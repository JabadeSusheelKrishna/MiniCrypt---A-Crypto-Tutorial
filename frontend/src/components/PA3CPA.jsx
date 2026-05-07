import React, { useState, useEffect, useCallback } from 'react';

const PA3CPA = () => {
  // Config
  const [k, setK] = useState('deadbeef12345678');
  const [m0, setM0] = useState('ATTACK AT DAWN');
  const [m1, setM1] = useState('RETREAT AT DUSK');
  const [reuseNonce, setReuseNonce] = useState(false);

  // Game State
  const [rounds, setRounds] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [challenge, setChallenge] = useState(null); // { r, c_hex, b }
  const [gameState, setGameState] = useState('idle'); // idle, challenged, revealed
  const [lastResult, setLastResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Standard Tool State
  const [toolM, setToolM] = useState('Hello Minicrypt');
  const [toolResult, setToolResult] = useState(null);
  const [decrypted, setDecrypted] = useState(null);

  const advantage = rounds > 0 ? Math.abs((correct / rounds) - 0.5) * 2 : 0;

  const handleKeyChange = (e) => {
    const val = e.target.value.toLowerCase().replace(/[^0-9a-f]/g, '');
    setK(val);
  };

  // ----------------------------------------------------------------
  // GAME LOGIC
  // ----------------------------------------------------------------
  const generateChallenge = async () => {
    if (m0.length !== m1.length) {
      alert("Messages must be of equal length for IND-CPA game!");
      return;
    }
    setLoading(true);
    try {
      const b = Math.random() > 0.5 ? 1 : 0;
      const msg = b === 0 ? m0 : m1;

      const payload = {
        k,
        m: msg
      };

      // If reuse nonce is on, we use a fixed r for every challenge in this round
      if (reuseNonce) {
        payload.r_override = 1337;
      }

      const response = await fetch('/api/pa3/encrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      setChallenge({ ...data, b });
      setGameState('challenged');
      setLastResult(null);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const submitGuess = (guess) => {
    if (gameState !== 'challenged') return;

    const isCorrect = guess === challenge.b;
    if (isCorrect) setCorrect(c => c + 1);
    setRounds(r => r + 1);
    setGameState('revealed');
    setLastResult(isCorrect);
  };

  const resetGame = () => {
    setRounds(0);
    setCorrect(0);
    setGameState('idle');
    setChallenge(null);
    setLastResult(null);
  };

  // ----------------------------------------------------------------
  // TOOL LOGIC
  // ----------------------------------------------------------------
  const runEncrypt = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/pa3/encrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ k, m: toolM }),
      });
      const data = await response.json();
      setToolResult(data);
      setDecrypted(null);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const runDecrypt = async () => {
    if (!toolResult) return;
    setLoading(true);
    try {
      const response = await fetch('/api/pa3/decrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ k, r: toolResult.r, c_hex: toolResult.c_hex }),
      });
      const data = await response.json();
      setDecrypted(data.m);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div className="panel" style={{ background: 'linear-gradient(145deg, #1e293b, #0f172a)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <div className="panel-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="panel-title" style={{ fontSize: '1.5rem', color: '#60a5fa' }}>PA #3 — IND-CPA Security</h2>
            <p className="panel-subtitle">Interactive Indistinguishability Game under Chosen Plaintext Attack.</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>GLOBAL KEY K (HEX)</label>
            <input
              type="text"
              value={k}
              onChange={handleKeyChange}
              placeholder="e.g. deadbeef"
              style={{ width: '150px', background: 'rgba(0,0,0,0.3)', border: '1px solid #334155', borderRadius: '4px', color: '#e2e8f0', padding: '0.25rem 0.5rem', fontSize: '0.8rem', fontFamily: 'monospace' }}
            />
          </div>
        </div>
      </div>

      {/* ------------------- IND-CPA GAME SECTION ------------------- */}
      <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.05)' }}>
        <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1rem', color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ padding: '4px 8px', background: '#1d4ed8', borderRadius: '4px', fontSize: '0.7rem', color: 'white' }}>GAME</span>
          Adversary's Challenge
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div className="form-group">
            <label style={{ color: '#64748b', fontSize: '0.75rem' }}>MESSAGE M₀</label>
            <input type="text" value={m0} onChange={e => setM0(e.target.value)} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid #334155' }} />
          </div>
          <div className="form-group">
            <label style={{ color: '#64748b', fontSize: '0.75rem' }}>MESSAGE M₁</label>
            <input type="text" value={m1} onChange={e => setM1(e.target.value)} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid #334155' }} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              className="btn-primary"
              onClick={generateChallenge}
              disabled={loading || gameState === 'challenged'}
              style={{ padding: '0.75rem 1.5rem', borderRadius: '8px' }}
            >
              {loading ? 'Encrypting...' : 'Encrypt Challenge'}
            </button>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: '#94a3b8' }}>
              <input type="checkbox" checked={reuseNonce} onChange={e => setReuseNonce(e.target.checked)} />
              Reuse Nonce (Deterministic)
            </label>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Score: <span style={{ color: '#fff', fontWeight: 'bold' }}>{correct}/{rounds}</span></div>
            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: advantage > 0.5 ? '#ef4444' : '#22c55e' }}>
              Advantage: {advantage.toFixed(3)}
            </div>
          </div>
        </div>

        {gameState !== 'idle' && (
          <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1.5rem', borderRadius: '8px', border: '1px solid #1e293b' }}>
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>CHALLENGE CIPHERTEXT C = (r, c)</span>
              <code style={{ background: '#020617', padding: '0.5rem', borderRadius: '4px', display: 'block', fontSize: '0.85rem', wordBreak: 'break-all', color: '#60a5fa', border: '1px solid #1e293b' }}>
                {challenge?.r} : {challenge?.c_hex}
              </code>
            </div>

            {gameState === 'challenged' ? (
              <div>
                <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#e2e8f0' }}>Which message was encrypted?</p>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button onClick={() => submitGuess(0)} style={{ flex: 1, padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid #334155', borderRadius: '8px', color: 'white', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.target.style.background = 'rgba(255,255,255,0.1)'} onMouseOut={e => e.target.style.background = 'rgba(255,255,255,0.05)'}>
                    It's M₀
                  </button>
                  <button onClick={() => submitGuess(1)} style={{ flex: 1, padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid #334155', borderRadius: '8px', color: 'white', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.target.style.background = 'rgba(255,255,255,0.1)'} onMouseOut={e => e.target.style.background = 'rgba(255,255,255,0.05)'}>
                    It's M₁
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem', color: lastResult ? '#22c55e' : '#ef4444' }}>
                  {lastResult ? '✓ CORRECT!' : '✗ INCORRECT'}
                </div>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1rem' }}>
                  The bit was <strong>b = {challenge.b}</strong>. {challenge.b === 0 ? 'M₀' : 'M₁'} was encrypted.
                </p>
                <button className="btn-primary" onClick={() => setGameState('idle')} style={{ background: '#334155' }}>Next Round</button>
              </div>
            )}
          </div>
        )}

        {rounds > 0 && (
          <button onClick={resetGame} style={{ marginTop: '1rem', background: 'none', border: 'none', color: '#ef4444', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}>
            Reset Stats
          </button>
        )}
      </div>

      {/* ------------------- STANDARD TOOL SECTION -------------------
      <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#64748b' }}>Encryption Sandbox</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', marginBottom: '1rem' }}>
           <input 
              type="text" 
              value={toolM} 
              onChange={e => setToolM(e.target.value)} 
              placeholder="Plaintext..."
              style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid #334155' }}
           />
           <button className="foundation-btn" onClick={runEncrypt} disabled={loading}>Encrypt</button>
        </div>

        {toolResult && (
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid #1e293b' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                <span style={{ color: '#64748b' }}>Nonce: {toolResult.r}</span>
                <span style={{ color: '#22c55e', cursor: 'pointer' }} onClick={runDecrypt}>[ Click to Decrypt ]</span>
             </div>
             <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all', color: '#94a3b8' }}>
                {toolResult.c_hex}
             </div>
             {decrypted && (
               <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #1e293b', color: '#fff', fontSize: '0.9rem' }}>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>DECRYPTED: </span>
                  {decrypted}
               </div>
             )}
          </div>
        )}
      </div> */}

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
};

export default PA3CPA;

