import { CouncilConfig, CouncilMember } from "./types";

export const DEFAULT_COUNCIL_MEMBERS: CouncilMember[] = [
  {
    id: 'analyst',
    name: 'The Analyst',
    role: 'Logical & Fact-oriented',
    model: 'gemini-3-flash-preview',
    provider: 'google',
    systemInstruction: 'You are The Analyst. Your goal is to provide highly structured, factually accurate, and logically sound responses. Focus on data, evidence, and clear reasoning.',
    enabled: true,
    isLocal: false
  },
  {
    id: 'creative',
    name: 'The Creative',
    role: 'Novel & Unconventional',
    model: 'gemini-3-flash-preview',
    provider: 'google',
    systemInstruction: 'You are The Creative. Your goal is to provide novel perspectives, interesting metaphors, and unconventional solutions. Think outside the box and explore creative possibilities.',
    enabled: true,
    isLocal: false
  },
  {
    id: 'critic',
    name: 'The Critic',
    role: 'Skeptical & Rigorous',
    model: 'gemini-3-flash-preview',
    provider: 'google',
    systemInstruction: 'You are The Critic. Your goal is to find potential flaws, edge cases, and errors in reasoning. Be rigorous, skeptical, and ensure high standards of quality.',
    enabled: true,
    isLocal: false
  }
];

export const DEFAULT_CHAIRMAN: CouncilMember = {
  id: 'chairman',
  name: 'The Chairman',
  role: 'Synthesizer & Final Arbiter',
  model: 'gemini-3.1-pro-preview',
  provider: 'google',
  systemInstruction: 'You are The Chairman of the LLM Council. Your task is to synthesize the responses from the Analyst, the Creative, and the Critic into a single, comprehensive, and definitive final answer. Acknowledge the different perspectives but provide a unified conclusion.',
  enabled: true,
  isLocal: false
};

export const DEFAULT_CONFIG: CouncilConfig = {
  members: DEFAULT_COUNCIL_MEMBERS,
  chairman: DEFAULT_CHAIRMAN,
  councilTemperature: 0.5,
  chairmanTemperature: 0.4,
  reviewTemperature: 0.3,
  useWebSearch: false,
  searchProvider: 'duckduckgo',
  maxSearchQueries: 3,
  searchQueryProcessing: 'direct',
  fetchFullArticles: false,
  maxArticlesToFetch: 3,
  executionMode: 'full',
  availableProviders: {
    google: true,
    openai: true,
    anthropic: true,
    groq: true,
    openrouter: true,
    mistral: true,
    deepseek: true,
    ollama: true,
    custom: true
  },
  llmApiKeys: {},
  providerBaseUrls: {},
  stage1Prompt: 'The user asked: "{query}"\n\nPlease provide your expert opinion on this matter. Focus on accuracy, depth, and clarity.',
  stage2Prompt: 'The user asked: "{query}"\n\nHere is a response from your peer, {peerName} ({peerRole}):\n"{peerOpinion}"\n\nPlease provide a specific critique of this response. Focus on its accuracy, depth, and any potential blind spots. Be professional but rigorous.',
  stage3Prompt: 'The user asked: "{query}"\n\nThe council has discussed this. Here are their individual opinions and the peer critiques they received:\n{context}\n\nPlease synthesize all this information into a final, authoritative response for the user.'
};
