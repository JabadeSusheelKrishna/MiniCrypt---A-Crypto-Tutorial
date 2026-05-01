import React, { useState } from 'react';

const PA5MAC = () => {
  const [mode, setMode] = useState('CBC');
  const [k, setK] = useState('123');
  const [m, setM] = useState('hello');
  const [tag, setTag] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);
  const [attackResult, setAttackResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateMAC = async () => {
    setLoading(true);
    // Convert m to hex
    const mHex = Array.from(new TextEncoder().encode(m)).map(b => b.toString(16).padStart(2, '0')).join('');
    try {
      const response = await fetch('/api/pa5/mac', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, k: parseInt(k), m_hex: mHex }),
      });
      const data = await response.json();
      setTag(data.tag);
      setVerifyResult(null);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const verifyMAC = async () => {
    if (tag === null) return;
    setLoading(true);
    const mHex = Array.from(new TextEncoder().encode(m)).map(b => b.toString(16).padStart(2, '0')).join('');
    try {
      const response = await fetch('/api/pa5/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, k: parseInt(k), m_hex: mHex, tag: parseInt(tag) }),
      });
      const data = await response.json();
      setVerifyResult(data.valid);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const runAttack = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/pa5/attack/extension', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ k: parseInt(k) }),
      });
      const data = await response.json();
      setAttackResult(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">PA #5 — MAC</h2>
        <p className="panel-subtitle">Message Authentication Codes (Integrity).</p>
      </div>

      <div className="form-group">
        <label>Configuration</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <select value={mode} onChange={e => setMode(e.target.value)} style={{ padding: '0.5rem' }}>
            <option value="CBC">CBC-MAC</option>
            <option value="PRF">PRF-MAC (1-byte)</option>
          </select>
          <input type="number" value={k} onChange={e => setK(e.target.value)} placeholder="Key (k)" />
        </div>
        <input type="text" value={m} onChange={e => setM(e.target.value)} placeholder="Message" style={{ width: '100%', marginBottom: '0.5rem' }} />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-primary" style={{ flex: 1 }} onClick={generateMAC}>Generate Tag</button>
          <button className="foundation-btn" style={{ flex: 1 }} onClick={verifyMAC} disabled={tag === null}>Verify</button>
        </div>
        
        {tag !== null && (
          <div className="result-box">
            <p><strong>Tag:</strong> {hexFormat(tag)}</p>
            {verifyResult !== null && (
              <p style={{ marginTop: '0.5rem', fontWeight: 'bold', color: verifyResult ? 'var(--accent)' : 'var(--danger)' }}>
                {verifyResult ? '✅ VALID SIGNATURE' : '❌ INVALID SIGNATURE'}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="form-group">
        <label>Length-Extension Attack Demo</label>
        <button className="foundation-btn" onClick={runAttack} style={{ width: '100%' }}>Run Attack Demo</button>
        {attackResult && (
          <div className="result-box" style={{ fontSize: '0.875rem' }}>
            <p>Original: "{attackResult.m}" | Ext: "{attackResult.extension}"</p>
            <p>Forged Tag: {attackResult.forged_tag}</p>
            <p>Correct Tag: {attackResult.correct_tag}</p>
            <p style={{ color: 'var(--danger)', fontWeight: 'bold', marginTop: '0.5rem' }}>
              {attackResult.match ? 'ATTACK SUCCEEDED!' : 'ATTACK FAILED'}
            </p>
            <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
              Vulnerability: Naive H(k||m) construction allows appending data to a known tag without knowing k.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const hexFormat = (n) => {
  if (typeof n !== 'number') return n;
  return '0x' + n.toString(16).padStart(2, '0').toUpperCase();
};

export default PA5MAC;
