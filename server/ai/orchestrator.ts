import { AIProvider, ProviderHealth, ProviderRequest, ProviderResponse, PromptRuleVersion } from './types';
import { GeminiProvider } from './providers/geminiProvider';
import { OpenAIProvider } from './providers/openAIProvider';
import { OpenSourceProvider } from './providers/openSourceProvider';

export interface OrchestratorMetrics {
  totalRequests: number;
  totalTokensUsed: number;
  averageLatencyMs: number;
  fallbackCount: number;
  webSearchesTriggered: number;
  positiveFeedbacks: number;
  negativeFeedbacks: number;
  activeProviderId: string;
  uptimeSeconds: number;
  startedAt: string;
}

export class AIOrchestrator {
  private providers: Map<string, AIProvider> = new Map();
  private activeProviderId: string = 'gemini-suite';
  private fallbackOrder: string[] = ['gemini-suite', 'openai-suite', 'opensource-intima-hub'];
  private ruleVersions: PromptRuleVersion[] = [
    {
      version: 'v2.4-autonomous',
      active: true,
      releaseDate: '2026-03-01',
      author: 'INTIMA Core Emotional Lab',
      description: 'Validation de l’accordage émotionnel (EFT), distinction absolue faits/suppositions, et citations bilingues',
      empathyWeight: 9.5,
      factClarityWeight: 10,
      actionabilityWeight: 8.5,
    },
    {
      version: 'v2.3-grounded',
      active: false,
      releaseDate: '2026-02-15',
      author: 'INTIMA Core Emotional Lab',
      description: 'Intégration du grounding Web et des 4 cavaliers de Gottman',
      empathyWeight: 9.0,
      factClarityWeight: 9.0,
      actionabilityWeight: 8.0,
    },
    {
      version: 'v2.0-baseline',
      active: false,
      releaseDate: '2026-01-10',
      author: 'INTIMA Core Emotional Lab',
      description: 'Version initiale bilingue sans grounding autonome',
      empathyWeight: 8.5,
      factClarityWeight: 8.0,
      actionabilityWeight: 7.5,
    },
  ];

  private metrics: OrchestratorMetrics = {
    totalRequests: 0,
    totalTokensUsed: 0,
    averageLatencyMs: 0,
    fallbackCount: 0,
    webSearchesTriggered: 0,
    positiveFeedbacks: 0,
    negativeFeedbacks: 0,
    activeProviderId: 'gemini-suite',
    uptimeSeconds: 0,
    startedAt: new Date().toISOString(),
  };

  private latencies: number[] = [];

  constructor() {
    // Register default providers: Gemini, OpenAI, Sovereign OpenSource
    const gemini = new GeminiProvider();
    const openAI = new OpenAIProvider();
    const openSource = new OpenSourceProvider();

    this.registerProvider(gemini);
    this.registerProvider(openAI);
    this.registerProvider(openSource);
  }

  registerProvider(provider: AIProvider): void {
    this.providers.set(provider.providerId, provider);
  }

  setActiveProvider(providerId: string): boolean {
    if (this.providers.has(providerId)) {
      this.activeProviderId = providerId;
      this.metrics.activeProviderId = providerId;
      return true;
    }
    return false;
  }

  getActiveProviderId(): string {
    return this.activeProviderId;
  }

  async getAllProvidersHealth(): Promise<ProviderHealth[]> {
    const healthPromises = Array.from(this.providers.values()).map((p) => p.healthCheck());
    return await Promise.all(healthPromises);
  }

  async testSpecificProvider(providerId: string): Promise<ProviderHealth> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      return {
        providerId,
        providerName: 'Inconnu',
        isOperational: false,
        latencyMs: 0,
        statusMessage: 'Fournisseur non trouvé',
        lastChecked: new Date().toISOString(),
        supportedFeatures: [],
      };
    }
    return await provider.healthCheck();
  }

  getMetrics(): OrchestratorMetrics {
    const uptime = Math.floor((Date.now() - new Date(this.metrics.startedAt).getTime()) / 1000);
    return {
      ...this.metrics,
      uptimeSeconds: uptime,
    };
  }

  recordFeedback(liked: boolean): void {
    if (liked) {
      this.metrics.positiveFeedbacks += 1;
    } else {
      this.metrics.negativeFeedbacks += 1;
    }
  }

  resetMetrics(): OrchestratorMetrics {
    this.metrics = {
      totalRequests: 0,
      totalTokensUsed: 0,
      averageLatencyMs: 0,
      fallbackCount: 0,
      webSearchesTriggered: 0,
      positiveFeedbacks: 0,
      negativeFeedbacks: 0,
      activeProviderId: this.activeProviderId,
      uptimeSeconds: 0,
      startedAt: new Date().toISOString(),
    };
    this.latencies = [];
    return this.getMetrics();
  }

  getRuleVersions(): PromptRuleVersion[] {
    return [...this.ruleVersions];
  }

  rollbackRuleVersion(targetVersion: string): boolean {
    const target = this.ruleVersions.find((r) => r.version === targetVersion);
    if (!target) return false;

    this.ruleVersions.forEach((r) => {
      r.active = r.version === targetVersion;
    });
    return true;
  }

  // Execute with automated failover and telemetry logging
  async execute(request: ProviderRequest): Promise<ProviderResponse> {
    this.metrics.totalRequests += 1;
    if (request.enableWebResearch) {
      this.metrics.webSearchesTriggered += 1;
    }

    const preferredProvider = this.providers.get(this.activeProviderId);
    const candidateOrder: AIProvider[] = [];

    if (preferredProvider) {
      candidateOrder.push(preferredProvider);
    }

    for (const [id, provider] of this.providers.entries()) {
      if (id !== this.activeProviderId) {
        candidateOrder.push(provider);
      }
    }

    let lastError: any = null;

    for (let i = 0; i < candidateOrder.length; i++) {
      const provider = candidateOrder[i];
      try {
        if (i > 0) {
          console.warn(`[AIOrchestrator] Basculement vers le fournisseur de secours: ${provider.providerName}`);
          this.metrics.fallbackCount += 1;
        }

        const response = await provider.generateResponse(request);

        // Update telemetry
        this.latencies.push(response.latencyMs);
        if (this.latencies.length > 50) this.latencies.shift();
        this.metrics.averageLatencyMs = Math.round(
          this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length
        );

        if (response.tokensUsed?.totalTokens) {
          this.metrics.totalTokensUsed += response.tokensUsed.totalTokens;
        }

        return response;
      } catch (err: any) {
        console.error(`[AIOrchestrator] Échec du fournisseur ${provider.providerName}:`, err?.message || err);
        lastError = err;
      }
    }

    throw lastError || new Error('Tous les fournisseurs d’IA sont actuellement indisponibles.');
  }
}

export const orchestrator = new AIOrchestrator();
