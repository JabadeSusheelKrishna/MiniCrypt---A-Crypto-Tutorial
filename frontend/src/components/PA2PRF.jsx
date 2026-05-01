import React, { useState } from 'react';

const PA2PRF = () => {
  const [k, setK] = useState('12345');
  const [x, setX] = useState('0');
  const [depth, setDepth] = useState(8);
  const [result, setResult] = useState(null);
  const [gameResult, setGameResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const evaluatePRF = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/pa2/prf/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ k: parseInt(k), x: parseInt(x), depth }),
      });
      const data = await response.json();
      setResult(data.y);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const runGame = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/pa2/prf/distinguish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: 100 }),
      });
      const data = await response.json();
      setGameResult(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">PA #2 — PRF (GGM)</h2>
        <p className="panel-subtitle">GGM Tree construction from PRG.</p>
      </div>

      <div className="form-group">
        <label>PRF Evaluation: Fₖ(x)</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <input type="number" value={k} onChange={e => setK(e.target.value)} placeholder="Key (k)" />
          <input type="number" value={x} onChange={e => setX(e.target.value)} placeholder="Input (x)" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <label style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>Tree Depth: {depth}</label>
          <input type="range" min="1" max="16" value={depth} onChange={e => setDepth(parseInt(e.target.value))} style={{ flex: 1 }} />
        </div>
        <button className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={evaluatePRF}>Evaluate</button>
        {result && <div className="result-box">Result: {result}</div>}
      </div>

      <div className="form-group">
        <label>Distinguishing Game</label>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
          Can an adversary distinguish PRF from a truly random function?
        </p>
        <button className="foundation-btn" onClick={runGame} style={{ width: '100%' }}>Run Game (q=100)</button>
        {gameResult && (
          <div className="result-box" style={{ fontSize: '0.875rem' }}>
            <p>PRF Unique: {gameResult.prf_unique}/100</p>
            <p>Rand Unique: {gameResult.rand_unique}/100</p>
            <p style={{ fontWeight: 'bold', color: 'var(--accent)', marginTop: '0.5rem' }}>Verdict: {gameResult.verdict}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PA2PRF;
