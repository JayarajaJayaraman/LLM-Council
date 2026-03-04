import { GoogleGenAI } from "@google/genai";
import { CouncilMember, CouncilResponse, ModelId, MemberStatus, PeerCritique, CouncilConfig, ProviderType } from "../types";
import { searchWeb, fetchArticleContent } from "./searchService";

async function callLLM(
  member: CouncilMember, 
  prompt: string, 
  temperature: number, 
  config: CouncilConfig,
  useWebSearch: boolean = false,
  signal?: AbortSignal
): Promise<string> {
  const { provider, model, apiKey, baseUrl, systemInstruction } = member;
  const globalApiKey = config.llmApiKeys[provider];
  const effectiveApiKey = apiKey || globalApiKey;
  const globalBaseUrl = config.providerBaseUrls[provider];
  const effectiveBaseUrl = baseUrl || globalBaseUrl;

  if (signal?.aborted) throw new Error('Aborted');

  let searchContext = "";
  if (useWebSearch && provider !== 'google') {
    const results = await searchWeb(prompt, config.searchProvider, config.searchApiKey, config.maxSearchQueries);
    if (signal?.aborted) throw new Error('Aborted');
    if (results.length > 0) {
      if (config.fetchFullArticles) {
        const fullArticles = await Promise.all(
          results.slice(0, config.maxArticlesToFetch).map(async (r) => {
            if (signal?.aborted) return '';
            const content = await fetchArticleContent(r.url);
            return `Source: ${r.url}\nTitle: ${r.title}\nContent: ${content.slice(0, 5000)}...`;
          })
        );
        searchContext = `Web Search Context:\n\n${fullArticles.join('\n\n')}`;
      } else {
        searchContext = `Web Search Context:\n\n${results.map(r => `Source: ${r.url}\nTitle: ${r.title}\nSnippet: ${r.snippet}`).join('\n\n')}`;
      }
    }
  }

  const effectivePrompt = searchContext 
    ? `Context from Web Search:\n${searchContext}\n\nUser Question: ${prompt}`
    : prompt;

  if (provider === 'google') {
    const googleApiKey = effectiveApiKey || process.env.GEMINI_API_KEY || "";
    const googleAI = new GoogleGenAI({ apiKey: googleApiKey });
    const response = await googleAI.models.generateContent({
      model: model,
      contents: effectivePrompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: temperature,
        tools: useWebSearch ? [{ googleSearch: {} }] : undefined
      }
    });
    return response.text || "Failed to generate response.";
  }

  // OpenAI-compatible providers (OpenAI, OpenRouter, Groq, Mistral, DeepSeek, Custom, Ollama)
  let apiUrl = "";
  let authHeader = "";

  const baseUrlToUse = member.isLocal ? effectiveBaseUrl : null;

  switch (provider) {
    case 'openai':
      apiUrl = baseUrlToUse ? `${baseUrlToUse}/chat/completions` : "https://api.openai.com/v1/chat/completions";
      authHeader = `Bearer ${effectiveApiKey || process.env.OPENAI_API_KEY}`;
      break;
    case 'openrouter':
      apiUrl = baseUrlToUse ? `${baseUrlToUse}/chat/completions` : "https://openrouter.ai/api/v1/chat/completions";
      authHeader = `Bearer ${effectiveApiKey || process.env.OPENROUTER_API_KEY}`;
      break;
    case 'groq':
      apiUrl = baseUrlToUse ? `${baseUrlToUse}/chat/completions` : "https://api.groq.com/openai/v1/chat/completions";
      authHeader = `Bearer ${effectiveApiKey || process.env.GROQ_API_KEY}`;
      break;
    case 'mistral':
      apiUrl = baseUrlToUse ? `${baseUrlToUse}/chat/completions` : "https://api.mistral.ai/v1/chat/completions";
      authHeader = `Bearer ${effectiveApiKey || process.env.MISTRAL_API_KEY}`;
      break;
    case 'deepseek':
      apiUrl = baseUrlToUse ? `${baseUrlToUse}/chat/completions` : "https://api.deepseek.com/v1/chat/completions";
      authHeader = `Bearer ${effectiveApiKey || process.env.DEEPSEEK_API_KEY}`;
      break;
    case 'anthropic':
      apiUrl = baseUrlToUse ? `${baseUrlToUse}/messages` : "https://api.anthropic.com/v1/messages";
      authHeader = `Bearer ${effectiveApiKey || process.env.ANTHROPIC_API_KEY}`;
      break;
    case 'ollama':
      apiUrl = `${effectiveBaseUrl || 'http://localhost:11434'}/api/chat`;
      break;
    case 'custom':
      apiUrl = effectiveBaseUrl || "";
      authHeader = `Bearer ${effectiveApiKey}`;
      break;
  }

  if (!apiUrl) return `Provider ${provider} not fully implemented yet.`;

  try {
    if (provider === 'ollama') {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal,
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: effectivePrompt }
          ],
          stream: false,
          options: { temperature }
        })
      });
      const data = await response.json();
      return data.message?.content || "Failed to generate response from Ollama.";
    }

    if (provider === 'anthropic') {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': effectiveApiKey || process.env.ANTHROPIC_API_KEY || "",
          'anthropic-version': '2023-06-01'
        },
        signal,
        body: JSON.stringify({
          model: model,
          system: systemInstruction,
          messages: [{ role: 'user', content: effectivePrompt }],
          max_tokens: 4096,
          temperature: temperature
        })
      });
      const data = await response.json();
      return data.content?.[0]?.text || "Failed to generate response from Anthropic.";
    }

    // Standard OpenAI-compatible
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      signal,
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: effectivePrompt }
        ],
        temperature: temperature
      })
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "Failed to generate response from provider.";
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    console.error(`Error calling ${provider}:`, error);
    return `Error: ${error instanceof Error ? error.message : String(error)}`;
  }
}

export async function getFirstOpinions(
  query: string, 
  config: CouncilConfig,
  onStatusUpdate?: (id: ModelId, status: MemberStatus) => void,
  signal?: AbortSignal
): Promise<CouncilResponse[]> {
  const enabledMembers = config.members.filter(m => m.enabled);
  const promises = enabledMembers.map(async (member) => {
    onStatusUpdate?.(member.id, 'generating');
    try {
      const prompt = config.stage1Prompt.replace('{query}', query);
      const content = await callLLM(member, prompt, config.councilTemperature, config, config.useWebSearch, signal);
      onStatusUpdate?.(member.id, 'complete');
      return {
        modelId: member.id,
        content,
        critiquesWritten: [],
        critiquesReceived: []
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') throw error;
      onStatusUpdate?.(member.id, 'error');
      return {
        modelId: member.id,
        content: `Error: ${error instanceof Error ? error.message : String(error)}`,
        critiquesWritten: [],
        critiquesReceived: []
      };
    }
  });

  return Promise.all(promises);
}

export async function getReviews(
  query: string, 
  opinions: CouncilResponse[],
  config: CouncilConfig,
  onStatusUpdate?: (id: ModelId, status: MemberStatus) => void,
  signal?: AbortSignal
): Promise<CouncilResponse[]> {
  const allCritiques: PeerCritique[] = [];
  const enabledMembers = config.members.filter(m => m.enabled);

  for (const reviewer of enabledMembers) {
    if (signal?.aborted) throw new Error('Aborted');
    onStatusUpdate?.(reviewer.id, 'reviewing');
    const peers = enabledMembers.filter(m => m.id !== reviewer.id);
    
    for (const peer of peers) {
      if (signal?.aborted) throw new Error('Aborted');
      const peerOpinion = opinions.find(o => o.modelId === peer.id)!;
      const reviewPrompt = config.stage2Prompt
        .replace('{query}', query)
        .replace('{peerName}', peer.name)
        .replace('{peerRole}', peer.role)
        .replace('{peerOpinion}', peerOpinion.content);

      try {
        const content = await callLLM(reviewer, reviewPrompt, config.reviewTemperature, config, false, signal);
        allCritiques.push({
          fromId: reviewer.id,
          toId: peer.id,
          content
        });
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') throw error;
        console.error(`Error generating critique from ${reviewer.id} to ${peer.id}:`, error);
      }
    }
    onStatusUpdate?.(reviewer.id, 'complete');
  }

  return opinions.map(o => ({
    ...o,
    critiquesWritten: allCritiques.filter(c => c.fromId === o.modelId),
    critiquesReceived: allCritiques.filter(c => c.toId === o.modelId)
  }));
}

export async function getFinalResponse(
  query: string, 
  reviewedOpinions: CouncilResponse[],
  config: CouncilConfig,
  onStatusUpdate?: (id: ModelId, status: MemberStatus) => void,
  signal?: AbortSignal
): Promise<string> {
  onStatusUpdate?.('chairman', 'generating');
  try {
    const context = reviewedOpinions.map(o => {
      const member = config.members.find(m => m.id === o.modelId)!;
      const critiques = o.critiquesReceived.map(c => {
        const fromMember = config.members.find(m => m.id === c.fromId)!;
        return `Critique from ${fromMember.name}: ${c.content}`;
      }).join('\n');

      return `
        Member: ${member.name} (${member.role})
        Initial Opinion: ${o.content}
        Peer Critiques Received:
        ${critiques}
      `;
    }).join('\n\n====================\n\n');

    const finalPrompt = config.stage3Prompt
      .replace('{query}', query)
      .replace('{context}', context);

    const response = await callLLM(config.chairman, finalPrompt, config.chairmanTemperature, config, config.useWebSearch, signal);
    onStatusUpdate?.('chairman', 'complete');
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    onStatusUpdate?.('chairman', 'error');
    throw error;
  }
}
