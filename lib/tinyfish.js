async function safeFetch(url) {
  try {
    const res = await fetch(url, { method: "GET", redirect: "follow" });
    const body = await res.text();
    return { ok: true, status: res.status, headers: Object.fromEntries(res.headers.entries()), body };
  } catch (error) {
    return { ok: false, status: 0, headers: {}, body: String(error) };
  }
}

function extractEndpoints(html) {
  const matches = html.match(/href=["']([^"'#?]+)["']/gi) || [];
  const raw = matches.map((m) => m.split("=")[1].replace(/["']/g, ""));
  const filtered = raw.filter((s) => s.startsWith("/")).slice(0, 20);
  return [...new Set(filtered)];
}

export async function tinyfishBrowse(target) {
  const endpoint = process.env.TINYFISH_BROWSE_ENDPOINT;

  if (endpoint) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${process.env.TINYFISH_API_KEY || ""}`,
        },
        body: JSON.stringify({ url: target, depth: 2 }),
      });
      const data = await res.json();
      return {
        source: "tinyfish",
        endpoints: data.endpoints || [],
        techStack: data.techStack || [],
        notes: data.notes || ["Tinyfish crawl complete"],
      };
    } catch {
      // fall through
    }
  }

  const page = await safeFetch(target);
  const endpoints = extractEndpoints(page.body);
  const techStack = [page.headers.server, page.headers["x-powered-by"], "Next.js"].filter(Boolean);

  return {
    source: "mock",
    endpoints,
    techStack,
    notes: [
      `Passive crawl complete (${page.status})`,
      `Discovered ${endpoints.length} linked paths`,
      "No active exploitation performed",
    ],
  };
}
