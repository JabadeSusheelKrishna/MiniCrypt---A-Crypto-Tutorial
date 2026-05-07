import React, { useState, useEffect } from 'react';

const PA4Modes = () => {
  const [mode, setMode] = useState('CBC');
  const [k, setK] = useState(123);
  const [m, setM] = useState('ABCD'); // 4 blocks
  const [blocks, setBlocks] = useState([]);
  const [ivOrR, setIvOrR] = useState(0);
  const [loading, setLoading] = useState(false);
  const [corruptedIndex, setCorruptedIndex] = useState(null);
  const [decryptedBlocks, setDecryptedBlocks] = useState([]);
  const [ivReuse, setIvReuse] = useState(false);
  const [reuseResult, setReuseResult] = useState(null);

  useEffect(() => {
    encrypt();
  }, [mode, k, m, ivReuse]);

  const encrypt = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/pa4/encrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, k: parseInt(k), m }),
      });
      const data = await response.json();
      setIvOrR(data.iv_or_r);
      const ctBytes = Array.from(new Uint8Array(new TextEncoder().encode(m)).length); // Mock split
      // Actually the server returns hex, let's parse it
      const ctHex = data.c_hex;
      const ctArr = [];
      for (let i = 0; i < ctHex.length; i += 2) {
        ctArr.push(parseInt(ctHex.substr(i, 2), 16));
      }
      setBlocks(ctArr);
      setCorruptedIndex(null);
      setDecryptedBlocks(new TextEncoder().encode(m)); // Initial correct decryption
      
      if (ivReuse && mode === 'CBC') {
          const res2 = await fetch('/api/pa4/attack/iv_reuse', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ k: parseInt(k) }),
          });
          setReuseResult(await res2.json());
      } else {
          setReuseResult(null);
      }

    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleFlipBit = async (index) => {
    setCorruptedIndex(index);
    const newBlocks = [...blocks];
    newBlocks[index] = newBlocks[index] ^ 0x01; // Flip LSB
    
    setLoading(true);
    try {
      const response = await fetch('/api/pa4/decrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            mode, 
            k: parseInt(k), 
            iv_or_r: ivOrR, 
            c_hex: newBlocks.map(b => b.toString(16).padStart(2, '0')).join('') 
        }),
      });
      const data = await response.json();
      // Compare with original m to see which blocks changed
      const original = new TextEncoder().encode(m);
      const decrypted = new TextEncoder().encode(data.m);
      setDecryptedBlocks(decrypted);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const isCorrupted = (index) => {
    const original = new TextEncoder().encode(m);
    if (index >= decryptedBlocks.length) return true;
    return decryptedBlocks[index] !== original[index];
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">PA #4 — Modes of Operation</h2>
        <p className="panel-subtitle">Visualizing Block Cipher Chaining and Error Propagation.</p>
      </div>

      <div className="form-group" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
            <div className="form-group">
                <label style={{ fontSize: '0.7rem' }}>Mode</label>
                <select value={mode} onChange={e => setMode(e.target.value)} style={{ width: '100%' }}>
                    <option value="CBC">CBC</option>
                    <option value="OFB">OFB</option>
                    <option value="CTR">CTR</option>
                </select>
            </div>
            <div className="form-group">
                <label style={{ fontSize: '0.7rem' }}>Key (k)</label>
                <input type="number" value={k} onChange={e => setK(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div className="form-group">
                <label style={{ fontSize: '0.7rem' }}>Message (M)</label>
                <input type="text" value={m} onChange={e => setM(e.target.value)} maxLength={8} style={{ width: '100%' }} />
            </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button className="btn-primary" onClick={encrypt} disabled={loading}>Refresh Encryption</button>
            {mode === 'CBC' && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input type="checkbox" checked={ivReuse} onChange={e => setIvReuse(e.target.checked)} />
                    Test IV Reuse Attack
                </label>
            )}
        </div>
      </div>

      <div className="animator-box" style={{ background: 'rgba(0,0,0,0.2)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)', minHeight: '300px', display: 'flex', flexDirection: 'column', gap: '2rem', position: 'relative' }}>
        
        {/* IV Row */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: '60px', height: '40px', background: 'var(--accent)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>
                    0x{ivOrR.toString(16).padStart(2, '0').toUpperCase()}
                </div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{mode === 'CTR' ? 'Nonce (r)' : 'IV'}</div>
            </div>
            <div style={{ width: '100px', height: '2px', background: 'linear-gradient(to right, var(--accent), transparent)', position: 'relative' }}>
                <div style={{ position: 'absolute', right: 0, top: '-4px', width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderLeft: '10px solid var(--accent)' }}></div>
            </div>
        </div>

        {/* Ciphertext Blocks Row */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            {blocks.map((b, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <div 
                        onClick={() => handleFlipBit(i)}
                        className={`block-node ${corruptedIndex === i ? 'active' : ''}`}
                        style={{ 
                            width: '50px', 
                            height: '50px', 
                            background: corruptedIndex === i ? 'var(--danger)' : 'rgba(255,255,255,0.1)', 
                            border: `2px solid ${corruptedIndex === i ? 'var(--danger)' : 'var(--border)'}`,
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            transition: 'all 0.2s',
                            position: 'relative'
                        }}
                        title="Click to flip bit"
                    >
                        {b.toString(16).padStart(2, '0').toUpperCase()}
                        {corruptedIndex === i && <div style={{ position: 'absolute', top: '-15px', fontSize: '10px', color: 'var(--danger)', whiteSpace: 'nowrap' }}>Bit Flipped!</div>}
                    </div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>C{i+1}</div>
                    
                    {/* Arrow Down */}
                    <div style={{ height: '30px', width: '2px', background: 'var(--border)', position: 'relative' }}>
                        <div style={{ position: 'absolute', bottom: 0, left: '-4px', width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '8px solid var(--border)' }}></div>
                    </div>

                    {/* Decrypted Plaintext Block */}
                    <div style={{ 
                        width: '50px', 
                        height: '50px', 
                        background: isCorrupted(i) ? 'rgba(255,0,0,0.2)' : 'rgba(0,255,150,0.1)', 
                        border: `2px solid ${isCorrupted(i) ? 'var(--danger)' : 'var(--accent)'}`,
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        color: isCorrupted(i) ? 'var(--danger)' : 'var(--accent)'
                    }}>
                        {decryptedBlocks[i] ? String.fromCharCode(decryptedBlocks[i]) : '?'}
                    </div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>P{i+1}</div>
                </div>
            ))}
        </div>

        <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <p>💡 <strong>Interact:</strong> Click a ciphertext block (C<sub>i</sub>) to flip a bit and see how the corruption propagates to the plaintext (P<sub>i</sub>).</p>
            <p style={{ marginTop: '0.5rem' }}>
                {mode === 'CBC' ? 'CBC: Corruption propagates to the current and NEXT block.' : 
                 mode === 'OFB' ? 'OFB: Corruption only affects the current block.' : 
                 'CTR: Corruption only affects the current block (Parallelizable).'}
            </p>
        </div>

        {reuseResult && (
            <div className="result-box" style={{ marginTop: '2rem', border: '1px solid var(--danger)', background: 'rgba(255,0,0,0.05)' }}>
                <h4 style={{ color: 'var(--danger)', margin: '0 0 0.5rem 0' }}>IV Reuse Vulnerability (CBC)</h4>
                <p style={{ fontSize: '0.8rem' }}>M1: "{reuseResult.m1}" | M2: "{reuseResult.m2}"</p>
                <p style={{ fontSize: '0.8rem' }}>Common Prefix Length: <strong>{reuseResult.match_index} bytes</strong></p>
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Because the same IV was used, the identical prefix results in identical ciphertext blocks!
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default PA4Modes;
