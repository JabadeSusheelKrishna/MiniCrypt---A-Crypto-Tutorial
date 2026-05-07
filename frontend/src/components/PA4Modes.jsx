import React, { useState, useEffect } from 'react';

const PA4Modes = () => {
  const [activeTab, setActiveTab] = useState('forge');
  const [k, setK] = useState(Math.floor(Math.random() * 255));
  const [signedMessages, setSignedMessages] = useState([]);
  const [mStar, setMStar] = useState('');
  const [tStar, setTStar] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [successes, setSuccesses] = useState(0);
  const [loading, setLoading] = useState(false);

  // Length extension state
  const [extensionM, setExtensionM] = useState('hello');
  const [suffix, setSuffix] = useState('');
  const [extensionResult, setExtensionResult] = useState(null);

  useEffect(() => {
    fetchSignedMessages();
  }, [k]);

  const fetchSignedMessages = async () => {
    try {
      const response = await fetch('/api/pa4/mac/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ k }),
      });
      const data = await response.json();
      setSignedMessages(data.pairs);
    } catch (e) {
      console.error("Failed to fetch signed messages", e);
    }
  };

  const submitForgery = async () => {
    if (mStar === '' || tStar === '') return;
    setLoading(true);
    try {
      const response = await fetch('/api/pa4/mac/forge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          k,
          m: parseInt(mStar),
          t: parseInt(tStar),
          signed_messages: signedMessages
        }),
      });
      const data = await response.json();
      setFeedback(data);
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
        body: JSON.stringify({ k, m: extensionM, suffix }),
      });
      const data = await response.json();
      setExtensionResult(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">PA #4 — Interactive Deliverable</h2>
        <p className="panel-subtitle">MAC Forgery and Length Extension Demo</p>
      </div>

      <div className="tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
        <button 
          className={`tab-btn ${activeTab === 'forge' ? 'active' : ''}`} 
          onClick={() => setActiveTab('forge')}
          style={{ padding: '0.5rem 1rem', background: 'none', border: 'none', color: activeTab === 'forge' ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', borderBottom: activeTab === 'forge' ? '2px solid var(--accent)' : 'none' }}
        >
          MAC Forge Attempt
        </button>
        <button 
          className={`tab-btn ${activeTab === 'extension' ? 'active' : ''}`} 
          onClick={() => setActiveTab('extension')}
          style={{ padding: '0.5rem 1rem', background: 'none', border: 'none', color: activeTab === 'extension' ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', borderBottom: activeTab === 'extension' ? '2px solid var(--accent)' : 'none' }}
        >
          Length-Extension Demo
        </button>
      </div>

      {activeTab === 'forge' ? (
        <div className="forge-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
             <div className="counter-box">
                <span style={{ color: 'var(--text-muted)' }}>Attempts: </span>
                <span style={{ fontWeight: 'bold' }}>{attempts}</span>
             </div>
             <div className="counter-box">
                <span style={{ color: 'var(--text-muted)' }}>Successes: </span>
                <span style={{ fontWeight: 'bold', color: successes > 0 ? 'var(--accent)' : 'inherit' }}>{successes}</span>
             </div>
          </div>

          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Oracle-signed messages (m, t)</label>
          <div className="scroll-box" style={{ maxHeight: '150px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.8rem', fontFamily: 'monospace' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
              {signedMessages.map((pair, i) => (
                <div key={i} style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '2px', textAlign: 'center' }}>
                  ({pair.m}, {pair.t})
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Submit Forgery (m*, t*)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input 
                type="number" 
                value={mStar} 
                onChange={e => setMStar(e.target.value)} 
                placeholder="Message m*" 
              />
              <input 
                type="number" 
                value={tStar} 
                onChange={e => setTStar(e.target.value)} 
                placeholder="Tag t*" 
              />
            </div>
            <button className="btn-primary" style={{ width: '100%' }} onClick={submitForgery} disabled={loading}>
              {loading ? 'Verifying...' : 'Submit Forgery'}
            </button>
          </div>

          {feedback && (
            <div className={`result-box ${feedback.valid ? 'success' : 'error'}`} style={{ textAlign: 'center', marginTop: '1rem' }}>
              <h3 style={{ color: feedback.valid ? 'var(--accent)' : 'var(--danger)' }}>
                {feedback.message}
              </h3>
            </div>
          )}
        </div>
      ) : (
        <div className="extension-panel">
          <div className="form-group">
            <label>Length-Extension Demo (Broken H(k||m))</label>
            <input 
              type="text" 
              value={extensionM} 
              onChange={e => setExtensionM(e.target.value)} 
              placeholder="Base Message m"
              style={{ width: '100%', marginBottom: '0.5rem' }}
            />
            <input 
              type="text" 
              value={suffix} 
              onChange={e => setSuffix(e.target.value)} 
              placeholder="Suffix m'"
              style={{ width: '100%', marginBottom: '0.5rem' }}
            />
            <button className="foundation-btn" style={{ width: '100%' }} onClick={runExtension} disabled={loading}>
              Run Demo
            </button>
          </div>

          {extensionResult && (
            <div className="result-box" style={{ fontSize: '0.85rem' }}>
              <p>Original Tag H(k||m): <strong>{extensionResult.original_tag}</strong></p>
              <p>Computed Tag from t alone: <strong>{extensionResult.extended_tag}</strong></p>
              <p>Correct Tag H(k||m||m'): <strong>{extensionResult.correct_tag}</strong></p>
              <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                <span style={{ 
                  fontWeight: 'bold', 
                  color: extensionResult.match ? 'var(--accent)' : 'var(--danger)' 
                }}>
                  {extensionResult.match ? 'VULNERABILITY DEMONSTRATED!' : 'ATTACK FAILED'}
                </span>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  The extended tag was computed without knowing the key k.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PA4Modes;
