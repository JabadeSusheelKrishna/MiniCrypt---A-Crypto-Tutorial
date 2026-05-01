import React, { useState } from 'react';

const PA6CCA = () => {
  const [ke, setKe] = useState('123');
  const [km, setKm] = useState('456');
  const [m, setM] = useState('Top Secret');
  const [encResult, setEncResult] = useState(null);
  const [decResult, setDecResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const encrypt = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/pa6/encrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ke: parseInt(ke), km: parseInt(km), m }),
      });
      const data = await response.json();
      setEncResult(data);
      setDecResult(null);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const decrypt = async (tamper = false) => {
    if (!encResult) return;
    setLoading(true);
    let { r, ct_hex, tag } = encResult;
    
    if (tamper) {
      // Flip a bit in the ciphertext hex
      const firstByte = parseInt(ct_hex.substring(0, 2), 16);
      const tamperedByte = (firstByte ^ 0x01).toString(16).padStart(2, '0');
      ct_hex = tamperedByte + ct_hex.substring(2);
    }

    try {
      const response = await fetch('/api/pa6/decrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ke: parseInt(ke), km: parseInt(km), r, ct_hex, tag }),
      });
      const data = await response.json();
      setDecResult(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">PA #6 — CCA-Secure Enc</h2>
        <p className="panel-subtitle">Authenticated Encryption (Encrypt-then-MAC).</p>
      </div>

      <div className="form-group">
        <label>Keys & Message</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <input type="number" value={ke} onChange={e => setKe(e.target.value)} placeholder="Enc Key (kE)" />
          <input type="number" value={km} onChange={e => setKm(e.target.value)} placeholder="MAC Key (kM)" />
        </div>
        <input type="text" value={m} onChange={e => setM(e.target.value)} placeholder="Message" style={{ width: '100%', marginBottom: '0.5rem' }} />
        <button className="btn-primary" style={{ width: '100%' }} onClick={encrypt}>Encrypt-then-MAC</button>
        
        {encResult && (
          <div className="result-box" style={{ fontSize: '0.875rem' }}>
            <p><strong>r:</strong> {encResult.r}</p>
            <p><strong>ct (hex):</strong> {encResult.ct_hex.substring(0, 32)}...</p>
            <p><strong>tag:</strong> 0x{encResult.tag.toString(16).toUpperCase()}</p>
            
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button className="foundation-btn" style={{ flex: 1 }} onClick={() => decrypt(false)}>Normal Decrypt</button>
              <button className="foundation-btn" style={{ flex: 1, color: 'var(--danger)' }} onClick={() => decrypt(true)}>Tamper & Decrypt</button>
            </div>

            {decResult && (
              <div style={{ marginTop: '1rem', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.1)' }}>
                {decResult.valid ? (
                  <p style={{ color: 'var(--accent)' }}><strong>Success:</strong> {decResult.m}</p>
                ) : (
                  <p style={{ color: 'var(--danger)' }}><strong>Error:</strong> MAC Verification Failed! (Decryption Aborted)</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="form-group">
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          CCA security ensures that any tampering with the ciphertext is detected before decryption, preventing chosen-ciphertext attacks.
        </p>
      </div>
    </div>
  );
};

export default PA6CCA;
