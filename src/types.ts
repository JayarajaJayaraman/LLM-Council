export type ModelId = string;

export type MemberStatus = 'idle' | 'generating' | 'reviewing' | 'complete' | 'error';

export type ProviderType = 
  | 'google' 
  | 'openrouter' 
  | 'ollama' 
  | 'groq' 
  | 'openai' 
  | 'anthropic' 
  | 'mistral' 
  | 'deepseek' 
  | 'custom';

export interface CouncilMember {
  id: ModelId;
  name: string;
  role: string;
  model: string;
  provider: ProviderType;
  apiKey?: string;
  baseUrl?: string;
  isLocal?: boolean;
  systemInstruction: string;
  enabled?: boolean;
}

export interface PeerCritique {
  fromId: ModelId;
  toId: ModelId;
  content: string;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  modelId?: ModelId;
}

export interface CouncilResponse {
  modelId: ModelId;
  content: string;
  critiquesWritten: PeerCritique[];
  critiquesReceived: PeerCritique[];
}

export type ExecutionMode = 'chat' | 'ranking' | 'full';

export type SearchProvider = 'duckduckgo' | 'serper' | 'tavily' | 'brave';

export type SearchQueryProcessing = 'direct' | 'yake';

export interface CouncilConfig {
  members: CouncilMember[];
  chairman: CouncilMember;
  councilTemperature: number;
  chairmanTemperature: number;
  reviewTemperature: number;
  useWebSearch: boolean;
  searchProvider: SearchProvider;
  searchApiKey?: string;
  maxSearchQueries: number;
  searchQueryProcessing: SearchQueryProcessing;
  fetchFullArticles: boolean;
  maxArticlesToFetch: number;
  executionMode: ExecutionMode;
  availableProviders: Record<ProviderType, boolean>;
  llmApiKeys: Partial<Record<ProviderType, string>>;
  providerBaseUrls: Partial<Record<ProviderType, string>>;
  stage1Prompt: string;
  stage2Prompt: string;
  stage3Prompt: string;
}

export interface CouncilSession {
  id: string;
  query: string;
  opinions: CouncilResponse[];
  finalResponse: string;
  timestamp: number;
  config: CouncilConfig;
}
