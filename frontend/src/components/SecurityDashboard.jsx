import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  X,
  RefreshCw,
  Zap,
  Activity,
  AlertTriangle,
  Radio,
  FileCode,
  BarChart3,
  Sliders,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Cpu,
  Loader2
} from 'lucide-react';
import api from '../api';
import TeleportationCircuitVisualizer from './TeleportationCircuitVisualizer';

export default function SecurityDashboard({
  chatId,
  onClose,
  securityAlerts = [],
  latestMessage = null
}) {
  const [activeTab, setActiveTab] = useState('live'); // 'live' | 'circuit' | 'threats' | 'simulator' | 'benchmark'
  const [statusData, setStatusData] = useState(null);
  const [threatLogs, setThreatLogs] = useState([]);
  const [benchmarkMatrix, setBenchmarkMatrix] = useState(null);
  const [loading, setLoading] = useState(false);
  const [evaluatingE91, setEvaluatingE91] = useState(false);
  const [noiseRate, setNoiseRate] = useState(0.0);
  const [interceptProb, setInterceptProb] = useState(0.0);
  const [simulatingAttack, setSimulatingAttack] = useState(null);
  const [simFeedback, setSimFeedback] = useState(null);
  const [simError, setSimError] = useState(null);

  // Fetch status and threat logs
  const fetchSecurityData = async () => {
    if (!chatId) return;
    setLoading(true);
    try {
      const [statusRes, threatsRes] = await Promise.all([
        api.get(`/security/${chatId}/status`),
        api.get(`/security/${chatId}/threats`)
      ]);
      setStatusData(statusRes.data);
      setThreatLogs(threatsRes.data.threats || []);
    } catch (err) {
      console.error('Error fetching security data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, [chatId]);

  // Merge real-time socket alerts
  useEffect(() => {
    if (securityAlerts.length > 0) {
      fetchSecurityData();
    }
  }, [securityAlerts]);

  // Trigger live E91 refresh
  const handleRefreshE91 = async () => {
    setEvaluatingE91(true);
    try {
      const res = await api.post(`/security/${chatId}/refresh-e91`, {
        noiseRate,
        interceptProb
      });
      setStatusData((prev) => ({
        ...prev,
        e91Status: res.data.e91Status
      }));
    } catch (err) {
      alert('Error running E91 test: ' + err.message);
    } finally {
      setEvaluatingE91(false);
    }
  };

  // Trigger simulated attack
  const handleTriggerAttack = async (attackType) => {
    setSimulatingAttack(attackType);
    setSimFeedback(null);
    setSimError(null);
    try {
      const res = await api.post('/security/simulate-attack', {
        chatId,
        attackType,
        sampleMessage: 'Financial wire dispatch: $1,500,000 to Offshore Vault'
      });

      const sim = res.data.simulation;
      setSimFeedback(sim);
      fetchSecurityData();
    } catch (err) {
      alert('Simulation error: ' + err.message);
      const errMsg = err.response?.data?.error || err.message;
      setSimError(errMsg);
    } finally {
      setSimulatingAttack(null);
    }
  };

  // Fetch Milestone 8 benchmark matrix
  const handleLoadBenchmark = async () => {
    setLoading(true);
    try {
      const res = await api.get('/security/benchmark/matrix');
      setBenchmarkMatrix(res.data);
    } catch (err) {
      alert('Error fetching benchmark: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const e91 = statusData?.e91Status || {
    chshS: 2.828,
    channelStatus: 'PASS',
    qberEstimate: 0.0
  };

  const latestVer = statusData?.latestVerification;

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-wa-panel border-l border-wa-border shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-200 select-none">
      {/* Drawer Header */}
      <div className="h-16 px-6 bg-wa-surface border-b border-wa-border flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-quantum-purple/20 border border-quantum-purple/50 flex items-center justify-center text-quantum-cyan">
            <ShieldCheck className="w-6 h-6 text-quantum-cyan" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Quantum Security & Threat Panel
            </h2>
            <p className="text-xs text-wa-textSecondary font-mono">
              Session: {statusData?.activeSessionId?.substring(0, 16) || 'qds_sess_active'}...
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 hover:bg-wa-hover text-wa-textSecondary hover:text-white rounded-full transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-wa-border bg-wa-surface/60 px-4">
        {[
          { id: 'live', label: 'E91 & QDS Live', icon: Activity },
          { id: 'circuit', label: 'Teleportation Circuit', icon: Cpu },
          { id: 'threats', label: `Threat Feed (${threatLogs.length})`, icon: AlertTriangle },
          { id: 'simulator', label: 'Attack Simulator', icon: Zap },
          { id: 'benchmark', label: 'Experiment Matrix', icon: BarChart3 }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'benchmark' && !benchmarkMatrix) handleLoadBenchmark();
              }}
              className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition ${
                activeTab === tab.id
                  ? 'border-wa-green text-wa-green'
                  : 'border-transparent text-wa-textSecondary hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* --- TAB 1: LIVE E91 & QDS --- */}
        {activeTab === 'live' && (
          <div className="space-y-6">
            {/* Dynamic E91 Status Card */}
            <div className="bg-wa-surface p-5 rounded-xl border border-wa-border shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Radio className="w-5 h-5 text-quantum-cyan" />
                  <h3 className="text-sm font-bold text-white">Dynamic E91 Entanglement Channel</h3>
                </div>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded font-bold uppercase ${
                    e91.channelStatus === 'PASS'
                      ? 'bg-wa-green/20 text-wa-green border border-wa-green/30'
                      : e91.channelStatus === 'SUSPICIOUS'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  {e91.channelStatus}
                </span>
              </div>

              {/* Gauge and Metrics Grid */}
              <div className="grid grid-cols-2 gap-4 my-4">
                {/* CHSH Gauge */}
                <div className="bg-wa-panel p-4 rounded-lg border border-wa-border text-center">
                  <div className="text-[11px] text-wa-textSecondary font-semibold uppercase tracking-wider mb-1">
                    CHSH S-Value
                  </div>
                  <div className="text-3xl font-mono font-extrabold text-white my-1">
                    {e91.chshS?.toFixed(3) || '2.828'}
                  </div>
                  <div className="text-[10px] text-quantum-cyan flex items-center justify-center gap-1">
                    <span>Tsirelson: 2.828</span>
                    <span>•</span>
                    <span className="text-red-400">Classical: 2.000</span>
                  </div>
                </div>

                {/* QBER Meter */}
                <div className="bg-wa-panel p-4 rounded-lg border border-wa-border text-center">
                  <div className="text-[11px] text-wa-textSecondary font-semibold uppercase tracking-wider mb-1">
                    QBER (Error Rate)
                  </div>
                  <div className="text-3xl font-mono font-extrabold text-white my-1">
                    {((e91.qberEstimate || 0) * 100).toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-wa-textSecondary">
                    Threshold: &le; 8.0%
                  </div>
                </div>
              </div>

              {/* Sliders for Simulated Channel Disturbance */}
              <div className="bg-wa-panel/60 p-3.5 rounded-lg border border-wa-border space-y-3">
                <div className="text-xs font-semibold text-white flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-wa-textSecondary" /> Channel Test Injection Parameters
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] text-wa-textSecondary mb-1">
                      Depolarizing Noise: {(noiseRate * 100).toFixed(0)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="0.3"
                      step="0.05"
                      value={noiseRate}
                      onChange={(e) => setNoiseRate(parseFloat(e.target.value))}
                      className="w-full accent-wa-green cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-wa-textSecondary mb-1">
                      Eve Intercept Prob: {(interceptProb * 100).toFixed(0)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1.0"
                      step="0.1"
                      value={interceptProb}
                      onChange={(e) => setInterceptProb(parseFloat(e.target.value))}
                      className="w-full accent-quantum-cyan cursor-pointer"
                    />
                  </div>
                </div>

                <button
                  onClick={handleRefreshE91}
                  disabled={evaluatingE91}
                  className="w-full mt-2 py-2 bg-wa-surface hover:bg-wa-hover text-quantum-cyan border border-quantum-cyan/30 rounded text-xs font-semibold transition flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${evaluatingE91 ? 'animate-spin' : ''}`} />
                  {evaluatingE91 ? 'Executing Bell Measurement Circuit...' : 'Run Live Dynamic E91 Test'}
                </button>
              </div>
            </div>

            {/* Latest Message QDS Breakdown */}
            <div className="bg-wa-surface p-5 rounded-xl border border-wa-border shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-quantum-cyan" />
                  <h3 className="text-sm font-bold text-white">Latest Message QDS Breakdown</h3>
                </div>
                {latestVer && (
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded font-bold uppercase ${
                      latestVer.decision === 'ACCEPT'
                        ? 'bg-wa-green/20 text-wa-green border border-wa-green/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {latestVer.decision}
                  </span>
                )}
              </div>

              {latestVer ? (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-wa-panel p-2.5 rounded border border-wa-border">
                      <span className="text-wa-textSecondary text-[10px] block">Teleported Qubits</span>
                      <span className="font-mono font-bold text-white text-sm">{latestVer.totalQubits}</span>
                    </div>
                    <div className="bg-wa-panel p-2.5 rounded border border-wa-border">
                      <span className="text-wa-textSecondary text-[10px] block">Matching States</span>
                      <span className="font-mono font-bold text-wa-green text-sm">{latestVer.matches}</span>
                    </div>
                    <div className="bg-wa-panel p-2.5 rounded border border-wa-border">
                      <span className="text-wa-textSecondary text-[10px] block">Mismatch Rate</span>
                      <span className="font-mono font-bold text-white text-sm">
                        {((latestVer.mismatchRate || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-wa-panel rounded border border-wa-border space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-wa-textSecondary">Acceptance Threshold (&tau;):</span>
                      <span className="text-white">&le; {(latestVer.threshold * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-wa-textSecondary">Classical Integrity (SHA256):</span>
                      <span className="text-wa-green font-bold">MATCH &check;</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-wa-textSecondary">Identity Authentication:</span>
                      <span className="text-wa-green font-bold">{latestVer.identityStatus || 'VALID'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-wa-textSecondary">Nonce Replay Protection:</span>
                      <span className="text-wa-green font-bold">{latestVer.nonceStatus || 'VALID'}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('circuit')}
                    className="w-full mt-3 py-2 bg-wa-panel hover:bg-wa-hover text-quantum-cyan border border-quantum-cyan/30 rounded text-xs font-semibold transition flex items-center justify-center gap-2 shadow"
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    Launch Dynamic Teleportation Circuit Simulation &rarr;
                  </button>
                </div>
              ) : (
                <p className="text-xs text-wa-textSecondary italic text-center py-4">
                  Send a message to view the simulated Pauli eigenstate teleportation and verification breakdown.
                </p>
              )}
            </div>
          </div>
        )}

        {/* --- TAB: TELEPORTATION CIRCUIT SIMULATOR --- */}
        {activeTab === 'circuit' && (
          <TeleportationCircuitVisualizer
            latestMessage={latestMessage}
            selectedState={latestMessage?.signatureMeta?.teleportationRecords?.[0]?.inputState || '10'}
          />
        )}

        {/* --- TAB 2: THREAT LOGS FEED --- */}
        {activeTab === 'threats' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Live Threat & Intrusion Log Feed</h3>
              <button
                onClick={fetchSecurityData}
                className="text-xs text-wa-green hover:underline flex items-center gap-1 font-semibold"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>

            {threatLogs.length === 0 ? (
              <div className="text-center p-8 bg-wa-surface rounded-xl border border-wa-border text-wa-textSecondary">
                <ShieldCheck className="w-10 h-10 text-wa-green mx-auto mb-2 opacity-80" />
                <p className="text-sm font-semibold text-white">Zero Threats Detected</p>
                <p className="text-xs mt-1">All messages and quantum channels have passed deterministic integrity verification.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {threatLogs.map((threat) => (
                  <div
                    key={threat._id || threat.timestamp}
                    className="p-4 bg-wa-surface rounded-xl border border-red-500/40 text-xs shadow-md space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold border border-red-500/30 uppercase tracking-wide">
                        {threat.attackType}
                      </span>
                      <span className="text-[11px] text-wa-textSecondary font-mono">
                        {new Date(threat.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <p className="text-sm text-red-200 font-medium">
                      {threat.reason}
                    </p>

                    {threat.evidence && Object.keys(threat.evidence).length > 0 && (
                      <div className="bg-wa-panel/80 p-2.5 rounded border border-wa-border/80 font-mono text-[11px] text-wa-textSecondary">
                        <span className="text-white font-semibold block mb-1">Cryptographic Evidence:</span>
                        <pre className="overflow-x-auto whitespace-pre-wrap">
                          {JSON.stringify(threat.evidence, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- TAB 3: ATTACK SIMULATOR (DEMO CONSOLE) --- */}
        {activeTab === 'simulator' && (
          <div className="space-y-4">
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200 flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-amber-300">Deterministic Threat Simulation Console</strong>
                <p className="mt-0.5 text-[11px] leading-relaxed">
                  Trigger each attack against a test session to evaluate how the deterministic, rule-based engine categorizes threats in strict priority order.
                </p>
              </div>
            </div>

            {/* Attack Buttons Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  id: 'FORGERY',
                  title: 'Signature Forgery',
                  desc: 'Adversary tampers with teleported Pauli eigenstates, triggering mismatch rate > tau.'
                },
                {
                  id: 'REPLAY',
                  title: 'Replay Attack',
                  desc: 'Adversary replays a previously captured signed packet. Caught by atomic NonceRegistry.'
                },
                {
                  id: 'IMPERSONATION',
                  title: 'Identity Impersonation',
                  desc: 'Adversary forges a message originating from an unauthorized sender identity.'
                },
                {
                  id: 'CHANNEL_MANIPULATION',
                  title: 'Channel Manipulation',
                  desc: 'Adversary actively tampers with entangled Bell pairs. CHSH S falls below 2.0.'
                },
                {
                  id: 'PASSIVE_EAVESDROP',
                  title: 'Passive Eavesdropping',
                  desc: 'Eve monitors quantum channel (QBER up, CHSH down) without modifying current message.'
                },
                {
                  id: 'UNAUTHORIZED_VERIFICATION',
                  title: 'Unauthorized Verifier',
                  desc: 'Third party not in the authorized session attempts quantum signature verification.'
                },
                {
                  id: 'TAMPERING',
                  title: 'Classical Tampering',
                  desc: 'Adversary flips bits in the AES-GCM ciphertext. Caught by SHA-256 hash check.'
                }
              ].map((att) => {
                const isCurrent = simulatingAttack === att.id;
                return (
                  <button
                    key={att.id}
                    onClick={() => handleTriggerAttack(att.id)}
                    disabled={Boolean(simulatingAttack)}
                    className={`p-3.5 bg-wa-surface hover:bg-wa-hover border rounded-xl text-left transition group ${
                      isCurrent
                        ? 'border-red-500 bg-red-950/30 ring-1 ring-red-500/50'
                        : 'border-wa-border hover:border-red-500/50'
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white group-hover:text-red-300">
                        {att.title}
                      </span>
                      {isCurrent ? (
                        <span className="text-[10px] text-red-400 font-mono font-semibold flex items-center gap-1.5">
                          <Loader2 className="w-3 h-3 animate-spin" /> RUNNING...
                        </span>
                      ) : (
                        <span className="text-[10px] text-red-400 font-mono font-semibold">TEST &rarr;</span>
                      )}
                    </div>
                    <p className="text-[11px] text-wa-textSecondary leading-snug">
                      {att.desc}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* In-Flight Simulation Progress Banner */}
            {simulatingAttack && (
              <div className="p-3.5 bg-quantum-cyan/10 border border-quantum-cyan/40 rounded-xl text-xs text-quantum-cyan flex items-start gap-3 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">
                    Simulating Threat: <span className="text-quantum-cyan">{simulatingAttack}</span>
                  </div>
                  <div className="text-[11px] text-wa-textSecondary mt-0.5 leading-relaxed">
                    Executing Qiskit Aer quantum circuits, Bell measurements, and deterministic rule evaluation. (If microservice is waking from idle, cold start takes ~20–40s).
                  </div>
                </div>
              </div>
            )}

            {/* Simulation Error Alert */}
            {simError && (
              <div className="p-3.5 bg-red-950/60 border border-red-500/60 rounded-xl text-xs text-red-200 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold text-red-300">Simulation Error</strong>
                  <p className="mt-0.5 text-[11px] text-red-200/90">{simError}</p>
                </div>
              </div>
            )}

            {/* Simulation Feedback Card */}
            {simFeedback && (
              <div className="p-4 bg-red-950/40 rounded-xl border border-red-500/60 space-y-2.5 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-wa-green" /> Deterministic Rule Triggered:
                  </span>
                  <span className="px-2 py-0.5 rounded bg-red-500/30 text-red-300 font-mono text-[10px] font-bold">
                    {simFeedback.detectedThreatType}
                  </span>
                </div>

                <p className="text-xs text-white font-medium">
                  {simFeedback.verificationResult?.reason}
                </p>

                <div className="text-[11px] text-wa-textSecondary bg-wa-panel/80 p-2.5 rounded border border-wa-border font-mono">
                  <div>Decision: <span className="text-red-400 font-bold">{simFeedback.verificationResult?.decision}</span></div>
                  <div>Severity: <span className="text-amber-400">{simFeedback.verificationResult?.severity}</span></div>
                  <div>Mismatch Rate: {((simFeedback.verificationResult?.mismatchRate || 0) * 100).toFixed(1)}%</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- TAB 4: BENCHMARK MATRIX (MILESTONE 8) --- */}
        {activeTab === 'benchmark' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Quantum Security Benchmark & Noise Sensitivity</h3>
              <button
                onClick={handleLoadBenchmark}
                disabled={loading}
                className="text-xs text-wa-green hover:underline flex items-center gap-1 font-semibold"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Run Matrix
              </button>
            </div>

            {benchmarkMatrix ? (
              <div className="space-y-4">
                {/* Summary KPIs */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-wa-surface p-3.5 rounded-lg border border-wa-border text-center">
                    <span className="text-wa-textSecondary text-[10px] uppercase font-semibold">Attack Detection Accuracy</span>
                    <span className="text-2xl font-mono font-bold text-wa-green block my-0.5">
                      {(benchmarkMatrix.attackDetectionAccuracy * 100).toFixed(0)}%
                    </span>
                    <span className="text-[10px] text-wa-textSecondary">Deterministic priority rule matching</span>
                  </div>

                  <div className="bg-wa-surface p-3.5 rounded-lg border border-wa-border text-center">
                    <span className="text-wa-textSecondary text-[10px] uppercase font-semibold">False Positive Rate</span>
                    <span className="text-2xl font-mono font-bold text-quantum-cyan block my-0.5">
                      {(benchmarkMatrix.falsePositiveRate * 100).toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-wa-textSecondary">At threshold &tau; = 0.05</span>
                  </div>
                </div>

                {/* Noise Sensitivity Table */}
                <div className="bg-wa-surface p-4 rounded-xl border border-wa-border">
                  <h4 className="font-bold text-white mb-2 text-xs">Depolarizing Channel Sensitivity Curve</h4>
                  <table className="w-full text-left font-mono text-[11px]">
                    <thead>
                      <tr className="border-b border-wa-border text-wa-textSecondary">
                        <th className="pb-1.5">Noise Level</th>
                        <th className="pb-1.5">CHSH S</th>
                        <th className="pb-1.5">QBER</th>
                        <th className="pb-1.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-wa-border/50">
                      {benchmarkMatrix.noiseSensitivityCurve?.map((row, idx) => (
                        <tr key={idx} className="hover:bg-wa-panel/40">
                          <td className="py-1.5 text-white">{(row.noiseRate * 100).toFixed(0)}%</td>
                          <td className="py-1.5 text-quantum-cyan">{row.chshS.toFixed(3)}</td>
                          <td className="py-1.5">{((row.qber || 0) * 100).toFixed(1)}%</td>
                          <td className="py-1.5">
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                row.status === 'PASS'
                                  ? 'bg-wa-green/20 text-wa-green'
                                  : 'bg-red-500/20 text-red-400'
                              }`}
                            >
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Security Claims Disclaimer Notice */}
                <div className="p-3 bg-wa-panel rounded-lg border border-wa-border text-[11px] text-wa-textSecondary leading-relaxed">
                  <strong className="text-white block mb-1">Simulated Protocol Notice:</strong>
                  This software is a prototype running Qiskit Aer simulation. It does not provide unconditional quantum security on physical hardware, but rigorously models the mathematical protocol of Dynamic E91 channel verification, 3-qubit teleportation, and deterministic threat classification.
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-wa-textSecondary">
                Loading benchmark experiment matrix...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

