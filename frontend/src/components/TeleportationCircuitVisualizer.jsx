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
        <span className="text-[11px] font-bold text-white block truncate">{title}</span>
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

  return (
    <div className="bg-wa-surface p-5 rounded-2xl border border-wa-border shadow-2xl space-y-5 text-xs select-none animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-wa-border">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-quantum-cyan animate-pulse" />
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
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
          <span className="text-white font-semibold flex items-center gap-1.5 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-quantum-cyan" /> Choose Input State |&psi;&rang; to Teleport:
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
                    : 'bg-wa-surface border border-wa-border text-wa-textSecondary hover:text-white'
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
                  : 'bg-wa-surface border border-wa-border text-wa-textSecondary hover:text-white'
              }`}
            >
              <Sliders className="w-3 h-3" />
              <span>Custom &theta;</span>
            </button>
          </div>
        </div>

        {/* Custom Angle Slider Drawer */}
        {isCustomAngle && (
          <div className="pt-2 border-t border-wa-border/60 flex flex-col sm:flex-row items-center gap-3 animate-in slide-in-from-top-1 text-[11px]">
            <span className="text-quantum-purple font-mono font-semibold">
              Superposition Angle &theta; = {customThetaDeg}&deg; ({(customThetaDeg * Math.PI / 180).toFixed(2)} rad)
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
              cos({customThetaDeg / 2}&deg;)|0⟩ + sin({customThetaDeg / 2}&deg;)|1⟩
            </span>
          </div>
        )}
      </div>

      {/* Message Qubit Selection Pill Bar (if message records exist) */}
      {messageRecords.length > 0 && (
        <div className="bg-wa-panel/60 p-2.5 rounded-xl border border-wa-border space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-white flex items-center gap-1.5">
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
                    : 'bg-wa-surface border border-wa-border text-wa-textSecondary hover:text-white'
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
                <span>P(|0⟩) = |&alpha;|&sup2;</span>
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
                <span>P(|1⟩) = |&beta;|&sup2;</span>
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
          <div className="px-2.5 py-1 bg-wa-surface rounded-lg border border-wa-border font-mono text-[10px] text-white/90 truncate max-w-full">
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

      {/* Interactive Circuit Diagram Canvas */}
      <div className="bg-wa-bg p-5 rounded-xl border border-wa-border relative overflow-hidden">
        {/* Background Grid Accent */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#00f2fe_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Circuit Tracks Container */}
        <div className="space-y-6 relative z-10 font-mono text-[11px]">
          {/* Wire 0: Alice's Signature State q0 */}
          <div className="flex items-center space-x-3">
            <div className="w-24 text-right shrink-0">
              <span className="font-bold text-quantum-cyan">q0 (Alice):</span>
              <span className="text-[10px] text-wa-textSecondary block">|&psi;&rang; = {simulationData?.stateInfo?.label || '|10⟩'}</span>
            </div>

            {/* Wire Line with Gates */}
            <div className="flex-1 h-0.5 bg-wa-border relative flex items-center justify-between px-4">
              {/* Gate: State Preparation */}
              <div
                className={`w-12 h-9 rounded bg-wa-panel border flex items-center justify-center font-bold transition-all duration-300 ${
                  currentStageIndex >= 0
                    ? 'border-quantum-cyan text-quantum-cyan shadow-[0_0_12px_rgba(0,242,254,0.4)]'
                    : 'border-wa-border text-wa-textSecondary opacity-40'
                }`}
              >
                {simulationData?.stateInfo?.label || '|&psi;&rang;'}
              </div>

              {/* Wire spacer */}
              <div className="w-10" />

              {/* Alice CNOT Control */}
              <div
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                  currentStageIndex >= 1
                    ? 'border-quantum-purple bg-quantum-purple shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                    : 'border-wa-border bg-wa-surface opacity-40'
                }`}
              />

              {/* Alice Hadamard */}
              <div
                className={`w-9 h-9 rounded bg-wa-panel border flex items-center justify-center font-bold transition-all duration-300 ${
                  currentStageIndex >= 1
                    ? 'border-quantum-purple text-quantum-purple shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                    : 'border-wa-border text-wa-textSecondary opacity-40'
                }`}
              >
                H
              </div>

              {/* Alice Measurement */}
              <div
                className={`w-10 h-9 rounded bg-wa-panel border flex items-center justify-center font-bold transition-all duration-300 ${
                  currentStageIndex >= 2
                    ? 'border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                    : 'border-wa-border text-wa-textSecondary opacity-40'
                }`}
              >
                M
              </div>

              {/* Consumed / Collapsed Wire */}
              <div className="w-16 text-center">
                {currentStageIndex >= 2 ? (
                  <span className="text-[10px] text-amber-400 font-bold animate-pulse">
                    c0 = {simulationData?.classicalBits?.[0] || '1'}
                  </span>
                ) : (
                  <span className="text-[9px] text-wa-textSecondary">&mdash;</span>
                )}
              </div>
            </div>
          </div>

          {/* Wire 1: Alice's Bell Qubit q1 */}
          <div className="flex items-center space-x-3">
            <div className="w-24 text-right shrink-0">
              <span className="font-bold text-white">q1 (Bell A):</span>
              <span className="text-[10px] text-wa-textSecondary block">|0&rang;</span>
            </div>

            <div className="flex-1 h-0.5 bg-wa-border relative flex items-center justify-between px-4">
              {/* Bell Hadamard on q1 */}
              <div
                className={`w-9 h-9 rounded bg-wa-panel border flex items-center justify-center font-bold transition-all duration-300 ${
                  currentStageIndex >= 0
                    ? 'border-wa-green text-wa-green shadow-[0_0_12px_rgba(0,168,132,0.4)]'
                    : 'border-wa-border text-wa-textSecondary opacity-40'
                }`}
              >
                H
              </div>

              {/* Bell CNOT Control to q2 */}
              <div
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                  currentStageIndex >= 0
                    ? 'border-wa-green bg-wa-green shadow-[0_0_10px_rgba(0,168,132,0.5)]'
                    : 'border-wa-border bg-wa-surface opacity-40'
                }`}
              />

              {/* Alice CNOT Target from q0 */}
              <div
                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center font-bold transition-all duration-300 ${
                  currentStageIndex >= 1
                    ? 'border-quantum-purple text-quantum-purple shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                    : 'border-wa-border text-wa-textSecondary opacity-40'
                }`}
              >
                &oplus;
              </div>

              {/* Spacer */}
              <div className="w-9" />

              {/* Alice Measurement on q1 */}
              <div
                className={`w-10 h-9 rounded bg-wa-panel border flex items-center justify-center font-bold transition-all duration-300 ${
                  currentStageIndex >= 2
                    ? 'border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                    : 'border-wa-border text-wa-textSecondary opacity-40'
                }`}
              >
                M
              </div>

              {/* Consumed / Collapsed Wire */}
              <div className="w-16 text-center">
                {currentStageIndex >= 2 ? (
                  <span className="text-[10px] text-amber-400 font-bold animate-pulse">
                    c1 = {simulationData?.classicalBits?.[1] || '0'}
                  </span>
                ) : (
                  <span className="text-[9px] text-wa-textSecondary">&mdash;</span>
                )}
              </div>
            </div>
          </div>

          {/* Classical Double Channel Line */}
          <div className="flex items-center space-x-3 py-1">
            <div className="w-24 text-right shrink-0">
              <span className="font-bold text-amber-400 text-[10px] uppercase">Classical Link:</span>
              <span className="text-[9px] text-wa-textSecondary block">c = (c0, c1)</span>
            </div>

            <div className="flex-1 h-1.5 border-y border-dashed border-amber-500/40 relative flex items-center justify-center px-4">
              {currentStageIndex >= 3 && (
                <div className="px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/50 text-[10px] font-bold animate-pulse flex items-center gap-1.5 shadow-md">
                  <Radio className="w-3 h-3" /> Transmitting Classical Bits: [{simulationData?.classicalBits}] &rarr; Bob
                </div>
              )}
            </div>
          </div>

          {/* Wire 2: Bob's Bell Qubit q2 */}
          <div className="flex items-center space-x-3">
            <div className="w-24 text-right shrink-0">
              <span className="font-bold text-wa-green">q2 (Bob):</span>
              <span className="text-[10px] text-wa-textSecondary block">|0&rang; &rarr; Reconstructed</span>
            </div>

            <div className="flex-1 h-0.5 bg-wa-border relative flex items-center justify-between px-4">
              {/* Spacer */}
              <div className="w-9" />

              {/* Bell CNOT Target from q1 */}
              <div
                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center font-bold transition-all duration-300 ${
                  currentStageIndex >= 0
                    ? 'border-wa-green text-wa-green shadow-[0_0_10px_rgba(0,168,132,0.5)]'
                    : 'border-wa-border text-wa-textSecondary opacity-40'
                }`}
              >
                &oplus;
              </div>

              {/* Space during Alice operations */}
              <div className="w-16" />

              {/* Bob Pauli Correction Gate */}
              <div
                className={`w-12 h-9 rounded bg-wa-panel border flex items-center justify-center font-bold transition-all duration-300 ${
                  currentStageIndex >= 4
                    ? 'border-quantum-cyan text-quantum-cyan shadow-[0_0_14px_rgba(0,242,254,0.5)] scale-105'
                    : 'border-wa-border text-wa-textSecondary opacity-40'
                }`}
              >
                {simulationData?.correctionApplied || 'XZ'}
              </div>

              {/* Bob Verification Measurement in matching basis */}
              <div
                className={`w-14 h-9 rounded bg-wa-panel border flex items-center justify-center font-bold transition-all duration-300 ${
                  currentStageIndex >= 5
                    ? 'border-wa-green text-wa-green shadow-[0_0_14px_rgba(0,168,132,0.6)]'
                    : 'border-wa-border text-wa-textSecondary opacity-40'
                }`}
              >
                M_{simulationData?.basis || 'Z'}
              </div>

              {/* Final State Output */}
              <div className="w-16 text-center">
                {currentStageIndex >= 5 ? (
                  <span className="text-[10px] text-wa-green font-bold flex items-center justify-center gap-0.5 animate-bounce">
                    <CheckCircle2 className="w-3 h-3" /> MATCH
                  </span>
                ) : (
                  <span className="text-[9px] text-wa-textSecondary">&mdash;</span>
                )}
              </div>
            </div>
          </div>
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
            className="p-2 bg-wa-surface hover:bg-wa-hover text-wa-textSecondary hover:text-white rounded-lg border border-wa-border transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handlePrev}
            disabled={currentStageIndex <= 0}
            title="Previous Step"
            className="p-2 bg-wa-surface hover:bg-wa-hover text-wa-textSecondary hover:text-white rounded-lg border border-wa-border transition disabled:opacity-30"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={handleNext}
            disabled={currentStageIndex >= stages.length - 1}
            title="Next Step"
            className="p-2 bg-wa-surface hover:bg-wa-hover text-wa-textSecondary hover:text-white rounded-lg border border-wa-border transition disabled:opacity-30"
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
                : 'bg-wa-surface text-wa-textSecondary hover:text-white'
            }`}
          >
            Slow (2s)
          </button>
          <button
            onClick={() => setSpeed(1200)}
            className={`px-2.5 py-1 rounded font-semibold transition ${
              speed === 1200
                ? 'bg-quantum-cyan/20 text-quantum-cyan border border-quantum-cyan/40'
                : 'bg-wa-surface text-wa-textSecondary hover:text-white'
            }`}
          >
            Normal (1.2s)
          </button>
          <button
            onClick={() => setSpeed(600)}
            className={`px-2.5 py-1 rounded font-semibold transition ${
              speed === 600
                ? 'bg-quantum-cyan/20 text-quantum-cyan border border-quantum-cyan/40'
                : 'bg-wa-surface text-wa-textSecondary hover:text-white'
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
                ? 'bg-wa-green/20 border-wa-green text-white font-bold shadow'
                : currentStageIndex > i
                ? 'bg-wa-panel border-wa-green/40 text-wa-green'
                : 'bg-wa-panel border-wa-border text-wa-textSecondary hover:text-white'
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
          <h4 className="text-xs font-bold text-white flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-wa-green/20 border border-wa-green/50 text-wa-green flex items-center justify-center text-[10px]">
              {currentStageIndex + 1}
            </span>
            {currentStage.title}
          </h4>

          {simulationData?.classicalBits && (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-400/30">
              Alice's Bits: c0,c1 = {simulationData.classicalBits} &rarr; Bob Gate: {simulationData.correctionApplied}
            </span>
          )}
        </div>

        <p className="text-xs text-white/90 leading-relaxed">
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
            <span className="font-bold text-white">{currentStage.qubitStates?.q0}</span>
          </div>
          <div className="p-2 bg-wa-surface rounded border border-wa-border">
            <span className="text-[10px] text-wa-textSecondary block">q1 (Alice's Bell)</span>
            <span className="font-bold text-white">{currentStage.qubitStates?.q1}</span>
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
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
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
                  ? 'bg-quantum-cyan/20 border-quantum-cyan text-white font-bold shadow-[0_0_10px_rgba(0,242,254,0.3)]'
                  : 'bg-wa-surface border-wa-border text-wa-textSecondary'
              }`}
            >
              <div className="text-amber-400 font-bold">{row.outcome}</div>
              <div className="text-white my-0.5">{row.gate}</div>
              <div className="text-[9px] text-wa-textSecondary">{row.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

