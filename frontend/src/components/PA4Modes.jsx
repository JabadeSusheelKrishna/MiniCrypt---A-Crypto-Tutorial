import React, { useState } from 'react';

const PA4Modes = () => {
  const [mode, setMode] = useState('CBC');
  const [k, setK] = useState('12345');
  const [m, setM] = useState('Hello Modes');
  const [encResult, setEncResult] = useState(null);
  const [decResult, setDecResult] = useState(null);
  const [attackResult, setAttackResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const encrypt = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/pa4/encrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, k: parseInt(k), m }),
      });
      const data = await response.json();
      setEncResult(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const decrypt = async () => {
    if (!encResult) return;
    setLoading(true);
    try {
      const response = await fetch('/api/pa4/decrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, k: parseInt(k), iv_or_r: encResult.iv_or_r, c_hex: encResult.c_hex }),
      });
      const data = await response.json();
      setDecResult(data.m);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const runAttack = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/pa4/attack/iv_reuse', {
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
        <h2 className="panel-title">PA #4 — Modes of Operation</h2>
        <p className="panel-subtitle">Comparing CBC, OFB, and CTR modes.</p>
      </div>

      <div className="form-group">
        <label>Configuration</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <select value={mode} onChange={e => setMode(e.target.value)} style={{ padding: '0.5rem' }}>
            <option value="CBC">CBC</option>
            <option value="OFB">OFB</option>
            <option value="CTR">CTR</option>
          </select>
          <input type="number" value={k} onChange={e => setK(e.target.value)} placeholder="Key (k)" />
        </div>
        <input type="text" value={m} onChange={e => setM(e.target.value)} placeholder="Message" style={{ width: '100%', marginBottom: '0.5rem' }} />
        <button className="btn-primary" style={{ width: '100%' }} onClick={encrypt}>Encrypt ({mode})</button>
        
        {encResult && (
          <div className="result-box" style={{ fontSize: '0.875rem' }}>
            <p><strong>IV/r:</strong> {encResult.iv_or_r}</p>
            <p><strong>c (hex):</strong> {encResult.c_hex}</p>
            <button className="foundation-btn" style={{ marginTop: '0.5rem', width: '100%' }} onClick={decrypt}>Decrypt</button>
            {decResult && <p style={{ marginTop: '0.5rem', color: 'var(--accent)' }}><strong>Decrypted:</strong> {decResult}</p>}
          </div>
        )}
      </div>

      <div className="form-group">
        <label>CBC IV-Reuse Attack Demo</label>
        <button className="foundation-btn" onClick={runAttack} style={{ width: '100%' }}>Run Attack Demo</button>
        {attackResult && (
          <div className="result-box" style={{ fontSize: '0.875rem' }}>
            <p>m1: {attackResult.m1} | m2: {attackResult.m2}</p>
            <p>c1: {attackResult.c1_hex.substring(0, 20)}...</p>
            <p>c2: {attackResult.c2_hex.substring(0, 20)}...</p>
            <p style={{ color: 'var(--danger)', fontWeight: 'bold' }}>
              First {attackResult.match_index} blocks match!
            </p>
            <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
              Conclusion: Reusing IV in CBC mode leaks equality of message prefixes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PA4Modes;
