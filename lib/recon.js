// ─── Domain Recon ─────────────────────────────────────────────────────────────

function normalizeUrl(target) {
  if (!target) return '';
  if (/^https?:\/\//i.test(target)) return target;
  return `https://${target}`;
}

const REQUIRED_HEADERS = [
  { name: 'content-security-policy',   severity: 'critical', label: 'Content-Security-Policy' },
  { name: 'strict-transport-security', severity: 'critical', label: 'HSTS' },
  { name: 'x-frame-options',           severity: 'high',     label: 'X-Frame-Options' },
  { name: 'x-content-type-options',    severity: 'high',     label: 'X-Content-Type-Options' },
  { name: 'referrer-policy',           severity: 'medium',   label: 'Referrer-Policy' },
  { name: 'permissions-policy',        severity: 'medium',   label: 'Permissions-Policy' },
];

const PROBE_PATHS = [
  '/admin', '/login', '/wp-admin', '/api',
  '/.env', '/config', '/robots.txt', '/sitemap.xml',
  '/graphql', '/swagger', '/api-docs', '/.git/config',
];

export async function reconScan(target) {
  console.log('[Recon] Real scan for:', target);

  const url = normalizeUrl(target);
  const results = {
    url,
    headers: {},
    missingHeaders: [],
    exposedInfo: [],
    endpoints: [],
    techStack: [],
    ssl: {},
    findings: [],
    statusCode: null,
    robotsPaths: [],
  };

  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SecurityScanner/1.0)' },
    });

    results.statusCode = res.status;

    // Capture real response headers
    res.headers.forEach((value, key) => { results.headers[key] = value; });

    // ── Missing security headers ──
    for (const h of REQUIRED_HEADERS) {
      if (!results.headers[h.name]) {
        results.missingHeaders.push({ header: h.label, severity: h.severity });
        results.findings.push({
          title: `Missing ${h.label} Header`,
          severity: h.severity,
          description: `The ${h.label} security header is absent — this opens ${h.label === 'Content-Security-Policy' ? 'XSS and injection' : h.label === 'HSTS' ? 'SSL-stripping and MITM' : 'clickjacking or content-sniffing'} vectors.`,
          recommendation: `Add ${h.label} to every HTTP response.`,
        });
      }
    }

    // ── Tech stack detection ──
    const server = results.headers['server'] || '';
    const powered = results.headers['x-powered-by'] || '';
    const via = results.headers['via'] || '';
    if (server) {
      results.techStack.push({ type: 'Server', value: server });
      results.exposedInfo.push({ type: 'Server Version Exposed', value: server, severity: 'medium' });
    }
    if (powered) {
      results.techStack.push({ type: 'Framework', value: powered });
      results.exposedInfo.push({ type: 'Technology Exposed', value: powered, severity: 'medium' });
    }
    if (via) results.techStack.push({ type: 'CDN/Proxy', value: via });
    if (results.headers['cf-ray'])                results.techStack.push({ type: 'CDN', value: 'Cloudflare' });
    if (results.headers['x-amz-cf-id'])           results.techStack.push({ type: 'CDN', value: 'AWS CloudFront' });
    if (results.headers['x-fastly-request-id'])   results.techStack.push({ type: 'CDN', value: 'Fastly' });
    if (results.headers['x-cache'])               results.techStack.push({ type: 'Cache', value: results.headers['x-cache'] });

    // ── Cookie flags ──
    const setCookie = results.headers['set-cookie'] || '';
    if (setCookie && !/httponly/i.test(setCookie)) {
      results.findings.push({
        title: 'Cookie Missing HttpOnly Flag',
        severity: 'medium',
        description: 'Session cookies are readable by JavaScript — XSS can steal sessions.',
        recommendation: 'Set HttpOnly on all session cookies.',
      });
    }
    if (setCookie && !/;\s*secure/i.test(setCookie)) {
      results.findings.push({
        title: 'Cookie Missing Secure Flag',
        severity: 'medium',
        description: 'Cookies transmitted over plain HTTP can be intercepted.',
        recommendation: 'Set Secure flag on all cookies.',
      });
    }

    // ── CORS wildcard ──
    if ((results.headers['access-control-allow-origin'] || '') === '*') {
      results.findings.push({
        title: 'CORS Wildcard Misconfiguration',
        severity: 'high',
        description: 'Access-Control-Allow-Origin: * lets any domain make credentialed requests.',
        recommendation: 'Restrict CORS to specific trusted origins.',
      });
    }

    // ── Endpoint probing (parallel) ──
    const checks = await Promise.allSettled(
      PROBE_PATHS.map(async (path) => {
        try {
          const r = await fetch(url.replace(/\/$/, '') + path, {
            method: 'GET',
            redirect: 'manual',
            signal: AbortSignal.timeout(3000),
          });
          return { path, status: r.status, exists: r.status < 400 };
        } catch {
          return { path, status: 0, exists: false };
        }
      })
    );

    for (const c of checks) {
      if (c.status !== 'fulfilled') continue;
      const ep = c.value;
      results.endpoints.push(ep);

      if (['/admin', '/wp-admin'].includes(ep.path) && ep.status === 200) {
        results.findings.push({
          title: `Admin Panel Exposed: ${ep.path}`,
          severity: 'critical',
          description: `${ep.path} returns HTTP 200 without authentication — full admin access possible.`,
          recommendation: 'Restrict admin access to authenticated, IP-allowlisted users.',
        });
      }
      if (ep.path === '/.env' && ep.exists) {
        results.findings.push({
          title: 'Environment File Publicly Accessible',
          severity: 'critical',
          description: '.env file is reachable — may expose API keys, DB passwords, and secrets.',
          recommendation: 'Remove .env from web root immediately and add to .gitignore.',
        });
      }
      if (ep.path === '/.git/config' && ep.exists) {
        results.findings.push({
          title: 'Git Repository Exposed',
          severity: 'critical',
          description: '.git directory is accessible — full source code can be reconstructed.',
          recommendation: 'Block .git directory access in web server config.',
        });
      }
      if (ep.path === '/graphql' && ep.status === 200) {
        results.findings.push({
          title: 'GraphQL Endpoint Exposed',
          severity: 'high',
          description: 'GraphQL endpoint is public — introspection may reveal full schema.',
          recommendation: 'Disable introspection in production and add authentication.',
        });
      }
    }

    // ── robots.txt ──
    const robotsCheck = checks.find(c => c.status === 'fulfilled' && c.value.path === '/robots.txt' && c.value.exists);
    if (robotsCheck) {
      try {
        const rRes = await fetch(url + '/robots.txt', { signal: AbortSignal.timeout(3000) });
        const rText = await rRes.text();
        const paths = (rText.match(/Disallow: \/[a-zA-Z0-9/\-_]+/g) || []).slice(0, 10);
        results.robotsPaths = paths;
        if (paths.length > 3) {
          results.findings.push({
            title: 'Sensitive Paths in robots.txt',
            severity: 'low',
            description: `robots.txt lists ${paths.length} disallowed paths — attackers use this as a recon map.`,
            recommendation: 'Limit robots.txt to SEO-relevant paths only.',
          });
        }
      } catch { /* non-fatal */ }
    }

  } catch (err) {
    console.error('[Recon] Fetch failed:', err.message);
    results.error = err.message;
    results.findings.push({
      title: 'Scan Attempt Failed',
      severity: 'info',
      description: `Could not connect to ${url}: ${err.message}`,
      recommendation: 'Verify the domain is reachable and try again.',
    });
  }

  // ── Calculate risk score from real findings ──
  let score = 0;
  for (const f of results.findings) {
    if (f.severity === 'critical') score += 25;
    else if (f.severity === 'high') score += 15;
    else if (f.severity === 'medium') score += 8;
    else score += 3;
  }
  results.riskScore = Math.min(score, 95);

  console.log(`[Recon] Done — ${results.findings.length} findings, risk: ${results.riskScore}`);
  return results;
}

// ─── GitHub Repo Recon ────────────────────────────────────────────────────────

const SENSITIVE_FILES = [
  '.env', '.env.local', '.env.production', '.env.staging',
  'config/database.yml', 'config/secrets.yml',
  'secrets.json', 'credentials.json', 'private.key',
  'id_rsa', 'server.key', 'aws-credentials',
];

const SECRET_PATTERNS = [
  { pattern: /AKIA[0-9A-Z]{16}/, type: 'AWS Access Key ID' },
  { pattern: /[a-zA-Z0-9/+=]{40}/, type: 'Possible AWS Secret Key' },
  { pattern: /sk-[a-zA-Z0-9]{32,}/, type: 'API Secret Key' },
  { pattern: /password\s*=\s*[^\s\n]+/i, type: 'Hardcoded Password' },
  { pattern: /secret\s*=\s*[^\s\n]+/i, type: 'Hardcoded Secret' },
  { pattern: /mongodb:\/\/[^\s\n]+/, type: 'MongoDB Connection String' },
  { pattern: /postgresql:\/\/[^\s\n]+/, type: 'PostgreSQL Connection String' },
  { pattern: /redis:\/\/[^\s\n]+/, type: 'Redis Connection String' },
];

export async function scanGitHubRepo(repoUrl) {
  console.log('[GitHub] Scanning:', repoUrl);

  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/?\s#]+)/);
  if (!match) return { type: 'github', findings: [], riskScore: 0, techStack: [] };

  const [, owner, repo] = match;
  const findings = [];
  const exposedFiles = [];
  const ghHeaders = { 'User-Agent': 'RedBox-Security-Scanner' };

  let repoMeta = {};

  try {
    // ── Repo metadata ──
    try {
      const metaRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: ghHeaders,
        signal: AbortSignal.timeout(5000),
      });
      if (metaRes.ok) repoMeta = await metaRes.json();
    } catch { /* non-fatal */ }

    // ── Root directory listing ──
    try {
      const contentsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, {
        headers: ghHeaders,
        signal: AbortSignal.timeout(5000),
      });
      if (contentsRes.ok) {
        const contents = await contentsRes.json();
        if (Array.isArray(contents)) {
          for (const file of contents) {
            const nameLower = file.name.toLowerCase();
            if (SENSITIVE_FILES.some(s => nameLower === s || nameLower.startsWith(s.replace('config/', '')))) {
              exposedFiles.push(file.name);
              findings.push({
                title: `Sensitive File in Repository: ${file.name}`,
                severity: 'critical',
                description: `${file.name} is committed to the public repo — may contain credentials or secrets.`,
                recommendation: `Remove ${file.name}, rotate all credentials, add to .gitignore, scrub git history.`,
              });
            }
          }
        }
      }
    } catch { /* non-fatal */ }

    // ── Try fetching actual .env content ──
    for (const branch of ['main', 'master']) {
      try {
        const envRes = await fetch(
          `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/.env`,
          { signal: AbortSignal.timeout(4000) }
        );
        if (envRes.ok) {
          const envContent = await envRes.text();
          const foundSecrets = SECRET_PATTERNS.filter(({ pattern }) => pattern.test(envContent)).map(p => p.type);
          if (foundSecrets.length > 0) {
            findings.push({
              title: `CRITICAL: ${foundSecrets.length} Secrets Exposed in Public .env`,
              severity: 'critical',
              description: `Public .env file contains: ${foundSecrets.join(', ')}`,
              recommendation: 'IMMEDIATE: Remove file, rotate ALL credentials, force-push clean history.',
            });
          } else if (envContent.includes('=')) {
            findings.push({
              title: '.env File Publicly Readable',
              severity: 'critical',
              description: '.env file is accessible and contains key=value pairs (may include secrets).',
              recommendation: 'Remove from repository and rotate any exposed values.',
            });
          }
          break;
        }
      } catch { /* non-fatal */ }
    }

    // ── Check package.json for known vulnerable deps ──
    try {
      const pkgRes = await fetch(
        `https://raw.githubusercontent.com/${owner}/${repo}/main/package.json`,
        { signal: AbortSignal.timeout(4000) }
      );
      if (pkgRes.ok) {
        const pkg = await pkgRes.json();
        const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
        const vulnerable = [];
        for (const [name, ver] of Object.entries(allDeps || {})) {
          if (/^[\^~]?4\.|^[\^~]?3\./.test(ver) && /express|mongoose|request/.test(name)) {
            vulnerable.push(`${name}@${ver}`);
          }
        }
        if (vulnerable.length > 0) {
          findings.push({
            title: `Potentially Outdated Dependencies (${vulnerable.length})`,
            severity: 'medium',
            description: `Packages with potentially known vulnerabilities: ${vulnerable.slice(0, 4).join(', ')}`,
            recommendation: 'Run npm audit and update dependencies to latest stable versions.',
          });
        }
      }
    } catch { /* non-fatal */ }

  } catch (err) {
    console.error('[GitHub] Scan error:', err.message);
  }

  let score = 0;
  for (const f of findings) {
    if (f.severity === 'critical') score += 30;
    else if (f.severity === 'high')    score += 15;
    else if (f.severity === 'medium')  score += 8;
    else score += 3;
  }

  return {
    type: 'github',
    url: repoUrl,
    owner, repo,
    repoName: repoMeta.full_name || `${owner}/${repo}`,
    description: repoMeta.description || '',
    stars: repoMeta.stargazers_count || 0,
    language: repoMeta.language || 'Unknown',
    isPrivate: repoMeta.private || false,
    exposedFiles,
    findings,
    techStack: repoMeta.language ? [{ type: 'Language', value: repoMeta.language }] : [],
    riskScore: Math.min(score, 98),
    endpoints: [],
    headers: {},
  };
}
