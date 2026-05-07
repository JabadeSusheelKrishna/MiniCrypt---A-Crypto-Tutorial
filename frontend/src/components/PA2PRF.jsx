import React, { useEffect, useMemo, useState, useCallback } from "react";

const NODE_SIZE = 80;

const PA2PRF = () => {
  const [k, setK] = useState("deadbeef12345678");
  const [x, setX] = useState("0101");
  const [depth, setDepth] = useState(4);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleKeyChange = (e) => {
    const value = e.target.value.toLowerCase().replace(/[^0-9a-f]/g, "");
    setK(value);
  };

  const handleXChange = (e) => {
    let value = e.target.value.replace(/[^01]/g, "");
    if (value.length > depth) {
      value = value.slice(0, depth);
    }
    setX(value);
  };

  useEffect(() => {
    if (x.length > depth) {
      setX(x.slice(0, depth));
    }
  }, [depth]);

  const activeNodes = useMemo(() => {
    const set = new Set();
    let current = "";
    set.add("");
    for (let i = 0; i < x.length; i++) {
      current += x[i];
      set.add(current);
    }
    return set;
  }, [x]);

  const deriveNodeValue = useCallback((bits, level) => {
    try {
      const keyBig = BigInt("0x" + (k || "0"));
      // Simple deterministic hash to simulate GGM tree nodes visually
      let hash = keyBig;
      for (let i = 0; i < bits.length; i++) {
          if (bits[i] === '0') hash = (hash * 0x5deece66dn + 11n) & 0xffffffffffffffffn;
          else hash = (hash * 0xbb31b6d1n + 13n) & 0xffffffffffffffffn;
      }
      // Return middle bytes for more visual entropy
      return hash.toString(16).padStart(16, "0").slice(4, 12);
    } catch {
      return "00000000";
    }
  }, [k]);

  const treeLevels = useMemo(() => {
    const levels = [];
    for (let level = 0; level <= depth; level++) {
      const nodes = [];
      const count = Math.pow(2, level);
      for (let i = 0; i < count; i++) {
        const bits = level === 0 ? "" : i.toString(2).padStart(level, "0");
        nodes.push({
          bits,
          active: activeNodes.has(bits),
          value: deriveNodeValue(bits, level),
        });
      }
      levels.push(nodes);
    }
    return levels;
  }, [depth, k, x, activeNodes, deriveNodeValue]);

  const evaluatePRF = async () => {
    if (!k || !x || x.length !== depth) return;
    setLoading(true);
    try {
      const response = await fetch("/api/pa2/prf/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          k: k.startsWith('0x') ? k : '0x' + k,
          x: parseInt(x, 2),
          depth,
        }),
      });
      const data = await response.json();
      setResult(data.y);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (x.length === depth && k.length > 0) {
        evaluatePRF();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [x, k, depth]);

  return (
    <div className="panel" style={{ background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))' }}>
      <div className="panel-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="panel-title" style={{ fontSize: '1.5rem', background: 'linear-gradient(to right, #60a5fa, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              PA #2 — GGM Tree Visualizer
            </h2>
            <p className="panel-subtitle">PRF construction from PRG (GGM Tree)</p>
          </div>
          <div style={{ background: 'rgba(96, 165, 250, 0.1)', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.75rem', color: '#60a5fa', border: '1px solid rgba(96, 165, 250, 0.2)' }}>
            Reduction: PRG → PRF
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
        <div className="form-group">
          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>KEY K (HEX)</label>
          <input
            type="text"
            value={k}
            onChange={handleKeyChange}
            placeholder="deadbeef"
            style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
          />
        </div>
        <div className="form-group">
          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>QUERY X ({depth} BITS)</label>
          <input
            type="text"
            value={x}
            onChange={handleXChange}
            placeholder="0101"
            style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--accent)' }}
          />
        </div>
        <div className="form-group">
          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>TREE DEPTH</label>
          <select
            value={depth}
            onChange={(e) => setDepth(Number(e.target.value))}
            style={{ fontSize: '0.9rem' }}
          >
            {[2, 3, 4, 5, 6].map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div className="result-box" style={{ background: 'rgba(0,0,0,0.4)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>FINAL PRF OUTPUT Fₖ(x)</div>
        <div style={{ fontSize: '1.8rem', fontWeight: '800', fontFamily: 'monospace', color: '#60a5fa', letterSpacing: '2px' }}>
          {loading ? "..." : result || "—"}
        </div>
      </div>

      <div style={{ overflowX: "auto", padding: "2rem 0", background: 'rgba(0,0,0,0.2)', borderRadius: '16px' }}>
        <div style={{ minWidth: `${Math.pow(2, depth) * 100}px`, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {treeLevels.map((level, levelIndex) => (
            <div key={levelIndex} style={{ display: "flex", justifyContent: "space-around", padding: "0 1rem" }}>
              {level.map((node) => (
                <div
                  key={node.bits}
                  style={{
                    width: `${NODE_SIZE}px`,
                    height: `${NODE_SIZE}px`,
                    borderRadius: "12px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    background: node.active ? "rgba(59, 130, 246, 0.2)" : "rgba(255, 255, 255, 0.03)",
                    border: node.active ? "2px solid #3b82f6" : "1px solid rgba(255, 255, 255, 0.1)",
                    boxShadow: node.active ? "0 0 15px rgba(59, 130, 246, 0.3)" : "none",
                    opacity: node.active ? 1 : 0.3,
                    transform: node.active ? 'scale(1.1)' : 'scale(1)',
                    zIndex: node.active ? 10 : 1
                  }}
                >
                  <div style={{ fontSize: "0.6rem", opacity: 0.6, marginBottom: "0.2rem" }}>
                    {node.bits === "" ? "root" : node.bits}
                  </div>
                  <div style={{ fontSize: "0.75rem", fontWeight: "700", fontFamily: "monospace", color: node.active ? "#60a5fa" : "white" }}>
                    {node.value}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: "2rem", display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.1)', fontSize: '0.8rem' }}>
          <strong style={{ color: '#60a5fa', display: 'block', marginBottom: '0.5rem' }}>Traversed Path</strong>
          <p style={{ color: 'var(--text-muted)' }}>The blue nodes trace the path defined by input x. At each level, the PRG is applied to the current seed.</p>
        </div>
        <div style={{ padding: '1rem', background: 'rgba(168, 85, 247, 0.05)', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.1)', fontSize: '0.8rem' }}>
          <strong style={{ color: '#a855f7', display: 'block', marginBottom: '0.5rem' }}>GGM Security</strong>
          <p style={{ color: 'var(--text-muted)' }}>Security reduces to PRG indistinguishability. Any leaf value is computationally random if the PRG is secure.</p>
        </div>
      </div>
    </div>
  );
};

export default PA2PRF;

