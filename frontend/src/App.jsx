import React, { useState } from 'react';
import PrimalityTester from './components/PA13PrimalityTester';
import PA14CRT from './components/PA14CRT';
import PA15DigitalSignatures from './components/PA15DigitalSignatures';
import PA16ElGamal from './components/PA16ElGamal';
import PA17CCA from './components/PA17CCA';
import PA18OT from './components/PA18OT';

const App = () => {
  const [foundation, setFoundation] = useState('DLP');
  const [proofOpen, setProofOpen] = useState(false);

  return (
    <>
      <header className="top-bar">
        <div className="logo">Minicrypt Clique Explorer</div>
        <div className="foundation-selector">
          <button
            className={`foundation-btn ${foundation === 'AES' ? 'active' : ''}`}
            onClick={() => setFoundation('AES')}
          >
            AES-128 (PRP)
          </button>
          <button
            className={`foundation-btn ${foundation === 'DLP' ? 'active' : ''}`}
            onClick={() => setFoundation('DLP')}
          >
            DLP (gˣ mod p)
          </button>
        </div>
      </header>

      <main className="main-content">
        <div className="panel">
          <div className="panel-header">
            <h2 className="panel-title">Column 1: Build Source</h2>
            <p className="panel-subtitle">Foundation → Source Primitive A</p>
          </div>
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 0' }}>
            <p>Not implemented yet (due: PA#1)</p>
            <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Using temporary numpy-based random pool.</p>
          </div>
        </div>

        <PrimalityTester />
        <PA14CRT />
        <PA15DigitalSignatures />
        <PA16ElGamal />
        <PA17CCA />
        <PA18OT />
      </main>

      <footer className="bottom-panel" style={{ maxHeight: proofOpen ? '600px' : '60px' }}>
        <div className="collapsible-header" onClick={() => setProofOpen(!proofOpen)}>
          <h3 style={{ fontSize: '1rem' }}>Reduction Proof Summary</h3>
          <span style={{ transform: proofOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>
            ▼
          </span>
        </div>
        {proofOpen && (
          <div style={{ padding: '1rem 0', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <p><strong>Primality Testing (PA #13):</strong> A standalone component for RSA and ElGamal.</p>
              <p style={{ fontSize: '0.875rem' }}>
                Security: Miller-Rabin is a probabilistic algorithm. For k rounds, the probability
                that a composite number is declared prime is &le; 4⁻ᵏ.
              </p>
            </div>

            <div>
              <p><strong>Håstad's Broadcast Attack (PA #14):</strong> Breaking Textbook RSA.</p>
              <p style={{ fontSize: '0.875rem' }}>
                Theorem: Håstad (1985). Small exponent $e$ allows recovering $m$ via CRT if $m^e$ is less than the product of all $N_i$.
                Padding (PKCS#1 v1.5) breaks the attack by ensuring different messages are encrypted.
              </p>
            </div>

            <div>
              <p><strong>Digital Signatures (PA #15):</strong> Integrity and Non-repudiation.</p>
              <p style={{ fontSize: '0.875rem' }}>
                Security: EUF-CMA security is achieved via Hash-then-Sign.
                Raw RSA signatures are vulnerable to multiplicative forgery due to the homomorphic property: σ(m₁) · σ(m₂) = σ(m₁ · m₂).
              </p>
            </div>

            <div>
              <p><strong>ElGamal PKC (PA #16):</strong> DLP-based Encryption.</p>
              <p style={{ fontSize: '0.875rem' }}>
                Assumption: Decisional Diffie-Hellman (DDH).
                Vulnerability: ElGamal is malleable. $(g^r, m \cdot h^r) \to (g^r, 2m \cdot h^r)$ allows an attacker to double the message.
                This demonstrates why CPA-security does not imply CCA-security.
              </p>
            </div>
          </div>
        )}
      </footer>
    </>
  );
};

export default App;
