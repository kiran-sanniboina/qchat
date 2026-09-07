import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Paperclip,
  Smile,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Check,
  CheckCheck,
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  Radio,
  Lock,
  Download,
  Info,
  Zap,
  MoreVertical,
  Trash2,
  Ban,
  UserCheck,
  X,
  AlertCircle,
  Loader2,
  Archive,
  User
} from 'lucide-react';
import api from '../api';

export default function ChatWindow({
  activeChat,
  currentUser,
  messages,
  typingStatus,
  onSendMessage,
  onOpenSecurityDashboard,
  onSelectMessageVerification,
  onUpdateCurrentUser,
  onClearChat,
  onOpenChatProfile,
  onOpenBackup
}) {
  const [inputText, setInputText] = useState('');
  const [selectedAttack, setSelectedAttack] = useState(''); // '' for normal
  const [uploading, setUploading] = useState(false);
  const [showAttackPicker, setShowAttackPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [sending, setSending] = useState(false);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const menuRef = useRef(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingStatus]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    const messageText = inputText.trim();
    const attackSim = selectedAttack || undefined;

    setSending(true);
    setInputText('');
    setSelectedAttack('');
    setShowAttackPicker(false);

    try {
      await onSendMessage({
        message: messageText,
        simulateAttack: attackSim
      });
    } catch (err) {
      setInputText(messageText);
      if (attackSim) setSelectedAttack(attackSim);
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const { mediaUrl, mediaType, filename } = res.data;
      onSendMessage({
        message: '',
        mediaUrl,
        mediaType,
        mediaFilename: filename,
        simulateAttack: selectedAttack || undefined
      });
      setSelectedAttack('');
    } catch (err) {
      alert('Upload failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const otherParticipant = activeChat?.isGroup
    ? null
    : activeChat?.participants?.find((p) => p._id !== currentUser.id);

  const isContactBlocked = Boolean(
    !activeChat?.isGroup &&
    otherParticipant &&
    currentUser?.blockedUsers?.some(
      (id) => (id._id || id).toString() === otherParticipant._id.toString()
    )
  );

  const handleClearChat = async () => {
    try {
      setClearing(true);
      await api.put(`/chats/${activeChat._id}/clear`);
      if (onClearChat) {
        onClearChat(activeChat._id);
      }
      setShowClearModal(false);
      setShowMenu(false);
    } catch (err) {
      alert('Failed to clear chat: ' + (err.response?.data?.error || err.message));
    } finally {
      setClearing(false);
    }
  };

  const handleToggleBlock = async () => {
    if (!otherParticipant) return;
    try {
      setBlocking(true);
      if (isContactBlocked) {
        const res = await api.post('/auth/unblock', { targetUserId: otherParticipant._id });
        if (onUpdateCurrentUser) {
          onUpdateCurrentUser({ blockedUsers: res.data.blockedUsers });
        }
      } else {
        const res = await api.post('/auth/block', { targetUserId: otherParticipant._id });
        if (onUpdateCurrentUser) {
          onUpdateCurrentUser({ blockedUsers: res.data.blockedUsers });
        }
      }
      setShowMenu(false);
    } catch (err) {
      alert('Action failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setBlocking(false);
    }
  };

  const title = activeChat?.isGroup ? activeChat.name : (otherParticipant?.name || 'Unknown User');
  const avatar = activeChat?.isGroup
    ? activeChat.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${activeChat._id}`
    : (otherParticipant?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${otherParticipant?.email}`);

  const isOtherUserTyping = typingStatus?.chatId === activeChat?._id && typingStatus?.isTyping;

  const renderDeliveryIcon = (msg) => {
    const state = msg.deliveryState;
    const isSender = msg.senderId?._id === currentUser.id || msg.senderId === currentUser.id;

    if (state === 'rejected') {
      return (
        <span
          onClick={(e) => { e.stopPropagation(); onSelectMessageVerification(msg); }}
          className="inline-flex items-center gap-0.5 text-red-400 font-medium cursor-pointer hover:underline"
          title="QDS Rejected! Click for threat evidence"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
          <span className="text-[10px]">REJECTED</span>
        </span>
      );
    }

    if (state === 'verified') {
      return (
        <span
          onClick={(e) => { e.stopPropagation(); onSelectMessageVerification(msg); }}
          className="inline-flex items-center gap-0.5 text-quantum-cyan cursor-pointer hover:brightness-125"
          title="QDS Teleportation Verified! Click to inspect Pauli states"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-wa-green" />
          <CheckCheck className="w-3.5 h-3.5 text-quantum-cyan" />
        </span>
      );
    }

    if (isSender) {
      if (state === 'read') {
        return <CheckCheck className="w-3.5 h-3.5 text-sky-400" />;
      }
      if (state === 'delivered') {
        return <CheckCheck className="w-3.5 h-3.5 text-wa-textSecondary" />;
      }
      return <Check className="w-3.5 h-3.5 text-wa-textSecondary" />;
    }

    return null;
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-wa-bg relative select-none">
      {/* Chat Window Header */}
      <div className="h-16 px-4 bg-wa-surface flex items-center justify-between border-b border-wa-border shrink-0 z-10">
        {/* Clickable Header for Contact / Chat Profile */}
        <div
          onClick={onOpenChatProfile}
          title="Click to view Contact & Quantum Security Details"
          className="flex items-center space-x-3.5 cursor-pointer group p-1 -ml-1 rounded-xl hover:bg-wa-hover/60 transition"
        >
          <div className="relative">
            <img
              src={avatar}
              alt={title}
              className="w-10 h-10 rounded-full object-cover border border-wa-border group-hover:border-quantum-cyan transition bg-wa-bg"
            />
            {!activeChat?.isGroup && (
              <span
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-wa-surface ${
                  otherParticipant?.isOnline ? 'bg-wa-green' : 'bg-wa-textSecondary/60'
                }`}
              />
            )}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white leading-tight group-hover:text-quantum-cyan transition">
              {title}
            </h2>
            <p className="text-[11px] text-wa-textSecondary flex items-center gap-1.5 font-medium">
              {isOtherUserTyping ? (
                <span className="text-wa-green animate-pulse font-semibold">typing...</span>
              ) : otherParticipant?.isOnline ? (
                <span className="text-wa-green flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-wa-green" /> online
                </span>
              ) : (
                <span>last seen recently</span>
              )}
            </p>
          </div>
        </div>

        {/* Security & Action Buttons */}
        <div className="flex items-center space-x-3">
          {/* Active E91 Status Pill */}
          <button
            onClick={onOpenSecurityDashboard}
            className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full bg-wa-panel hover:bg-wa-hover border border-quantum-cyan/30 text-xs transition"
          >
            <Shield className="w-3.5 h-3.5 text-quantum-cyan" />
            <span className="font-mono text-quantum-cyan text-[11px]">
              S = {activeChat?.e91Status?.chshS?.toFixed(2) || '2.82'}
            </span>
            <span className="w-2 h-2 rounded-full bg-wa-green" />
          </button>

          {/* Drawer Toggle */}
          <button
            onClick={onOpenSecurityDashboard}
            title="Open Quantum Security Dashboard"
            className="p-2 hover:bg-wa-hover text-quantum-cyan rounded-full transition flex items-center gap-1.5 text-xs font-semibold"
          >
            <ShieldCheck className="w-5 h-5 text-wa-green" />
            <span className="hidden md:inline text-white">Security Panel</span>
          </button>

          {/* Options Dropdown Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              title="More options"
              className={`p-2 rounded-full transition ${
                showMenu ? 'bg-wa-hover text-white' : 'hover:bg-wa-hover text-wa-textSecondary hover:text-white'
              }`}
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-11 w-52 bg-wa-surface border border-wa-border rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    if (onOpenChatProfile) onOpenChatProfile();
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs text-white hover:bg-wa-hover flex items-center gap-2.5 transition"
                >
                  <User className="w-4 h-4 text-quantum-cyan" />
                  <span>{activeChat?.isGroup ? 'Group Details' : 'Contact Info & Security'}</span>
                </button>

                <button
                  onClick={() => {
                    setShowMenu(false);
                    if (onOpenBackup) onOpenBackup(activeChat);
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs text-white hover:bg-wa-hover flex items-center gap-2.5 transition"
                >
                  <Archive className="w-4 h-4 text-quantum-cyan" />
                  <span>Backup Chat</span>
                </button>

                <div className="border-t border-wa-border my-1" />

                <button
                  onClick={() => {
                    setShowClearModal(true);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs text-white hover:bg-wa-hover flex items-center gap-2.5 transition"
                >
                  <Trash2 className="w-4 h-4 text-wa-textSecondary" />
                  <span>Clear Chat</span>
                </button>

                {!activeChat?.isGroup && (
                  <button
                    onClick={handleToggleBlock}
                    disabled={blocking}
                    className={`w-full px-4 py-2.5 text-left text-xs flex items-center gap-2.5 transition ${
                      isContactBlocked
                        ? 'text-wa-green hover:bg-wa-hover'
                        : 'text-red-400 hover:bg-wa-hover'
                    }`}
                  >
                    {isContactBlocked ? (
                      <>
                        <UserCheck className="w-4 h-4 text-wa-green" />
                        <span>Unblock Contact</span>
                      </>
                    ) : (
                      <>
                        <Ban className="w-4 h-4 text-red-400" />
                        <span>Block Contact</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages Stream with WhatsApp Doodle Pattern */}
      <div className="flex-1 overflow-y-auto wa-chat-bg p-4 space-y-3">
        {/* End-to-End Quantum Security Notice */}
        <div className="max-w-md mx-auto bg-wa-panel/90 border border-wa-border rounded-lg p-2.5 text-center shadow-md my-2">
          <div className="flex items-center justify-center gap-1.5 text-amber-300 text-xs font-semibold mb-1">
            <Lock className="w-3.5 h-3.5" /> Quantum End-to-End Encryption
          </div>
          <p className="text-[11px] text-wa-textSecondary leading-relaxed">
            Messages are encrypted with AES-256-GCM and bound to simulated Pauli eigenstates via quantum teleportation. E91 channel actively monitored ($S \approx 2.82$).
          </p>
        </div>

        {/* Messages List */}
        {messages.map((msg) => {
          const isSender = msg.senderId?._id === currentUser.id || msg.senderId === currentUser.id;
          const isRejected = msg.deliveryState === 'rejected';

          return (
            <div
              key={msg._id}
              className={`flex flex-col ${isSender ? 'items-end' : 'items-start'} group`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[70%] rounded-lg px-3 py-2 text-sm shadow relative transition ${
                  isRejected
                    ? 'bg-red-950/60 border border-red-500/50 text-red-200'
                    : isSender
                    ? 'bg-wa-outgoing text-white'
                    : 'bg-wa-incoming text-white'
                }`}
              >
                {/* Sender Name in Group Chat */}
                {activeChat?.isGroup && !isSender && (
                  <div className="text-[11px] font-semibold text-quantum-cyan mb-1">
                    {msg.senderId?.name || 'Group Member'}
                  </div>
                )}

                {/* Media Attachment Rendering */}
                {msg.mediaUrl && (() => {
                  const mediaFullUrl = msg.mediaUrl.startsWith('http')
                    ? msg.mediaUrl
                    : `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')}${msg.mediaUrl}`;

                  return (
                    <div className="mb-2 rounded overflow-hidden">
                      {msg.mediaType === 'image' ? (
                        <img
                          src={mediaFullUrl}
                          alt="attachment"
                          className="max-h-60 rounded object-cover cursor-pointer hover:opacity-95 transition"
                          onClick={() => window.open(mediaFullUrl, '_blank')}
                        />
                      ) : (
                        <a
                          href={mediaFullUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 p-2 bg-wa-bg/60 rounded border border-wa-border text-xs hover:bg-wa-bg transition"
                        >
                          <FileText className="w-5 h-5 text-quantum-cyan shrink-0" />
                          <span className="truncate max-w-xs">{msg.mediaFilename || 'Download Attachment'}</span>
                          <Download className="w-4 h-4 text-wa-textSecondary ml-auto" />
                        </a>
                      )}
                    </div>
                  );
                })()}

                {/* Message Body */}
                {msg.isDeletedForEveryone ? (
                  <span className="italic text-wa-textSecondary/80 text-xs">
                    This message was deleted
                  </span>
                ) : (
                  <div className="break-words leading-relaxed whitespace-pre-wrap">
                    {msg.plaintextPreview}
                  </div>
                )}

                {/* Threat Warning Callout if Rejected */}
                {isRejected && (
                  <div className="mt-2 pt-2 border-t border-red-500/30 text-[11px] text-red-300 flex items-start gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Threat Detected: </span>
                      {msg.qdsVerification?.detectedAttack} &mdash; {msg.qdsVerification?.reason}
                    </div>
                  </div>
                )}

                {/* Message Footer: Timestamp + QDS Status Badge */}
                <div className="flex items-center justify-end space-x-1.5 mt-1 text-[11px] text-wa-textSecondary/90 font-medium">
                  <span>
                    {new Date(msg.createdAt || msg.sentAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  {renderDeliveryIcon(msg)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Attack Simulator Bar for Demo Mode */}
      {showAttackPicker && (
        <div className="p-3 bg-red-950/40 border-t border-red-500/40 animate-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-red-300 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              DEMO ATTACK SIMULATOR (Test Deterministic Threat Engine)
            </span>
            <button
              onClick={() => setShowAttackPicker(false)}
              className="text-xs text-wa-textSecondary hover:text-white"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
            {[
              { id: '', label: 'Normal (Legitimate)', color: 'text-wa-green' },
              { id: 'FORGERY', label: 'Signature Forgery', color: 'text-red-400' },
              { id: 'REPLAY', label: 'Replay Attack', color: 'text-amber-400' },
              { id: 'IMPERSONATION', label: 'Impersonation', color: 'text-red-400' },
              { id: 'CHANNEL_MANIPULATION', label: 'Channel Manipulation', color: 'text-purple-400' },
              { id: 'PASSIVE_EAVESDROP', label: 'Passive Eavesdropping', color: 'text-cyan-400' },
              { id: 'UNAUTHORIZED_VERIFICATION', label: 'Unauthorized Verifier', color: 'text-yellow-400' },
              { id: 'TAMPERING', label: 'Classical Tampering', color: 'text-red-400' }
            ].map((att) => (
              <button
                key={att.id}
                type="button"
                onClick={() => { setSelectedAttack(att.id); setShowAttackPicker(false); }}
                className={`px-2.5 py-1.5 rounded border text-left truncate transition ${
                  selectedAttack === att.id
                    ? 'bg-red-500/30 border-red-400 text-white font-bold'
                    : 'bg-wa-surface border-wa-border hover:bg-wa-hover text-wa-textPrimary'
                }`}
              >
                <span className={`font-semibold mr-1 ${att.color}`}>•</span>
                {att.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Attack Notification Banner */}
      {selectedAttack && (
        <div className="px-4 py-1.5 bg-red-900/60 border-t border-red-500/50 flex items-center justify-between text-xs text-red-200">
          <span>
            ⚠️ Next send will simulate attack: <strong className="text-white">{selectedAttack}</strong>
          </span>
          <button
            onClick={() => setSelectedAttack('')}
            className="text-red-300 hover:text-white underline font-semibold"
          >
            Cancel simulation
          </button>
        </div>
      )}

      {/* Blocked Contact Warning Bar or Input Bar */}
      {isContactBlocked ? (
        <div className="h-16 px-6 bg-red-950/40 border-t border-red-500/40 flex items-center justify-between shrink-0 animate-in fade-in">
          <div className="flex items-center gap-2.5 text-xs text-red-200">
            <Ban className="w-5 h-5 text-red-400 shrink-0" />
            <span>You have blocked this contact. Unblock to send messages.</span>
          </div>
          <button
            type="button"
            onClick={handleToggleBlock}
            disabled={blocking}
            className="px-3.5 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 hover:text-white rounded-lg text-xs font-semibold transition"
          >
            {blocking ? 'Updating...' : 'Unblock Contact'}
          </button>
        </div>
      ) : (
        /* Message Input Bar */
        <div className="h-16 px-4 bg-wa-surface flex items-center space-x-3 border-t border-wa-border shrink-0">
          {/* Attack Demo Toggle */}
          <button
            type="button"
            onClick={() => setShowAttackPicker(!showAttackPicker)}
            title="Demo Attack Simulator"
            className={`p-2 rounded-full transition flex items-center gap-1 ${
              selectedAttack
                ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                : 'hover:bg-wa-hover text-wa-textSecondary hover:text-amber-400'
            }`}
          >
            <Zap className="w-5 h-5" />
          </button>

          {/* Attachment Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            title="Attach Image or Document"
            className="p-2 hover:bg-wa-hover text-wa-textSecondary hover:text-white rounded-full transition disabled:opacity-50"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt"
          />

          {/* Text Input Form */}
          <form onSubmit={handleSend} className="flex-1 flex items-center space-x-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                selectedAttack
                  ? `Type message (will simulate ${selectedAttack})...`
                  : 'Type a message (secured by QDS)...'
              }
              className="w-full bg-wa-panel border border-wa-border rounded-lg px-4 py-2.5 text-sm text-white placeholder-wa-textSecondary focus:outline-none focus:border-wa-green transition"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || sending}
              className="p-2.5 bg-wa-green hover:bg-wa-greenHover text-white rounded-full shadow-md transition disabled:opacity-40 disabled:hover:bg-wa-green shrink-0"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
        </div>
      )}

      {/* Clear Chat Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-wa-surface border border-wa-border max-w-sm w-full rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-white">Clear this chat?</h3>
              <p className="text-xs text-wa-textSecondary leading-relaxed">
                Messages will be removed for your account. This will not affect other participants in this chat.
              </p>
            </div>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                disabled={clearing}
                className="px-4 py-2 bg-wa-panel hover:bg-wa-hover text-white text-xs font-semibold rounded-lg transition border border-wa-border"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearChat}
                disabled={clearing}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition shadow-md flex items-center gap-1.5"
              >
                {clearing ? 'Clearing...' : 'Clear Chat'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

