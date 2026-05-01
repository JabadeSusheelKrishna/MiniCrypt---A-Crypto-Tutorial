import React, { useState } from 'react';

const PA3CPA = () => {
  const [k, setK] = useState('12345');
  const [m, setM] = useState('Hello World');
  const [encResult, setEncResult] = useState(null);
  const [decM, setDecM] = useState('');
  const [decResult, setDecResult] = useState(null);
  const [gameResult, setGameResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const encrypt = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/pa3/encrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ k: parseInt(k), m }),
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
      const response = await fetch('/api/pa3/decrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ k: parseInt(k), r: encResult.r, c_hex: encResult.c_hex }),
      });
      const data = await response.json();
      setDecResult(data.m);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const runGame = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/pa3/ind_cpa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queries: 50 }),
      });
      const data = await response.json();
      setGameResult(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">PA #3 — CPA-Secure Enc</h2>
        <p className="panel-subtitle">Counter-mode encryption using PRF.</p>
      </div>

      <div className="form-group">
        <label>Encryption / Decryption</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <input type="number" value={k} onChange={e => setK(e.target.value)} placeholder="Key (k)" />
          <input type="text" value={m} onChange={e => setM(e.target.value)} placeholder="Message" />
        </div>
        <button className="btn-primary" style={{ width: '100%' }} onClick={encrypt}>Encrypt</button>
        
        {encResult && (
          <div className="result-box" style={{ fontSize: '0.875rem' }}>
            <p><strong>r:</strong> {encResult.r}</p>
            <p><strong>c (hex):</strong> {encResult.c_hex}</p>
            <button className="foundation-btn" style={{ marginTop: '0.5rem', width: '100%' }} onClick={decrypt}>Decrypt This Ciphertext</button>
            {decResult && <p style={{ marginTop: '0.5rem', color: 'var(--accent)' }}><strong>Decrypted:</strong> {decResult}</p>}
          </div>
        )}
      </div>

      <div className="form-group">
        <label>IND-CPA Game Simulation</label>
        <button className="foundation-btn" onClick={runGame} style={{ width: '100%' }}>Run Simulation</button>
        {gameResult && (
          <div className="result-box" style={{ fontSize: '0.875rem' }}>
            <p>Correct Guesses: {gameResult.correct}/{gameResult.queries}</p>
            <p>Advantage: {gameResult.advantage.toFixed(3)}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
              Security Theorem: For a secure PRF, the advantage in IND-CPA game is negligible.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PA3CPA;
