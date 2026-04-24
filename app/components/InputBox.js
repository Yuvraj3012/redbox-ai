'use client';
import { memo, useState } from 'react';

const InputBox = memo(function InputBox({ onRun, onDemo, isScanning }) {
  const [target, setTarget] = useState('');

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
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
        <button
          onClick={() => target.trim() && !isScanning && onRun(target.trim())}
          disabled={isScanning || !target.trim()}
          style={{
            background: '#e63946',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 20px',
            fontWeight: '700',
            cursor: isScanning ? 'not-allowed' : 'pointer',
            opacity: isScanning || !target.trim() ? 0.6 : 1,
            whiteSpace: 'nowrap',
          }}
        >
          {isScanning ? 'Scanning...' : 'Run Simulation'}
        </button>
        <button
          onClick={() => !isScanning && onDemo()}
          disabled={isScanning}
          style={{
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
