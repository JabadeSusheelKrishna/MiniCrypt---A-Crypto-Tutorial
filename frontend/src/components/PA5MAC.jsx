import React, { useState, useEffect } from 'react';

const PA5MAC = () => {
  const [activeTab, setActiveTab] = useState('construction');
  const [loading, setLoading] = useState(false);

  // Construction Tab State
  const [mode, setMode] = useState('CBC');
  const [k, setK] = useState(123);
  const [m, setM] = useState('hello');
  const [tag, setTag] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);

  // Forge Attempt Tab State
  const [forgeK, setForgeK] = useState(Math.floor(Math.random() * 255));
  const [signedMessages, setSignedMessages] = useState([]);
  const [mStar, setMStar] = useState('');
  const [tStar, setTStar] = useState('');
  const [forgeFeedback, setForgeFeedback] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [successes, setSuccesses] = useState(0);

  // Length Extension Tab State
  const [extM, setExtM] = useState('hello');
  const [suffix, setSuffix] = useState('world');
  const [extResult, setExtResult] = useState(null);

  useEffect(() => {
    if (activeTab === 'forge') {
      fetchSignedMessages();
    }
  }, [activeTab, forgeK]);

  const fetchSignedMessages = async () => {
    try {
      const response = await fetch('/api/pa4/mac/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ k: forgeK }),
      });
      const data = await response.json();
      setSignedMessages(data.pairs);
    } catch (e) {
      console.error("Failed to fetch signed messages", e);
    }
  };

  const generateMAC = async () => {
    setLoading(true);
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

  const submitForgery = async () => {
    if (mStar === '' || tStar === '') return;
    setLoading(true);
    try {
      const response = await fetch('/api/pa4/mac/forge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          k: forgeK,
          m: parseInt(mStar),
          t: parseInt(tStar),
          signed_messages: signedMessages
        }),
      });
      const data = await response.json();
      setForgeFeedback(data);
      setAttempts(prev => prev + 1);
      if (data.valid) {
        setSuccesses(prev => prev + 1);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const runExtension = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/pa4/mac/length_extension', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ k: parseInt(k), m: extM, suffix }),
      });
      const data = await response.json();
      setExtResult(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const hexFormat = (n) => {
    if (typeof n !== 'number') return n;
    return '0x' + n.toString(16).padStart(2, '0').toUpperCase();
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">PA #5 — Message Authentication Codes</h2>
        <p className="panel-subtitle">Ensuring Integrity and Authenticity in Minicrypt.</p>
      </div>

      <div className="tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
        {['construction', 'forge', 'extension'].map(t => (
          <button 
            key={t}
            className={`tab-btn ${activeTab === t ? 'active' : ''}`} 
            onClick={() => setActiveTab(t)}
            style={{ 
              padding: '0.75rem 1rem', 
              background: 'none', 
              border: 'none', 
              color: activeTab === t ? 'var(--accent)' : 'var(--text-muted)', 
              cursor: 'pointer', 
              borderBottom: activeTab === t ? '2px solid var(--accent)' : 'none',
              textTransform: 'capitalize',
              fontWeight: activeTab === t ? '600' : '400'
            }}
          >
            {t === 'construction' ? 'MAC Construction' : t === 'forge' ? 'Forge Attempt' : 'Length Extension'}
          </button>
        ))}
      </div>

      {activeTab === 'construction' && (
        <div className="tab-content">
          <div className="form-group">
            <label>Algorithm Configuration</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <select value={mode} onChange={e => setMode(e.target.value)} style={{ padding: '0.5rem' }}>
                <option value="CBC">CBC-MAC (Variable Length)</option>
                <option value="PRF">PRF-MAC (Fixed Length)</option>
              </select>
              <input type="number" value={k} onChange={e => setK(e.target.value)} placeholder="Key (k)" />
            </div>
            <input type="text" value={m} onChange={e => setM(e.target.value)} placeholder="Message" style={{ width: '100%', marginBottom: '0.5rem' }} />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={generateMAC} disabled={loading}>
                {loading ? 'Processing...' : 'Generate Tag'}
              </button>
              <button className="foundation-btn" style={{ flex: 1 }} onClick={verifyMAC} disabled={tag === null || loading}>
                Verify
              </button>
            </div>
            
            {tag !== null && (
              <div className="result-box" style={{ marginTop: '1rem' }}>
                <p><strong>Tag:</strong> <span className="hex-value">{hexFormat(tag)}</span></p>
                {verifyResult !== null && (
                  <div style={{ marginTop: '0.5rem', padding: '0.5rem', borderRadius: '4px', backgroundColor: verifyResult ? 'rgba(0,255,150,0.1)' : 'rgba(255,0,0,0.1)', textAlign: 'center' }}>
                    <span style={{ fontWeight: 'bold', color: verifyResult ? 'var(--accent)' : 'var(--danger)' }}>
                      {verifyResult ? '✅ VALID SIGNATURE' : '❌ INVALID SIGNATURE'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'forge' && (
        <div className="tab-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
             <div className="counter-box" style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '8px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Attempts: </span>
                <span style={{ fontWeight: 'bold' }}>{attempts}</span>
             </div>
             <div className="counter-box" style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '8px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Successes: </span>
                <span style={{ fontWeight: 'bold', color: successes > 0 ? 'var(--accent)' : 'inherit' }}>{successes}</span>
             </div>
          </div>

          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Oracle-signed messages (m, t)</label>
          <div className="scroll-box" style={{ maxHeight: '180px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.8rem', fontFamily: 'monospace', border: '1px solid var(--border)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
              {signedMessages.map((pair, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '4px', textAlign: 'center' }}>
                  ({pair.m}, {hexFormat(pair.t)})
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Submit Forgery (m*, t*)</label>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Message must NOT be in the list above.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <input 
                type="number" 
                value={mStar} 
                onChange={e => setMStar(e.target.value)} 
                placeholder="New Message m*" 
              />
              <input 
                type="number" 
                value={tStar} 
                onChange={e => setTStar(e.target.value)} 
                placeholder="Guessed Tag t*" 
              />
            </div>
            <button className="btn-primary" style={{ width: '100%' }} onClick={submitForgery} disabled={loading}>
              {loading ? 'Verifying...' : 'Submit Forgery'}
            </button>
          </div>

          {forgeFeedback && (
            <div className={`result-box ${forgeFeedback.valid ? 'success' : 'error'}`} style={{ textAlign: 'center', marginTop: '1rem', padding: '1rem', borderRadius: '8px', border: forgeFeedback.valid ? '1px solid var(--accent)' : '1px solid var(--danger)' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: forgeFeedback.valid ? 'var(--accent)' : 'var(--danger)' }}>
                {forgeFeedback.message}
              </h3>
            </div>
          )}
        </div>
      )}

      {activeTab === 'extension' && (
        <div className="tab-content">
          <div className="form-group">
            <label>Length-Extension Attack (Vulnerability Demo)</label>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Demonstrates how a naive MAC construction H(k || m) allows an attacker to compute a valid tag for M || Suffix without knowing the key k.
            </p>
            <div className="form-group">
              <label style={{ fontSize: '0.75rem' }}>Original Message</label>
              <input 
                type="text" 
                value={extM} 
                onChange={e => setExtM(e.target.value)} 
                placeholder="Base Message m"
                style={{ width: '100%', marginBottom: '0.5rem' }}
              />
            </div>
            <div className="form-group">
              <label style={{ fontSize: '0.75rem' }}>Suffix to Append</label>
              <input 
                type="text" 
                value={suffix} 
                onChange={e => setSuffix(e.target.value)} 
                placeholder="Suffix m'"
                style={{ width: '100%', marginBottom: '1rem' }}
              />
            </div>
            <button className="foundation-btn" style={{ width: '100%' }} onClick={runExtension} disabled={loading}>
              {loading ? 'Running Attack...' : 'Run Length-Extension Attack'}
            </button>
          </div>

          {extResult && (
            <div className="result-box" style={{ fontSize: '0.85rem', marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Original Tag H(k||m):</p>
                  <p style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{extResult.original_tag}</p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Computed from t alone:</p>
                  <p style={{ fontWeight: 'bold', fontFamily: 'monospace', color: 'var(--accent)' }}>{extResult.extended_tag}</p>
                </div>
              </div>
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Actual H(k||m||m'):</p>
                <p style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{extResult.correct_tag}</p>
                <div style={{ marginTop: '1rem' }}>
                  <span style={{ 
                    padding: '0.4rem 1rem',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold', 
                    background: extResult.match ? 'rgba(0,255,150,0.2)' : 'rgba(255,0,0,0.2)',
                    color: extResult.match ? 'var(--accent)' : 'var(--danger)' 
                  }}>
                    {extResult.match ? 'VULNERABILITY CONFIRMED!' : 'ATTACK FAILED'}
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                  The extended tag was successfully derived starting from the intermediate state (the previous tag), proving that H(k||m) is not a secure MAC.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PA5MAC;
