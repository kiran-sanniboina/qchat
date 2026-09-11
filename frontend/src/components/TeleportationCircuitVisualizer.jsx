import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Cpu,
  Radio,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  Info,
  Sparkles,
  Sliders,
  Shield
} from 'lucide-react';
import api from '../api';

// 3D-Styled SVG Bloch Sphere Component
function BlochSphere3D({
  title,
  subtitle,
  theta = 0,
  phi = 0,
  isCollapsed = false,
  isDestroyed = false,
  isEntangled = false,
  accentColor = '#00f2fe'
}) {
  const R = 54;
  const cx = 80;
  const cy = 80;

  // Spherical coordinates to Cartesian
  const x3d = Math.sin(theta) * Math.cos(phi);
  const y3d = Math.sin(theta) * Math.sin(phi);
  const z3d = Math.cos(theta);

  // Isometric 2D projection
  const tipX = cx + R * (y3d * 0.85 - x3d * 0.45);
  const tipY = cy - R * (z3d * 0.85 - x3d * 0.25);

  const gradId = `blochGrad-${title.replace(/[^a-zA-Z0-9]/g, '')}`;
  const glowId = `glow-${title.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <div className="flex flex-col items-center bg-wa-bg p-3 rounded-xl border border-wa-border relative overflow-hidden shadow-inner w-full max-w-[210px]">
      <div className="text-center mb-1">
        <span className="text-[11px] font-bold text-wa-textPrimary block truncate">{title}</span>
        <span className="text-[9px] text-wa-textSecondary block truncate">{subtitle}</span>
      </div>

      <div className="relative w-[160px] h-[160px] my-1">
        <svg viewBox="0 0 160 160" className="w-full h-full select-none">
          <defs>
            <radialGradient id={gradId} cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#1e293b" stopOpacity="0.85" />
              <stop offset="65%" stopColor="#0f172a" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#020617" stopOpacity="1" />
            </radialGradient>
            <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Shaded 3D Sphere Surface */}
          <circle
            cx={cx}
            cy={cy}
            r={R}
            fill={`url(#${gradId})`}
            stroke={accentColor}
            strokeWidth="1.2"
            strokeOpacity="0.35"
          />

          {/* Equator Ellipse */}
          <ellipse
            cx={cx}
            cy={cy}
            rx={R}
            ry={R * 0.28}
            fill="none"
            stroke="#00f2fe"
            strokeWidth="0.8"
            strokeDasharray="2.5 2.5"
            strokeOpacity="0.3"
          />

          {/* Prime Meridian Ellipse */}
          <ellipse
            cx={cx}
            cy={cy}
            rx={R * 0.28}
            ry={R}
            fill="none"
            stroke="#a855f7"
            strokeWidth="0.8"
            strokeDasharray="2.5 2.5"
            strokeOpacity="0.25"
          />

          {/* Coordinate Axes */}
          <line x1={cx} y1={cy - R} x2={cx} y2={cy + R} stroke="#475569" strokeWidth="0.8" strokeOpacity="0.6" />
          <line x1={cx - R} y1={cy} x2={cx + R} y2={cy} stroke="#475569" strokeWidth="0.8" strokeOpacity="0.6" />
          <line
            x1={cx + R * 0.45}
            y1={cy - R * 0.25}
            x2={cx - R * 0.45}
            y2={cy + R * 0.25}
            stroke="#475569"
            strokeWidth="0.8"
            strokeOpacity="0.6"
          />

          {/* Pole Labels */}
          <text x={cx} y={cy - R - 3} textAnchor="middle" fill="#00f2fe" fontSize="8" fontWeight="bold" fontFamily="monospace">|0⟩</text>
          <text x={cx} y={cy + R + 10} textAnchor="middle" fill="#00f2fe" fontSize="8" fontWeight="bold" fontFamily="monospace">|1⟩</text>
          <text x={cx - R * 0.45 - 7} y={cy + R * 0.25 + 6} textAnchor="middle" fill="#a855f7" fontSize="7" fontFamily="monospace">|+⟩</text>
          <text x={cx + R * 0.45 + 7} y={cy - R * 0.25 - 2} textAnchor="middle" fill="#a855f7" fontSize="7" fontFamily="monospace">|-⟩</text>
          <text x={cx + R + 6} y={cy + 3} textAnchor="middle" fill="#38bdf8" fontSize="7" fontFamily="monospace">|+i⟩</text>
          <text x={cx - R - 6} y={cy + 3} textAnchor="middle" fill="#38bdf8" fontSize="7" fontFamily="monospace">|-i⟩</text>

          {/* Origin Center Point */}
          <circle cx={cx} cy={cy} r="1.5" fill="#64748b" />

          {/* Dynamic State Vector */}
          {!isDestroyed && !isEntangled && (
            <g className="transition-all duration-500 ease-out">
              <line
                x1={cx}
                y1={cy}
                x2={cx + R * (y3d * 0.85 - x3d * 0.45)}
                y2={cy + R * 0.28 * (x3d * 0.45)}
                stroke="#000000"
                strokeWidth="1.2"
                strokeOpacity="0.4"
                strokeDasharray="2 2"
              />
              <line
                x1={cx}
                y1={cy}
                x2={tipX}
                y2={tipY}
                stroke={isCollapsed ? '#fbbf24' : accentColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                filter={`url(#${glowId})`}
              />
              <circle
                cx={tipX}
                cy={tipY}
                r="4"
                fill={isCollapsed ? '#fbbf24' : accentColor}
                filter={`url(#${glowId})`}
              />
              <circle cx={tipX} cy={tipY} r="1.8" fill="#ffffff" />
            </g>
          )}

          {/* Entangled Bell Pair Visual */}
          {isEntangled && (
            <g className="animate-pulse">
              <circle cx={cx} cy={cy} r="14" fill="#a855f7" fillOpacity="0.2" stroke="#a855f7" strokeWidth="1" strokeDasharray="2 2" />
              <circle cx={cx} cy={cy} r="6" fill="#c084fc" fillOpacity="0.4" />
              <text x={cx} y={cy + 3} textAnchor="middle" fill="#e9d5ff" fontSize="8" fontWeight="bold" fontFamily="monospace">|Φ⁺⟩</text>
            </g>
          )}

          {/* Destroyed / Consumed */}
          {isDestroyed && (
            <g className="animate-in fade-in">
              <line x1={cx - 12} y1={cy - 12} x2={cx + 12} y2={cy + 12} stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
              <line x1={cx + 12} y1={cy - 12} x2={cx - 12} y2={cy + 12} stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
              <text x={cx} y={cy + 24} textAnchor="middle" fill="#ef4444" fontSize="8" fontWeight="bold" fontFamily="sans-serif">
                Consumed (No-Cloning)
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="mt-0.5 flex items-center justify-center gap-2 font-mono text-[9px] text-quantum-cyan">
        {isDestroyed ? (
          <span className="text-red-400 font-semibold">Qubit Collapsed</span>
        ) : isEntangled ? (
          <span className="text-purple-300 font-semibold">Maximal Entangled Pair</span>
        ) : (
          <>
            <span>&theta; = {(theta * 180 / Math.PI).toFixed(0)}&deg;</span>
            <span className="text-wa-textSecondary">&bull;</span>
            <span>&phi; = {(phi * 180 / Math.PI).toFixed(0)}&deg;</span>
          </>
        )}
      </div>
    </div>
  );
}

export default function TeleportationCircuitVisualizer({
  latestMessage,
  selectedState = '10',
  onClose
}) {
  const [activeState, setActiveState] = useState(selectedState || '10');
  const [selectedQubitIndex, setSelectedQubitIndex] = useState(0);
  const [perturb, setPerturb] = useState(false);
  const [speed, setSpeed] = useState(1200); // Speed: Slow 2s, Normal 1.2s, Fast 0.6s
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [simulationData, setSimulationData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Custom angle exploration
  const [isCustomAngle, setIsCustomAngle] = useState(false);
  const [customThetaDeg, setCustomThetaDeg] = useState(45);

  const timerRef = useRef(null);

  // Message signature records if available
  const messageRecords = latestMessage?.signatureMeta?.teleportationRecords || [];

  // State definitions catalog
  const stateCatalog = {
    '00': { id: '00', name: '|0⟩', desc: 'Computational Zero (Z+)', theta: 0, phi: 0, p0: 1.0, p1: 0.0, formula: '|ψ⟩ = |0⟩' },
    '01': { id: '01', name: '|1⟩', desc: 'Computational One (Z-)', theta: Math.PI, phi: 0, p0: 0.0, p1: 1.0, formula: '|ψ⟩ = |1⟩' },
    '10': { id: '10', name: '|+⟩', desc: 'Hadamard Plus (X+)', theta: Math.PI / 2, phi: 0, p0: 0.5, p1: 0.5, formula: '|ψ⟩ = (|0⟩ + |1⟩)/√2' },
    '11': { id: '11', name: '|-⟩', desc: 'Hadamard Minus (X-)', theta: Math.PI / 2, phi: Math.PI, p0: 0.5, p1: 0.5, formula: '|ψ⟩ = (|0⟩ - |1⟩)/√2' },
    '+i': { id: '+i', name: '|+i⟩', desc: 'Phase Plus (Y+)', theta: Math.PI / 2, phi: Math.PI / 2, p0: 0.5, p1: 0.5, formula: '|ψ⟩ = (|0⟩ + i|1⟩)/√2' },
    '-i': { id: '-i', name: '|-i⟩', desc: 'Phase Minus (Y-)', theta: Math.PI / 2, phi: (3 * Math.PI) / 2, p0: 0.5, p1: 0.5, formula: '|ψ⟩ = (|0⟩ - i|1⟩)/√2' }
  };

  const currentStateInfo = isCustomAngle
    ? {
        id: 'custom',
        name: `|θ=${customThetaDeg}°⟩`,
        desc: `Custom Superposition State`,
        theta: (customThetaDeg * Math.PI) / 180,
        phi: 0,
        p0: Math.pow(Math.cos((customThetaDeg * Math.PI) / 360), 2),
        p1: Math.pow(Math.sin((customThetaDeg * Math.PI) / 360), 2),
        formula: `|ψ⟩ = cos(${customThetaDeg / 2}°)|0⟩ + sin(${customThetaDeg / 2}°)|1⟩`
      }
    : stateCatalog[activeState] || stateCatalog['10'];

  // Fetch or recompute simulation steps
  const fetchSimulationSteps = async (stateLabel, isPerturbed) => {
    setLoading(true);
    try {
      const effectiveState = isCustomAngle ? '10' : stateLabel;
      const res = await api.post('/security/teleport/simulate-steps', {
        stateLabel: effectiveState,
        perturb: isPerturbed,
        perturbType: isPerturbed ? 'DEPHASE' : null
      });
      setSimulationData(res.data);
      setCurrentStageIndex(0);
      setIsPlaying(false);
    } catch (err) {
      console.error('Error fetching teleport steps:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSimulationSteps(activeState, perturb);
  }, [activeState, perturb, isCustomAngle]);

  // Handle auto playback
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentStageIndex((prev) => {
          if (simulationData && prev >= simulationData.stages.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speed, simulationData]);

  const handlePlayPause = () => {
    if (currentStageIndex >= (simulationData?.stages?.length || 6) - 1) {
      setCurrentStageIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStageIndex(0);
  };

  const handleNext = () => {
    if (simulationData && currentStageIndex < simulationData.stages.length - 1) {
      setCurrentStageIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStageIndex > 0) {
      setCurrentStageIndex((prev) => prev - 1);
    }
  };

  const stages = simulationData?.stages || [];
  const currentStage = stages[currentStageIndex] || {
    title: 'Loading Stage...',
    description: '',
    statevectorDescription: '',
    qubitStates: {}
  };

  // Derive Bob's sphere properties based on stage and perturbation
  const getBobSphereProps = () => {
    if (currentStageIndex <= 1) {
      return { isEntangled: true, theta: 0, phi: 0 };
    }
    if (currentStageIndex === 2 || currentStageIndex === 3) {
      const c0 = simulationData?.classicalBits?.[0] || '0';
      const c1 = simulationData?.classicalBits?.[1] || '0';
      let shiftedTheta = currentStateInfo.theta;
      let shiftedPhi = currentStateInfo.phi;
      if (c1 === '1') shiftedTheta = Math.PI - shiftedTheta;
      if (c0 === '1') shiftedPhi = (shiftedPhi + Math.PI) % (2 * Math.PI);
      return {
        isCollapsed: true,
        theta: shiftedTheta,
        phi: shiftedPhi,
        subtitle: `Pending Pauli ${simulationData?.correctionApplied || 'I'}`
      };
    }
    if (perturb) {
      return {
        theta: currentStateInfo.theta,
        phi: (currentStateInfo.phi + Math.PI) % (2 * Math.PI),
        isCollapsed: false,
        accentColor: '#f87171',
        subtitle: 'Reconstructed with Phase Error'
      };
    }
    return {
      theta: currentStateInfo.theta,
      phi: currentStateInfo.phi,
      isCollapsed: false,
      accentColor: '#00a884',
      subtitle: 'Reconstructed Exact State'
    };
  };

  const bobProps = getBobSphereProps();

  const currentFidelity = currentStageIndex >= 4
    ? (perturb ? 0.50 : 1.0)
    : (currentStageIndex >= 2 ? 0.25 : 0.0);

  const c0 = simulationData?.classicalBits?.[0] ?? (currentStageIndex >= 2 ? '1' : '?');
  const c1 = simulationData?.classicalBits?.[1] ?? (currentStageIndex >= 2 ? '0' : '?');
  const corrApplied = simulationData?.correctionApplied || (c0 === '1' && c1 === '1' ? 'XZ' : c0 === '1' ? 'Z' : c1 === '1' ? 'X' : 'I');
  const basis = simulationData?.basis || (currentStateInfo.id === '10' || currentStateInfo.id === '11' ? 'X' : 'Z');

  return (
    <div className="bg-wa-surface p-5 rounded-2xl border border-wa-border shadow-2xl space-y-5 text-xs select-none animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-wa-border">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-quantum-cyan animate-pulse" />
            <h3 className="text-sm font-bold text-wa-textPrimary tracking-wide flex items-center gap-2">
              Quantum Teleportation Circuit Visualizer & Bloch Sphere Engine
            </h3>
          </div>
          <p className="text-[11px] text-wa-textSecondary mt-0.5">
            Physical simulation of Bennett et al. (1993) protocol with dynamic 3D Bloch sphere vector projection and QDS signature binding.
          </p>
        </div>

        {/* Channel Perturbation Toggle */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-wa-panel border border-wa-border cursor-pointer hover:bg-wa-hover transition">
            <input
              type="checkbox"
              checked={perturb}
              onChange={(e) => setPerturb(e.target.checked)}
              className="rounded accent-red-500 w-3.5 h-3.5 cursor-pointer"
            />
            <span className={`text-[11px] font-semibold ${perturb ? 'text-red-400' : 'text-wa-textSecondary'}`}>
              Inject Channel Noise (Eve Intercept)
            </span>
          </label>
        </div>
      </div>

      {/* State Selector Bar & Custom Angle Slider */}
      <div className="bg-wa-panel/80 p-3 rounded-xl border border-wa-border space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-wa-textPrimary font-semibold flex items-center gap-1.5 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-quantum-cyan" /> Choose Input State |ψ⟩ to Teleport:
          </span>

          {/* Basis Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {Object.values(stateCatalog).map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setIsCustomAngle(false);
                  setActiveState(s.id);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1 ${
                  !isCustomAngle && activeState === s.id
                    ? 'bg-quantum-cyan/20 text-quantum-cyan border border-quantum-cyan shadow-[0_0_10px_rgba(0,242,254,0.3)]'
                    : 'bg-wa-surface border border-wa-border text-wa-textSecondary hover:text-wa-textPrimary'
                }`}
                title={s.desc}
              >
                <span>{s.name}</span>
              </button>
            ))}

            {/* Custom Angle Button */}
            <button
              onClick={() => setIsCustomAngle(!isCustomAngle)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1 ${
                isCustomAngle
                  ? 'bg-quantum-purple/20 text-quantum-purple border border-quantum-purple shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                  : 'bg-wa-surface border border-wa-border text-wa-textSecondary hover:text-wa-textPrimary'
              }`}
            >
              <Sliders className="w-3 h-3" />
              <span>Custom θ</span>
            </button>
          </div>
        </div>

        {/* Custom Angle Slider Drawer */}
        {isCustomAngle && (
          <div className="pt-2 border-t border-wa-border/60 flex flex-col sm:flex-row items-center gap-3 animate-in slide-in-from-top-1 text-[11px]">
            <span className="text-quantum-purple font-mono font-semibold">
              Superposition Angle θ = {customThetaDeg}° ({(customThetaDeg * Math.PI / 180).toFixed(2)} rad)
            </span>
            <input
              type="range"
              min="0"
              max="180"
              value={customThetaDeg}
              onChange={(e) => setCustomThetaDeg(parseInt(e.target.value))}
              className="flex-1 accent-quantum-purple h-1.5 bg-wa-surface rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-wa-textSecondary font-mono">
              cos({customThetaDeg / 2}°)|0⟩ + sin({customThetaDeg / 2}°)|1⟩
            </span>
          </div>
        )}
      </div>

      {/* Message Qubit Selection Pill Bar (if message records exist) */}
      {messageRecords.length > 0 && (
        <div className="bg-wa-panel/60 p-2.5 rounded-xl border border-wa-border space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-wa-textPrimary flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-wa-green" /> Inspect Qubits from Active Message Signature:
            </span>
            <span className="text-wa-textSecondary font-mono">Qubit #{selectedQubitIndex} of 32</span>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {messageRecords.slice(0, 16).map((rec, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedQubitIndex(idx);
                  setIsCustomAngle(false);
                  setActiveState(rec.inputState);
                }}
                className={`px-2 py-1 rounded text-[10px] font-mono shrink-0 transition ${
                  selectedQubitIndex === idx && !isCustomAngle
                    ? 'bg-wa-green text-white font-bold shadow'
                    : 'bg-wa-surface border border-wa-border text-wa-textSecondary hover:text-wa-textPrimary'
                }`}
              >
                Q{idx}: {rec.inputState === '00' ? '|0⟩' : rec.inputState === '01' ? '|1⟩' : rec.inputState === '10' ? '|+⟩' : '|-⟩'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic 3D Bloch Spheres & Quantum State Fidelity Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center bg-wa-panel/40 p-4 rounded-2xl border border-wa-border">
        {/* Alice's Bloch Sphere (Source State) */}
        <div className="flex justify-center">
          <BlochSphere3D
            title="Alice's Input Qubit (q0)"
            subtitle={`Source State: ${currentStateInfo.name}`}
            theta={currentStateInfo.theta}
            phi={currentStateInfo.phi}
            isDestroyed={currentStageIndex >= 3}
            isCollapsed={currentStageIndex === 2}
            accentColor="#00f2fe"
          />
        </div>

        {/* Center: Fidelity Meter & Wavefunction Probabilities */}
        <div className="flex flex-col items-center justify-center p-3 bg-wa-bg rounded-xl border border-wa-border space-y-3.5 text-center">
          <div>
            <span className="text-[10px] font-bold text-wa-textSecondary uppercase tracking-wider block">
              Quantum State Overlap Fidelity
            </span>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className={`text-2xl font-mono font-black ${
                currentStageIndex < 4
                  ? 'text-amber-400'
                  : perturb
                  ? 'text-red-400'
                  : 'text-wa-green'
              }`}>
                F = {currentFidelity.toFixed(3)}
              </span>
              {currentStageIndex >= 4 && !perturb ? (
                <CheckCircle2 className="w-5 h-5 text-wa-green animate-pulse" />
              ) : perturb && currentStageIndex >= 4 ? (
                <AlertTriangle className="w-5 h-5 text-red-400 animate-bounce" />
              ) : null}
            </div>
            <span className="text-[10px] text-wa-textSecondary">
              {currentStageIndex < 4
                ? 'Teleportation in progress...'
                : perturb
                ? '⚠️ Fidelity degraded! Triggering QDS Threat Engine.'
                : '100% Perfect Quantum Reconstitution'}
            </span>
          </div>

          {/* Wavefunction Probabilities Gauge */}
          <div className="w-full space-y-2 text-left pt-2 border-t border-wa-border/60">
            <div>
              <div className="flex justify-between text-[10px] font-mono text-quantum-cyan mb-1">
                <span>P(|0⟩) = |α|²</span>
                <span className="font-bold">{(currentStateInfo.p0 * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full h-1.5 bg-wa-surface rounded-full overflow-hidden border border-wa-border">
                <div
                  className="h-full bg-quantum-cyan transition-all duration-300"
                  style={{ width: `${currentStateInfo.p0 * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[10px] font-mono text-quantum-purple mb-1">
                <span>P(|1⟩) = |β|²</span>
                <span className="font-bold">{(currentStateInfo.p1 * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full h-1.5 bg-wa-surface rounded-full overflow-hidden border border-wa-border">
                <div
                  className="h-full bg-quantum-purple transition-all duration-300"
                  style={{ width: `${currentStateInfo.p1 * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* State Formula */}
          <div className="px-2.5 py-1 bg-wa-surface rounded-lg border border-wa-border font-mono text-[10px] text-wa-textPrimary truncate max-w-full">
            {currentStateInfo.formula}
          </div>
        </div>

        {/* Bob's Bloch Sphere (Reconstructed State) */}
        <div className="flex justify-center">
          <BlochSphere3D
            title="Bob's Output Qubit (q2)"
            subtitle={bobProps.subtitle || "Reconstructed Qubit"}
            theta={bobProps.theta}
            phi={bobProps.phi}
            isCollapsed={bobProps.isCollapsed}
            isEntangled={bobProps.isEntangled}
            accentColor={bobProps.accentColor || "#00a884"}
          />
        </div>
      </div>

      {/* Interactive Precision SVG Quantum Circuit Diagram Canvas */}
      <div className="bg-wa-bg p-4 rounded-xl border border-wa-border relative overflow-x-auto shadow-inner">
        {/* Background Grid Accent */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#00f2fe_1px,transparent_1px)] [background-size:16px_16px]" />

        <svg viewBox="0 0 940 295" className="w-full min-w-[820px] h-auto font-mono select-none relative z-10">
          <defs>
            {/* Glow Filters */}
            <filter id="cyanGlow" x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="greenGlow" x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="purpleGlow" x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="amberGlow" x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="redGlow" x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Classical Feed-Forward Arrow Marker */}
            <marker id="arrowUp" viewBox="0 0 10 10" refX="5" refY="3" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 6 L 5 0 L 10 6 z" fill="#00f2fe" />
            </marker>
          </defs>

          {/* ================= STATIONS BOUNDARY REGIONS ================= */}
          {/* Alice Node (Transmitter) */}
          <rect
            x="135"
            y="16"
            width="445"
            height="182"
            rx="12"
            fill="#00f2fe"
            fillOpacity="0.02"
            stroke="#00f2fe"
            strokeOpacity="0.22"
            strokeDasharray="4 4"
          />
          <text x="145" y="32" fill="#00f2fe" fontSize="9.5" fontWeight="bold" letterSpacing="0.5">
            ALICE'S NODE (QDS TRANSMITTER)
          </text>

          {/* Bob Node (Receiver) */}
          <rect
            x="670"
            y="126"
            width="255"
            height="154"
            rx="12"
            fill="#00a884"
            fillOpacity="0.02"
            stroke="#00a884"
            strokeOpacity="0.22"
            strokeDasharray="4 4"
          />
          <text x="680" y="142" fill="#00a884" fontSize="9.5" fontWeight="bold" letterSpacing="0.5">
            BOB'S NODE (QDS RECEIVER)
          </text>

          {/* ================= ACTIVE STAGE HIGHLIGHT OVERLAY ================= */}
          {currentStageIndex === 0 && (
            <rect x="148" y="24" width="158" height="166" rx="8" fill="#00f2fe" fillOpacity="0.05" stroke="#00f2fe" strokeOpacity="0.35" />
          )}
          {currentStageIndex === 1 && (
            <rect x="316" y="24" width="160" height="114" rx="8" fill="#a855f7" fillOpacity="0.05" stroke="#a855f7" strokeOpacity="0.35" />
          )}
          {currentStageIndex === 2 && (
            <rect x="486" y="24" width="80" height="166" rx="8" fill="#fbbf24" fillOpacity="0.05" stroke="#fbbf24" strokeOpacity="0.35" />
          )}
          {currentStageIndex === 3 && (
            <rect x="572" y="222" width="96" height="48" rx="8" fill="#fbbf24" fillOpacity="0.08" stroke="#fbbf24" strokeOpacity="0.4" />
          )}
          {currentStageIndex === 4 && (
            <rect x="692" y="145" width="102" height="128" rx="8" fill="#00f2fe" fillOpacity="0.05" stroke="#00f2fe" strokeOpacity="0.35" />
          )}
          {currentStageIndex === 5 && (
            <rect x="802" y="145" width="112" height="128" rx="8" fill="#00a884" fillOpacity="0.05" stroke="#00a884" strokeOpacity="0.35" />
          )}

          {/* ================= HORIZONTAL WIRE TRACKS ================= */}
          {/* Wire 0 (q0): Active until measurement (X=520), then collapsed dashed wire */}
          <line
            x1="120"
            y1="62"
            x2="520"
            y2="62"
            stroke={currentStageIndex <= 2 ? '#00f2fe' : '#334155'}
            strokeWidth="1.6"
            strokeOpacity={currentStageIndex <= 2 ? 0.7 : 0.4}
          />
          <line
            x1="520"
            y1="62"
            x2="920"
            y2="62"
            stroke="#475569"
            strokeWidth="1.2"
            strokeDasharray="4 4"
            opacity={currentStageIndex >= 2 ? 0.6 : 0.25}
          />
          {currentStageIndex >= 2 && (
            <text x="730" y="58" textAnchor="middle" fill="#64748b" fontSize="8" fontStyle="italic">
              [No-Cloning: Original state destroyed]
            </text>
          )}

          {/* Wire 1 (q1): Active until measurement (X=520), then collapsed dashed wire */}
          <line
            x1="120"
            y1="118"
            x2="520"
            y2="118"
            stroke={currentStageIndex <= 2 ? '#00a884' : '#334155'}
            strokeWidth="1.6"
            strokeOpacity={currentStageIndex <= 2 ? 0.7 : 0.4}
          />
          <line
            x1="520"
            y1="118"
            x2="920"
            y2="118"
            stroke="#475569"
            strokeWidth="1.2"
            strokeDasharray="4 4"
            opacity={currentStageIndex >= 2 ? 0.6 : 0.25}
          />

          {/* Wire 2 (q2): Bob's continuous quantum wire */}
          <line
            x1="120"
            y1="174"
            x2="920"
            y2="174"
            stroke={currentStageIndex >= 4 ? '#00a884' : '#334155'}
            strokeWidth="1.8"
            strokeOpacity={currentStageIndex >= 4 ? 0.9 : 0.5}
          />

          {/* Classical Channel: Double dashed amber lines */}
          <line
            x1="520"
            y1="244"
            x2="740"
            y2="244"
            stroke="#fbbf24"
            strokeWidth="1.4"
            strokeDasharray="4 3"
            strokeOpacity={currentStageIndex >= 3 ? 0.9 : 0.3}
          />
          <line
            x1="520"
            y1="249"
            x2="740"
            y2="249"
            stroke="#fbbf24"
            strokeWidth="1.4"
            strokeDasharray="4 3"
            strokeOpacity={currentStageIndex >= 3 ? 0.9 : 0.3}
          />

          {/* ================= LEFT WIRE LABELS ================= */}
          {/* q0 Label */}
          <text x="118" y="58" textAnchor="end" fill="#00f2fe" fontWeight="bold" fontSize="11">
            q0 (Alice):
          </text>
          <text x="118" y="72" textAnchor="end" fill="#8696a0" fontSize="10">
            |ψ⟩ = {currentStateInfo.name}
          </text>

          {/* q1 Label */}
          <text x="118" y="114" textAnchor="end" fill="#ffffff" fontWeight="bold" fontSize="11">
            q1 (Bell A):
          </text>
          <text x="118" y="128" textAnchor="end" fill="#8696a0" fontSize="10">
            |0⟩
          </text>

          {/* q2 Label */}
          <text x="118" y="170" textAnchor="end" fill="#00a884" fontWeight="bold" fontSize="11">
            q2 (Bob):
          </text>
          <text x="118" y="184" textAnchor="end" fill="#8696a0" fontSize="10">
            |0⟩ → {currentStageIndex >= 5 ? currentStateInfo.name : 'Reconstructed'}
          </text>

          {/* Classical Link Label */}
          <text x="118" y="243" textAnchor="end" fill="#fbbf24" fontWeight="bold" fontSize="10">
            CLASSICAL LINK:
          </text>
          <text x="118" y="256" textAnchor="end" fill="#8696a0" fontSize="9">
            c = (c0, c1)
          </text>

          {/* ================= COLUMN 1: STATE PREP (q0) & BELL H (q1) ================= */}
          {/* State Prep Gate on q0 (X = 180) */}
          <g>
            <rect
              x="156"
              y="44"
              width="48"
              height="36"
              rx="8"
              fill="#202c33"
              stroke={currentStageIndex >= 0 ? '#00f2fe' : '#2a3942'}
              strokeWidth="2"
              filter={currentStageIndex === 0 ? 'url(#cyanGlow)' : undefined}
            />
            <text
              x="180"
              y="67"
              textAnchor="middle"
              fill={currentStageIndex >= 0 ? '#00f2fe' : '#8696a0'}
              fontWeight="bold"
              fontSize="12.5"
            >
              {currentStateInfo.name}
            </text>
          </g>

          {/* Bell Hadamard on q1 (X = 180) */}
          <g>
            <rect
              x="162"
              y="100"
              width="36"
              height="36"
              rx="8"
              fill="#202c33"
              stroke={currentStageIndex >= 0 ? '#00a884' : '#2a3942'}
              strokeWidth="2"
              filter={currentStageIndex === 0 ? 'url(#greenGlow)' : undefined}
            />
            <text
              x="180"
              y="123"
              textAnchor="middle"
              fill={currentStageIndex >= 0 ? '#00a884' : '#8696a0'}
              fontWeight="bold"
              fontSize="13"
            >
              H
            </text>
          </g>

          {/* ================= COLUMN 2: BELL EPR CNOT (q1 -> q2) ================= */}
          {/* Solid Vertical Connector between q1 and q2 (X = 260) */}
          <line
            x1="260"
            y1="118"
            x2="260"
            y2="174"
            stroke={currentStageIndex >= 0 ? '#00a884' : '#2a3942'}
            strokeWidth="2.5"
          />
          {/* Control on q1 */}
          <circle
            cx="260"
            cy="118"
            r="5.5"
            fill={currentStageIndex >= 0 ? '#00a884' : '#64748b'}
            filter={currentStageIndex === 0 ? 'url(#greenGlow)' : undefined}
          />
          {/* Target on q2 (circle with cross) */}
          <circle
            cx="260"
            cy="174"
            r="11"
            fill="#111b21"
            stroke={currentStageIndex >= 0 ? '#00a884' : '#2a3942'}
            strokeWidth="2"
            filter={currentStageIndex === 0 ? 'url(#greenGlow)' : undefined}
          />
          <line x1="260" y1="163" x2="260" y2="185" stroke={currentStageIndex >= 0 ? '#00a884' : '#2a3942'} strokeWidth="2" />
          <line x1="249" y1="174" x2="271" y2="174" stroke={currentStageIndex >= 0 ? '#00a884' : '#2a3942'} strokeWidth="2" />
          <text
            x="260"
            y="198"
            textAnchor="middle"
            fill={currentStageIndex >= 0 ? '#00a884' : '#64748b'}
            fontSize="8.5"
            fontWeight="bold"
          >
            |Φ⁺⟩ Bell Pair
          </text>

          {/* ================= COLUMN 3: ALICE BELL CNOT (q0 -> q1) ================= */}
          {/* Solid Vertical Connector between q0 and q1 (X = 360) */}
          <line
            x1="360"
            y1="62"
            x2="360"
            y2="118"
            stroke={currentStageIndex >= 1 ? '#a855f7' : '#2a3942'}
            strokeWidth="2.5"
          />
          {/* Control on q0 */}
          <circle
            cx="360"
            cy="62"
            r="5.5"
            fill={currentStageIndex >= 1 ? '#a855f7' : '#64748b'}
            filter={currentStageIndex === 1 ? 'url(#purpleGlow)' : undefined}
          />
          {/* Target on q1 */}
          <circle
            cx="360"
            cy="118"
            r="11"
            fill="#111b21"
            stroke={currentStageIndex >= 1 ? '#a855f7' : '#2a3942'}
            strokeWidth="2"
            filter={currentStageIndex === 1 ? 'url(#purpleGlow)' : undefined}
          />
          <line x1="360" y1="107" x2="360" y2="129" stroke={currentStageIndex >= 1 ? '#a855f7' : '#2a3942'} strokeWidth="2" />
          <line x1="349" y1="118" x2="371" y2="118" stroke={currentStageIndex >= 1 ? '#a855f7' : '#2a3942'} strokeWidth="2" />

          {/* ================= COLUMN 4: ALICE HADAMARD (H on q0) ================= */}
          <g>
            <rect
              x="422"
              y="44"
              width="36"
              height="36"
              rx="8"
              fill="#202c33"
              stroke={currentStageIndex >= 1 ? '#a855f7' : '#2a3942'}
              strokeWidth="2"
              filter={currentStageIndex === 1 ? 'url(#purpleGlow)' : undefined}
            />
            <text
              x="440"
              y="67"
              textAnchor="middle"
              fill={currentStageIndex >= 1 ? '#a855f7' : '#8696a0'}
              fontWeight="bold"
              fontSize="13"
            >
              H
            </text>
          </g>

          {/* ================= COLUMN 5: ALICE MEASUREMENTS (M on q0, q1) ================= */}
          {/* Measurement Gate on q0 (X = 520) */}
          <g>
            <rect
              x="502"
              y="44"
              width="36"
              height="36"
              rx="8"
              fill="#202c33"
              stroke={currentStageIndex >= 2 ? '#fbbf24' : '#2a3942'}
              strokeWidth="2"
              filter={currentStageIndex === 2 ? 'url(#amberGlow)' : undefined}
            />
            <path
              d="M 510 70 A 10 10 0 0 1 530 70"
              fill="none"
              stroke={currentStageIndex >= 2 ? '#fbbf24' : '#8696a0'}
              strokeWidth="1.5"
            />
            <line
              x1="520"
              y1="70"
              x2="526"
              y2="58"
              stroke={currentStageIndex >= 2 ? '#fbbf24' : '#8696a0'}
              strokeWidth="1.5"
            />
            <text
              x="520"
              y="37"
              textAnchor="middle"
              fill={currentStageIndex >= 2 ? '#fbbf24' : '#64748b'}
              fontSize="9.5"
              fontWeight="bold"
            >
              c0 = {currentStageIndex >= 2 ? c0 : '?'}
            </text>
          </g>

          {/* Measurement Gate on q1 (X = 520) */}
          <g>
            <rect
              x="502"
              y="100"
              width="36"
              height="36"
              rx="8"
              fill="#202c33"
              stroke={currentStageIndex >= 2 ? '#fbbf24' : '#2a3942'}
              strokeWidth="2"
              filter={currentStageIndex === 2 ? 'url(#amberGlow)' : undefined}
            />
            <path
              d="M 510 126 A 10 10 0 0 1 530 126"
              fill="none"
              stroke={currentStageIndex >= 2 ? '#fbbf24' : '#8696a0'}
              strokeWidth="1.5"
            />
            <line
              x1="520"
              y1="126"
              x2="526"
              y2="114"
              stroke={currentStageIndex >= 2 ? '#fbbf24' : '#8696a0'}
              strokeWidth="1.5"
            />
            <text
              x="520"
              y="93"
              textAnchor="middle"
              fill={currentStageIndex >= 2 ? '#fbbf24' : '#64748b'}
              fontSize="9.5"
              fontWeight="bold"
            >
              c1 = {currentStageIndex >= 2 ? c1 : '?'}
            </text>
          </g>

          {/* Classical Vertical Feed Lines down to Classical Bus */}
          <line
            x1="517"
            y1="80"
            x2="517"
            y2="244"
            stroke="#fbbf24"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            opacity={currentStageIndex >= 2 ? 0.85 : 0.2}
          />
          <line
            x1="523"
            y1="136"
            x2="523"
            y2="249"
            stroke="#fbbf24"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            opacity={currentStageIndex >= 2 ? 0.85 : 0.2}
          />

          {/* ================= COLUMN 6: CLASSICAL CHANNEL FEED-FORWARD ================= */}
          {currentStageIndex >= 3 ? (
            <g filter="url(#amberGlow)">
              <rect x="568" y="234" width="104" height="24" rx="12" fill="#fbbf24" fillOpacity="0.18" stroke="#fbbf24" strokeWidth="1.5" />
              <text x="620" y="250" textAnchor="middle" fill="#fbbf24" fontWeight="bold" fontSize="10">
                c = [{c0}, {c1}] → Bob
              </text>
            </g>
          ) : (
            <text x="620" y="250" textAnchor="middle" fill="#64748b" fontSize="8.5">
              Classical Link
            </text>
          )}

          {/* ================= COLUMN 7: BOB PAULI FEED-FORWARD GATE ================= */}
          {/* Feed-forward arrow rising from classical bus into Bob's gate */}
          <line
            x1="740"
            y1="244"
            x2="740"
            y2="198"
            stroke={currentStageIndex >= 4 ? '#00f2fe' : '#475569'}
            strokeWidth="1.8"
            strokeDasharray="3 3"
            opacity={currentStageIndex >= 4 ? 1 : 0.3}
            markerEnd="url(#arrowUp)"
          />

          {/* Bob Pauli Gate on q2 (X = 740) */}
          <g>
            <rect
              x="712"
              y="152"
              width="56"
              height="42"
              rx="9"
              fill="#202c33"
              stroke={currentStageIndex >= 4 ? '#00f2fe' : '#2a3942'}
              strokeWidth="2.5"
              filter={currentStageIndex === 4 ? 'url(#cyanGlow)' : undefined}
            />
            <text
              x="740"
              y="174"
              textAnchor="middle"
              fill={currentStageIndex >= 4 ? '#00f2fe' : '#8696a0'}
              fontWeight="bold"
              fontSize="13.5"
            >
              {currentStageIndex >= 4 ? corrApplied : 'Zᶜ⁰Xᶜ¹'}
            </text>
            <text x="740" y="188" textAnchor="middle" fill="#8696a0" fontSize="8">
              Pauli Gate
            </text>
          </g>

          {/* ================= COLUMN 8: BOB VERIFICATION & MATCH ================= */}
          {/* Verification Gate on q2 (X = 855) */}
          <g>
            <rect
              x="827"
              y="152"
              width="56"
              height="42"
              rx="9"
              fill="#202c33"
              stroke={currentStageIndex >= 5 ? (perturb ? '#f87171' : '#00a884') : '#2a3942'}
              strokeWidth="2.5"
              filter={currentStageIndex === 5 ? (perturb ? 'url(#redGlow)' : 'url(#greenGlow)') : undefined}
            />
            <text
              x="855"
              y="173"
              textAnchor="middle"
              fill={currentStageIndex >= 5 ? (perturb ? '#f87171' : '#00a884') : '#8696a0'}
              fontWeight="bold"
              fontSize="12.5"
            >
              M_{basis}
            </text>
            <text x="855" y="188" textAnchor="middle" fill="#8696a0" fontSize="8">
              {currentStateInfo.name}
            </text>
          </g>

          {/* Output State Badge below wire at X = 855 */}
          {currentStageIndex >= 5 && (
            perturb ? (
              <g filter="url(#redGlow)">
                <rect x="805" y="206" width="100" height="22" rx="6" fill="#f87171" fillOpacity="0.18" stroke="#f87171" strokeWidth="1.2" />
                <text x="855" y="221" textAnchor="middle" fill="#f87171" fontWeight="bold" fontSize="9.5">
                  ⚠️ ERROR (Eve)
                </text>
              </g>
            ) : (
              <g filter="url(#greenGlow)">
                <rect x="805" y="206" width="100" height="22" rx="6" fill="#00a884" fillOpacity="0.18" stroke="#00a884" strokeWidth="1.2" />
                <text x="855" y="221" textAnchor="middle" fill="#00a884" fontWeight="bold" fontSize="9.5">
                  ✓ MATCH (100%)
                </text>
              </g>
            )
          )}
        </svg>

        {/* Circuit Diagram Legend */}
        <div className="mt-3 pt-3 border-t border-wa-border/60 flex flex-wrap items-center justify-between gap-2 text-[10px] text-wa-textSecondary font-mono">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1 text-quantum-cyan">
              <span className="w-2.5 h-2.5 rounded bg-quantum-cyan/20 border border-quantum-cyan inline-block" /> |ψ⟩ Input State
            </span>
            <span className="flex items-center gap-1 text-wa-green">
              <span className="w-2 h-2 rounded-full bg-wa-green inline-block" />—⊕ EPR Entanglement
            </span>
            <span className="flex items-center gap-1 text-quantum-purple">
              <span className="w-2.5 h-2.5 rounded bg-quantum-purple/20 border border-quantum-purple inline-block" /> [H] & CNOT Bell Rotation
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <span className="w-2.5 h-2.5 rounded bg-amber-400/20 border border-amber-400 inline-block" /> [M] Bell Measurement
            </span>
            <span className="flex items-center gap-1 text-amber-300">
              <span className="inline-block border-b-2 border-dashed border-amber-400 w-3" /> Classical Link c=(c0,c1)
            </span>
            <span className="flex items-center gap-1 text-quantum-cyan">
              <span className="w-2.5 h-2.5 rounded bg-quantum-cyan/20 border border-quantum-cyan inline-block" /> [Z/X] Bob Pauli Correction
            </span>
          </div>
          <span className="text-[9.5px] opacity-70">Bennett et al. (1993) Teleportation Standard</span>
        </div>
      </div>

      {/* Playback Controls & Speed Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 bg-wa-panel rounded-xl border border-wa-border">
        {/* Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePlayPause}
            className="px-4 py-2 bg-wa-green hover:bg-wa-greenHover text-white font-bold rounded-lg transition flex items-center gap-1.5 shadow"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? 'Pause' : 'Run Dynamic Simulation'}
          </button>

          <button
            onClick={handleReset}
            title="Reset Simulation"
            className="p-2 bg-wa-surface hover:bg-wa-hover text-wa-textSecondary hover:text-wa-textPrimary rounded-lg border border-wa-border transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handlePrev}
            disabled={currentStageIndex <= 0}
            title="Previous Step"
            className="p-2 bg-wa-surface hover:bg-wa-hover text-wa-textSecondary hover:text-wa-textPrimary rounded-lg border border-wa-border transition disabled:opacity-30"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={handleNext}
            disabled={currentStageIndex >= stages.length - 1}
            title="Next Step"
            className="p-2 bg-wa-surface hover:bg-wa-hover text-wa-textSecondary hover:text-wa-textPrimary rounded-lg border border-wa-border transition disabled:opacity-30"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Speed Controls ("take time to show") */}
        <div className="flex items-center space-x-2 text-[11px]">
          <span className="text-wa-textSecondary">Simulation Speed:</span>
          <button
            onClick={() => setSpeed(2000)}
            className={`px-2.5 py-1 rounded font-semibold transition ${
              speed === 2000
                ? 'bg-quantum-cyan/20 text-quantum-cyan border border-quantum-cyan/40'
                : 'bg-wa-surface text-wa-textSecondary hover:text-wa-textPrimary'
            }`}
          >
            Slow (2s)
          </button>
          <button
            onClick={() => setSpeed(1200)}
            className={`px-2.5 py-1 rounded font-semibold transition ${
              speed === 1200
                ? 'bg-quantum-cyan/20 text-quantum-cyan border border-quantum-cyan/40'
                : 'bg-wa-surface text-wa-textSecondary hover:text-wa-textPrimary'
            }`}
          >
            Normal (1.2s)
          </button>
          <button
            onClick={() => setSpeed(600)}
            className={`px-2.5 py-1 rounded font-semibold transition ${
              speed === 600
                ? 'bg-quantum-cyan/20 text-quantum-cyan border border-quantum-cyan/40'
                : 'bg-wa-surface text-wa-textSecondary hover:text-wa-textPrimary'
            }`}
          >
            Fast (0.6s)
          </button>
        </div>
      </div>

      {/* Progressive Stage Stepper Bar */}
      <div className="grid grid-cols-6 gap-1.5 font-mono text-[10px]">
        {stages.map((st, i) => (
          <button
            key={i}
            onClick={() => { setCurrentStageIndex(i); setIsPlaying(false); }}
            className={`p-2 rounded border text-center transition ${
              currentStageIndex === i
                ? 'bg-wa-green/20 border-wa-green text-wa-green font-bold shadow'
                : currentStageIndex > i
                ? 'bg-wa-panel border-wa-green/40 text-wa-green'
                : 'bg-wa-panel border-wa-border text-wa-textSecondary hover:text-wa-textPrimary'
            }`}
          >
            <span className="block font-semibold">Stage {i + 1}</span>
            <span className="truncate block text-[9px] opacity-80">{st.title.split(':')[1] || st.title}</span>
          </button>
        ))}
      </div>

      {/* Current Stage Detailed Explanation Card */}
      <div className="p-4 bg-wa-panel rounded-xl border border-wa-border space-y-3 animate-in fade-in">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-wa-textPrimary flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-wa-green/20 border border-wa-green/50 text-wa-green flex items-center justify-center text-[10px]">
              {currentStageIndex + 1}
            </span>
            {currentStage.title}
          </h4>

          {simulationData?.classicalBits && (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-400/30">
              Alice's Bits: c0,c1 = {simulationData.classicalBits} → Bob Gate: {simulationData.correctionApplied}
            </span>
          )}
        </div>

        <p className="text-xs text-wa-textPrimary leading-relaxed">
          {currentStage.description}
        </p>

        {/* Statevector Mathematical Formulation */}
        <div className="p-3 bg-wa-bg rounded-lg border border-wa-border font-mono text-[11px] text-quantum-cyan">
          <span className="text-wa-textSecondary text-[10px] uppercase font-bold block mb-1">Mathematical State:</span>
          {currentStage.statevectorDescription}
        </div>

        {/* Qubit States Breakdown Grid */}
        <div className="grid grid-cols-3 gap-2 font-mono text-[11px] pt-1">
          <div className="p-2 bg-wa-surface rounded border border-wa-border">
            <span className="text-[10px] text-wa-textSecondary block">q0 (Alice's QDS)</span>
            <span className="font-bold text-wa-textPrimary">{currentStage.qubitStates?.q0}</span>
          </div>
          <div className="p-2 bg-wa-surface rounded border border-wa-border">
            <span className="text-[10px] text-wa-textSecondary block">q1 (Alice's Bell)</span>
            <span className="font-bold text-wa-textPrimary">{currentStage.qubitStates?.q1}</span>
          </div>
          <div className="p-2 bg-wa-surface rounded border border-wa-border">
            <span className="text-[10px] text-wa-textSecondary block">q2 (Bob's Reconstructed)</span>
            <span className="font-bold text-wa-green">{currentStage.qubitStates?.q2}</span>
          </div>
        </div>
      </div>

      {/* Pauli Correction Lookup Table Explanation */}
      <div className="p-3.5 bg-wa-panel/60 rounded-xl border border-wa-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-wa-textPrimary flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-quantum-cyan" /> Deterministic Pauli Correction Rule Table (Section 5.3):
          </span>
          <span className="text-[10px] text-wa-textSecondary">Standard Quantum Teleportation Protocol</span>
        </div>

        <div className="grid grid-cols-4 gap-2 font-mono text-center text-xs">
          {[
            { outcome: '00', gate: 'I (Identity)', desc: 'No flip required' },
            { outcome: '01', gate: 'X (Bit Flip)', desc: 'Flips |0⟩ ↔ |1⟩' },
            { outcome: '10', gate: 'Z (Phase Flip)', desc: 'Flips sign of |1⟩' },
            { outcome: '11', gate: 'XZ (Both)', desc: 'Bit flip + Phase flip' }
          ].map((row) => (
            <div
              key={row.outcome}
              className={`p-2 rounded border transition ${
                simulationData?.classicalBits === row.outcome
                  ? 'bg-quantum-cyan/20 border-quantum-cyan text-quantum-cyan font-bold shadow-[0_0_10px_rgba(0,242,254,0.3)]'
                  : 'bg-wa-surface border-wa-border text-wa-textSecondary'
              }`}
            >
              <div className="text-amber-400 font-bold">{row.outcome}</div>
              <div className="text-wa-textPrimary my-0.5">{row.gate}</div>
              <div className="text-[9px] text-wa-textSecondary">{row.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

