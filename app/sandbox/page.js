'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const tabs = [
  'SQL Injection',
  'XSS Attack',
  'Auth Bypass',
  'Ransomware',
  'Verify Your Domain',
];

function Section({ children }) {
  return (
    <div style={{ background: '#0f0f1a', border: '1px solid #1f1f34', borderRadius: '12px', padding: '18px' }}>
      {children}
    </div>
  );
}

function FixCard({ text }) {
  return (
    <div style={{ marginTop: '14px', background: '#062a18', border: '1px solid #166534', borderRadius: '8px', padding: '10px 12px', color: '#86efac', fontSize: '12px' }}>
      <strong>How to fix this:</strong> {text}
    </div>
  );
}

export default function SandboxPage() {
  const [activeTab, setActiveTab] = useState('SQL Injection');

  const [sqlUser, setSqlUser] = useState('admin');
  const [sqlPass, setSqlPass] = useState("' OR '1'='1");
  const [sqlLines, setSqlLines] = useState([]);

  const [xssPayload, setXssPayload] = useState('<script>alert(document.cookie)</script>');
  const [xssLines, setXssLines] = useState([]);
  const [xssAlert, setXssAlert] = useState(false);

  const [authUser, setAuthUser] = useState('admin');
  const [authPass, setAuthPass] = useState('');
  const [jwtAlg, setJwtAlg] = useState('HS256');
  const [authLines, setAuthLines] = useState([]);

  const [encryptedPaths, setEncryptedPaths] = useState([]);
  const [ransomProgress, setRansomProgress] = useState(0);
  const [ransomRunning, setRansomRunning] = useState(false);
  const [ransomDone, setRansomDone] = useState(false);

  const [verifyDomain, setVerifyDomain] = useState('');
  const [dnsToken, setDnsToken] = useState('');
  const [verified, setVerified] = useState(false);
  const [verifyLogs, setVerifyLogs] = useState([]);

  const files = useMemo(() => [
    '/user-data (148,000 records)',
    '/financial (Q4 revenue data)',
    '/credentials (employee passwords)',
  ], []);

  useEffect(() => {
    if (!ransomRunning) return;

    let index = 0;
    setEncryptedPaths([]);
    const lockTimer = setInterval(() => {
      if (index >= files.length) {
        clearInterval(lockTimer);
        return;
      }
      setEncryptedPaths((prev) => [...prev, files[index]]);
      index += 1;
    }, 400);

    let pct = 0;
    const progTimer = setInterval(() => {
      pct += 10;
      setRansomProgress(Math.min(pct, 100));
      if (pct >= 100) {
        clearInterval(progTimer);
        setRansomRunning(false);
        setRansomDone(true);
      }
    }, 220);

    return () => {
      clearInterval(lockTimer);
      clearInterval(progTimer);
    };
  }, [ransomRunning, files]);

  const runSqlDemo = () => {
    setSqlLines([
      `> Executing: SELECT * FROM users WHERE username='${sqlUser}' AND password='${sqlPass}'`,
      '> RESULT: Query bypassed!',
      '> Returned: ALL 148,000 user records',
      '> Admin access: GRANTED',
      '> Time to exploit: 0.3 seconds',
    ]);
  };

  const runXssDemo = () => {
    setXssLines([
      '> XSS payload stored in database',
      '> Executes when ANY user views this page',
      '> Cookie stolen: session=eyJhbGci... (admin)',
      '> Result: Attacker has persistent admin access',
      `> Payload: ${xssPayload}`,
    ]);
    setXssAlert(true);
  };

  const runAuthDemo = () => {
    const usingNone = jwtAlg === 'none';
    setAuthLines([
      `> Username: ${authUser}`,
      `> Password: ${authPass || '(empty)'}`,
      usingNone ? '> Empty password accepted' : '> Weak server-side validation detected',
      '> No validation on server',
      '> JWT issued: eyJhbGciOiJub25lIn0.eyJ1c2VyIjoiYWRtaW4ifQ.',
      `> Algorithm: ${jwtAlg} ${usingNone ? '— signature ignored' : '(toggle to none to show bypass)'}`,
      '> Access level: ADMINISTRATOR',
    ]);
  };

  const startRansomDemo = () => {
    setRansomProgress(0);
    setRansomDone(false);
    setRansomRunning(true);
  };

  const decryptDemo = () => {
    setRansomRunning(false);
    setRansomDone(false);
    setRansomProgress(0);
    setEncryptedPaths([]);
  };

  const generateDnsToken = () => {
    const domainLabel = verifyDomain || 'yourdomain.com';
    const token = `redbox-verify-${Math.random().toString(16).slice(2, 14)}`;
    setDnsToken(`_redbox-verify.${domainLabel} → ${token}`);
    setVerifyLogs((prev) => [...prev.slice(-6), `DNS token generated for ${domainLabel}`]);
  };

  const markVerified = (method) => {
    setVerified(true);
    setVerifyLogs((prev) => [...prev.slice(-6), `✓ Verified via ${method}`]);
  };

  const runFullSandboxTest = () => {
    setVerifyLogs((prev) => [
      ...prev.slice(-5),
      'Running full sandbox test against localhost vulnerable endpoints...',
      '→ /api/vulnerable/nosql',
      '→ /api/vulnerable/cmdinject',
      '→ /api/vulnerable/idor',
      '✓ Sandbox simulation completed safely',
    ]);
  };

  const terminalStyle = {
    marginTop: '12px',
    background: '#06080f',
    border: '1px solid #1a1a2e',
    borderRadius: '8px',
    padding: '10px',
    fontFamily: 'monospace',
    fontSize: '12px',
    color: '#d4d4d8',
    lineHeight: '1.7',
  };

  return (
    <main style={{ minHeight: '100vh', background: '#0B0B0B', color: '#fff', padding: '28px 16px 40px' }}>
      <div style={{ maxWidth: '980px', margin: '0 auto' }}>
        <Link href="/" style={{ color: '#9ca3af', fontSize: '13px', textDecoration: 'none' }}>
          ← Back to Dashboard
        </Link>

        <h1 style={{ fontSize: '32px', fontWeight: 900, marginTop: '12px', marginBottom: '6px' }}>
          🧪 RedBox Sandbox — Live Attack Lab
        </h1>
        <p style={{ color: '#94a3b8', marginBottom: '14px' }}>
          Safe demonstration environment — all attacks contained
        </p>

        <div style={{ background: '#1a0a0a', border: '1px solid #7f1d1d', color: '#fecaca', borderRadius: '10px', padding: '12px 14px', fontSize: '12px', marginBottom: '18px' }}>
          This sandbox uses intentionally vulnerable endpoints built into RedBox for demonstration purposes only.
          No external systems are harmed.
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                borderRadius: '999px',
                border: `1px solid ${activeTab === tab ? '#e63946' : '#30303f'}`,
                background: activeTab === tab ? '#e6394618' : '#0c0c16',
                color: activeTab === tab ? '#fca5a5' : '#94a3b8',
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'SQL Injection' && (
          <Section>
            <h2 style={{ margin: 0, fontSize: '16px' }}>SQL Injection</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '10px' }}>
              <div>
                <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '8px' }}>Fake login form</div>
                <input value={sqlUser} onChange={(e) => setSqlUser(e.target.value)} style={{ width: '100%', marginBottom: '8px', background: '#15152a', border: '1px solid #303046', borderRadius: '8px', padding: '10px', color: '#fff' }} />
                <input value={sqlPass} onChange={(e) => setSqlPass(e.target.value)} style={{ width: '100%', marginBottom: '8px', background: '#15152a', border: '1px solid #303046', borderRadius: '8px', padding: '10px', color: '#fff' }} />
                <button onClick={runSqlDemo} style={{ background: '#e63946', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 14px', fontWeight: 700, cursor: 'pointer' }}>
                  Login
                </button>
              </div>
              <div style={terminalStyle}>
                {sqlLines.length === 0 ? 'Terminal waiting for injection attempt...' : sqlLines.map((line, i) => <div key={i}>{line}</div>)}
              </div>
            </div>

            <div style={{ marginTop: '12px', background: '#090d18', border: '1px solid #1f2a40', borderRadius: '8px', padding: '10px', fontSize: '12px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', color: '#d4d4d8' }}>
                <thead>
                  <tr style={{ color: '#94a3b8' }}>
                    <th style={{ textAlign: 'left' }}>ID</th><th style={{ textAlign: 'left' }}>Email</th><th style={{ textAlign: 'left' }}>Role</th><th style={{ textAlign: 'left' }}>Data</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>1</td><td>ceo@company.com</td><td>admin</td><td>$2B revenue</td></tr>
                  <tr><td>2</td><td>cto@company.com</td><td>admin</td><td>AWS keys</td></tr>
                  <tr><td>3</td><td>...</td><td>...</td><td>... +147,997 more</td></tr>
                </tbody>
              </table>
            </div>
            <FixCard text="Use parameterized queries: db.query('SELECT * FROM users WHERE username=$1', [username])" />
          </Section>
        )}

        {activeTab === 'XSS Attack' && (
          <Section>
            <h2 style={{ margin: 0, fontSize: '16px' }}>XSS Attack</h2>
            <p style={{ color: '#94a3b8', fontSize: '12px' }}>Fake blog comment input:</p>
            <textarea value={xssPayload} onChange={(e) => setXssPayload(e.target.value)} rows={3} style={{ width: '100%', background: '#15152a', border: '1px solid #303046', borderRadius: '8px', padding: '10px', color: '#fff' }} />
            <button onClick={runXssDemo} style={{ marginTop: '10px', background: '#fb923c', color: '#111', border: 'none', borderRadius: '8px', padding: '10px 14px', fontWeight: 700, cursor: 'pointer' }}>
              Submit Comment
            </button>

            <div style={terminalStyle}>
              {xssLines.length === 0 ? 'Terminal waiting for stored XSS simulation...' : xssLines.map((line, i) => <div key={i}>{line}</div>)}
            </div>

            {xssAlert && (
              <div style={{ marginTop: '12px', background: '#2a0a0a', border: '1px solid #ef4444', borderRadius: '8px', padding: '10px', color: '#fecaca', fontSize: '12px' }}>
                ⚠ XSS Alert: document.cookie = 'session=ADMIN_TOKEN'
              </div>
            )}
            <FixCard text="Sanitize all inputs: htmlspecialchars($input)" />
          </Section>
        )}

        {activeTab === 'Auth Bypass' && (
          <Section>
            <h2 style={{ margin: 0, fontSize: '16px' }}>Auth Bypass</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
              <input value={authUser} onChange={(e) => setAuthUser(e.target.value)} placeholder="Username" style={{ background: '#15152a', border: '1px solid #303046', borderRadius: '8px', padding: '10px', color: '#fff' }} />
              <input value={authPass} onChange={(e) => setAuthPass(e.target.value)} placeholder="Password" style={{ background: '#15152a', border: '1px solid #303046', borderRadius: '8px', padding: '10px', color: '#fff' }} />
            </div>

            <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>Algorithm:</span>
              <select value={jwtAlg} onChange={(e) => setJwtAlg(e.target.value)} style={{ background: '#15152a', border: '1px solid #303046', borderRadius: '8px', padding: '8px 10px', color: '#fff' }}>
                <option value="HS256">HS256</option>
                <option value="none">none</option>
              </select>
              <button onClick={runAuthDemo} style={{ background: '#a855f7', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 14px', fontWeight: 700, cursor: 'pointer' }}>
                Login
              </button>
            </div>

            <div style={terminalStyle}>
              {authLines.length === 0 ? 'Terminal waiting for auth bypass simulation...' : authLines.map((line, i) => <div key={i}>{line}</div>)}
            </div>
            <FixCard text="Always validate passwords, never use alg:none" />
          </Section>
        )}

        {activeTab === 'Ransomware' && (
          <Section>
            <h2 style={{ margin: 0, fontSize: '16px' }}>Ransomware Simulation</h2>
            <div style={{ marginTop: '10px', background: '#0a0f1c', border: '1px solid #1f2a40', borderRadius: '8px', padding: '10px', fontSize: '12px' }}>
              {files.map((path) => (
                <div key={path} style={{ color: encryptedPaths.includes(path) ? '#ef4444' : '#86efac', marginBottom: '6px' }}>
                  {encryptedPaths.includes(path) ? '🔒' : '📁'} {path}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <button onClick={startRansomDemo} disabled={ransomRunning} style={{ background: '#b91c1c', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 14px', fontWeight: 700, cursor: 'pointer', opacity: ransomRunning ? 0.6 : 1 }}>
                Simulate Ransomware
              </button>
              <button onClick={decryptDemo} style={{ background: 'transparent', color: '#86efac', border: '1px solid #166534', borderRadius: '8px', padding: '10px 14px', fontWeight: 700, cursor: 'pointer' }}>
                Decrypt (Demo)
              </button>
            </div>

            {(ransomRunning || ransomDone) && (
              <div style={{ marginTop: '14px', background: '#2a0a0a', border: '1px solid #7f1d1d', borderRadius: '8px', padding: '10px' }}>
                <div style={{ color: '#fca5a5', fontWeight: 700, marginBottom: '8px' }}>🔒 ENCRYPTION IN PROGRESS</div>
                <div style={{ background: '#111827', borderRadius: '999px', height: '10px', overflow: 'hidden' }}>
                  <div style={{ width: `${ransomProgress}%`, height: '100%', background: '#ef4444', transition: 'width 0.2s linear' }} />
                </div>
                <div style={{ marginTop: '6px', fontSize: '12px', color: '#fecaca' }}>{ransomProgress}%</div>
              </div>
            )}

            {ransomDone && (
              <div style={{ marginTop: '12px', color: '#fecaca', fontSize: '13px', lineHeight: '1.7' }}>
                ALL 148,000 RECORDS ENCRYPTED<br />
                Ransom: $450,000 in Bitcoin<br />
                Deadline: 72 hours
              </div>
            )}
            <FixCard text="Patch vulnerabilities before ransomware finds them" />
          </Section>
        )}

        {activeTab === 'Verify Your Domain' && (
          <Section>
            <h2 style={{ margin: 0, fontSize: '16px' }}>Verify ownership to enable full sandbox testing</h2>
            <p style={{ color: '#94a3b8', fontSize: '12px' }}>Choose one method to prove you own this domain.</p>

            <div style={{ display: 'grid', gap: '10px' }}>
              <div style={{ border: '1px solid #2d2d42', borderRadius: '8px', padding: '10px' }}>
                <div style={{ fontWeight: 700, marginBottom: '6px' }}>METHOD 1 — DNS Verification</div>
                <input value={verifyDomain} onChange={(e) => setVerifyDomain(e.target.value)} placeholder="Enter your domain" style={{ width: '100%', background: '#15152a', border: '1px solid #303046', borderRadius: '8px', padding: '9px', color: '#fff', marginBottom: '8px' }} />
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button onClick={generateDnsToken} style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 12px', fontWeight: 700, cursor: 'pointer' }}>Generate TXT Record</button>
                  <button onClick={() => markVerified('DNS TXT')} style={{ background: 'transparent', color: '#22c55e', border: '1px solid #166534', borderRadius: '8px', padding: '8px 12px', fontWeight: 700, cursor: 'pointer' }}>Check Verification</button>
                </div>
                {dnsToken && <div style={{ marginTop: '8px', fontSize: '12px', color: '#93c5fd' }}>Add this TXT record to your DNS: {dnsToken}</div>}
              </div>

              <div style={{ border: '1px solid #2d2d42', borderRadius: '8px', padding: '10px' }}>
                <div style={{ fontWeight: 700, marginBottom: '6px' }}>METHOD 2 — HTTP File</div>
                <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px' }}>Download this file and place at /.well-known/redbox.txt</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button onClick={() => setVerifyLogs((prev) => [...prev.slice(-6), 'verification.txt downloaded (demo)'])} style={{ background: '#0f766e', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 12px', fontWeight: 700, cursor: 'pointer' }}>Download verification.txt</button>
                  <button onClick={() => markVerified('HTTP file')} style={{ background: 'transparent', color: '#22c55e', border: '1px solid #166534', borderRadius: '8px', padding: '8px 12px', fontWeight: 700, cursor: 'pointer' }}>Check URL</button>
                </div>
              </div>

              <div style={{ border: '1px solid #2d2d42', borderRadius: '8px', padding: '10px' }}>
                <div style={{ fontWeight: 700, marginBottom: '6px' }}>METHOD 3 — GitHub OAuth</div>
                <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px' }}>Connect your GitHub to verify repo ownership.</div>
                <button onClick={() => markVerified('GitHub OAuth')} style={{ background: '#111827', color: '#fff', border: '1px solid #374151', borderRadius: '8px', padding: '8px 12px', fontWeight: 700, cursor: 'pointer' }}>Connect GitHub</button>
              </div>
            </div>

            {verified && (
              <div style={{ marginTop: '12px', background: '#052e16', border: '1px solid #166534', borderRadius: '8px', padding: '10px', color: '#86efac', fontSize: '13px' }}>
                ✓ DOMAIN VERIFIED — Full attack simulation enabled
                <div style={{ marginTop: '8px' }}>
                  <button onClick={runFullSandboxTest} style={{ background: '#22c55e', color: '#052e16', border: 'none', borderRadius: '8px', padding: '8px 12px', fontWeight: 700, cursor: 'pointer' }}>
                    Run Full Sandbox Test
                  </button>
                </div>
              </div>
            )}

            <div style={terminalStyle}>
              {verifyLogs.length === 0 ? 'Verification logs will appear here...' : verifyLogs.map((line, i) => <div key={i}>{line}</div>)}
            </div>
          </Section>
        )}
      </div>
    </main>
  );
}
