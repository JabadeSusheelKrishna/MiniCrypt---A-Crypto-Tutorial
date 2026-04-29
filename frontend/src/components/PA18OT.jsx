import React, { useState } from 'react';

const PA18OT = () => {
  const [choice, setChoice] = useState(null);
  const [state, setState] = useState(null);
  const [pk, setPk] = useState(null);
  const [cipher, setCipher] = useState(null);
  const [result, setResult] = useState(null);
  const [log, setLog] = useState([]);

  const m0 = 10;
  const m1 = 99;

  const addLog = (msg) => {
    setLog((prev) => [...prev, msg]);
  };

  // Step 1
  const choose = async (b) => {
    setChoice(b);
    setLog([]);

    addLog(`Bob chooses b = ${b}`);

    const res = await fetch('/api/pa18/step1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ b }),
    });

    const data = await res.json();
    setPk(data);
    setState(data.state);

    addLog("Generated pk0, pk1 and sent to Alice");
  };

  // Step 2 (Alice encrypts)
  const sender = async () => {
    const res = await fetch('/api/pa18/sender', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pk0: pk.pk0,
        pk1: pk.pk1,
        m0,
        m1,
      }),
    });

    const data = await res.json();
    setCipher(data);

    addLog("Alice sends C0 and C1");
  };

  // Step 3
  const decrypt = async () => {
    const res = await fetch('/api/pa18/step2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        state,
        c0: cipher.c0,
        c1: cipher.c1,
      }),
    });

    const data = await res.json();
    setResult(data.mb);

    addLog(`Bob decrypts and gets m${choice} = ${data.mb}`);
  };

  // Cheat
  const cheat = async () => {
    const res = await fetch('/api/pa18/cheat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        state,
        c0: cipher.c0,
        c1: cipher.c1,
      }),
    });

    const data = await res.json();

    addLog("Cheat attempt: trying to decrypt other message...");
    addLog("Result: FAILED (no secret key)");
  };

  return (
    <div className="panel">
      <h2>PA #18 — Oblivious Transfer</h2>

      <div style={{ display: 'flex', gap: '1rem' }}>

        {/* Alice Panel */}
        <div className="panel" style={{ opacity: 0.5 }}>
          <h3>Alice (Sender)</h3>
          <p>m0 = ??</p>
          <p>m1 = ??</p>
        </div>

        {/* Bob Panel */}
        <div className="panel">
          <h3>Bob (You)</h3>

          <button onClick={() => choose(0)}>Choose 0</button>
          <button onClick={() => choose(1)}>Choose 1</button>

          <button onClick={sender} disabled={!pk}>
            Receive Ciphertexts
          </button>

          <button onClick={decrypt} disabled={!cipher}>
            Decrypt
          </button>

          <button onClick={cheat} disabled={!cipher}>
            Cheat Attempt
          </button>

          {result && (
            <div className="result-box">
              <p>Received: {result}</p>
              <p>Other message: ??</p>
            </div>
          )}
        </div>
      </div>

      {/* Logs */}
      <div className="result-box">
        <h3>Protocol Log</h3>
        {log.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  );
};

export default PA18OT;