import React, { useState } from "react";

const PA20Millionaire = () => {
  const [x, setX] = useState(7);   // Alice's wealth
  const [y, setY] = useState(12);  // Bob's wealth
  const [result, setResult] = useState(null);
  const [trace, setTrace] = useState([]);
  const [progress, setProgress] = useState(0);
  const [totalGates, setTotalGates] = useState(0);
  const [otCalls, setOtCalls] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showTrace, setShowTrace] = useState(false);
  const [animDone, setAnimDone] = useState(false);
  const [hideAlice, setHideAlice] = useState(false);
  const [hideBob, setHideBob] = useState(false);
  const [truthTable, setTruthTable] = useState(null);
  const [testingTable, setTestingTable] = useState(false);

  const runComparison = async () => {
    setLoading(true);
    setResult(null);
    setTrace([]);
    setProgress(0);
    setTotalGates(0);
    setOtCalls(0);
    setShowTrace(false);
    setAnimDone(false);

    try {
      const response = await fetch("/api/pa20/millionaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ x, y, n: 4 }),
      });

      const data = await response.json();

      if (!data.trace) {
        console.error("Invalid response:", data);
        setLoading(false);
        return;
      }

      setTotalGates(data.total_gates);
      setOtCalls(data.ot_calls || 0);

      // Animate gate-by-gate progress
      const traceData = data.trace;
      let i = 0;
      const interval = setInterval(() => {
        if (i >= traceData.length) {
          clearInterval(interval);
          setResult(data.result);
          setAnimDone(true);
          setLoading(false);
          return;
        }

        setTrace((prev) => [...prev, traceData[i]]);
        setProgress(Math.round(((i + 1) / data.total_gates) * 100));
        i++;
      }, 60);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  /* Format one trace entry into a human-readable string */
  const fmtTrace = (entry) => {
    if (!entry) return "";
    if (Array.isArray(entry)) {
      const [op, ...args] = entry;
      if (op === "AND") return `AND(wire ${args[0]}, wire ${args[1]}) → ${args[2] ?? "?"}`;
      if (op === "XOR") return `XOR(wire ${args[0]}, wire ${args[1]}) → ${args[2] ?? "?"}`;
      if (op === "NOT") return `NOT(wire ${args[0]}) → ${args[1] ?? "?"}`;
      return JSON.stringify(entry);
    }
    if (typeof entry === "object") {
      return JSON.stringify(entry);
    }
    return String(entry);
  };

  /* Colour badge per gate type */
  const gateBadge = (entry) => {
    const op = Array.isArray(entry) ? entry[0] : typeof entry === "string" ? entry : "";
    const colors = {
      AND: { bg: "rgba(239, 68, 68, 0.15)", border: "rgba(239, 68, 68, 0.4)", text: "#f87171" },
      XOR: { bg: "rgba(59, 130, 246, 0.15)", border: "rgba(59, 130, 246, 0.4)", text: "#60a5fa" },
      NOT: { bg: "rgba(168, 85, 247, 0.15)", border: "rgba(168, 85, 247, 0.4)", text: "#c084fc" },
    };
    return colors[op] || { bg: "rgba(255,255,255,0.05)", border: "var(--border)", text: "var(--text-muted)" };
  };

  const progressPct = Math.min(progress, 100);

  return (
    <div className="panel">
      {/* Header */}
      <div className="panel-header">
        <h2 className="panel-title">PA #20 — Millionaire's Problem</h2>
        <p className="panel-subtitle">
          Secure 2-Party Comparison via Circuit-based MPC (n = 4 bits)
        </p>
      </div>

      {/* Two-column Alice / Bob panels */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Alice */}
        <div
          style={{
            background: "rgba(99, 102, 241, 0.05)",
            border: "1px solid rgba(99, 102, 241, 0.2)",
            borderRadius: "16px",
            padding: "1.5rem",
            position: "relative",
            overflow: "hidden"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <label style={{ fontWeight: 600, color: "#818cf8" }}>Alice's Input</label>
            <button 
              onClick={() => setHideAlice(!hideAlice)}
              style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.8rem" }}
            >
              {hideAlice ? "👁️ Show" : "🔒 Hide"}
            </button>
          </div>
          
          <div style={{ filter: hideAlice ? "blur(8px)" : "none", transition: "filter 0.3s" }}>
            <input
              type="range"
              min="0"
              max="15"
              value={x}
              onChange={(e) => setX(parseInt(e.target.value))}
              style={{ width: "100%" }}
            />
            <div style={{ display: "flex", justifyContent: "center", alignItems: "baseline", gap: "0.5rem", marginTop: "1rem" }}>
              <span style={{ fontSize: "2rem", fontWeight: 700, fontFamily: "monospace" }}>{x}</span>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>units</span>
            </div>
          </div>
          {hideAlice && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15, 23, 42, 0.4)", pointerEvents: "none" }}>
              <span style={{ fontSize: "2rem" }}>🔒</span>
            </div>
          )}
        </div>

        {/* Bob */}
        <div
          style={{
            background: "rgba(16, 185, 129, 0.05)",
            border: "1px solid rgba(16, 185, 129, 0.2)",
            borderRadius: "16px",
            padding: "1.5rem",
            position: "relative",
            overflow: "hidden"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <label style={{ fontWeight: 600, color: "#34d399" }}>Bob's Input</label>
            <button 
              onClick={() => setHideBob(!hideBob)}
              style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.8rem" }}
            >
              {hideBob ? "👁️ Show" : "🔒 Hide"}
            </button>
          </div>

          <div style={{ filter: hideBob ? "blur(8px)" : "none", transition: "filter 0.3s" }}>
            <input
              type="range"
              min="0"
              max="15"
              value={y}
              onChange={(e) => setY(parseInt(e.target.value))}
              style={{ width: "100%" }}
            />
            <div style={{ display: "flex", justifyContent: "center", alignItems: "baseline", gap: "0.5rem", marginTop: "1rem" }}>
              <span style={{ fontSize: "2rem", fontWeight: 700, fontFamily: "monospace" }}>{y}</span>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>units</span>
            </div>
          </div>
          {hideBob && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15, 23, 42, 0.4)", pointerEvents: "none" }}>
              <span style={{ fontSize: "2rem" }}>🔒</span>
            </div>
          )}
        </div>
      </div>

      {/* Run Button */}
      <button
        id="run-comparison"
        className="btn-primary"
        style={{ width: "100%" }}
        onClick={runComparison}
        disabled={loading}
      >
        {loading ? "Evaluating circuit…" : "Who is richer?"}
      </button>

      {/* Progress bar (visible while loading or after) */}
      {(loading || animDone) && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-muted)" }}>
            <span>Gates evaluated</span>
            <span>{Math.round((progressPct / 100) * totalGates)} / {totalGates}</span>
          </div>
          <div
            style={{
              height: "8px",
              borderRadius: "4px",
              background: "rgba(255,255,255,0.07)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progressPct}%`,
                height: "100%",
                borderRadius: "4px",
                background: "linear-gradient(90deg, #6366f1, #a78bfa)",
                transition: "width 0.15s ease",
              }}
            />
          </div>
        </div>
      )}

      {/* Result card */}
      {result && (
        <div
          className="result-box"
          style={{
            textAlign: "center",
            padding: "1.25rem",
          }}
        >
          <p style={{ fontSize: "1.35rem", fontWeight: 700 }}>{result}</p>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
            OT calls used: <strong style={{ color: "var(--accent)" }}>{otCalls}</strong> &nbsp;|&nbsp;
            Total gates: <strong style={{ color: "#818cf8" }}>{totalGates}</strong>
          </p>
          <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
            The actual values of x and y were never revealed to the other party.
          </p>
        </div>
      )}

      {/* Circuit Trace (expandable) */}
      {trace.length > 0 && (
        <div className="form-group">
          <div
            className="collapsible-header"
            onClick={() => setShowTrace(!showTrace)}
            style={{ cursor: "pointer", userSelect: "none" }}
          >
            <h4 style={{ fontSize: "0.9rem" }}>
              Circuit Trace ({trace.length} entries)
            </h4>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              {showTrace ? "▲ Collapse" : "▼ Expand"}
            </span>
          </div>

          {showTrace && (
            <div
              style={{
                maxHeight: "280px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "0.35rem",
                paddingRight: "0.25rem",
              }}
            >
              {trace.map((entry, i) => {
                const badge = gateBadge(entry);
                return (
                  <div
                    key={i}
                    style={{
                      background: badge.bg,
                      border: `1px solid ${badge.border}`,
                      borderRadius: "6px",
                      padding: "0.4rem 0.65rem",
                      fontFamily: "monospace",
                      fontSize: "0.75rem",
                      color: badge.text,
                      animation: "fadeIn 0.3s ease-out",
                    }}
                  >
                    <span style={{ opacity: 0.5, marginRight: "0.5rem" }}>#{i + 1}</span>
                    {fmtTrace(entry)}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Privacy footer */}
      <div className="form-group">
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
          The protocol reveals only the comparison result (who is richer) without
          revealing the actual values of Alice or Bob. Each AND gate is computed
          via Oblivious Transfer (PA #19 → PA #18 → PA #16 ElGamal). XOR and NOT
          gates are free (no communication needed).
        </p>
      </div>
    </div>
  );
};

export default PA20Millionaire;
