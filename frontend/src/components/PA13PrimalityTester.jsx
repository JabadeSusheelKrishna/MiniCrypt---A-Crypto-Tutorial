import React, { useState, useEffect } from 'react';

const PrimalityTester = () => {
  const [n, setN] = useState('');
  const [k, setK] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [carmichael, setCarmichael] = useState(null);

  const testPrimality = async () => {
    if (!n) return;
    setLoading(true);
    try {
      const response = await fetch('/api/pa13/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ n, k }),
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error testing primality:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCarmichael = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/pa13/carmichael');
      const data = await response.json();
      setCarmichael(data);
    } catch (error) {
      console.error('Error loading carmichael demo:', error);
    } finally {
      setLoading(false);
    }
  };

  const useExample = (val) => {
    setN(val);
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">PA #13 — Miller-Rabin Primality Tester</h2>
        <p className="panel-subtitle">Probabilistic test with 4⁻ᵏ error probability.</p>
      </div>

      <div className="form-group">
        <label>Integer to Test (n)</label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            type="text" 
            value={n} 
            onChange={(e) => setN(e.target.value)}
            placeholder="Enter integer up to 20 digits"
            style={{ flex: 1 }}
          />
          <button className="btn-primary" onClick={testPrimality} disabled={loading}>
            {loading ? 'Testing...' : 'Test'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          <button className="foundation-btn" onClick={() => useExample('561')}>Example: 561</button>
          <button className="foundation-btn" onClick={() => useExample('104729')}>Example: 104729</button>
          <button className="foundation-btn" onClick={() => useExample('562')}>Example: 562</button>
        </div>
      </div>

      <div className="form-group">
        <label>Rounds (k): {k}</label>
        <input 
          type="range" 
          min="1" 
          max="40" 
          value={k} 
          onChange={(e) => setK(parseInt(e.target.value))}
        />
      </div>

      {result && (
        <div className="result-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ 
              color: result.result === 'PROBABLY PRIME' ? 'var(--accent)' : 'var(--danger)',
              fontSize: '1.5rem'
            }}>
              {result.result}
            </h3>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {result.time_taken.toFixed(4)}s
            </span>
          </div>
          
          <div className="witness-list">
            <h4 style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Witnesses & Intermediate Values:</h4>
            {result.witnesses.map((w, idx) => (
              <div key={idx} className="witness-item">
                <div className="witness-a">a = {w.a}</div>
                <div className="witness-rounds">
                  {w.rounds.map((round, rIdx) => (
                    <span key={rIdx} className="round-val" title={round}>
                      {rIdx === 0 ? 'aᵈ' : `x²`} mod n = {round}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="carmichael-info">
        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Carmichael Numbers Demo (n=561)</h3>
        <button className="btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.875rem' }} onClick={loadCarmichael}>
          Run Demo
        </button>
        {carmichael && (
          <div style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}>
            <p><strong>Fermat Test (a=2):</strong> {carmichael.fermat_passed ? 'PASSED (FOOLED!)' : 'FAILED'}</p>
            <p><strong>Miller-Rabin:</strong> {carmichael.mr_result} (CORRECT)</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrimalityTester;
