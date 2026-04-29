import React, { useState } from 'react';

const PA17CCA = () => {
  const [message, setMessage] = useState('42');

  const [pkEnc, setPkEnc] = useState(null);
  const [skEnc, setSkEnc] = useState(null);
  const [vkSign, setVkSign] = useState(null);
  const [skSign, setSkSign] = useState(null);

  const [cipher, setCipher] = useState(null);
  const [tampered, setTampered] = useState(null);
  const [decryptResult, setDecryptResult] = useState(null);

  const [loading, setLoading] = useState(false);

  // ----------------------------------------
  // Key Generation
  // ----------------------------------------
  const generateKeys = async () => {
    setLoading(true);
    try {
      const encRes = await fetch('/api/pa16/keygen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bits: 32 }),
      });
      const encData = await encRes.json();

      const sigRes = await fetch('/api/pa15/keygen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bits: 256 }),
      });
      const sigData = await sigRes.json();

      setPkEnc(encData.pk);
      setSkEnc(encData.sk);
      setVkSign(sigData.pk);
      setSkSign(sigData.sk);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------
  // Encrypt
  // ----------------------------------------
  const encrypt = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pa17/encrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pk_enc: pkEnc,
          sk_sign: skSign,
          m: message,
        }),
      });

      const data = await res.json();
      setCipher(data);
      setTampered(null);
      setDecryptResult(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------
  // Tamper (CCA attacker)
  // ----------------------------------------
  const tamper = () => {
    if (!cipher) return;

    const p = BigInt(pkEnc.p);
    const c1 = BigInt(cipher.c1);
    const c2 = BigInt(cipher.c2);

    const newC2 = (c2 * 2n) % p;

    setTampered({
      c1: c1.toString(),
      c2: newC2.toString(),
      sigma: cipher.sigma, // signature unchanged → invalid
    });
  };

  // ----------------------------------------
  // Decrypt
  // ----------------------------------------
  const decrypt = async (useTampered = false) => {
    setLoading(true);
    try {
      const target = useTampered ? tampered : cipher;

      const res = await fetch('/api/pa17/decrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sk_enc: skEnc,
          vk_sign: vkSign,
          c1: target.c1,
          c2: target.c2,
          sigma: target.sigma,
        }),
      });

      const data = await res.json();
      setDecryptResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------
  // UI
  // ----------------------------------------
  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">PA #17 — CCA Secure Encryption</h2>
        <p className="panel-subtitle">Encrypt-then-Sign prevents malleability attacks</p>
      </div>

      {/* Message Input */}
      <div className="form-group">
        <label>Message</label>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button onClick={generateKeys} className="btn-primary">
          Generate Keys
        </button>

        <button onClick={encrypt} disabled={!pkEnc} className="btn-primary">
          Encrypt
        </button>

        <button onClick={tamper} disabled={!cipher} className="foundation-btn">
          Tamper with CE
        </button>
      </div>

      {/* Cipher Display */}
      {cipher && (
        <div className="result-box">
          <h3>Ciphertext (CE, σ)</h3>
          <p>c1: {cipher.c1}</p>
          <p>c2: {cipher.c2}</p>
          <p>σ: {cipher.sigma}</p>
        </div>
      )}

      {/* Tampered */}
      {tampered && (
        <div className="result-box" style={{ borderColor: 'var(--danger)' }}>
          <h3>Tampered Ciphertext</h3>
          <p>c1: {tampered.c1}</p>
          <p>c2: {tampered.c2}</p>
        </div>
      )}

      {/* Decrypt Buttons */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button onClick={() => decrypt(false)} className="btn-primary">
          Decrypt Original
        </button>

        <button onClick={() => decrypt(true)} className="btn-primary">
          Decrypt Tampered
        </button>
      </div>

      {/* Result */}
      {decryptResult && (
        <div className="result-box">
          <h3>
            {decryptResult.status === 'success'
              ? 'Decryption Successful'
              : 'Signature Invalid'}
          </h3>

          {decryptResult.status === 'success' ? (
            <p>Message: {decryptResult.output}</p>
          ) : (
            <p>⊥ (decryption aborted)</p>
          )}
        </div>
      )}
    </div>
  );
};

export default PA17CCA;