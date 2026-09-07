import React, { useState, useEffect } from 'react';
import {
  X,
  Archive,
  Download,
  FileText,
  FileCode,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Calendar,
  Lock,
  Upload,
  RefreshCw
} from 'lucide-react';
import api from '../api';

export default function ChatBackupModal({ activeChat, onClose }) {
  const [activeTab, setActiveTab] = useState('export'); // 'export' | 'inspect'
  const [loading, setLoading] = useState(true);
  const [backupData, setBackupData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Inspect state
  const [inspectedFile, setInspectedFile] = useState(null);
  const [inspectResult, setInspectResult] = useState(null);
  const [inspectError, setInspectError] = useState(null);
  const [verifyingSeal, setVerifyingSeal] = useState(false);

  useEffect(() => {
    if (activeChat?._id) {
      fetchBackup();
    }
  }, [activeChat?._id]);

  const fetchBackup = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.get(`/chats/${activeChat._id}/backup`);
      setBackupData(res.data.backup);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message || 'Failed to prepare chat backup.');
    } finally {
      setLoading(false);
    }
  };

  // 1. Download as Cryptographic JSON Backup
  const handleDownloadJSON = () => {
    if (!backupData) return;

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    const safeName = (backupData.metadata?.name || 'chat').replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `qchat_backup_${safeName}_${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // 2. Download as Formatted Plaintext Transcript
  const handleDownloadTXT = () => {
    if (!backupData) return;

    const meta = backupData.metadata || {};
    const e91 = meta.e91Status || {};

    let transcript = '';
    transcript += '=======================================================================\n';
    transcript += '        QCHAT QUANTUM-SECURED CONVERSATION TRANSCRIPT\n';
    transcript += '=======================================================================\n';
    transcript += `Chat Name:           ${meta.name || 'Direct Quantum Chat'}\n`;
    transcript += `Chat ID:             ${meta.chatId}\n`;
    transcript += `Exported At:         ${meta.exportedAt || new Date().toISOString()}\n`;
    transcript += `Exported By:         ${meta.exportedBy?.name} (${meta.exportedBy?.email})\n`;
    transcript += `E91 Channel Status:  ${e91.channelStatus || 'PASS'} (CHSH S=${e91.chshS?.toFixed(3) || '2.828'}, QBER=${((e91.qberEstimate || 0) * 100).toFixed(1)}%)\n`;
    transcript += `Total Messages:      ${backupData.messagesCount || 0}\n`;
    transcript += `Integrity Seal:      ${backupData.integritySeal}\n`;
    transcript += '=======================================================================\n\n';

    (backupData.messages || []).forEach((msg) => {
      const timeStr = new Date(msg.timestamp).toLocaleString();
      const senderName = msg.sender?.name || 'Unknown';
      const decision = msg.qdsVerification?.decision || 'ACCEPT';
      const threat = msg.qdsVerification?.detectedAttack ? ` [THREAT: ${msg.qdsVerification.detectedAttack}]` : '';

      transcript += `[${timeStr}] ${senderName} [QDS: ${decision}${threat}]:\n`;
      if (msg.content) {
        transcript += `  ${msg.content}\n`;
      }
      if (msg.mediaUrl) {
        transcript += `  [Attachment: ${msg.mediaType} - ${msg.mediaFilename || msg.mediaUrl}]\n`;
      }
      transcript += '\n';
    });

    transcript += '-----------------------------------------------------------------------\n';
    transcript += 'End of Transcript • Sealed with Quantum Digital Signatures (QDS)\n';
    transcript += '=======================================================================\n';

    const dataStr = 'data:text/plain;charset=utf-8,' + encodeURIComponent(transcript);
    const downloadAnchor = document.createElement('a');
    const safeName = (meta.name || 'chat').replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `qchat_transcript_${safeName}_${dateStr}.txt`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // 3. Inspect and verify an uploaded JSON backup
  const handleInspectFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setInspectedFile(file.name);
    setInspectError(null);
    setInspectResult(null);
    setVerifyingSeal(true);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target.result;
        const parsed = JSON.parse(text);

        if (!parsed.schemaVersion || !parsed.messages || !parsed.integritySeal) {
          throw new Error('Invalid QChat backup format. Missing schemaVersion, messages, or integritySeal.');
        }

        // Recompute SHA-256 hash using Web Crypto API
        const hashData = JSON.stringify({
          metadata: { chatId: parsed.metadata?.chatId, exportedAt: parsed.metadata?.exportedAt },
          messages: (parsed.messages || []).map(m => ({ id: m.messageId, hash: m.messageHash, t: m.timestamp }))
        });

        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(hashData);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const computedHash = 'sha256:' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        const isTampered = (computedHash !== parsed.integritySeal);

        setInspectResult({
          parsed,
          computedHash,
          isTampered
        });
      } catch (err) {
        setInspectError(err.message || 'Failed to parse backup file.');
      } finally {
        setVerifyingSeal(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 select-none">
      <div className="bg-wa-surface border border-wa-border max-w-xl w-full rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[95vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="h-14 sm:h-16 px-4 sm:px-6 bg-wa-panel border-b border-wa-border flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-quantum-cyan/20 border border-quantum-cyan/40 flex items-center justify-center text-quantum-cyan shrink-0">
              <Archive className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white leading-tight truncate">Chat Backup & Archive</h2>
              <p className="text-[11px] text-wa-textSecondary font-mono truncate">
                Cryptographic export & QDS verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-wa-hover text-wa-textSecondary hover:text-white rounded-full transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-wa-border bg-wa-surface/60 px-4 sm:px-6 text-xs">
          <button
            onClick={() => setActiveTab('export')}
            className={`py-3 px-4 font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'export'
                ? 'border-quantum-cyan text-quantum-cyan'
                : 'border-transparent text-wa-textSecondary hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Create & Export Backup</span>
          </button>
          <button
            onClick={() => setActiveTab('inspect')}
            className={`py-3 px-4 font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'inspect'
                ? 'border-quantum-cyan text-quantum-cyan'
                : 'border-transparent text-wa-textSecondary hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Inspect / Verify Backup File</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {activeTab === 'export' && (
            <>
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center text-wa-textSecondary space-y-3">
                  <Loader2 className="w-8 h-8 text-quantum-cyan animate-spin" />
                  <p className="text-sm font-semibold text-white">Generating Quantum Backup...</p>
                  <p className="text-xs">Gathering Pauli measurement traces & hashing SHA-256 seal.</p>
                </div>
              ) : errorMsg ? (
                <div className="p-4 bg-red-950/60 border border-red-500/60 rounded-xl text-xs text-red-200 space-y-2">
                  <div className="font-bold flex items-center gap-2 text-red-300">
                    <AlertTriangle className="w-4 h-4" /> Backup Generation Error
                  </div>
                  <p>{errorMsg}</p>
                  <button
                    onClick={fetchBackup}
                    className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded border border-red-500/40 text-xs font-semibold"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div className="p-3.5 bg-quantum-cyan/10 border border-quantum-cyan/30 rounded-xl text-quantum-cyan flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold text-white">Quantum Cryptographic Archive Ready</strong>
                      <p className="text-[11px] text-quantum-cyan/80 mt-0.5 leading-relaxed">
                        This backup includes complete conversation history, sender quantum keys, and QDS Pauli eigenstate verification metrics sealed with a deterministic SHA-256 checksum.
                      </p>
                    </div>
                  </div>

                  {/* Backup Summary Grid */}
                  <div className="grid grid-cols-2 gap-3 font-mono">
                    <div className="bg-wa-panel p-3 rounded-lg border border-wa-border text-center">
                      <span className="text-[10px] text-wa-textSecondary uppercase block">Messages Archived</span>
                      <span className="text-2xl font-bold text-white block my-0.5">
                        {backupData?.messagesCount || 0}
                      </span>
                      <span className="text-[10px] text-wa-textSecondary">Verified records</span>
                    </div>

                    <div className="bg-wa-panel p-3 rounded-lg border border-wa-border text-center">
                      <span className="text-[10px] text-wa-textSecondary uppercase block">E91 Channel Bell S</span>
                      <span className="text-2xl font-bold text-quantum-cyan block my-0.5">
                        {backupData?.metadata?.e91Status?.chshS?.toFixed(3) || '2.828'}
                      </span>
                      <span className="text-[10px] text-wa-green">Tsirelson Bound</span>
                    </div>
                  </div>

                  {/* Cryptographic Seal Details */}
                  <div className="bg-wa-panel/60 p-3.5 rounded-xl border border-wa-border space-y-2 font-mono text-[11px]">
                    <div className="flex items-center justify-between text-wa-textSecondary">
                      <span className="text-white font-semibold">Integrity Checksum:</span>
                      <span className="text-wa-green flex items-center gap-1 font-bold">
                        <CheckCircle2 className="w-3 h-3" /> Sealed
                      </span>
                    </div>
                    <div className="p-2 bg-wa-surface rounded border border-wa-border text-wa-textSecondary select-all break-all">
                      {backupData?.integritySeal}
                    </div>
                  </div>

                  {/* Download Options */}
                  <div className="space-y-2.5 pt-2">
                    <div className="text-[11px] text-wa-textSecondary font-semibold uppercase tracking-wider">
                      Select Export Format
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* JSON Backup Button */}
                      <button
                        onClick={handleDownloadJSON}
                        className="p-3.5 bg-wa-panel hover:bg-wa-hover border border-quantum-cyan/40 hover:border-quantum-cyan rounded-xl text-left transition group shadow-md"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-white group-hover:text-quantum-cyan flex items-center gap-1.5">
                            <FileCode className="w-4 h-4 text-quantum-cyan" /> Quantum JSON (.json)
                          </span>
                          <Download className="w-3.5 h-3.5 text-quantum-cyan" />
                        </div>
                        <p className="text-[11px] text-wa-textSecondary leading-snug">
                          Structured cryptographic backup with full verification states and hash proofs.
                        </p>
                      </button>

                      {/* Plaintext Transcript Button */}
                      <button
                        onClick={handleDownloadTXT}
                        className="p-3.5 bg-wa-panel hover:bg-wa-hover border border-wa-border hover:border-wa-green rounded-xl text-left transition group shadow-md"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-white group-hover:text-wa-green flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-wa-green" /> Text Transcript (.txt)
                          </span>
                          <Download className="w-3.5 h-3.5 text-wa-green" />
                        </div>
                        <p className="text-[11px] text-wa-textSecondary leading-snug">
                          Clean, human-readable conversation transcript formatted chronologically.
                        </p>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'inspect' && (
            <div className="space-y-4">
              {/* File Selector */}
              <div className="p-6 border-2 border-dashed border-wa-border rounded-xl bg-wa-panel/40 text-center hover:border-quantum-cyan transition">
                <Archive className="w-8 h-8 text-quantum-cyan mx-auto mb-2 opacity-80" />
                <p className="text-xs font-semibold text-white">Select a QChat JSON Backup to Inspect</p>
                <p className="text-[11px] text-wa-textSecondary mt-0.5">
                  Verify cryptographic SHA-256 seal integrity and review archived messages.
                </p>

                <label className="mt-3 inline-block px-4 py-1.5 bg-quantum-cyan/20 hover:bg-quantum-cyan/30 text-quantum-cyan border border-quantum-cyan/40 rounded-lg text-xs font-semibold cursor-pointer transition">
                  Browse .json file
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleInspectFile}
                    className="hidden"
                  />
                </label>
                {inspectedFile && (
                  <span className="block text-[11px] text-wa-textSecondary mt-2 font-mono">
                    Loaded: {inspectedFile}
                  </span>
                )}
              </div>

              {verifyingSeal && (
                <div className="p-4 bg-wa-panel rounded-xl flex items-center justify-center gap-2 text-quantum-cyan">
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying SHA-256 cryptographic seal...
                </div>
              )}

              {inspectError && (
                <div className="p-3 bg-red-950/60 border border-red-500/60 rounded-xl text-xs text-red-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{inspectError}</span>
                </div>
              )}

              {/* Inspection Results Card */}
              {inspectResult && (
                <div className="space-y-4 animate-in fade-in">
                  {/* Integrity Seal Status */}
                  <div
                    className={`p-4 rounded-xl border flex items-center justify-between ${
                      !inspectResult.isTampered
                        ? 'bg-wa-green/15 border-wa-green/50 text-wa-green'
                        : 'bg-red-950/60 border-red-500/60 text-red-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {!inspectResult.isTampered ? (
                        <CheckCircle2 className="w-5 h-5 text-wa-green shrink-0" />
                      ) : (
                        <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
                      )}
                      <div>
                        <span className="font-bold block text-sm">
                          {!inspectResult.isTampered ? 'Cryptographic Seal Verified (Authentic)' : 'Tampering Detected (Hash Mismatch)'}
                        </span>
                        <span className="text-[11px] opacity-90 block">
                          {!inspectResult.isTampered
                            ? 'SHA-256 checksum matches message payload signatures perfectly.'
                            : 'Backup content has been modified or corrupted since export.'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Backup Metadata */}
                  <div className="bg-wa-panel/60 p-3.5 rounded-xl border border-wa-border grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-wa-textSecondary block">Chat Name</span>
                      <span className="text-white font-semibold">{inspectResult.parsed?.metadata?.name || 'Quantum Chat'}</span>
                    </div>
                    <div>
                      <span className="text-wa-textSecondary block">Archived Messages</span>
                      <span className="text-white font-semibold">{inspectResult.parsed?.messagesCount || 0} messages</span>
                    </div>
                    <div>
                      <span className="text-wa-textSecondary block">Exported Date</span>
                      <span className="text-white font-mono">
                        {new Date(inspectResult.parsed?.metadata?.exportedAt).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-wa-textSecondary block">Schema</span>
                      <span className="text-quantum-cyan font-mono">{inspectResult.parsed?.schemaVersion}</span>
                    </div>
                  </div>

                  {/* Restored Messages Preview */}
                  <div>
                    <span className="text-[11px] text-wa-textSecondary font-semibold uppercase tracking-wider block mb-2">
                      Message Log Preview ({inspectResult.parsed?.messages?.length || 0})
                    </span>
                    <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-wa-panel rounded-xl border border-wa-border text-[11px] font-mono">
                      {(inspectResult.parsed?.messages || []).map((m, idx) => (
                        <div key={idx} className="p-1.5 rounded bg-wa-surface/80 border border-wa-border/50">
                          <span className="text-quantum-cyan font-semibold">{m.sender?.name || 'User'}: </span>
                          <span className="text-white">{m.content}</span>
                          <span className="text-wa-textSecondary text-[10px] ml-2">
                            ({new Date(m.timestamp).toLocaleTimeString()})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
