import React, { useState } from 'react';

const PA1PRG = () => {
  const [owfInput, setOwfInput] = useState('');
  const [owfResult, setOwfResult] = useState(null);
  const [hardnessResult, setHardnessResult] = useState(null);
  const [seed, setSeed] = useState('123456');
  const [length, setLength] = useState(128);
  const [bits, setBits] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const evaluateOWF = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/pa1/owf/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x: parseInt(owfInput) }),
      });
      const data = await response.json();
      setOwfResult(data.y);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const verifyHardness = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/pa1/owf/verify', { method: 'POST' });
      const data = await response.json();
      setHardnessResult(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const generatePRG = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/pa1/prg/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed: parseInt(seed), length: parseInt(length) }),
      });
      const data = await response.json();
      setBits(data.bits);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const runTests = async () => {
    if (!bits) return;
    setLoading(true);
    try {
      const response = await fetch('/api/pa1/prg/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bits }),
      });
      const data = await response.json();
      setTestResult(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">PA #1 — OWF & PRG</h2>
        <p className="panel-subtitle">Modular Exponentiation OWF and Hard-Core Bit PRG.</p>
      </div>

      <div className="form-group">
        <label>OWF Evaluation: f(x) = gˣ mod p</label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input type="number" value={owfInput} onChange={e => setOwfInput(e.target.value)} placeholder="Enter x" />
          <button className="btn-primary" onClick={evaluateOWF}>Evaluate</button>
        </div>
        {owfResult && <div className="result-box">Result: {owfResult}</div>}
      </div>

      <div className="form-group">
        <label>Hardness Verification (Brute Force)</label>
        <button className="foundation-btn" onClick={verifyHardness} disabled={loading}>
          {loading ? 'Running...' : 'Attempt Inversion'}
        </button>
        {hardnessResult && (
          <div className="result-box" style={{ fontSize: '0.875rem' }}>
            <p>Target y: {hardnessResult.target}</p>
            <p>Status: {hardnessResult.found ? 'SUCCESS (Small x found!)' : 'FAILED (Hard to invert!)'}</p>
            <p>Values searched: {hardnessResult.count}</p>
          </div>
        )}
      </div>

      <hr style={{ border: '0', borderTop: '1px solid var(--border)', margin: '1.5rem 0' }} />

      <div className="form-group">
        <label>PRG Generation (B-M construction)</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <input type="number" value={seed} onChange={e => setSeed(e.target.value)} placeholder="Seed" />
          <input type="number" value={length} onChange={e => setLength(e.target.value)} placeholder="Length (bits)" />
        </div>
        <button className="btn-primary" style={{ marginTop: '0.5rem', width: '100%' }} onClick={generatePRG}>Generate Bits</button>
      </div>

      {bits && (
        <div className="result-box">
          <div style={{ wordBreak: 'break-all', fontSize: '0.75rem', maxHeight: '60px', overflowY: 'auto', marginBottom: '1rem' }}>
            {bits.join('')}
          </div>
          <button className="foundation-btn" onClick={runTests} style={{ width: '100%' }}>Run NIST-lite Tests</button>
          {testResult && (
            <div style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
              <p>Frequency Test: p={testResult.freq_p.toFixed(3)} {testResult.freq_p >= 0.01 ? '✅' : '❌'}</p>
              <p>Runs Test: p={testResult.runs_p.toFixed(3)} {testResult.runs_p >= 0.01 ? '✅' : '❌'}</p>
              <p>Serial Test: p={testResult.serial_p.toFixed(3)} {testResult.serial_p >= 0.01 ? '✅' : '❌'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PA1PRG;
