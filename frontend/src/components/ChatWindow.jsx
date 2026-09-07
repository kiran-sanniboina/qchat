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
  User,
  ArrowLeft,
  ArrowLeftRight,
  Search,
  MessageSquarePlus
} from 'lucide-react';
import api from '../api';
import { getResolvedAvatar, getResolvedMediaUrl, handleAvatarError } from '../utils/avatarHelper';

export default function ChatWindow({
  activeChat,
  currentUser,
  messages,
  typingStatus,
  chats = [],
  onSelectChat,
  onOpenNewChat,
  onSendMessage,
  onOpenSecurityDashboard,
  onSelectMessageVerification,
  onUpdateCurrentUser,
  onClearChat,
  onOpenChatProfile,
  onOpenBackup,
  onBack
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
  const [showQuickSwitcher, setShowQuickSwitcher] = useState(false);
  const [quickSwitcherSearch, setQuickSwitcherSearch] = useState('');

  // Touch swipe gesture handling for mobile: swipe right from edge to go back
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const touchStartTimeRef = useRef(0);
  const isSwipingRef = useRef(false);

  const handleTouchStart = (e) => {
    if (!onBack) return;
    const touch = e.touches[0];
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
    touchStartTimeRef.current = Date.now();
    // Only arm swipe if started within 85px of left screen edge
    isSwipingRef.current = touch.clientX < 85;
  };

  const handleTouchEnd = (e) => {
    if (!onBack || !isSwipingRef.current) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartXRef.current;
    const deltaY = touch.clientY - touchStartYRef.current;
    const deltaTime = Date.now() - touchStartTimeRef.current;

    // Trigger back if swiped right by at least 70px horizontally, low vertical drift, under 450ms
    if (deltaX > 70 && Math.abs(deltaY) < 60 && deltaTime < 450) {
      onBack();
    }
    isSwipingRef.current = false;
  };

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

  const myId = String(currentUser?.id || currentUser?._id || '');
  const otherParticipant = activeChat?.isGroup
    ? null
    : activeChat?.participants?.find((p) => String(p?._id || p?.id || p) !== myId);

  const otherParticipantId = otherParticipant ? String(otherParticipant._id || otherParticipant.id || otherParticipant) : '';

  const isContactBlocked = Boolean(
    !activeChat?.isGroup &&
    otherParticipantId &&
    currentUser?.blockedUsers?.some(
      (id) => String(id?._id || id?.id || id) === otherParticipantId
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
  const rawAvatar = activeChat?.isGroup ? activeChat.avatar : otherParticipant?.avatarUrl;
  const fallbackSeed = activeChat?.isGroup ? activeChat._id : (otherParticipant?.email || title);
  const avatar = getResolvedAvatar(rawAvatar, fallbackSeed, title);

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

  const filteredSwitcherChats = (chats || []).filter((chat) => {
    if (!quickSwitcherSearch.trim()) return true;
    const name = chat.isGroup
      ? chat.name
      : chat.participants?.find((p) => String(p?._id || p?.id || p) !== myId)?.name || '';
    return name.toLowerCase().includes(quickSwitcherSearch.toLowerCase());
  });

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="flex-1 h-full flex flex-col bg-wa-bg relative select-none"
    >
      {/* Chat Window Header */}
      <div className="h-16 px-3 sm:px-4 bg-wa-surface flex items-center justify-between border-b border-wa-border shrink-0 z-10">
        <div className="flex items-center space-x-1 sm:space-x-3 min-w-0">
          {/* Back Button on Mobile */}
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              title="Back to Chats"
              className="md:hidden p-2 -ml-1 mr-0.5 text-wa-textSecondary hover:text-white rounded-full hover:bg-wa-hover transition shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-wa-textSecondary hover:text-white" />
            </button>
          )}

          {/* Clickable Header for Contact / Chat Profile */}
          <div
            onClick={onOpenChatProfile}
            title="Click to view Contact & Quantum Security Details"
            className="flex items-center space-x-2.5 sm:space-x-3.5 cursor-pointer group p-1 -ml-1 rounded-xl hover:bg-wa-hover/60 transition min-w-0"
          >
            <div className="relative shrink-0">
              <img
                src={avatar}
                alt={title}
                onError={(e) => handleAvatarError(e, fallbackSeed, title)}
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
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-white leading-tight group-hover:text-quantum-cyan transition truncate max-w-[120px] xs:max-w-[160px] sm:max-w-[280px] md:max-w-none">
                {title}
              </h2>
              <p className="text-[11px] text-wa-textSecondary flex items-center gap-1.5 font-medium truncate">
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
        </div>

        {/* Security & Action Buttons */}
        <div className="flex items-center space-x-1 sm:space-x-3">
          {/* Mobile Quick Switcher Trigger */}
          <button
            type="button"
            onClick={() => setShowQuickSwitcher(true)}
            title="Quick switch conversation"
            className="md:hidden p-2 hover:bg-wa-hover text-quantum-cyan rounded-full transition shrink-0"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>

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
                    setShowQuickSwitcher(true);
                  }}
                  className="md:hidden w-full px-4 py-2.5 text-left text-xs text-quantum-cyan hover:bg-wa-hover flex items-center gap-2.5 transition font-medium"
                >
                  <ArrowLeftRight className="w-4 h-4 text-quantum-cyan" />
                  <span>Switch Conversation</span>
                </button>

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

      {/* Mobile Quick-Switch Avatar Ribbon */}
      {chats && chats.length > 1 && (
        <div className="md:hidden bg-wa-surface/95 border-b border-wa-border/80 px-2.5 py-1.5 flex items-center space-x-2 overflow-x-auto no-scrollbar shrink-0 z-10">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-wa-panel hover:bg-wa-hover text-wa-textSecondary hover:text-white text-[11px] font-medium shrink-0 border border-wa-border transition"
            title="All Chats"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>All</span>
            <span className="text-[10px] text-quantum-cyan bg-quantum-cyan/10 px-1 py-0.2 rounded-full border border-quantum-cyan/20 ml-0.5 font-mono">
              {chats.length}
            </span>
          </button>

          <div className="h-5 w-[1px] bg-wa-border/60 shrink-0" />

          {/* Horizontal Chat Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
            {chats.map((chat) => {
              const isCurrent = chat._id === activeChat._id;
              const other = chat.isGroup
                ? null
                : chat.participants?.find((p) => String(p?._id || p?.id || p) !== myId);
              const name = chat.isGroup ? chat.name : (other?.name || 'User');
              const avatar = getResolvedAvatar(
                chat.isGroup ? chat.avatar : other?.avatarUrl,
                chat.isGroup ? chat._id : (other?.email || name),
                name
              );
              const isOnline = !chat.isGroup && other?.isOnline;

              return (
                <button
                  key={chat._id}
                  type="button"
                  onClick={() => onSelectChat && onSelectChat(chat)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full shrink-0 transition text-left ${
                    isCurrent
                      ? 'bg-wa-green/20 border border-wa-green/70 text-white shadow-sm ring-1 ring-wa-green/40'
                      : 'bg-wa-panel/80 hover:bg-wa-panel border border-wa-border/60 text-wa-textSecondary hover:text-white'
                  }`}
                  title={`Switch to ${name}`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={avatar}
                      alt={name}
                      onError={(e) => handleAvatarError(e, chat.isGroup ? chat._id : (other?.email || name), name)}
                      className="w-5 h-5 rounded-full object-cover bg-wa-bg"
                    />
                    {isOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-wa-green ring-1 ring-wa-panel" />
                    )}
                  </div>
                  <span className={`text-[11px] max-w-[80px] truncate ${isCurrent ? 'text-wa-green font-semibold' : 'font-medium'}`}>
                    {name.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Switch Drawer Button */}
          <button
            type="button"
            onClick={() => setShowQuickSwitcher(true)}
            className="p-1 rounded-full bg-wa-panel hover:bg-wa-hover text-quantum-cyan border border-wa-border/60 shrink-0 transition ml-auto"
            title="Search and switch conversations"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

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
                  const mediaFullUrl = getResolvedMediaUrl(msg.mediaUrl);

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
        <div className="p-3 bg-red-950/40 border-t border-red-500/40 max-h-48 overflow-y-auto animate-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-red-300 flex items-center gap-1.5 truncate pr-2">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <span>DEMO ATTACK SIMULATOR</span>
            </span>
            <button
              onClick={() => setShowAttackPicker(false)}
              className="text-xs text-wa-textSecondary hover:text-white shrink-0"
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
                className={`px-2 py-1.5 rounded border text-left truncate transition ${
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
        <div className="px-3 sm:px-4 py-1.5 bg-red-900/60 border-t border-red-500/50 flex items-center justify-between text-xs text-red-200">
          <span className="truncate pr-2">
            ⚠️ Simulating: <strong className="text-white">{selectedAttack}</strong>
          </span>
          <button
            onClick={() => setSelectedAttack('')}
            className="text-red-300 hover:text-white underline font-semibold shrink-0"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Blocked Contact Warning Bar or Input Bar */}
      {isContactBlocked ? (
        <div className="h-16 px-4 sm:px-6 bg-red-950/40 border-t border-red-500/40 flex items-center justify-between shrink-0 animate-in fade-in">
          <div className="flex items-center gap-2 text-xs text-red-200 truncate pr-2">
            <Ban className="w-4 h-4 text-red-400 shrink-0" />
            <span className="truncate">You have blocked this contact.</span>
          </div>
          <button
            type="button"
            onClick={handleToggleBlock}
            disabled={blocking}
            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 hover:text-white rounded-lg text-xs font-semibold transition shrink-0"
          >
            {blocking ? 'Updating...' : 'Unblock'}
          </button>
        </div>
      ) : (
        /* Message Input Bar */
        <div className="min-h-[56px] py-2 px-2 sm:px-4 bg-wa-surface flex items-center space-x-1.5 sm:space-x-3 border-t border-wa-border shrink-0">
          {/* Attack Demo Toggle */}
          <button
            type="button"
            onClick={() => setShowAttackPicker(!showAttackPicker)}
            title="Demo Attack Simulator"
            className={`p-2 rounded-full transition flex items-center gap-1 shrink-0 ${
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
            className="p-2 hover:bg-wa-hover text-wa-textSecondary hover:text-white rounded-full transition disabled:opacity-50 shrink-0"
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
          <form onSubmit={handleSend} className="flex-1 flex items-center space-x-1.5 sm:space-x-2 min-w-0">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                selectedAttack
                  ? `Simulating ${selectedAttack}...`
                  : 'Type a message...'
              }
              className="w-full bg-wa-panel border border-wa-border rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-white placeholder-wa-textSecondary focus:outline-none focus:border-wa-green transition min-w-0"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || sending}
              className="p-2 sm:p-2.5 bg-wa-green hover:bg-wa-greenHover text-white rounded-full shadow-md transition disabled:opacity-40 disabled:hover:bg-wa-green shrink-0"
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

      {/* Mobile Quick Switcher Sheet / Drawer */}
      {showQuickSwitcher && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setShowQuickSwitcher(false)}
        >
          <div
            className="bg-wa-surface border border-wa-border w-full sm:max-w-md max-h-[85vh] sm:max-h-[80vh] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Pull Indicator for Mobile */}
            <div className="w-12 h-1 rounded-full bg-wa-border mx-auto mt-3 mb-1 sm:hidden shrink-0" />

            {/* Header */}
            <div className="p-3.5 border-b border-wa-border flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-quantum-cyan/10 border border-quantum-cyan/30 flex items-center justify-center text-quantum-cyan">
                  <ArrowLeftRight className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Switch Conversation</h3>
                  <p className="text-[11px] text-wa-textSecondary">
                    {chats?.length || 0} active {chats?.length === 1 ? 'chat' : 'chats'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickSwitcher(false)}
                className="p-1.5 rounded-full hover:bg-wa-hover text-wa-textSecondary hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Filter */}
            <div className="p-3 border-b border-wa-border bg-wa-panel shrink-0">
              <div className="flex items-center bg-wa-surface rounded-lg px-3 py-1.5 border border-wa-border focus-within:border-quantum-cyan">
                <Search className="w-4 h-4 text-wa-textSecondary mr-2 shrink-0" />
                <input
                  type="text"
                  value={quickSwitcherSearch}
                  onChange={(e) => setQuickSwitcherSearch(e.target.value)}
                  placeholder="Filter conversations..."
                  className="w-full bg-transparent text-xs text-white placeholder-wa-textSecondary focus:outline-none"
                  autoFocus
                />
                {quickSwitcherSearch && (
                  <button
                    type="button"
                    onClick={() => setQuickSwitcherSearch('')}
                    className="p-1 text-wa-textSecondary hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto divide-y divide-wa-border/40 p-2 space-y-0.5">
              {filteredSwitcherChats.length === 0 ? (
                <div className="py-8 text-center text-wa-textSecondary text-xs">
                  No conversations match "{quickSwitcherSearch}".
                </div>
              ) : (
                filteredSwitcherChats.map((chat) => {
                  const isCurrent = chat._id === activeChat._id;
                  const other = chat.isGroup
                    ? null
                    : chat.participants?.find((p) => String(p?._id || p?.id || p) !== myId);
                  const name = chat.isGroup ? chat.name : (other?.name || 'User');
                  const avatar = getResolvedAvatar(
                    chat.isGroup ? chat.avatar : other?.avatarUrl,
                    chat.isGroup ? chat._id : (other?.email || name),
                    name
                  );
                  const isOnline = !chat.isGroup && other?.isOnline;
                  const lastMsg = chat.lastMessage;

                  return (
                    <div
                      key={chat._id}
                      onClick={() => {
                        if (onSelectChat) onSelectChat(chat);
                        setShowQuickSwitcher(false);
                      }}
                      className={`flex items-center px-3 py-2.5 rounded-xl cursor-pointer transition ${
                        isCurrent
                          ? 'bg-wa-active border border-wa-green/40 shadow-sm'
                          : 'hover:bg-wa-hover'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0 mr-3">
                        <img
                          src={avatar}
                          alt={name}
                          onError={(e) => handleAvatarError(e, chat.isGroup ? chat._id : (other?.email || name), name)}
                          className="w-10 h-10 rounded-full object-cover bg-wa-bg border border-wa-border"
                        />
                        {isOnline && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-wa-green border-2 border-wa-surface" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={`text-xs font-semibold truncate pr-2 ${isCurrent ? 'text-wa-green' : 'text-white'}`}>
                            {name}
                          </h4>
                          {isCurrent && (
                            <span className="text-[10px] font-bold text-wa-green uppercase tracking-wider bg-wa-green/15 px-1.5 py-0.5 rounded border border-wa-green/30">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-wa-textSecondary truncate mt-0.5">
                          {lastMsg ? (
                            lastMsg.plaintextPreview || (lastMsg.mediaUrl ? `[Media: ${lastMsg.mediaType}]` : 'Encrypted message')
                          ) : (
                            <span className="italic text-quantum-cyan/70">Quantum channel ready</span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Actions */}
            <div className="p-3 border-t border-wa-border bg-wa-surface flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowQuickSwitcher(false);
                  if (onBack) onBack();
                }}
                className="flex-1 py-2 bg-wa-panel hover:bg-wa-hover border border-wa-border text-white text-xs font-medium rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> View All in Sidebar
              </button>
              {onOpenNewChat && (
                <button
                  type="button"
                  onClick={() => {
                    setShowQuickSwitcher(false);
                    onOpenNewChat();
                  }}
                  className="py-2 px-3.5 bg-wa-green hover:bg-wa-greenHover text-white text-xs font-medium rounded-xl transition flex items-center justify-center gap-1.5 shadow"
                >
                  <MessageSquarePlus className="w-3.5 h-3.5" /> New
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

