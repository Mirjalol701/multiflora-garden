export type WebSearchHit = {
  title: string;
  url: string;
  content: string;
};

export async function searchWeb(query: string): Promise<WebSearchHit[]> {
  const apiKey = process.env.TAVILY_API_KEY?.trim();

  if (!apiKey) {
    return [];
  }

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query: query.slice(0, 400),
      max_results: 5,
      search_depth: "basic",
      include_answer: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Web search failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    results?: { title?: string; url?: string; content?: string }[];
  };

  return (data.results ?? [])
    .filter((r) => r.content?.trim())
    .map((r) => ({
      title: r.title ?? "Source",
      url: r.url ?? "",
      content: r.content!.slice(0, 500),
    }));
}

export function formatWebHits(hits: WebSearchHit[]): string {
  if (hits.length === 0) return "";
  return hits
    .map(
      (h, i) =>
        `${i + 1}. **${h.title}**${h.url ? ` (${h.url})` : ""}\n${h.content}`
    )
    .join("\n\n");
}
