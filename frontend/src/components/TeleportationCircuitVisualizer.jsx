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
  Info
} from 'lucide-react';
import api from '../api';

export default function TeleportationCircuitVisualizer({
  latestMessage,
  selectedState = '10',
  onClose
}) {
  const [activeState, setActiveState] = useState(selectedState || '10');
  const [selectedQubitIndex, setSelectedQubitIndex] = useState(0);
  const [perturb, setPerturb] = useState(false);
  const [speed, setSpeed] = useState(1500); // 1.5s per step ("taking time to show")
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [simulationData, setSimulationData] = useState(null);
  const [loading, setLoading] = useState(false);

  const timerRef = useRef(null);

  // If a message with signature records is passed, allow selecting its qubits
  const messageRecords = latestMessage?.signatureMeta?.teleportationRecords || [];

  // Fetch or recompute simulation steps
  const fetchSimulationSteps = async (stateLabel, isPerturbed) => {
    setLoading(true);
    try {
      const res = await api.post('/security/teleport/simulate-steps', {
        stateLabel: stateLabel,
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
  }, [activeState, perturb]);

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

  const stateLabels = [
    { id: '00', name: '|0⟩', desc: 'Computational Zero (Pauli Z)' },
    { id: '01', name: '|1⟩', desc: 'Computational One (Pauli Z)' },
    { id: '10', name: '|+⟩', desc: 'Hadamard Plus (Pauli X)' },
    { id: '11', name: '|-⟩', desc: 'Hadamard Minus (Pauli X)' }
  ];

  return (
    <div className="bg-wa-surface p-5 rounded-xl border border-wa-border shadow-2xl space-y-6 text-xs select-none">
      {/* Visualizer Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-wa-border">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-quantum-cyan animate-pulse" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              Dynamic 3-Qubit Quantum Teleportation Simulator
            </h3>
          </div>
          <p className="text-[11px] text-wa-textSecondary mt-0.5">
            Step-by-step Qiskit circuit execution transferring signature Pauli eigenstates with Pauli correction.
          </p>
        </div>

        {/* Input State Selector */}
        <div className="flex items-center gap-2">
          <span className="text-wa-textSecondary text-[11px] font-semibold">Input |&psi;&rang;:</span>
          <div className="flex rounded-lg bg-wa-panel border border-wa-border p-0.5">
            {stateLabels.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveState(s.id)}
                className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition ${
                  activeState === s.id
                    ? 'bg-quantum-cyan/20 text-quantum-cyan border border-quantum-cyan/50'
                    : 'text-wa-textSecondary hover:text-white'
                }`}
                title={s.desc}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Message Qubit Selection Pill Bar (if message records exist) */}
      {messageRecords.length > 0 && (
        <div className="bg-wa-panel/80 p-3 rounded-lg border border-wa-border space-y-2">
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
                  setActiveState(rec.inputState);
                }}
                className={`px-2 py-1 rounded text-[10px] font-mono shrink-0 transition ${
                  selectedQubitIndex === idx
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
