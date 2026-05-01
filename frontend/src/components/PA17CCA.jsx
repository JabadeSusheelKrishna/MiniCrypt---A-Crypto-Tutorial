import React, { useState } from "react";

const PA17CCA = () => {
  const [message, setMessage] = useState("42");

  const [pkEnc, setPkEnc] = useState(null);
  const [skEnc, setSkEnc] = useState(null);
  const [vkSign, setVkSign] = useState(null);
  const [skSign, setSkSign] = useState(null);

  const [cipher, setCipher] = useState(null);
  const [tampered, setTampered] = useState(null);
  const [decryptResult, setDecryptResult] = useState(null);

  const [plainCipher, setPlainCipher] = useState(null);
  const [plainTampered, setPlainTampered] = useState(null);
  const [plainResult, setPlainResult] = useState(null);

  const [loading, setLoading] = useState(false);

  // -------------------------
  // Key Generation
  // -------------------------
  const generateKeys = async () => {
    setLoading(true);
    console.log("Clicked key gen");
    try {
      const encRes = await fetch("/api/pa16/keygen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bits: 32 }),
      });
      const encData = await encRes.json();
      console.log("Encoded Data: ", encData);
      const sigRes = await fetch("/api/pa15/keygen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bits: 256 }),
      });
      const sigData = await sigRes.json();
      console.log("SIG Data: ", sigData);

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

  // -------------------------
  // Encrypt (Secure)
  // -------------------------
  const encrypt = async () => {
    const res = await fetch("/api/pa17/encrypt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
  };

  // -------------------------
  // Tamper (Secure)
  // -------------------------
  const tamper = () => {
    const p = BigInt(pkEnc.p);
    const c1 = BigInt(cipher.c1);
    const c2 = BigInt(cipher.c2);

    const newC2 = (c2 * 2n) % p;

    setTampered({
      c1: c1.toString(),
      c2: newC2.toString(),
      sigma: cipher.sigma, // signature unchanged
    });
    console.log("Tamper Done.");
    console.log("New C2 value: ", newC2);
  };

  // -------------------------
  // Decrypt (Secure)
  // -------------------------
  const decrypt = async (useTampered = false) => {
    const target = useTampered ? tampered : cipher;

    const res = await fetch("/api/pa17/decrypt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
  };

  // -------------------------
  // Plain ElGamal (Insecure)
  // -------------------------
  const encryptPlain = async () => {
    const res = await fetch("/api/pa16/encrypt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pk: pkEnc,
        m: message,
      }),
    });

    const data = await res.json();
    console.log("Insecure data: ", data);
    setPlainCipher(data);
    setPlainTampered(null);
    setPlainResult(null);
  };

  const tamperPlain = () => {
    const p = BigInt(pkEnc.p);
    const c1 = BigInt(plainCipher.c1);
    const c2 = BigInt(plainCipher.c2);

    const newC2 = (c2 * 2n) % p;

    setPlainTampered({
      c1: c1.toString(),
      c2: newC2.toString(),
    });

    console.log("Plain ElGamal Tamper Done.");
    console.log("Original c2:", c2.toString());
    console.log("New c2 (2*c2 mod p):", newC2.toString());
  };

  const decryptPlain = async (useTampered = false) => {
    const target = useTampered ? plainTampered : plainCipher;

    const res = await fetch("/api/pa16/decrypt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sk: skEnc,
        c1: target.c1,
        c2: target.c2,
      }),
    });

    const data = await res.json();
    setPlainResult(data.m);
  };

  // -------------------------
  // UI
  // -------------------------
  return (
    <div className="panel">
      <h2>PA #17 — CCA Security Demo</h2>

      <div className="form-group">
        <label>Message</label>
        <input value={message} onChange={(e) => setMessage(e.target.value)} />
      </div>

      <button onClick={generateKeys}>Generate Keys</button>

      {/* ---------------- SECURE ---------------- */}
      <div className="panel" style={{ marginTop: "1rem" }}>
        <h3>Secure: Encrypt-then-Sign</h3>

        <button onClick={encrypt} disabled={!pkEnc}>
          Encrypt
        </button>
        <button onClick={tamper} disabled={!cipher}>
          Tamper
        </button>

        <button onClick={() => decrypt(false)}>Decrypt Original</button>
        <button onClick={() => decrypt(true)}>Decrypt Tampered</button>

        {cipher && (
          <div className="result-box">
            <p>c1: {cipher.c1}</p>
            <p>c2: {cipher.c2}</p>
            <p>σ: {cipher.sigma}</p>
          </div>
        )}

        {tampered && (
          <div className="result-box" style={{ borderColor: "var(--danger)" }}>
            <h4>Tampered Ciphertext</h4>
            <p>c1: {tampered.c1}</p>
            <p>
              c2: {tampered.c2}
              <span style={{ color: "var(--danger)", marginLeft: "0.5rem" }}>
                (modified → 2×c2 mod p)
              </span>
            </p>
            <p>σ: {tampered.sigma}</p>
          </div>
        )}

        {decryptResult && (
          <div className="result-box">
            {decryptResult.status === "success" ? (
              <>
                <p>✔ Signature valid</p>
                <p>Decrypted message: {decryptResult.output}</p>
              </>
            ) : (
              <>
                <p>❌ Signature verification FAILED</p>
                <p>Decryption aborted</p>
                <p>Output: ⊥</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* ---------------- INSECURE ---------------- */}
      <div className="panel" style={{ marginTop: "1rem", borderColor: "red" }}>
        <h3>Insecure: Plain ElGamal</h3>

        <button onClick={encryptPlain}>Encrypt</button>
        <button onClick={tamperPlain} disabled={!plainCipher}>
          Tamper
        </button>

        <button onClick={() => decryptPlain(false)}>Decrypt Original</button>
        <button onClick={() => decryptPlain(true)}>Decrypt Tampered</button>

        {plainCipher && (
          <div className="result-box">
            <h4>Original Ciphertext</h4>
            <p>c1: {plainCipher.c1}</p>
            <p>c2: {plainCipher.c2}</p>
          </div>
        )}
        {plainTampered && (
          <div className="result-box" style={{ borderColor: "var(--danger)" }}>
            <h4>Tampered Ciphertext</h4>
            <p>c1: {plainTampered.c1}</p>
            <p>
              c2: {plainTampered.c2}
              <span style={{ color: "var(--danger)", marginLeft: "0.5rem" }}>
                (modified → 2×c2 mod p)
              </span>
            </p>
          </div>
        )}
        {plainResult && (
          <div className="result-box">
            <p>Decrypted: {plainResult}</p>
            <p style={{ color: "red" }}>
              ⚠️ Tampering succeeded → message changed (m → 2m)
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PA17CCA;
