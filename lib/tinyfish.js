function normalizeTarget(target) {
  if (!target) return '';
  if (/^https?:\/\//i.test(target)) return target;
  if (target.includes('github.com')) return target;
  return `https://${target}`;
}

export async function tinyfishCrawl(target) {
  const normalized = normalizeTarget(target);
  const apiKey = process.env.TINYFISH_API_KEY;

  if (apiKey) {
    try {
      const res = await fetch('https://agent.tinyfish.ai/v1/automation/run-sse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({ url: normalized, depth: 2 }),
        signal: AbortSignal.timeout(8000),
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.pages || data?.urls) {
          return {
            pages: data.pages || data.urls || [normalized],
            forms: data.forms || [],
            source: 'tinyfish-live',
          };
        }
      }
    } catch {
      // fall through to mock
    }
  }

  return {
    pages: [normalized, `${normalized}/login`, `${normalized}/admin`, `${normalized}/api/users`, `${normalized}/api/files`],
    forms: ['login form detected', 'search form detected'],
    endpoints: ['/login', '/admin', '/api/users', '/api/files'],
    source: 'tinyfish-mock',
  };
}
