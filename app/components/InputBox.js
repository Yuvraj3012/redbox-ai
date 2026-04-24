'use client';
import { memo, useState } from 'react';

const actionHintStyle = {
  marginTop: '6px',
  fontSize: '11px',
  color: '#6b7280',
  textAlign: 'center',
};

const buttonShellStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  minWidth: '170px',
};

const InputBox = memo(function InputBox({ onRun, onDemo, isScanning }) {
  const [target, setTarget] = useState('');

  const runDisabled = isScanning || !target.trim();

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', width: '100%', alignItems: 'flex-start' }}>
        <input
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !isScanning && target.trim() && onRun(target.trim())}
          placeholder="demo-startup-vulnapp  ← click Demo Mode"
          style={{
            flex: 1,
            background: '#1a1a2e',
            border: '1px solid #333',
            borderRadius: '8px',
            padding: '12px 16px',
            color: '#fff',
            fontSize: '14px',
            outline: 'none',
          }}
          disabled={isScanning}
        />

        <div style={buttonShellStyle}>
          <button
            title="Scan domain and simulate attack chain"
            onClick={() => target.trim() && !isScanning && onRun(target.trim())}
            disabled={runDisabled}
            style={{
              width: '100%',
              background: '#e63946',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 20px',
              fontWeight: '700',
              cursor: runDisabled ? 'not-allowed' : 'pointer',
              opacity: runDisabled ? 0.6 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            {isScanning ? 'Scanning...' : 'Run Simulation'}
          </button>
          <div style={actionHintStyle}>Scan domain and simulate attack chain</div>
        </div>

        <div style={buttonShellStyle}>
          <button
            title="See a pre-built attack simulation"
            onClick={() => !isScanning && onDemo()}
            disabled={isScanning}
            style={{
              width: '100%',
              background: 'transparent',
              color: '#e63946',
              border: '1px solid #e63946',
              borderRadius: '8px',
              padding: '12px 20px',
              fontWeight: '700',
              cursor: isScanning ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Demo Mode
          </button>
          <div style={actionHintStyle}>See a pre-built attack simulation</div>
        </div>
      </div>

      <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
        Try:{' '}
        <span
          onClick={() => !isScanning && onDemo()}
          style={{ color: '#e63946', cursor: 'pointer', textDecoration: 'underline' }}
        >
          demo
        </span>
        {' '}or paste a GitHub repo URL
      </div>
    </div>
  );
});

export default InputBox;
