'use client';
import { useState } from 'react';
import Link from 'next/link';

// ─── Reusable terminal output box ─────────────────────────────────────────────
function Terminal({ lines, visible }) {
  if (!visible || lines.length === 0) return null;
  return (
    <div style={{
      background: '#000',
      border: '1px solid #333',
      borderRadius: '8px',
      padding: '12px 16px',
      fontFamily: 'monospace',
      fontSize: '13px',
      marginTop: '12px',
    }}>
      {lines.map((line, i) => (
        <div key={i} style={{ color: line.color || '#a3e635', marginBottom: '4px' }}>
          {line.text}
        </div>
      ))}
    </div>
  );
}

// ─── SQL Injection Demo ───────────────────────────────────────────────────────
function SQLInjectionDemo() {
  const [query, setQuery] = useState("' OR '1'='1");
  const [output, setOutput] = useState([]);
  const [ran, setRan] = useState(false);

  async function execute() {
    setRan(false);
    setOutput([]);
    await new Promise(r => setTimeout(r, 300));
    setOutput([
      { text: `> SELECT * FROM users WHERE name = '${query}'`, color: '#e5e5e5' },
      { text: '> RESULT: Returned ALL 148,000 user records', color: '#ef4444' },
      { text: '> BREACH: Complete database dump in 0.3 seconds', color: '#ef4444' },
      { text: '────────────────────────────────────────', color: '#333' },
      { text: '| admin@acmecorp.com    | admin | $2B revenue data      |', color: '#fbbf24' },
      { text: '| ceo@acmecorp.com      | admin | Board meeting notes   |', color: '#fbbf24' },
      { text: '| cto@acmecorp.com      | admin | AWS infrastructure    |', color: '#fbbf24' },
      { text: '| 148,000 more rows...  |       |                       |', color: '#6b7280' },
      { text: '────────────────────────────────────────', color: '#333' },
      { text: '> IMPACT: Full database exfiltration in a single request.', color: '#ef4444' },
    ]);
    setRan(true);
  }

  return (
    <div style={{ background: '#0f0f1a', border: '1px solid #1e1e3a', borderRadius: '12px', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: '700', margin: 0 }}>
          💉 SQL Injection Demo
        </h2>
        <span style={{ background: '#1a1a2e', color: '#22c55e', fontSize: '10px', padding: '3px 10px', borderRadius: '20px', letterSpacing: '1px' }}>
          SAFE DEMO ONLY
        </span>
      </div>
      <p style={{ color: '#6b7280', fontSize: '12px', marginBottom: '12px' }}>
        Real-world impact: Attacker dumps your entire user database in one HTTP request.
      </p>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{
            flex: 1,
            background: '#1a1a2e',
            border: '1px solid #333',
            borderRadius: '6px',
            padding: '10px 14px',
            color: '#fbbf24',
            fontFamily: 'monospace',
            fontSize: '13px',
          }}
          placeholder="Search users..."
        />
        <button
          onClick={execute}
          style={{
            background: '#ef4444',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            padding: '10px 18px',
            fontWeight: '700',
            cursor: 'pointer',
          }}
        >
          Execute Query
        </button>
        {ran && (
          <button
            onClick={() => { setOutput([]); setRan(false); }}
            style={{ background: 'transparent', color: '#6b7280', border: '1px solid #333', borderRadius: '6px', padding: '10px 14px', cursor: 'pointer' }}
          >
            Reset
          </button>
        )}
      </div>
      <Terminal lines={output} visible={ran} />
    </div>
  );
}

// ─── XSS Demo ─────────────────────────────────────────────────────────────────
function XSSDemo() {
  const [payload, setPayload] = useState("<script>alert(document.cookie)</script>");
  const [output, setOutput] = useState([]);
  const [ran, setRan] = useState(false);

  async function submit() {
    setRan(false);
    setOutput([]);
    await new Promise(r => setTimeout(r, 300));
    setOutput([
      { text: '> XSS PAYLOAD STORED IN DATABASE', color: '#ef4444' },
      { text: `> Payload: ${payload}`, color: '#fbbf24' },
      { text: '> EXECUTES ON EVERY USER WHO VIEWS THIS PAGE', color: '#ef4444' },
      { text: '> Cookie stolen: session=eyJhbGciOiJub25lIn0.eyJ1c2VyIjoiYWRtaW4ifQ.. (admin session)', color: '#fbbf24' },
      { text: '> Attacker now has persistent access to admin account', color: '#ef4444' },
      { text: '> All future visitors are also compromised', color: '#ef4444' },
      { text: '> IMPACT: Stored XSS — one injection poisons all users perpetually.', color: '#ef4444' },
    ]);
    setRan(true);
  }

  return (
    <div style={{ background: '#0f0f1a', border: '1px solid #1e1e3a', borderRadius: '12px', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: '700', margin: 0 }}>
          🎯 XSS (Cross-Site Scripting) Demo
        </h2>
        <span style={{ background: '#1a1a2e', color: '#22c55e', fontSize: '10px', padding: '3px 10px', borderRadius: '20px', letterSpacing: '1px' }}>
          SAFE DEMO ONLY
        </span>
      </div>
      <p style={{ color: '#6b7280', fontSize: '12px', marginBottom: '12px' }}>
        Real-world impact: Your comment box becomes a persistent attack vector against all users.
      </p>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          value={payload}
          onChange={e => setPayload(e.target.value)}
          style={{
            flex: 1,
            background: '#1a1a2e',
            border: '1px solid #333',
            borderRadius: '6px',
            padding: '10px 14px',
            color: '#f97316',
            fontFamily: 'monospace',
            fontSize: '13px',
          }}
          placeholder="Comment box..."
        />
        <button
          onClick={submit}
          style={{
            background: '#f97316',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            padding: '10px 18px',
            fontWeight: '700',
            cursor: 'pointer',
          }}
        >
          Submit Comment
        </button>
        {ran && (
          <button
            onClick={() => { setOutput([]); setRan(false); }}
            style={{ background: 'transparent', color: '#6b7280', border: '1px solid #333', borderRadius: '6px', padding: '10px 14px', cursor: 'pointer' }}
          >
            Reset
          </button>
        )}
      </div>
      <Terminal lines={output} visible={ran} />
    </div>
  );
}

// ─── Auth Bypass Demo ─────────────────────────────────────────────────────────
function AuthBypassDemo() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [output, setOutput] = useState([]);
  const [ran, setRan] = useState(false);

  async function login() {
    setRan(false);
    setOutput([]);
    await new Promise(r => setTimeout(r, 400));
    setOutput([
      { text: `> POST /api/auth/login  username=${username}  password="${password || '(empty)'}"`, color: '#e5e5e5' },
      { text: '> AUTHENTICATION BYPASSED', color: '#ef4444' },
      { text: '> Empty password accepted — no server-side validation', color: '#ef4444' },
      { text: '> JWT token issued: eyJhbGciOiJub25lIn0.eyJ1c2VyIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4ifQ..', color: '#fbbf24' },
      { text: '> Algorithm: none (JWT vulnerability — signature skipped)', color: '#ef4444' },
      { text: '> Access level: ADMINISTRATOR', color: '#ef4444' },
      { text: '────────────────────────────────────────', color: '#333' },
      { text: '> ADMIN PANEL UNLOCKED', color: '#ef4444' },
      { text: '> Total users in database: 148,000', color: '#fbbf24' },
      { text: '> Revenue records: $2,300,000,000', color: '#fbbf24' },
      { text: '> Employee SSNs: visible', color: '#fbbf24' },
      { text: '────────────────────────────────────────', color: '#333' },
    ]);
    setRan(true);
  }

  return (
    <div style={{ background: '#0f0f1a', border: '1px solid #1e1e3a', borderRadius: '12px', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: '700', margin: 0 }}>
          🔓 Authentication Bypass Demo
        </h2>
        <span style={{ background: '#1a1a2e', color: '#22c55e', fontSize: '10px', padding: '3px 10px', borderRadius: '20px', letterSpacing: '1px' }}>
          SAFE DEMO ONLY
        </span>
      </div>
      <p style={{ color: '#6b7280', fontSize: '12px', marginBottom: '12px' }}>
        Real-world impact: Empty password + JWT alg:none gives full admin access instantly.
      </p>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        <input
          value={username}
          onChange={e => setUsername(e.target.value)}
          style={{
            flex: 1,
            background: '#1a1a2e',
            border: '1px solid #333',
            borderRadius: '6px',
            padding: '10px 14px',
            color: '#fff',
            fontSize: '13px',
          }}
          placeholder="Username"
        />
        <input
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{
            flex: 1,
            background: '#1a1a2e',
            border: '1px solid #333',
            borderRadius: '6px',
            padding: '10px 14px',
            color: '#fff',
            fontSize: '13px',
          }}
          placeholder="Password (leave empty)"
        />
        <button
          onClick={login}
          style={{
            background: '#7c3aed',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            padding: '10px 18px',
            fontWeight: '700',
            cursor: 'pointer',
          }}
        >
          Login
        </button>
        {ran && (
          <button
            onClick={() => { setOutput([]); setRan(false); }}
            style={{ background: 'transparent', color: '#6b7280', border: '1px solid #333', borderRadius: '6px', padding: '10px 14px', cursor: 'pointer' }}
          >
            Reset
          </button>
        )}
      </div>
      <Terminal lines={output} visible={ran} />
    </div>
  );
}

// ─── Ransomware Simulation ─────────────────────────────────────────────────────
function RansomwareDemo() {
  const [active, setActive] = useState(false);
  const [decrypted, setDecrypted] = useState(false);

  async function simulate() {
    setDecrypted(false);
    setActive(false);
    await new Promise(r => setTimeout(r, 200));
    setActive(true);
  }

  function decrypt() {
    setActive(false);
    setDecrypted(true);
  }

  return (
    <div style={{ background: '#0f0f1a', border: '1px solid #1e1e3a', borderRadius: '12px', padding: '20px', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: '700', margin: 0 }}>
          🔒 Ransomware Simulation
        </h2>
        <span style={{ background: '#1a1a2e', color: '#22c55e', fontSize: '10px', padding: '3px 10px', borderRadius: '20px', letterSpacing: '1px' }}>
          SAFE DEMO ONLY
        </span>
      </div>
      <p style={{ color: '#6b7280', fontSize: '12px', marginBottom: '16px' }}>
        Real-world impact: All files encrypted in minutes. Business operations halted.
      </p>

      {/* "Files" that get blurred */}
      <div style={{ filter: active ? 'blur(6px)' : 'none', transition: 'filter 0.3s', marginBottom: '16px' }}>
        <div style={{ background: '#1a1a2e', borderRadius: '8px', padding: '12px', fontFamily: 'monospace', fontSize: '12px' }}>
          <div style={{ color: '#22c55e', marginBottom: '4px' }}>📁 /data/users.db  (148,000 records)</div>
          <div style={{ color: '#22c55e', marginBottom: '4px' }}>📁 /data/revenue.xlsx  ($2.3B data)</div>
          <div style={{ color: '#22c55e', marginBottom: '4px' }}>📁 /backups/secrets.bak  (credentials)</div>
          <div style={{ color: '#22c55e', marginBottom: '4px' }}>📁 /config/production.env  (AWS keys)</div>
          <div style={{ color: '#22c55e' }}>📁 /logs/audit_2024.log  (50GB)</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        {!active && (
          <button
            onClick={simulate}
            style={{
              background: '#991b1b',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '10px 20px',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            Simulate Ransomware Attack
          </button>
        )}
        {decrypted && (
          <button
            onClick={() => setDecrypted(false)}
            style={{ background: 'transparent', color: '#6b7280', border: '1px solid #333', borderRadius: '6px', padding: '10px 14px', cursor: 'pointer' }}
          >
            Reset
          </button>
        )}
      </div>

      {decrypted && (
        <div style={{ marginTop: '12px', background: '#052e16', border: '1px solid #166534', borderRadius: '8px', padding: '12px', fontFamily: 'monospace', fontSize: '12px', color: '#22c55e' }}>
          ✓ Demo decryption complete — all files restored (simulation only)
        </div>
      )}

      {/* Ransom overlay */}
      {active && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.93)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '12px',
          zIndex: 10,
          padding: '20px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>🔒</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#ef4444', marginBottom: '8px', letterSpacing: '2px' }}>
            ALL FILES ENCRYPTED
          </div>
          <div style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '16px', lineHeight: 1.6 }}>
            148,000 user records encrypted with AES-256<br />
            Ransom demand: $450,000 in Bitcoin<br />
            Time to decrypt without key: 3 million years
          </div>
          <div style={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: '8px', padding: '10px 20px', marginBottom: '16px', fontFamily: 'monospace', fontSize: '12px', color: '#fbbf24' }}>
            BTC: bc1q9r3k4m5p6q7s8t9u0v1w2x3y4z5a6b7c8d9e
          </div>
          <button
            onClick={decrypt}
            style={{
              background: '#22c55e',
              color: '#000',
              border: 'none',
              borderRadius: '6px',
              padding: '10px 24px',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            DECRYPT (Demo)
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SandboxPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#0B0B0B', color: '#fff', padding: '32px 20px' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <Link href="/" style={{ color: '#6b7280', fontSize: '13px', textDecoration: 'none' }}>
            ← Back to Dashboard
          </Link>
          <h1 style={{ fontSize: '32px', fontWeight: '900', marginTop: '12px', marginBottom: '4px' }}>
            🧪 RedBox Sandbox — Safe Attack Lab
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: '#22c55e', fontSize: '13px' }}>
              ● Intentionally vulnerable demo environment
            </span>
            <span style={{ color: '#4b5563', fontSize: '13px' }}>
              All attacks contained. No real systems harmed.
            </span>
          </div>
        </div>

        {/* Warning banner */}
        <div style={{
          background: '#1a0a0a',
          border: '1px solid #7f1d1d',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '24px',
          fontSize: '12px',
          color: '#fca5a5',
        }}>
          ⚠️ Educational purposes only. These demos simulate real attack techniques in a completely isolated environment with no network requests to real targets.
        </div>

        {/* 5 Demo Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <SQLInjectionDemo />
          <XSSDemo />
          <AuthBypassDemo />
          <RansomwareDemo />

          {/* Section 5 — What This Means */}
          <div style={{ background: '#0f0f1a', border: '1px solid #1e1e3a', borderRadius: '12px', padding: '20px' }}>
            <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>
              💡 Real-World Impact Summary
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {[
                { attack: 'SQL Injection', impact: 'Full DB dump in 0.3s', cost: '$1.2M avg breach', color: '#ef4444' },
                { attack: 'XSS (Stored)', impact: 'Persistent all-user compromise', cost: '$800K avg breach', color: '#f97316' },
                { attack: 'Auth Bypass', impact: 'Instant admin access', cost: '$2.3M avg breach', color: '#7c3aed' },
                { attack: 'Ransomware', impact: 'Full business shutdown', cost: '$4.5M avg demand', color: '#991b1b' },
              ].map(({ attack, impact, cost, color }) => (
                <div key={attack} style={{ background: '#1a1a2e', borderRadius: '8px', padding: '12px', borderLeft: `3px solid ${color}` }}>
                  <div style={{ color, fontWeight: '700', marginBottom: '4px', fontSize: '13px' }}>{attack}</div>
                  <div style={{ color: '#e5e5e5', fontSize: '12px', marginBottom: '2px' }}>{impact}</div>
                  <div style={{ color: '#6b7280', fontSize: '11px' }}>{cost}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <Link
                href="/"
                style={{
                  display: 'inline-block',
                  background: '#e63946',
                  color: '#fff',
                  textDecoration: 'none',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '13px',
                  letterSpacing: '1px',
                }}
              >
                Run Full Attack Simulation →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
