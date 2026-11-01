import OpenAI from 'openai';
import {
  AIProvider,
  ProviderHealth,
  ProviderRequest,
  ProviderResponse,
  SupportedLanguage,
} from '../types';
import { IntimaBehaviorEngine } from '../intimaBehavior';

export class OpenAIProvider implements AIProvider {
  readonly providerId = 'openai-suite';
  readonly providerName = 'OpenAI GPT Engine (Responses API)';
  private client: OpenAI | null = null;
  private primaryModel: string;
  private fallbackModels: string[] = ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'];

  constructor(apiKey?: string, model?: string) {
    const key = apiKey || process.env.OPENAI_API_KEY;
    this.primaryModel = model || process.env.OPENAI_MODEL || 'gpt-4o-mini';

    if (key && key.trim().length > 0) {
      this.client = new OpenAI({
        apiKey: key.trim(),
        timeout: 10000,
        maxRetries: 0,
      });
    }
  }

  // Live health check with physical handshake and clear diagnostic classification
  async healthCheck(): Promise<ProviderHealth> {
    const startTime = Date.now();

    if (!this.client || !process.env.OPENAI_API_KEY) {
      return {
        providerId: this.providerId,
        providerName: this.providerName,
        isOperational: false,
        latencyMs: 0,
        statusMessage: 'Secret OPENAI_API_KEY absent des variables d’environnement du serveur.',
        lastChecked: new Date().toISOString(),
        supportedFeatures: ['Responses API', 'Chat Completions', 'Cost Protection'],
      };
    }

    try {
      // 1. Check model availability
      await this.client.models.retrieve(this.primaryModel);

      // 2. Physical handshake to verify active credit quota (guarantees zero false operational status)
      await this.client.chat.completions.create({
        model: this.primaryModel,
        messages: [{ role: 'user', content: 'p' }],
        max_tokens: 1,
      });

      const latencyMs = Date.now() - startTime;

      return {
        providerId: this.providerId,
        providerName: `${this.providerName} (${this.primaryModel})`,
        isOperational: true,
        latencyMs,
        statusMessage: `Opérationnel via ${this.primaryModel} (${latencyMs}ms)`,
        lastChecked: new Date().toISOString(),
        supportedFeatures: [
          'Responses API (v1)',
          'Chat Completions',
          'Contexte Multi-Tour',
          'Validation & Anti-surcoût',
          'Multilingue FR/EN/DE/ES/PT/LA',
        ],
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      const status = err?.status;
      const code = err?.code;
      const errorMsg = err?.message || String(err);

      let diagnostic = `Indisponible: ${errorMsg}`;

      if (code === 'credit_balance_exhausted' || code === 'insufficient_quota' || status === 429) {
        if (errorMsg.toLowerCase().includes('quota') || errorMsg.toLowerCase().includes('credit')) {
          diagnostic = 'Crédits OpenAI épuisés. Veuillez recharger votre solde sur platform.openai.com/settings/organization/billing/.';
        } else {
          diagnostic = 'Limite de requêtes OpenAI atteinte (Rate limit temporaire).';
        }
      } else if (status === 401 || code === 'invalid_api_key') {
        diagnostic = 'Clé OPENAI_API_KEY invalide ou révoquée par OpenAI.';
      } else if (status === 403) {
        diagnostic = 'Accès refusé au modèle ou restrictions régionales OpenAI.';
      } else if (status >= 500) {
        diagnostic = 'Serveurs OpenAI momentanément indisponibles (erreur 5xx).';
      }

      return {
        providerId: this.providerId,
        providerName: this.providerName,
        isOperational: false,
        latencyMs,
        statusMessage: diagnostic,
        lastChecked: new Date().toISOString(),
        supportedFeatures: ['Responses API', 'Chat Completions', 'Validation & Anti-surcoût'],
      };
    }
  }

  async generateResponse(request: ProviderRequest): Promise<ProviderResponse> {
    const startTime = Date.now();

    if (!this.client || !process.env.OPENAI_API_KEY) {
      throw new Error(
        request.language === 'en'
          ? 'OpenAI API key is missing on the server. Please verify OPENAI_API_KEY secret.'
          : 'La clé OPENAI_API_KEY est manquante sur le serveur. Veuillez configurer le secret.'
      );
    }

    // Step 1: Input Validation & Cost Control Limiter
    // Cap recent history to last 12 messages and truncate oversized inputs
    const MAX_HISTORY_MESSAGES = 12;
    const MAX_MESSAGE_CHARS = 4000;

    const trimmedMessages = request.messages.slice(-MAX_HISTORY_MESSAGES).map((m) => ({
      role: m.role,
      content: (m.content || '').slice(0, MAX_MESSAGE_CHARS),
    }));

    const lastUserMsg = [...trimmedMessages].reverse().find((m) => m.role === 'user')?.content || '';

    // Step 2: Intent detection & System instruction generation
    const detectedIntent = IntimaBehaviorEngine.analyzeIntent(lastUserMsg, {
      ...request.userContext,
      language: request.language,
    });

    let systemInstruction = IntimaBehaviorEngine.buildSystemInstruction(
      request.language,
      detectedIntent,
      request.userContext
    );

    // Contextual memory injection
    if (request.userContext) {
      const { relationshipStatus, userName, partnerName, topic, memories } = request.userContext;
      const memList = memories && memories.length > 0 ? memories.map((m) => `- ${m}`).join('\n') : '';

      const ctxHeader = request.language === 'en' ? 'CONVERSATION CONTEXT:' : 'CONTEXTE DE LA DISCUSSION :';
      systemInstruction += `\n\n${ctxHeader}
- Statut relationnel: ${relationshipStatus || 'Non précisé'}
- Prénom: ${userName || 'Ami(e)'}
${partnerName ? `- Partenaire: ${partnerName}` : ''}
${topic ? `- Thème abordé: ${topic}` : ''}
${memList ? `\nInformations mémorisées autorisées :\n${memList}` : ''}`;
    }

    // Specific formatting requirement for structured insights
    systemInstruction += `\n\nIMPORTANT FORMATTING RULES:
If analyzing an interpersonal situation or message, optionally include distinct markers:
[FAITS] (Objective observable elements)
[HYPOTHESES] (Possible alternative interpretations with uncertainty)
[ACTION] (A respectful suggested formulation ready to use in "I")`;

    let generatedText = '';
    let promptTokens = 0;
    let completionTokens = 0;
    let modelUsed = this.primaryModel;

    // Step 3: Call OpenAI using Responses API with fallback to Chat Completions
    try {
      // First preference: Responses API (official OpenAI SDK method)
      if (typeof this.client.responses?.create === 'function') {
        try {
          const inputMessages = trimmedMessages.map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          }));

          const response = await this.client.responses.create({
            model: this.primaryModel,
            instructions: systemInstruction,
            input: inputMessages as any,
            max_output_tokens: 1200,
          });

          // Extract text from Responses API output
          if (response.output_text) {
            generatedText = response.output_text;
          } else if (Array.isArray(response.output) && response.output.length > 0) {
            const firstItem: any = response.output[0];
            if (firstItem.content) {
              generatedText = typeof firstItem.content === 'string'
                ? firstItem.content
                : JSON.stringify(firstItem.content);
            }
          }

          if (response.usage) {
            promptTokens = response.usage.input_tokens || 0;
            completionTokens = response.usage.output_tokens || 0;
          }
        } catch (responsesApiErr: any) {
          // If Responses API failed with quota or authentication, rethrow immediately
          if (
            responsesApiErr?.status === 429 ||
            responsesApiErr?.status === 401 ||
            responsesApiErr?.code === 'insufficient_quota' ||
            responsesApiErr?.code === 'credit_balance_exhausted'
          ) {
            throw responsesApiErr;
          }
          console.warn('[OpenAIProvider] responses.create fallback to chat.completions:', responsesApiErr?.message);
        }
      }

      // Second preference: Chat Completions API fallback
      if (!generatedText) {
        const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
          { role: 'system', content: systemInstruction },
          ...trimmedMessages.map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
        ];

        const completion = await this.client.chat.completions.create({
          model: this.primaryModel,
          messages: chatMessages,
          max_tokens: 1200,
          temperature: 0.7,
        });

        generatedText = completion.choices?.[0]?.message?.content || '';
        promptTokens = completion.usage?.prompt_tokens || 0;
        completionTokens = completion.usage?.completion_tokens || 0;
        modelUsed = completion.model || this.primaryModel;
      }
    } catch (err: any) {
      const status = err?.status;
      const code = err?.code;
      const originalMsg = err?.message || '';

      // Produce high-clarity error in user's language
      if (code === 'credit_balance_exhausted' || code === 'insufficient_quota' || status === 429) {
        const quotaError = new Error(
          request.language === 'en'
            ? 'OpenAI API quota exhausted. Please check billing at platform.openai.com/settings/organization/billing.'
            : 'Solde OpenAI épuisé : veuillez approvisionner votre compte sur platform.openai.com/settings/organization/billing.'
        );
        (quotaError as any).status = 429;
        (quotaError as any).code = code;
        (quotaError as any).providerId = this.providerId;
        throw quotaError;
      }

      if (status === 401 || code === 'invalid_api_key') {
        const authError = new Error(
          request.language === 'en'
            ? 'Invalid OpenAI API key. Please check your OPENAI_API_KEY secret.'
            : 'Clé API OpenAI invalide. Veuillez vérifier le secret OPENAI_API_KEY dans les paramètres.'
        );
        (authError as any).status = 401;
        throw authError;
      }

      throw new Error(`[OpenAIProvider] ${originalMsg}`);
    }

    if (!generatedText) {
      throw new Error(
        request.language === 'en'
          ? 'OpenAI returned an empty response.'
          : 'OpenAI a renvoyé une réponse vide.'
      );
    }

    // Step 4: Extract structured sections if provided by the model
    let facts: string | undefined;
    let hypotheses: string | undefined;
    let suggestedAction: string | undefined;
    let cleanContent = generatedText;

    const factsMatch = generatedText.match(/\[FAITS\]([\s\S]*?)(?=\[HYPOTHESES\]|\[ACTION\]|$)/i);
    const hypoMatch = generatedText.match(/\[HYPOTHESES\]([\s\S]*?)(?=\[ACTION\]|$)/i);
    const actionMatch = generatedText.match(/\[ACTION\]([\s\S]*?)$/i);

    if (factsMatch && hypoMatch) {
      facts = factsMatch[1].trim();
      hypotheses = hypoMatch[1].trim();
      if (actionMatch) {
        suggestedAction = actionMatch[1].trim();
      }
      cleanContent = generatedText
        .replace(/\[FAITS\][\s\S]*?\[HYPOTHESES\]/i, '')
        .replace(/\[HYPOTHESES\][\s\S]*?(\[ACTION\]|$)/i, '')
        .replace(/\[ACTION\][\s\S]*$/i, '')
        .trim();

      if (!cleanContent) {
        cleanContent = `${facts}\n\n${hypotheses}${suggestedAction ? `\n\nSuggestion : ${suggestedAction}` : ''}`;
      }
    }

    const latencyMs = Date.now() - startTime;

    return {
      content: cleanContent,
      facts,
      hypotheses,
      suggestedAction,
      providerUsed: this.providerName,
      modelUsed,
      latencyMs,
      tokensUsed: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
    };
  }
}
