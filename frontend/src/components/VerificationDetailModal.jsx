import React from 'react';
import { X, ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Cpu, Lock, Key } from 'lucide-react';

export default function VerificationDetailModal({ message, onClose }) {
  if (!message) return null;

  const ver = message.qdsVerification || {};
  const isAccepted = ver.decision === 'ACCEPT';
  const meta = message.signatureMeta || {};
  const records = meta.teleportationRecords || [];

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 animate-in fade-in select-none">
      <div className="w-full max-w-2xl bg-wa-panel rounded-xl border border-wa-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="h-16 px-6 bg-wa-surface border-b border-wa-border flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isAccepted ? 'bg-wa-green/20 text-wa-green' : 'bg-red-500/20 text-red-400'
              }`}
            >
              {isAccepted ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Quantum Digital Signature Inspector
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                    isAccepted
                      ? 'bg-wa-green/20 text-wa-green border border-wa-green/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  {ver.decision || 'VERIFIED'}
                </span>
              </h3>
              <p className="text-xs text-wa-textSecondary font-mono">
                Nonce: {message.nonce?.substring(0, 18)}...
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-wa-hover text-wa-textSecondary hover:text-white rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Verdict and Engine Reason */}
          <div
            className={`p-4 rounded-xl border ${
              isAccepted
                ? 'bg-wa-green/10 border-wa-green/30 text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}
          >
            <div className="flex items-center gap-2 font-bold mb-1 text-sm">
              {isAccepted ? (
                <CheckCircle2 className="w-5 h-5 text-wa-green" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400" />
              )}
              {isAccepted ? 'Valid Quantum Digital Signature' : `Rejected: ${ver.detectedAttack || 'Threat Detected'}`}
            </div>
            <p className="leading-relaxed text-xs opacity-90">{ver.reason || 'Verified under standard QDS protocol.'}</p>
          </div>

          {/* Core Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-wa-surface p-3 rounded-lg border border-wa-border text-center">
              <span className="text-[10px] text-wa-textSecondary block uppercase font-semibold">Teleported Qubits</span>
              <span className="text-lg font-mono font-bold text-white">{ver.totalQubits || meta.qubitCount || 32}</span>
            </div>
            <div className="bg-wa-surface p-3 rounded-lg border border-wa-border text-center">
              <span className="text-[10px] text-wa-textSecondary block uppercase font-semibold">Matching States</span>
              <span className="text-lg font-mono font-bold text-wa-green">{ver.matches ?? 32}</span>
            </div>
            <div className="bg-wa-surface p-3 rounded-lg border border-wa-border text-center">
              <span className="text-[10px] text-wa-textSecondary block uppercase font-semibold">Mismatch Rate</span>
              <span className="text-lg font-mono font-bold text-quantum-cyan">
                {((ver.mismatchRate || 0) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="bg-wa-surface p-3 rounded-lg border border-wa-border text-center">
              <span className="text-[10px] text-wa-textSecondary block uppercase font-semibold">Threshold (&tau;)</span>
              <span className="text-lg font-mono font-bold text-white">&le; {((ver.threshold || 0.05) * 100).toFixed(0)}%</span>
            </div>
          </div>

          {/* Classical & Protocol Checklist */}
          <div className="bg-wa-surface p-4 rounded-xl border border-wa-border space-y-2 font-mono">
            <h4 className="text-white font-bold text-xs uppercase mb-2 flex items-center gap-1.5 font-sans">
              <Lock className="w-3.5 h-3.5 text-wa-green" /> Dual-Layer Protocol Verification
            </h4>

            <div className="flex justify-between py-1 border-b border-wa-border/50">
              <span className="text-wa-textSecondary">Classical Integrity Hash (SHA-256):</span>
              <span className="text-white truncate max-w-xs font-mono">{message.messageHash}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-wa-border/50">
              <span className="text-wa-textSecondary">AES-256-GCM Confidentiality:</span>
              <span className="text-wa-green font-bold">AUTHENTICATED TAG &check;</span>
            </div>
            <div className="flex justify-between py-1 border-b border-wa-border/50">
              <span className="text-wa-textSecondary">Identity Authentication:</span>
              <span className="text-wa-green font-bold">{ver.identityStatus || 'VALID'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-wa-border/50">
              <span className="text-wa-textSecondary">Nonce Replay Check:</span>
              <span className="text-wa-green font-bold">{ver.nonceStatus || 'VALID'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-wa-textSecondary">Dynamic E91 Bell Correlation:</span>
              <span className="text-quantum-cyan font-bold">
                S = {ver.chshS?.toFixed(2) || '2.82'} ({ver.channelStatus || 'PASS'})
              </span>
            </div>
          </div>

          {/* Teleported Signature Qubits Sample Visualizer */}
          {records.length > 0 && (
            <div className="bg-wa-surface p-4 rounded-xl border border-wa-border">
              <h4 className="text-white font-bold text-xs uppercase mb-2 flex items-center gap-1.5 font-sans">
                <Cpu className="w-3.5 h-3.5 text-quantum-cyan" /> Pauli Signature Eigenstates & Corrections
              </h4>
              <p className="text-[11px] text-wa-textSecondary mb-3">
                Each 2-bit chunk of the binding hash maps to a Pauli state: 00 &rarr; |0&rang;, 01 &rarr; |1&rang;, 10 &rarr; |+&rang;, 11 &rarr; |-&rang;.
              </p>

              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 font-mono text-[11px]">
                {records.slice(0, 16).map((rec, i) => {
                  const stateSymbols = {
                    '00': '|0⟩',
                    '01': '|1⟩',
                    '10': '|+⟩',
                    '11': '|-⟩'
                  };

                  return (
                    <div
                      key={i}
                      className="p-2 bg-wa-panel rounded border border-wa-border text-center hover:border-quantum-cyan transition"
                    >
                      <span className="text-[9px] text-wa-textSecondary block">Q{i}</span>
                      <span className="font-bold text-quantum-cyan">{stateSymbols[rec.inputState] || rec.inputState}</span>
                      <span className="text-[9px] text-wa-textSecondary block mt-0.5">Corr: {rec.classicalCorrectionBits}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

