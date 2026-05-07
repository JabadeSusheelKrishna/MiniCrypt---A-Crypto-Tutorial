import React, { useState, useEffect, useCallback } from "react";

const PA1PRG = () => {
  const [owfInput, setOwfInput] = useState("0x1234");
  const [owfResult, setOwfResult] = useState(null);
  const [hardnessResult, setHardnessResult] = useState(null);
  const [seed, setSeed] = useState("0xdeadbeef12345678");
  const [lengthBytes, setLengthBytes] = useState(32); // 8-256 bytes
  const [bits, setBits] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [targetY, setTargetY] = useState("");
  const [hardnessLoading, setHardnessLoading] = useState(false);

  const evaluateOWF = async () => {
    try {
      const response = await fetch("/api/pa1/owf/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ x: owfInput }),
      });
      const data = await response.json();
      if (response.ok) {
        setOwfResult(data.y);
        setTargetY(data.y);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const verifyHardness = async () => {
    setHardnessLoading(true);
    setHardnessResult(null);
    try {
      const response = await fetch("/api/pa1/owf/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: targetY,
        }),
      });
      const data = await response.json();
      setHardnessResult(data);
    } catch (e) {
      console.error(e);
    }
    setHardnessLoading(false);
  };

  const generatePRG = useCallback(async () => {
    if (!seed) return;
    try {
      const response = await fetch("/api/pa1/prg/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seed: seed, length: lengthBytes * 8 }),
      });
      const data = await response.json();
      if (response.ok) setBits(data.bits);
    } catch (e) {
      console.error(e);
    }
  }, [seed, lengthBytes]);

  const runTests = async () => {
    if (!bits) return;
    setLoading(true);
    try {
      const response = await fetch("/api/pa1/prg/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bits }),
      });
      const data = await response.json();
      setTestResult(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      generatePRG();
    }, 300);
    return () => clearTimeout(timer);
  }, [seed, lengthBytes, generatePRG]);

  const oneCount = bits ? bits.filter((b) => b === 1).length : 0;
  const zeroCount = bits ? bits.length - oneCount : 0;
  const ratio = bits ? (oneCount / bits.length) * 100 : 50;

  return (
    <div
      className="panel"
      style={{
        background:
          "linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))",
      }}
    >
      <div className="panel-header">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h2
              className="panel-title"
              style={{
                fontSize: "1.5rem",
                background: "linear-gradient(to right, #818cf8, #c084fc)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              PA #1 — One-Way Functions & PRG
            </h2>
            <p className="panel-subtitle">
              Discrete Log OWF & Hard-Core Bit Iterative PRG
            </p>
          </div>
          <div
            style={{
              background: "rgba(99, 102, 241, 0.1)",
              padding: "0.5rem 1rem",
              borderRadius: "20px",
              fontSize: "0.75rem",
              color: "#818cf8",
              border: "1px solid rgba(99, 102, 241, 0.2)",
            }}
          >
            Interactive Demo
          </div>
        </div>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}
      >
        {/* Left Column: OWF */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          <div className="form-group">
            <label
              style={{
                color: "var(--primary)",
                fontWeight: "600",
                letterSpacing: "0.05em",
              }}
            >
              OWF EVALUATION
            </label>
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                marginBottom: "0.5rem",
              }}
            >
              Compute f(x) = gˣ mod p
            </p>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="text"
                value={owfInput}
                onChange={(e) => setOwfInput(e.target.value)}
                placeholder="Enter x (hex or dec)"
                style={{ flex: 1, fontFamily: "monospace" }}
              />
              <button
                className="btn-primary"
                onClick={evaluateOWF}
                style={{ padding: "0.75rem" }}
              >
                Evaluate
              </button>
            </div>
            {owfResult && (
              <div
                className="result-box"
                style={{
                  padding: "1rem",
                  border: "1px solid var(--border)",
                  background: "rgba(0,0,0,0.2)",
                }}
              >
                <div
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--text-muted)",
                    marginBottom: "0.25rem",
                  }}
                >
                  RESULT (HEX)
                </div>
                <div
                  style={{
                    fontFamily: "monospace",
                    wordBreak: "break-all",
                    color: "var(--accent)",
                  }}
                >
                  {owfResult}
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label
              style={{
                color: "var(--primary)",
                fontWeight: "600",
                letterSpacing: "0.05em",
              }}
            >
              HARDNESS DEMO
            </label>
            <input
              type="text"
              value={targetY}
              onChange={(e) => setTargetY(e.target.value)}
              placeholder="Enter target y (hex or dec)"
              style={{
                width: "100%",
                marginBottom: "0.5rem",
                fontFamily: "monospace",
              }}
            />
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                marginBottom: "0.5rem",
              }}
            >
              Attempt to invert f(x) using brute force
            </p>
            <button
              className="foundation-btn"
              onClick={verifyHardness}
              disabled={hardnessLoading}
              style={{
                width: "100%",
                background: hardnessLoading
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(99, 102, 241, 0.1)",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                color: "#818cf8",
              }}
            >
              {hardnessLoading
                ? "Searching Range..."
                : "Start Inversion Attack"}
            </button>
            {hardnessResult && (
              <div
                className="result-box"
                style={{
                  padding: "1rem",
                  fontSize: "0.8rem",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span style={{ color: "var(--text-muted)" }}>Target y:</span>
                  <span style={{ fontFamily: "monospace" }}>
                    {hardnessResult.target.substring(0, 16)}...
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span style={{ color: "var(--text-muted)" }}>Status:</span>
                  <span
                    style={{
                      color: hardnessResult.found
                        ? "var(--accent)"
                        : "var(--danger)",
                      fontWeight: "600",
                    }}
                  >
                    {hardnessResult.found
                      ? "SUCCESS"
                      : "FAILED (Hard to invert!)"}
                  </span>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ color: "var(--text-muted)" }}>
                    Values Searched:
                  </span>
                  <span>{hardnessResult.count.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: PRG */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          <div className="form-group">
            <label
              style={{
                color: "var(--primary)",
                fontWeight: "600",
                letterSpacing: "0.05em",
              }}
            >
              PRG GENERATION
            </label>
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                marginBottom: "0.5rem",
              }}
            >
              G(s) = b(s) ∥ b(f(s)) ∥ b(f(f(s))) ...
            </p>

            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{
                  fontSize: "0.7rem",
                  display: "block",
                  marginBottom: "0.25rem",
                }}
              >
                SEED (HEX)
              </label>
              <input
                type="text"
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                placeholder="0x..."
                style={{ width: "100%", fontFamily: "monospace" }}
              />
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "0.25rem",
                }}
              >
                <label style={{ fontSize: "0.7rem" }}>OUTPUT LENGTH</label>
                <span style={{ fontSize: "0.75rem", color: "var(--accent)" }}>
                  {lengthBytes} Bytes ({lengthBytes * 8} Bits)
                </span>
              </div>
              <input
                type="range"
                min="8"
                max="256"
                value={lengthBytes}
                onChange={(e) => setLengthBytes(parseInt(e.target.value))}
                style={{ width: "100%", accentColor: "var(--primary)" }}
              />
            </div>
          </div>

          <div className="form-group">
            <label
              style={{
                color: "var(--primary)",
                fontWeight: "600",
                letterSpacing: "0.05em",
              }}
            >
              RANDOMNESS VISUALIZER
            </label>
            <div
              style={{
                height: "40px",
                background: "rgba(0,0,0,0.4)",
                borderRadius: "8px",
                overflow: "hidden",
                display: "flex",
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  width: `${ratio}%`,
                  background: "var(--primary)",
                  height: "100%",
                  transition: "width 0.5s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.7rem",
                }}
              >
                {ratio > 10 && `1s: ${oneCount}`}
              </div>
              <div
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.05)",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.7rem",
                }}
              >
                {ratio < 90 && `0s: ${zeroCount}`}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "0.25rem",
                fontSize: "0.7rem",
                color: "var(--text-muted)",
              }}
            >
              <span>Ideal: 50%</span>
              <span>Current: {ratio.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {bits && (
        <div style={{ marginTop: "1rem" }}>
          <div
            className="result-box"
            style={{
              padding: "1rem",
              background: "rgba(0,0,0,0.3)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                fontSize: "0.7rem",
                color: "var(--text-muted)",
                marginBottom: "0.5rem",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>PSEUDORANDOM STREAM G(s)</span>
              <span>{bits.length} BITS</span>
            </div>
            <div
              style={{
                wordBreak: "break-all",
                fontFamily: "monospace",
                fontSize: "0.65rem",
                maxHeight: "100px",
                overflowY: "auto",
                lineHeight: "1.2",
                color: "#94a3b8",
                letterSpacing: "1px",
              }}
            >
              {bits.join("")}
            </div>

            <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
              <button
                className="btn-primary"
                onClick={runTests}
                disabled={loading}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "1px solid var(--primary)",
                  color: "var(--primary)",
                }}
              >
                {loading ? "Running NIST Suite..." : "Run Statistical Tests"}
              </button>
            </div>

            {testResult && (
              <div
                style={{
                  marginTop: "1.5rem",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "1rem",
                  animation: "fadeIn 0.5s ease",
                }}
              >
                {[
                  { label: "Frequency", p: testResult.freq_p },
                  { label: "Runs", p: testResult.runs_p },
                  { label: "Serial", p: testResult.serial_p },
                ].map((test, i) => (
                  <div
                    key={i}
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      padding: "0.75rem",
                      borderRadius: "8px",
                      border: `1px solid ${test.p >= 0.01 ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"}`,
                    }}
                  >
                    <div
                      style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}
                    >
                      {test.label} Test
                    </div>
                    <div
                      style={{
                        fontSize: "1rem",
                        fontWeight: "700",
                        margin: "0.25rem 0",
                        color:
                          test.p >= 0.01 ? "var(--accent)" : "var(--danger)",
                      }}
                    >
                      p = {test.p.toFixed(3)}
                    </div>
                    <div style={{ fontSize: "0.6rem", opacity: 0.8 }}>
                      {test.p >= 0.01 ? "✅ PASS" : "❌ FAIL"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PA1PRG;
