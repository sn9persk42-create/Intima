export type SupportedLanguage = 'fr' | 'en' | 'de' | 'es' | 'pt' | 'la';

export interface SearchSource {
  title: string;
  url: string;
  snippet: string;
  sourceType: 'scientific_research' | 'real_story' | 'expert_guide';
  attribution: string;
  publishedDate?: string;
}

export interface AgentQualityAssessment {
  empathyScore: number; // 0 - 100
  factAssumptionClarityScore: number; // 0 - 100
  nonJudgmentScore: number; // 0 - 100
  actionabilityScore: number; // 0 - 100
  overallScore: number; // 0 - 100
  evaluationNotes?: string;
}

export interface AttachmentItem {
  name: string;
  type: string;
  size: number;
  dataUrl?: string;
}

export interface ProviderRequest {
  messages: {
    role: 'user' | 'assistant';
    content: string;
    attachments?: AttachmentItem[];
  }[];
  language: SupportedLanguage;
  userContext?: {
    relationshipStatus?: string;
    partnerName?: string;
    userName?: string;
    topic?: string;
    memories?: string[];
  };
  enableWebResearch?: boolean;
}

export interface ProviderResponse {
  content: string;
  facts?: string;
  hypotheses?: string;
  suggestedAction?: string;
  sources?: SearchSource[];
  providerUsed: string;
  modelUsed: string;
  latencyMs: number;
  tokensUsed?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  qualityAssessment?: AgentQualityAssessment;
}

export interface ProviderHealth {
  providerId: string;
  providerName: string;
  isOperational: boolean;
  latencyMs: number;
  statusMessage: string;
  lastChecked: string;
  supportedFeatures: string[];
}

export interface AIProvider {
  readonly providerId: string;
  readonly providerName: string;
  healthCheck(): Promise<ProviderHealth>;
  generateResponse(request: ProviderRequest): Promise<ProviderResponse>;
}

export interface KnowledgeItem {
  id: string;
  titleFr: string;
  titleEn: string;
  category: 'attachment' | 'conflict_resolution' | 'breakup' | 'communication' | 'dating' | 'intimacy' | 'science';
  summaryFr: string;
  summaryEn: string;
  keyPrinciplesFr: string[];
  keyPrinciplesEn: string[];
  recommendedPhrasesFr: string[];
  recommendedPhrasesEn: string[];
  scientificReference?: string;
  confidenceScore: number; // 0.0 - 1.0
  sourceType: 'empirical_study' | 'clinical_framework' | 'lived_experience_pattern';
  updatedAt: string;
}

export interface PromptRuleVersion {
  version: string;
  active: boolean;
  releaseDate: string;
  author: string;
  description: string;
  empathyWeight: number; // 1-10
  factClarityWeight: number; // 1-10
  actionabilityWeight: number; // 1-10
  promptModifications?: string;
}
