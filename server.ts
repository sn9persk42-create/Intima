import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { intimaAgent } from './server/ai/autonomousAgent';
import { orchestrator } from './server/ai/orchestrator';
import { knowledgeBaseService } from './server/ai/knowledgeBase';
import { SupportedLanguage } from './server/ai/types';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Initialize Google GenAI on the server for specialized TTS
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build-intima',
    },
  },
});

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  attachments?: {
    name: string;
    type: string;
    size: number;
    dataUrl?: string;
  }[];
}

// Sliding-window rate limiter per client IP to prevent abuse and control API costs
const ipRateLimits = new Map<string, { count: number; resetTime: number }>();
function checkRateLimit(ip: string, limit = 30, windowMs = 60000): boolean {
  const now = Date.now();
  const record = ipRateLimits.get(ip);
  if (!record || now > record.resetTime) {
    ipRateLimits.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  if (record.count >= limit) {
    return false;
  }
  record.count += 1;
  return true;
}

// Clean up stale rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipRateLimits.entries()) {
    if (now > record.resetTime) {
      ipRateLimits.delete(ip);
    }
  }
}, 300000);

// Autonomous Agent Chat API endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';

    // 1. Rate Limiting Protection (Max 30 requests/minute per client)
    if (!checkRateLimit(clientIp, 30, 60000)) {
      return res.status(429).json({
        error: 'Limite de requêtes atteinte. Veuillez patienter quelques secondes avant de renvoyer un message.',
        code: 'rate_limit_exceeded',
      });
    }

    const { messages, userContext, enableWebResearch } = req.body as {
      messages: ChatMessage[];
      userContext?: {
        relationshipStatus?: string;
        partnerName?: string;
        userName?: string;
        topic?: string;
        language?: SupportedLanguage;
        memories?: string[];
      };
      enableWebResearch?: boolean;
    };

    // 2. Input Validation
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Historique de messages requis / Message history required' });
    }

    if (messages.length > 50) {
      return res.status(400).json({ error: 'Historique trop volumineux (max 50 messages).' });
    }

    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.content && lastMsg.content.length > 4000) {
      return res.status(400).json({ error: 'Message trop volumineux (max 4000 caractères par envoi).' });
    }

    const validLanguages: SupportedLanguage[] = ['fr', 'en', 'de', 'es', 'pt', 'la'];
    const language: SupportedLanguage = (userContext?.language && validLanguages.includes(userContext.language as SupportedLanguage))
      ? (userContext.language as SupportedLanguage)
      : 'fr';

    // Execute through autonomous agent cycle (with active provider & intelligent fallback)
    const result = await intimaAgent.processCycle({
      messages,
      language,
      userContext: {
        relationshipStatus: userContext?.relationshipStatus,
        partnerName: userContext?.partnerName,
        userName: userContext?.userName,
        topic: userContext?.topic,
        memories: userContext?.memories,
      },
      enableWebResearch,
    });

    return res.json({
      content: result.content,
      facts: result.facts,
      hypotheses: result.hypotheses,
      suggestedAction: result.suggestedAction,
      sources: result.sources,
      providerUsed: result.providerUsed,
      modelUsed: result.modelUsed,
      latencyMs: result.latencyMs,
      tokensUsed: result.tokensUsed,
      qualityAssessment: result.qualityAssessment,
    });
  } catch (error: any) {
    console.error('[API Chat] Erreur de l’agent INTIMA:', error?.message || error);

    const isQuotaError = error?.code === 'insufficient_quota' || error?.code === 'credit_balance_exhausted' || error?.status === 429;
    if (isQuotaError) {
      return res.status(429).json({
        error: 'Crédits du modèle IA épuisés. Veuillez approvisionner la facturation ou rebasculer sur Gemini.',
        details: error?.message,
        code: 'insufficient_quota',
      });
    }

    return res.status(500).json({
      error: 'Une erreur est survenue lors de la communication avec INTIMA.',
      details: error?.message || 'Erreur serveur',
    });
  }
});

// Dedicated Direct OpenAI Chat endpoint with Responses API
app.post('/api/chat/openai', async (req: Request, res: Response) => {
  try {
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';

    if (!checkRateLimit(clientIp, 20, 60000)) {
      return res.status(429).json({
        error: 'Limite de requêtes atteinte pour l’endpoint OpenAI direct. Veuillez patienter.',
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        error: 'Le secret OPENAI_API_KEY n’est pas configuré sur le serveur.',
        code: 'missing_api_key',
      });
    }

    const { messages, userContext, model } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages requis' });
    }

    const { OpenAIProvider } = await import('./server/ai/providers/openAIProvider');
    const openAI = new OpenAIProvider(undefined, model);

    const validLanguages: SupportedLanguage[] = ['fr', 'en', 'de', 'es', 'pt', 'la'];
    const language: SupportedLanguage = (userContext?.language && validLanguages.includes(userContext.language as SupportedLanguage))
      ? (userContext.language as SupportedLanguage)
      : 'fr';

    const result = await openAI.generateResponse({
      messages,
      language,
      userContext,
    });

    return res.json(result);
  } catch (err: any) {
    const isQuota = err?.code === 'insufficient_quota' || err?.code === 'credit_balance_exhausted' || err?.status === 429;
    return res.status(isQuota ? 429 : 500).json({
      error: err?.message || 'Erreur OpenAI',
      code: err?.code,
    });
  }
});

// User Feedback Endpoint for Continuous Learning (Zero Private Chat Logging)
app.post('/api/feedback', (req: Request, res: Response) => {
  try {
    const { liked, messageId, reason, report } = req.body;
    orchestrator.recordFeedback(!!liked);
    return res.json({ status: 'ok', recorded: true });
  } catch {
    return res.status(500).json({ error: 'Erreur enregistrement feedback' });
  }
});

// Admin Oversight: Live System & Agent Metrics
app.get('/api/admin/metrics', (_req: Request, res: Response) => {
  try {
    const metrics = orchestrator.getMetrics();
    const rules = orchestrator.getRuleVersions();
    const activeRule = rules.find((r) => r.active) || rules[0];

    return res.json({
      metrics,
      activeRule,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Erreur métriques' });
  }
});

// Admin Oversight: Reset Metrics to Zero
app.post('/api/admin/reset-metrics', (_req: Request, res: Response) => {
  try {
    const metrics = orchestrator.resetMetrics();
    return res.json({
      success: true,
      message: 'Métriques administratives réinitialisées à zéro.',
      metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Erreur réinitialisation métriques' });
  }
});

// Admin Oversight: Live Health Check of all registered AI Providers
app.get('/api/admin/providers', async (_req: Request, res: Response) => {
  try {
    const providersHealth = await orchestrator.getAllProvidersHealth();
    return res.json({
      providers: providersHealth,
      activeProviderId: orchestrator.getActiveProviderId(),
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Erreur santé providers' });
  }
});

// Admin Oversight: Real-time Ping test for a single provider
app.post('/api/admin/test-provider', async (req: Request, res: Response) => {
  try {
    const { providerId } = req.body;
    if (!providerId) {
      return res.status(400).json({ error: 'providerId requis' });
    }
    const health = await orchestrator.testSpecificProvider(providerId);
    return res.json({ health });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Échec test provider' });
  }
});

// Admin Oversight: Switch active provider
app.post('/api/admin/set-active-provider', (req: Request, res: Response) => {
  try {
    const { providerId } = req.body;
    const success = orchestrator.setActiveProvider(providerId);
    if (!success) {
      return res.status(404).json({ error: 'Fournisseur introuvable' });
    }
    return res.json({ success: true, activeProviderId: orchestrator.getActiveProviderId() });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message });
  }
});

// Admin Oversight: Prompt Rule Versions & Rollback
app.get('/api/admin/rules', (_req: Request, res: Response) => {
  return res.json({ rules: orchestrator.getRuleVersions() });
});

app.post('/api/admin/rules/rollback', (req: Request, res: Response) => {
  try {
    const { version } = req.body;
    const success = orchestrator.rollbackRuleVersion(version);
    if (!success) {
      return res.status(404).json({ error: 'Version de règle introuvable' });
    }
    return res.json({ success: true, rules: orchestrator.getRuleVersions() });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message });
  }
});

// Knowledge Base Endpoints
app.get('/api/knowledge', (req: Request, res: Response) => {
  const { query, category } = req.query as { query?: string; category?: string };
  if (query) {
    const results = knowledgeBaseService.searchKnowledge(query, category, 10);
    return res.json({ items: results });
  }
  return res.json({ items: knowledgeBaseService.getAllItems() });
});

app.post('/api/knowledge', (req: Request, res: Response) => {
  try {
    const newItem = req.body;
    if (!newItem.id || !newItem.titleFr || !newItem.titleEn) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }
    knowledgeBaseService.addItem({
      ...newItem,
      updatedAt: new Date().toISOString(),
    });
    return res.json({ success: true, item: newItem });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message });
  }
});

// Secure Text-To-Speech (TTS) endpoint using gemini-3.8-flash-lite-tts
app.post('/api/tts', async (req: Request, res: Response) => {
  try {
    const { text, voiceName = 'Kore', language = 'fr' } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Texte requis pour la synthèse vocale' });
    }

    const cleanedText = text.slice(0, 400).replace(/[*_#]/g, '');

    const speechStyles: Record<string, string> = {
      fr: 'Chaleureuse, apaisante, empathique et douce en français',
      en: 'Warm, soothing, empathetic and gentle voice in English',
      de: 'Warme, beruhigende, einfühlsame und sanfte Stimme auf Deutsch',
      es: 'Voz cálida, reconfortante, empática y dulce en español',
      pt: 'Voz calorosa, reconfortante, empática e suave em português',
      la: 'Vox subtilis, aequa, serena et clementer loquens',
    };
    const speechStyle = speechStyles[language] || speechStyles.fr;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: cleanedText,
              speechMetadata: {
                style: speechStyle,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: (voiceName as any) || 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(500).json({ error: 'Impossible de synthétiser la voix' });
    }

    return res.json({
      audioUrl: `data:audio/wav;base64,${base64Audio}`,
    });
  } catch (error: any) {
    console.error('Erreur API TTS Gemini:', error);
    return res.status(500).json({
      error: 'Synthèse vocale indisponible pour le moment.',
      details: error?.message,
    });
  }
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'INTIMA',
    version: '2.4.0-autonomous',
    timestamp: new Date().toISOString(),
  });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, '../dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`INTIMA Autonomous Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
