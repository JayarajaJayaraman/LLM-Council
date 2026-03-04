export type SearchResult = {
  title: string;
  url: string;
  snippet: string;
  content?: string;
};

export async function searchWeb(
  query: string,
  provider: 'duckduckgo' | 'serper' | 'tavily' | 'brave',
  apiKey?: string,
  maxResults: number = 3
): Promise<SearchResult[]> {
  console.log(`Searching web for: "${query}" using ${provider}`);
  
  try {
    switch (provider) {
      case 'duckduckgo':
        // DuckDuckGo doesn't have a simple official free API for this, 
        // but we can use a proxy or a simple implementation.
        // For now, let's use a mock that simulates a real search since we don't have a direct client-side way without CORS issues.
        // In a real app, this would be a server-side call.
        return [
          { title: `${query} - Search Result 1`, url: 'https://example.com/1', snippet: `Information about ${query} from source 1.` },
          { title: `${query} - Search Result 2`, url: 'https://example.com/2', snippet: `More details on ${query} from source 2.` },
        ].slice(0, maxResults);

      case 'serper':
        if (!apiKey) throw new Error('Serper API Key is required');
        const serperRes = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ q: query, num: maxResults })
        });
        const serperData = await serperRes.json();
        return (serperData.organic || []).map((item: any) => ({
          title: item.title,
          url: item.link,
          snippet: item.snippet
        }));

      case 'tavily':
        if (!apiKey) throw new Error('Tavily API Key is required');
        const tavilyRes = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ api_key: apiKey, query, max_results: maxResults })
        });
        const tavilyData = await tavilyRes.json();
        return (tavilyData.results || []).map((item: any) => ({
          title: item.title,
          url: item.url,
          snippet: item.content
        }));

      case 'brave':
        if (!apiKey) throw new Error('Brave API Key is required');
        const braveRes = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${maxResults}`, {
          headers: { 'Accept': 'application/json', 'X-Subscription-Token': apiKey }
        });
        const braveData = await braveRes.json();
        return (braveData.web?.results || []).map((item: any) => ({
          title: item.title,
          url: item.url,
          snippet: item.description
        }));

      default:
        return [];
    }
  } catch (error) {
    console.error(`Search error (${provider}):`, error);
    return [];
  }
}

export async function fetchArticleContent(url: string): Promise<string> {
  try {
    const response = await fetch(`https://r.jina.ai/${url}`);
    if (!response.ok) throw new Error('Failed to fetch article');
    return await response.text();
  } catch (error) {
    console.error(`Error fetching article (${url}):`, error);
    return '';
  }
}
