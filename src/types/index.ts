export type RelationshipStatus =
  | 'single'
  | 'couple'
  | 'dating'
  | 'complicated'
  | 'divorced'
  | 'prefer_not_to_say';

export type RelationshipTopic =
  | 'communication'
  | 'conflict_resolution'
  | 'dating_advice'
  | 'emotional_support'
  | 'intimacy_rekindling'
  | 'breakup_healing'
  | 'general';

export type Language = 'fr' | 'en' | 'de' | 'es' | 'pt' | 'la';

export interface MemoryItem {
  id: string;
  text: string;
  category?: 'partner' | 'communication' | 'boundary' | 'milestone' | 'general';
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  relationshipStatus: RelationshipStatus;
  partnerName?: string;
  subscriptionTier: 'free' | 'premium';
  anonymousMode: boolean;
  dataRetentionDays: number;
  language?: Language;
  preferredVoice?: string;
  isAdmin?: boolean;
  pinProtected?: boolean;
  pinCode?: string;
  memories?: MemoryItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface Attachment {
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
  dataUrl?: string;
}

export interface SearchSource {
  title: string;
  url: string;
  snippet: string;
  sourceType: 'scientific_research' | 'real_story' | 'expert_guide';
  attribution: string;
  publishedDate?: string;
}

export interface AgentQualityAssessment {
  empathyScore: number;
  factAssumptionClarityScore: number;
  nonJudgmentScore: number;
  actionabilityScore: number;
  overallScore: number;
  evaluationNotes?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  userId: string;
  sender: 'user' | 'assistant';
  content: string;
  facts?: string;
  hypotheses?: string;
  suggestedAction?: string;
  sources?: SearchSource[];
  providerUsed?: string;
  modelUsed?: string;
  latencyMs?: number;
  qualityAssessment?: AgentQualityAssessment;
  liked?: boolean;
  disliked?: boolean;
  dislikeReason?: string;
  reported?: boolean;
  reportReason?: string;
  audioUrl?: string;
  attachments?: Attachment[];
  status?: 'sending' | 'sent' | 'error';
  createdAt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  topic: RelationshipTopic;
  messageCount: number;
  pinned?: boolean;
  lastMessageSnippet?: string;
  createdAt: string;
  updatedAt?: string;
}

export type ScreenType =
  | 'home'
  | 'chat'
  | 'history'
  | 'profile'
  | 'pricing'
  | 'settings'
  | 'auth'
  | 'memory'
  | 'admin';
