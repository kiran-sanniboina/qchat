import React, { useState } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Key,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  Download,
  FileText,
  Image as ImageIcon,
  Users,
  Trash2,
  Ban,
  UserCheck,
  Radio,
  Archive,
  ExternalLink
} from 'lucide-react';
import { getResolvedAvatar, getResolvedMediaUrl, handleAvatarError } from '../utils/avatarHelper';

export default function ChatProfileModal({
  activeChat,
  currentUser,
  messages = [],
  onClose,
  onOpenBackup,
  onClearChat,
  onToggleBlock,
  isContactBlocked
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'media' | 'members'
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSession, setCopiedSession] = useState(false);

  if (!activeChat) return null;

  const myId = String(currentUser?.id || currentUser?._id || '');
  const otherParticipant = activeChat.isGroup
    ? null
    : activeChat.participants?.find((p) => String(p?._id || p?.id || p) !== myId);

  const displayName = activeChat.isGroup
    ? activeChat.name || 'Group Chat'
    : (otherParticipant?.name || 'Quantum Contact');

  const rawAvatar = activeChat.isGroup ? activeChat.avatar : otherParticipant?.avatarUrl;
  const fallbackSeed = activeChat.isGroup ? activeChat._id : (otherParticipant?.email || displayName);
  const resolvedAvatar = getResolvedAvatar(rawAvatar, fallbackSeed, displayName);

  const e91 = activeChat.e91Status || {
    chshS: 2.828,
    channelStatus: 'PASS',
    qberEstimate: 0.0
  };

  // Filter messages with media
  const mediaMessages = messages.filter((m) => m.mediaUrl);
  const imageMessages = mediaMessages.filter((m) => m.mediaType === 'image');
  const docMessages = mediaMessages.filter((m) => m.mediaType !== 'image');

  const handleCopy = (text, type) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else if (type === 'session') {
      setCopiedSession(true);
      setTimeout(() => setCopiedSession(false), 2000);
    }
  };

  const resolveMediaUrl = (url) => getResolvedMediaUrl(url);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 select-none">
      <div className="bg-wa-surface border border-wa-border max-w-xl w-full rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[95vh] sm:max-h-[90vh]">
        {/* Header Bar */}
        <div className="h-14 sm:h-16 px-4 sm:px-6 bg-wa-panel border-b border-wa-border flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-quantum-cyan/20 border border-quantum-cyan/40 flex items-center justify-center text-quantum-cyan shrink-0">
              {activeChat.isGroup ? <Users className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-wa-textPrimary leading-tight truncate">
                {activeChat.isGroup ? 'Group Details' : 'Contact Profile'}
              </h2>
              <p className="text-[11px] text-wa-textSecondary font-mono truncate">
                {activeChat.isGroup ? `${activeChat.participants?.length || 0} participants` : 'Quantum-verified peer'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-wa-hover text-wa-textSecondary hover:text-wa-textPrimary rounded-full transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hero Card */}
        <div className="p-4 sm:p-6 bg-wa-surface border-b border-wa-border flex flex-col items-center text-center">
          <div className="relative group mb-3">
            <img
              src={resolvedAvatar}
              alt={displayName}
              onError={(e) => handleAvatarError(e, fallbackSeed, displayName)}
              className="w-24 h-24 rounded-full object-cover border-2 border-wa-border shadow-xl bg-wa-panel"
            />
            {!activeChat.isGroup && (
              <span
                className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-wa-surface ${
                  otherParticipant?.isOnline ? 'bg-wa-green' : 'bg-wa-textSecondary/60'
                }`}
                title={otherParticipant?.isOnline ? 'Online' : 'Offline'}
              />
            )}
          </div>

          <h3 className="text-lg font-bold text-wa-textPrimary leading-tight flex items-center justify-center gap-2">
            {displayName}
            {!activeChat.isGroup && otherParticipant?.isOnline && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-wa-green/20 text-wa-green border border-wa-green/30 font-medium">
                Online
              </span>
            )}
          </h3>

          <p className="text-xs text-wa-textSecondary max-w-sm mt-1 leading-relaxed">
            {activeChat.isGroup
              ? (activeChat.description || 'Quantum End-to-End Encrypted Group Conversation')
              : (otherParticipant?.statusBio || 'Secured with Quantum Digital Signatures (QDS)')}
          </p>

          {/* Quick Action Pills */}
          <div className="flex items-center gap-2.5 mt-4">
            <button
              onClick={() => {
                onClose();
                if (onOpenBackup) onOpenBackup(activeChat);
              }}
              className="px-3.5 py-1.5 bg-wa-panel hover:bg-wa-hover text-wa-textPrimary border border-wa-border rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
            >
              <Archive className="w-3.5 h-3.5 text-quantum-cyan" />
              <span>Backup Chat</span>
            </button>

            <button
              onClick={() => {
                onClose();
                if (onClearChat) onClearChat(activeChat._id);
              }}
              className="px-3.5 py-1.5 bg-wa-panel hover:bg-wa-hover text-wa-textPrimary border border-wa-border rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5 text-wa-textSecondary" />
              <span>Clear History</span>
            </button>

            {!activeChat.isGroup && onToggleBlock && (
              <button
                onClick={() => {
                  onToggleBlock();
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border shadow-sm ${
                  isContactBlocked
                    ? 'bg-wa-green/20 text-wa-green border-wa-green/40 hover:bg-wa-green/30'
                    : 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30'
                }`}
              >
                {isContactBlocked ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Unblock</span>
                  </>
                ) : (
                  <>
                    <Ban className="w-3.5 h-3.5" />
                    <span>Block</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-wa-border bg-wa-panel/40 px-6 text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 font-semibold border-b-2 transition ${
              activeTab === 'overview'
                ? 'border-quantum-cyan text-quantum-cyan'
                : 'border-transparent text-wa-textSecondary hover:text-wa-textPrimary'
            }`}
          >
            Overview & Security
          </button>
          <button
            onClick={() => setActiveTab('media')}
            className={`py-3 px-4 font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'media'
                ? 'border-quantum-cyan text-quantum-cyan'
                : 'border-transparent text-wa-textSecondary hover:text-wa-textPrimary'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Shared Media ({mediaMessages.length})</span>
          </button>
          {activeChat.isGroup && (
            <button
              onClick={() => setActiveTab('members')}
              className={`py-3 px-4 font-semibold border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'members'
                  ? 'border-quantum-cyan text-quantum-cyan'
                  : 'border-transparent text-wa-textSecondary hover:text-wa-textPrimary'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Participants ({activeChat.participants?.length || 0})</span>
            </button>
          )}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {activeTab === 'overview' && (
            <>
              {/* Contact Details Card */}
              {!activeChat.isGroup && otherParticipant && (
                <div className="bg-wa-panel/60 p-4 rounded-xl border border-wa-border space-y-3">
                  <div className="text-[11px] text-wa-textSecondary font-semibold uppercase tracking-wider">
                    Contact Information
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center space-x-2.5">
                      <Mail className="w-4 h-4 text-quantum-cyan shrink-0" />
                      <div className="truncate">
                        <span className="text-wa-textSecondary block text-[10px]">Email Address</span>
                        <span className="text-wa-textPrimary select-all font-mono">{otherParticipant.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2.5">
                      <Phone className="w-4 h-4 text-quantum-purple shrink-0" />
                      <div className="truncate">
                        <span className="text-wa-textSecondary block text-[10px]">Phone Number</span>
                        <span className="text-wa-textPrimary font-mono">
                          {otherParticipant.phone || 'Not provided'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quantum Cryptographic Credentials */}
              <div className="bg-wa-panel/60 p-4 rounded-xl border border-wa-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-wa-textSecondary font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-quantum-cyan" /> Quantum Identity & E91 Channel
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      e91.channelStatus === 'PASS'
                        ? 'bg-wa-green/20 text-wa-green border border-wa-green/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {e91.channelStatus}
                  </span>
                </div>

                {/* Public Quantum Identity */}
                {!activeChat.isGroup && otherParticipant && (
                  <div>
                    <span className="text-[10px] text-wa-textSecondary block mb-1">
                      Peer Quantum Signature Public Key:
                    </span>
                    <div className="p-2 bg-wa-surface rounded-lg border border-wa-border flex items-center justify-between font-mono text-[11px] text-quantum-cyan">
                      <span className="truncate mr-2 select-all">
                        {otherParticipant.publicIdentity || 'pk_peer_verified'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(otherParticipant.publicIdentity, 'key')}
                        className="px-2 py-0.5 bg-quantum-cyan/20 hover:bg-quantum-cyan/30 text-quantum-cyan rounded text-[10px] font-bold flex items-center gap-1 transition shrink-0"
                      >
                        {copiedKey ? <Check className="w-3 h-3 text-wa-green" /> : <Copy className="w-3 h-3" />}
                        {copiedKey ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Dynamic E91 Metrics */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-wa-surface p-3 rounded-lg border border-wa-border text-center">
                    <span className="text-[10px] text-wa-textSecondary uppercase font-semibold block">
                      CHSH S-Value
                    </span>
                    <span className="text-xl font-mono font-bold text-wa-textPrimary block my-0.5">
                      {e91.chshS?.toFixed(3) || '2.828'}
                    </span>
                    <span className="text-[10px] text-quantum-cyan">Quantum Bound: 2.828</span>
                  </div>

                  <div className="bg-wa-surface p-3 rounded-lg border border-wa-border text-center">
                    <span className="text-[10px] text-wa-textSecondary uppercase font-semibold block">
                      QBER (Bit Error)
                    </span>
                    <span className="text-xl font-mono font-bold text-wa-textPrimary block my-0.5">
                      {((e91.qberEstimate || 0) * 100).toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-wa-textSecondary">Threshold &le; 8.0%</span>
                  </div>
                </div>

                {/* Session ID */}
                <div className="flex items-center justify-between text-[11px] text-wa-textSecondary pt-1">
                  <span className="font-mono truncate mr-2">
                    Session: {activeChat.securitySession?._id?.substring(0, 18) || 'qds_sess_active'}...
                  </span>
                  <button
                    onClick={() => handleCopy(activeChat.securitySession?._id || activeChat._id, 'session')}
                    className="text-quantum-cyan hover:underline flex items-center gap-1 font-semibold"
                  >
                    {copiedSession ? 'Copied ID' : 'Copy Session'}
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'media' && (
            <div className="space-y-4">
              {mediaMessages.length === 0 ? (
                <div className="text-center py-12 text-wa-textSecondary bg-wa-panel/40 rounded-xl border border-wa-border">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-40 text-quantum-cyan" />
                  <p className="text-sm font-semibold text-wa-textPrimary">No Shared Media Yet</p>
                  <p className="text-xs mt-1">Photos and documents sent in this chat will appear here.</p>
                </div>
              ) : (
                <>
                  {/* Images Gallery */}
                  {imageMessages.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-wa-textPrimary mb-2 flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-quantum-cyan" /> Photos ({imageMessages.length})
                      </h4>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {imageMessages.map((msg) => {
                          const fullUrl = resolveMediaUrl(msg.mediaUrl);
                          return (
                            <a
                              key={msg._id}
                              href={fullUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="aspect-square rounded-lg overflow-hidden border border-wa-border group relative block bg-black/40"
                            >
                              <img
                                src={fullUrl}
                                alt="shared"
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                                <ExternalLink className="w-4 h-4" />
                              </div>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Documents List */}
                  {docMessages.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-wa-textPrimary mb-2 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-quantum-purple" /> Documents ({docMessages.length})
                      </h4>
                      <div className="space-y-2">
                        {docMessages.map((msg) => {
                          const fullUrl = resolveMediaUrl(msg.mediaUrl);
                          return (
                            <a
                              key={msg._id}
                              href={fullUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2.5 bg-wa-panel hover:bg-wa-hover border border-wa-border rounded-xl flex items-center justify-between transition group"
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <div className="p-2 bg-quantum-purple/20 text-quantum-purple rounded-lg shrink-0">
                                  <FileText className="w-4 h-4" />
                                </div>
                                <div className="truncate">
                                  <span className="text-wa-textPrimary font-medium block truncate text-xs">
                                    {msg.mediaFilename || 'Quantum Document'}
                                  </span>
                                  <span className="text-[10px] text-wa-textSecondary font-mono">
                                    {new Date(msg.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <Download className="w-4 h-4 text-wa-textSecondary group-hover:text-wa-textPrimary shrink-0 ml-2" />
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'members' && activeChat.isGroup && (
            <div className="space-y-3">
              <div className="text-[11px] text-wa-textSecondary font-semibold uppercase tracking-wider mb-2">
                Group Members ({activeChat.participants?.length || 0})
              </div>
              <div className="space-y-2">
                {activeChat.participants?.map((participant) => {
                  const myParticipantId = String(currentUser?.id || currentUser?._id || '');
                  const isMe = String(participant?._id || participant?.id || participant) === myParticipantId;
                  const memberFallbackSeed = participant?.email || participant?.name || 'user';
                  const resolvedMemberAvatar = getResolvedAvatar(participant?.avatarUrl, memberFallbackSeed, participant?.name);

                  return (
                    <div
                      key={participant._id || participant.id}
                      className="p-2.5 bg-wa-panel/60 border border-wa-border rounded-xl flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={resolvedMemberAvatar}
                          alt={participant.name}
                          onError={(e) => handleAvatarError(e, memberFallbackSeed, participant.name)}
                          className="w-9 h-9 rounded-full object-cover border border-wa-border bg-wa-panel"
                        />
                        <div>
                          <span className="text-wa-textPrimary font-semibold text-xs block leading-tight">
                            {participant.name} {isMe && <span className="text-wa-green text-[10px] font-normal">(You)</span>}
                          </span>
                          <span className="text-[10px] text-wa-textSecondary truncate max-w-[200px] block">
                            {participant.statusBio || 'Secured with QDS'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        {participant.isOnline ? (
                          <span className="text-[10px] text-wa-green font-medium flex items-center gap-1 justify-end">
                            <span className="w-1.5 h-1.5 rounded-full bg-wa-green" /> online
                          </span>
                        ) : (
                          <span className="text-[10px] text-wa-textSecondary">offline</span>
                        )}
                      </div>
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
