import { AIProvider, ProviderHealth, ProviderRequest, ProviderResponse } from '../types';

export class OpenSourceProvider implements AIProvider {
  readonly providerId = 'opensource-intima-hub';
  readonly providerName = 'Sovereign Open-Source Endpoint (Ollama / vLLM / Local)';
  private endpointUrl: string;
  private apiKey: string;
  private modelName: string;

  constructor() {
    this.endpointUrl = process.env.INTIMA_LOCAL_AI_URL || process.env.LOCAL_LLM_URL || 'http://localhost:11434/v1';
    this.apiKey = process.env.LOCAL_LLM_API_KEY || 'none';
    this.modelName = process.env.LOCAL_LLM_MODEL || 'mistral-nemo-intima';
  }

  // Live test of the endpoint - NEVER pretents to be operational without physical verification
  async healthCheck(): Promise<ProviderHealth> {
    const startTime = Date.now();
    try {
      // Abort controller with 2.5s timeout so health check never hangs
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(`${this.endpointUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        signal: controller.signal,
      }).catch((e) => {
        throw new Error(e.name === 'AbortError' ? 'Délai d’attente dépassé (timeout > 2.5s)' : e.message);
      });

      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;

      if (res.ok) {
        return {
          providerId: this.providerId,
          providerName: this.providerName,
          isOperational: true,
          latencyMs,
          statusMessage: `Connecté à l’infrastructure souveraine (${latencyMs}ms)`,
          lastChecked: new Date().toISOString(),
          supportedFeatures: ['Privacy Zero-Log', 'Open Source Weights', 'Local Inference'],
        };
      } else {
        return {
          providerId: this.providerId,
          providerName: this.providerName,
          isOperational: false,
          latencyMs,
          statusMessage: `Serveur contacté mais code HTTP invalide: ${res.status} ${res.statusText}`,
          lastChecked: new Date().toISOString(),
          supportedFeatures: ['Privacy Zero-Log'],
        };
      }
    } catch (err: any) {
      return {
        providerId: this.providerId,
        providerName: this.providerName,
        isOperational: false,
        latencyMs: Date.now() - startTime,
        statusMessage: `Endpoint souverain non détecté (${err?.message || 'Connexion refusée sur ' + this.endpointUrl}). L’agent bascule automatiquement sur Gemini.`,
        lastChecked: new Date().toISOString(),
        supportedFeatures: ['Privacy Zero-Log'],
      };
    }
  }

  async generateResponse(request: ProviderRequest): Promise<ProviderResponse> {
    const startTime = Date.now();
    const isEnglish = request.language === 'en';

    // Verify endpoint is actually reachable
    const health = await this.healthCheck();
    if (!health.isOperational) {
      throw new Error(`Provider open-source non opérationnel: ${health.statusMessage}`);
    }

    const messages = [
      {
        role: 'system',
        content: isEnglish
          ? 'You are INTIMA, a compassionate relationship guide. Always separate facts from assumptions and provide ready-to-say "I" statements.'
          : 'Tu es INTIMA, accompagnateur en relations amoureuses. Sépare rigoureusement les faits des suppositions et propose des phrases prêtes à l’emploi formulées en "Je".',
      },
      ...request.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(`${this.endpointUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.modelName,
        messages,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Erreur API Local LLM: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || (isEnglish ? 'I am here with you.' : 'Je suis là avec toi.');
    const latencyMs = Date.now() - startTime;

    return {
      content,
      providerUsed: this.providerId,
      modelUsed: this.modelName,
      latencyMs,
      tokensUsed: {
        promptTokens: data.usage?.prompt_tokens || 100,
        completionTokens: data.usage?.completion_tokens || 150,
        totalTokens: data.usage?.total_tokens || 250,
      },
    };
  }
}
