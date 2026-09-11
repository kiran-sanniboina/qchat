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
  Video,
  Mic,
  Music,
  Play,
  Pause,
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
  MessageSquarePlus,
  Settings,
  MapPin,
  Phone,
  Mail,
  Star,
  CornerUpLeft,
  Copy,
  Edit3,
  Forward,
  Sparkles,
  ExternalLink,
  ChevronDown,
  CheckCircle2,
  HardDrive
} from 'lucide-react';
import api from '../api';
import { getResolvedAvatar, getResolvedMediaUrl, handleAvatarError } from '../utils/avatarHelper';
import VoiceRecorder from './VoiceRecorder';
import EmojiStickerPicker from './EmojiStickerPicker';
import LocationShareModal from './LocationShareModal';
import ContactShareModal from './ContactShareModal';
import ForwardModal from './ForwardModal';

// Audio and Voice Note Player Subcomponent
function AudioMessagePlayer({ url, isVoice, filename }) {
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const val = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center space-x-2.5 p-2 bg-black/25 rounded-xl max-w-xs min-w-[210px] border border-white/10 my-1">
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setPlaying(false)}
      />
      <button
        type="button"
        onClick={togglePlay}
        className="w-8 h-8 rounded-full bg-wa-green hover:bg-wa-greenHover text-white flex items-center justify-center shrink-0 shadow transition active:scale-95"
      >
        {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0 flex flex-col justify-center space-y-1">
        <input
          type="range"
          min="0"
          max={duration || 1}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          className="w-full accent-wa-green h-1.5 bg-white/20 rounded-lg cursor-pointer"
        />
        <div className="flex items-center justify-between text-[10px] text-wa-textSecondary font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="p-1.5 rounded-full bg-white/10 text-quantum-cyan shrink-0" title={isVoice ? 'Voice Note' : 'Audio'}>
        {isVoice ? <Mic className="w-3.5 h-3.5 text-wa-green" /> : <Music className="w-3.5 h-3.5 text-quantum-cyan" />}
      </div>
    </div>
  );
}

// Lightbox Image Preview Modal
function LightboxModal({ url, filename, onClose }) {
  if (!url) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in select-none"
      onClick={onClose}
    >
      <div className="absolute top-4 right-4 flex items-center space-x-3 z-10" onClick={(e) => e.stopPropagation()}>
        <a
          href={url}
          download={filename || 'image'}
          target="_blank"
          rel="noreferrer"
          className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition shadow"
          title="Download full size"
        >
          <Download className="w-5 h-5" />
        </a>
        <button
          type="button"
          onClick={onClose}
          className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition shadow"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <img
        src={url}
        alt="Preview"
        className="max-h-[85vh] max-w-[92vw] object-contain rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

export default function ChatWindow({
  activeChat,
  currentUser,
  messages = [],
  typingStatus,
  chats = [],
  onSelectChat,
  onOpenNewChat,
  onSendMessage,
  onOpenSecurityDashboard,
  onSelectMessageVerification,
  onUpdateCurrentUser,
  onClearChat,
  onDeleteMessage,
  onOpenChatProfile,
  onOpenUserProfile,
  onOpenBackup,
  onOpenStorageManager,
  onOpenStarredMessages,
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

  // Rich Media & Modern Actions State
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [messageToForward, setMessageToForward] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [activeBubbleMenuId, setActiveBubbleMenuId] = useState(null);
  const [deleteModalData, setDeleteModalData] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const hasValidReply = (reply) => {
    if (!reply) return false;
    const hasMsgId = Boolean(reply.messageId?._id || reply.messageId);
    const hasText = Boolean(reply.textPreview && typeof reply.textPreview === 'string' && reply.textPreview.trim().length > 0);
    const hasMedia = Boolean(reply.mediaType && reply.mediaType !== 'none');
    return hasMsgId || hasText || hasMedia;
  };

  const fileInputRef = useRef(null);
  const docInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const menuRef = useRef(null);
  const attachMenuRef = useRef(null);

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
    isSwipingRef.current = touch.clientX < 85;
  };

  const handleTouchEnd = (e) => {
    if (!onBack || !isSwipingRef.current) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartXRef.current;
    const deltaY = touch.clientY - touchStartYRef.current;
    const deltaTime = Date.now() - touchStartTimeRef.current;

    if (deltaX > 70 && Math.abs(deltaY) < 60 && deltaTime < 450) {
      onBack();
    }
    isSwipingRef.current = false;
  };

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target)) {
        setShowAttachMenu(false);
      }
      if (!e.target.closest('.bubble-menu-container')) {
        setActiveBubbleMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollToBottom = (smooth = false) => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    if (document.body) document.body.scrollTop = 0;
    if (document.documentElement) document.documentElement.scrollTop = 0;
    scrollToBottom(false);
  }, [activeChat?._id]);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages?.length, typingStatus]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  // Send or Edit Message
  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || sending) return;

    // Handle Edit Mode Save
    if (editingMessage) {
      try {
        setSending(true);
        await api.put(`/messages/${editingMessage._id}`, {
          message: inputText.trim()
        });
        setEditingMessage(null);
        setInputText('');
        showToast('Message updated');
      } catch (err) {
        alert('Failed to edit message: ' + (err.response?.data?.error || err.message));
      } finally {
        setSending(false);
      }
      return;
    }

    const messageText = inputText.trim();
    const attackSim = selectedAttack || undefined;
    const currentReply = replyingTo;

    setSending(true);
    setInputText('');
    setSelectedAttack('');
    setShowAttackPicker(false);
    setReplyingTo(null);

    try {
      await onSendMessage({
        message: messageText,
        replyTo: hasValidReply(currentReply) ? currentReply : undefined,
        simulateAttack: attackSim
      });
    } catch (err) {
      setInputText(messageText);
      setReplyingTo(currentReply);
      if (attackSim) setSelectedAttack(attackSim);
    } finally {
      setSending(false);
    }
  };

  // Upload Media
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setShowAttachMenu(false);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const { mediaUrl, mediaType, filename, size } = res.data;
      await onSendMessage({
        message: '',
        mediaUrl,
        mediaType,
        mediaFilename: filename,
        fileSize: size || file.size,
        replyTo: hasValidReply(replyingTo) ? replyingTo : undefined,
        simulateAttack: selectedAttack || undefined
      });
      setReplyingTo(null);
      setSelectedAttack('');
    } catch (err) {
      alert('Upload failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (docInputRef.current) docInputRef.current.value = '';
    }
  };

  // Send Location
  const handleSendLocation = async (locationData) => {
    try {
      await onSendMessage({
        message: '',
        mediaType: 'location',
        locationData,
        replyTo: hasValidReply(replyingTo) ? replyingTo : undefined,
        simulateAttack: selectedAttack || undefined
      });
      setReplyingTo(null);
      setSelectedAttack('');
    } catch (err) {
      alert('Failed to share location: ' + err.message);
    }
  };

  // Send Contact
  const handleSendContact = async (contactData) => {
    try {
      await onSendMessage({
        message: '',
        mediaType: 'contact',
        contactData,
        replyTo: hasValidReply(replyingTo) ? replyingTo : undefined,
        simulateAttack: selectedAttack || undefined
      });
      setReplyingTo(null);
      setSelectedAttack('');
    } catch (err) {
      alert('Failed to share contact: ' + err.message);
    }
  };

  // Send Voice Message
  const handleSendVoice = async (voicePayload) => {
    try {
      await onSendMessage({
        ...voicePayload,
        replyTo: hasValidReply(replyingTo) ? replyingTo : undefined,
        simulateAttack: selectedAttack || undefined
      });
      setShowVoiceRecorder(false);
      setReplyingTo(null);
      setSelectedAttack('');
    } catch (err) {
      alert('Failed to send voice note: ' + err.message);
    }
  };

  // Send Sticker
  const handleSelectSticker = async (sticker) => {
    try {
      await onSendMessage({
        message: `${sticker.visual} ${sticker.title} - ${sticker.subtitle}`,
        mediaType: 'sticker',
        replyTo: hasValidReply(replyingTo) ? replyingTo : undefined,
        simulateAttack: selectedAttack || undefined
      });
      setShowEmojiPicker(false);
      setReplyingTo(null);
    } catch (err) {
      alert('Failed to send sticker: ' + err.message);
    }
  };

  // Emoji selection from picker
  const handleSelectEmoji = (emoji) => {
    setInputText((prev) => prev + emoji);
  };

  // Quick Emoji Reaction
  const handleReact = async (msgId, emoji) => {
    setActiveBubbleMenuId(null);
    try {
      await api.put(`/messages/${msgId}/react`, { emoji });
    } catch (err) {
      console.error('Failed to react:', err);
    }
  };

  // Toggle Star
  const handleToggleStar = async (msgId) => {
    setActiveBubbleMenuId(null);
    try {
      const res = await api.put(`/messages/${msgId}/star`);
      showToast(res.data.isStarred ? 'Message starred ⭐' : 'Message unstarred');
    } catch (err) {
      alert('Failed to toggle star: ' + (err.response?.data?.error || err.message));
    }
  };

  // Copy Message Text
  const handleCopy = (text) => {
    setActiveBubbleMenuId(null);
    navigator.clipboard.writeText(text);
    showToast('Message copied to clipboard');
  };

  // Start Quoted Reply
  const handleStartReply = (msg) => {
    setActiveBubbleMenuId(null);
    setReplyingTo({
      messageId: msg._id,
      senderName: msg.senderId?.name || 'User',
      textPreview: msg.plaintextPreview || `[Media: ${msg.mediaType}]`,
      mediaType: msg.mediaType
    });
  };

  // Start Edit
  const handleStartEdit = (msg) => {
    setActiveBubbleMenuId(null);
    setEditingMessage(msg);
    setInputText(msg.plaintextPreview || '');
  };

  // Delete Message
  const handleDeleteMessage = async (deleteForEveryone) => {
    if (!deleteModalData) return;
    try {
      await api.delete(`/messages/${deleteModalData.messageId}`, {
        data: { deleteForEveryone }
      });
      if (onDeleteMessage) {
        onDeleteMessage(deleteModalData.messageId, deleteForEveryone);
      }
      setDeleteModalData(null);
      showToast(deleteForEveryone ? 'Deleted for everyone' : 'Deleted for you');
    } catch (err) {
      alert('Failed to delete: ' + (err.response?.data?.error || err.message));
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
    const isSender = String(msg.senderId?._id || msg.senderId) === myId;

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
        return <CheckCheck className="w-3.5 h-3.5 text-sky-400" title="Read" />;
      }
      if (state === 'delivered') {
        return <CheckCheck className="w-3.5 h-3.5 text-wa-textSecondary" title="Delivered" />;
      }
      return <Check className="w-3.5 h-3.5 text-wa-textSecondary" title="Sent" />;
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

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="flex-1 h-full w-full flex flex-col bg-wa-bg relative select-none min-h-0 overflow-hidden"
    >
      {/* Real-time Toast Confirmation */}
      {toastMsg && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-wa-panel border border-wa-border text-wa-textPrimary text-xs rounded-full shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-wa-green" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Chat Window Header */}
      <div className="h-14 sm:h-16 px-3 sm:px-4 bg-wa-surface flex items-center justify-between border-b border-wa-border shrink-0 z-20">
        <div className="flex items-center space-x-1 sm:space-x-3 min-w-0">
          {/* Back Button on Mobile */}
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              title="Back to Chats"
              className="md:hidden p-2 -ml-1 mr-0.5 text-wa-textSecondary hover:text-wa-textPrimary rounded-full hover:bg-wa-hover transition shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-wa-textSecondary hover:text-wa-textPrimary" />
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
              <h2 className="text-sm font-semibold text-wa-textPrimary leading-tight group-hover:text-quantum-cyan transition truncate max-w-[120px] xs:max-w-[160px] sm:max-w-[280px] md:max-w-none">
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
            <span className="hidden md:inline text-wa-textPrimary">Security Panel</span>
          </button>

          {/* Options Dropdown Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              title="More options"
              className={`p-2 rounded-full transition ${
                showMenu ? 'bg-wa-hover text-wa-textPrimary' : 'hover:bg-wa-hover text-wa-textSecondary hover:text-wa-textPrimary'
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
                  className="w-full px-4 py-2.5 text-left text-xs text-wa-textPrimary hover:bg-wa-hover flex items-center gap-2.5 transition"
                >
                  <User className="w-4 h-4 text-quantum-cyan" />
                  <span>{activeChat?.isGroup ? 'Group Details' : 'Contact Info & Security'}</span>
                </button>

                {onOpenStorageManager && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onOpenStorageManager();
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs text-wa-textPrimary hover:bg-wa-hover flex items-center gap-2.5 transition"
                  >
                    <HardDrive className="w-4 h-4 text-quantum-cyan" />
                    <span>Storage Manager</span>
                  </button>
                )}

                {onOpenStarredMessages && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onOpenStarredMessages();
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs text-wa-textPrimary hover:bg-wa-hover flex items-center gap-2.5 transition"
                  >
                    <Star className="w-4 h-4 fill-amber-400/40 text-amber-400" />
                    <span>Starred Messages</span>
                  </button>
                )}

                {onOpenUserProfile && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onOpenUserProfile();
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs text-wa-textPrimary hover:bg-wa-hover flex items-center gap-2.5 transition"
                  >
                    <Settings className="w-4 h-4 text-wa-green" />
                    <span>My Profile Settings</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowMenu(false);
                    if (onOpenBackup) onOpenBackup(activeChat);
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs text-wa-textPrimary hover:bg-wa-hover flex items-center gap-2.5 transition"
                >
                  <Archive className="w-4 h-4 text-quantum-cyan" />
                  <span>Backup & Restore</span>
                </button>

                <div className="border-t border-wa-border my-1" />

                <button
                  onClick={() => {
                    setShowClearModal(true);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs text-wa-textPrimary hover:bg-wa-hover flex items-center gap-2.5 transition"
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
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-wa-panel hover:bg-wa-hover text-wa-textSecondary hover:text-wa-textPrimary text-[11px] font-medium shrink-0 border border-wa-border transition"
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
                      ? 'bg-wa-green/20 border border-wa-green/70 text-wa-textPrimary shadow-sm ring-1 ring-wa-green/40 font-medium'
                      : 'bg-wa-panel/80 hover:bg-wa-panel border border-wa-border/60 text-wa-textSecondary hover:text-wa-textPrimary'
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
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto wa-chat-bg p-4 space-y-3 min-h-0">
        {/* End-to-End Quantum Security Notice */}
        <div className="flex justify-center my-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-wa-panel/90 border border-wa-border rounded-lg text-amber-300 text-xs font-semibold shadow-sm">
            <Lock className="w-3.5 h-3.5" />
            <span>Quantum End-to-End Encryption</span>
          </div>
        </div>

        {/* Messages List */}
        {messages.map((msg) => {
          const isSender = String(msg.senderId?._id || msg.senderId) === myId;
          const isRejected = msg.deliveryState === 'rejected';
          const isStarred = (msg.starredBy || []).some((uid) => String(uid?._id || uid) === myId);
          const isMenuOpen = activeBubbleMenuId === msg._id;
          const canEdit = isSender && !msg.isDeletedForEveryone && (Date.now() - new Date(msg.createdAt).getTime() <= 15 * 60 * 1000);

          // Aggregate emoji reaction counts
          const reactionCounts = {};
          (msg.reactions || []).forEach((r) => {
            reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
          });

          return (
            <div
              key={msg._id}
              id={`msg-${msg._id}`}
              className={`flex flex-col ${isSender ? 'items-end' : 'items-start'} group relative`}
            >
              {/* Floating Quick Action Toolbar (Reactions & Menu) */}
              <div
                className={`opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute -top-8 ${
                  isSender ? 'right-2' : 'left-2'
                } z-10 flex items-center bg-wa-surface/95 border border-wa-border rounded-full px-1.5 py-0.5 shadow-xl space-x-0.5 bubble-menu-container`}
              >
                {/* 6 Quick Reactions */}
                {['👍', '❤️', '😂', '😮', '😢', '🙏'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleReact(msg._id, emoji)}
                    className="hover:scale-125 transition-transform p-1 text-sm rounded-full"
                    title={`React ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}

                <div className="h-3 w-[1px] bg-wa-border mx-0.5" />

                {/* Reply */}
                <button
                  type="button"
                  onClick={() => handleStartReply(msg)}
                  className="p-1 text-wa-textSecondary hover:text-wa-textPrimary rounded-full hover:bg-wa-hover transition"
                  title="Reply"
                >
                  <CornerUpLeft className="w-3.5 h-3.5" />
                </button>

                {/* Star */}
                <button
                  type="button"
                  onClick={() => handleToggleStar(msg._id)}
                  className={`p-1 rounded-full hover:bg-wa-hover transition ${isStarred ? 'text-amber-400' : 'text-wa-textSecondary hover:text-wa-textPrimary'}`}
                  title={isStarred ? 'Unstar' : 'Star message'}
                >
                  <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-amber-400' : ''}`} />
                </button>

                {/* Bubble Menu Toggle */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setActiveBubbleMenuId(isMenuOpen ? null : msg._id)}
                    className="p-1 text-wa-textSecondary hover:text-wa-textPrimary rounded-full hover:bg-wa-hover transition"
                    title="More actions"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>

                  {/* Bubble Menu Popup */}
                  {isMenuOpen && (
                    <div className="absolute right-0 top-7 w-36 bg-wa-surface border border-wa-border rounded-xl shadow-2xl py-1 z-50 text-xs text-wa-textPrimary animate-in fade-in zoom-in-95">
                      <button
                        type="button"
                        onClick={() => handleStartReply(msg)}
                        className="w-full px-3 py-1.5 text-left hover:bg-wa-hover flex items-center gap-2"
                      >
                        <CornerUpLeft className="w-3.5 h-3.5 text-quantum-cyan" /> Reply
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveBubbleMenuId(null);
                          setMessageToForward(msg);
                        }}
                        className="w-full px-3 py-1.5 text-left hover:bg-wa-hover flex items-center gap-2"
                      >
                        <Forward className="w-3.5 h-3.5 text-quantum-cyan" /> Forward
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.plaintextPreview)}
                        className="w-full px-3 py-1.5 text-left hover:bg-wa-hover flex items-center gap-2"
                      >
                        <Copy className="w-3.5 h-3.5 text-wa-textSecondary" /> Copy text
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleStar(msg._id)}
                        className="w-full px-3 py-1.5 text-left hover:bg-wa-hover flex items-center gap-2 text-amber-400"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-400/30" /> {isStarred ? 'Unstar' : 'Star message'}
                      </button>

                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => handleStartEdit(msg)}
                          className="w-full px-3 py-1.5 text-left hover:bg-wa-hover flex items-center gap-2 text-wa-green"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-wa-green" /> Edit message
                        </button>
                      )}

                      <div className="border-t border-wa-border my-1" />

                      <button
                        type="button"
                        onClick={() => {
                          setActiveBubbleMenuId(null);
                          setDeleteModalData({ messageId: msg._id, isSender });
                        }}
                        className="w-full px-3 py-1.5 text-left hover:bg-wa-hover flex items-center gap-2 text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete...
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-3.5 py-2 text-sm shadow-md relative transition ${
                  isRejected
                    ? 'bg-red-950/70 border border-red-500/50 text-red-200'
                    : isSender
                    ? 'bg-wa-outgoing text-wa-textPrimary rounded-tr-none'
                    : 'bg-wa-incoming text-wa-textPrimary rounded-tl-none'
                }`}
              >
                {/* Forwarded Header */}
                {msg.isForwarded && (
                  <div className="text-[10px] italic text-wa-textSecondary flex items-center gap-1 mb-1">
                    <Forward className="w-3 h-3 text-wa-textSecondary" />
                    <span>Forwarded</span>
                  </div>
                )}

                {/* Sender Name in Group Chat */}
                {activeChat?.isGroup && !isSender && (
                  <div className="text-[11px] font-semibold text-quantum-cyan mb-1">
                    {msg.senderId?.name || 'Group Member'}
                  </div>
                )}

                {/* Quoted Message Box (Reply to) */}
                {hasValidReply(msg.replyTo) && (
                  <div
                    onClick={() => {
                      const quoteId = msg.replyTo.messageId?._id || msg.replyTo.messageId;
                      if (quoteId) {
                        const target = document.getElementById(`msg-${quoteId}`);
                        if (target) {
                          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }
                    }}
                    className="p-2 mb-2 rounded-lg bg-black/30 border-l-4 border-wa-green cursor-pointer hover:bg-black/40 transition text-xs"
                  >
                    <span className="font-bold text-wa-green block text-[11px]">
                      {msg.replyTo.senderName || 'Replying'}
                    </span>
                    <span className="text-wa-textSecondary line-clamp-2 text-[11px]">
                      {msg.replyTo.textPreview || (msg.replyTo.mediaType && msg.replyTo.mediaType !== 'none' ? `[${msg.replyTo.mediaType}]` : '')}
                    </span>
                  </div>
                )}

                {/* Rich Media: Images */}
                {msg.mediaUrl && msg.mediaType === 'image' && (() => {
                  const fullUrl = getResolvedMediaUrl(msg.mediaUrl);
                  return (
                    <div className="mb-2 rounded-xl overflow-hidden cursor-pointer group/img relative">
                      <img
                        src={fullUrl}
                        alt="attachment"
                        className="max-h-72 w-full object-cover rounded-xl hover:scale-[1.01] transition duration-200"
                        onClick={() => setLightboxImage({ url: fullUrl, filename: msg.mediaFilename })}
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center pointer-events-none">
                        <span className="p-2 rounded-full bg-black/60 text-white text-xs flex items-center gap-1 font-semibold">
                          <ImageIcon className="w-3.5 h-3.5" /> View
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Rich Media: Videos */}
                {msg.mediaUrl && msg.mediaType === 'video' && (() => {
                  const fullUrl = getResolvedMediaUrl(msg.mediaUrl);
                  return (
                    <div className="mb-2 rounded-xl overflow-hidden bg-black">
                      <video
                        controls
                        playsInline
                        src={fullUrl}
                        className="max-h-72 w-full rounded-xl object-contain bg-black"
                      />
                    </div>
                  );
                })()}

                {/* Rich Media: Voice Notes & Audio */}
                {msg.mediaUrl && (msg.mediaType === 'voice' || msg.mediaType === 'audio') && (() => {
                  const fullUrl = getResolvedMediaUrl(msg.mediaUrl);
                  return (
                    <AudioMessagePlayer
                      url={fullUrl}
                      isVoice={msg.mediaType === 'voice'}
                      filename={msg.mediaFilename}
                    />
                  );
                })()}

                {/* Rich Media: Documents */}
                {msg.mediaUrl && msg.mediaType === 'document' && (() => {
                  const fullUrl = getResolvedMediaUrl(msg.mediaUrl);
                  return (
                    <a
                      href={fullUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2.5 p-2.5 bg-black/10 dark:bg-black/25 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/15 dark:hover:bg-black/35 transition my-1"
                    >
                      <div className="w-9 h-9 rounded-lg bg-quantum-cyan/20 border border-quantum-cyan/40 flex items-center justify-center text-quantum-cyan shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-wa-textPrimary block truncate text-xs">
                          {msg.mediaFilename || 'Download Document'}
                        </span>
                        {msg.fileSize > 0 && (
                          <span className="text-[10px] text-wa-textSecondary block font-mono">
                            {formatFileSize(msg.fileSize)}
                          </span>
                        )}
                      </div>
                      <Download className="w-4 h-4 text-wa-textSecondary shrink-0 ml-1" />
                    </a>
                  );
                })()}

                {/* Rich Media: Location */}
                {msg.mediaType === 'location' && msg.locationData && (
                  <div className="rounded-xl overflow-hidden bg-black/5 dark:bg-black/25 border border-black/10 dark:border-white/10 p-3 my-1 space-y-2">
                    <div className="flex items-start space-x-2">
                      <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-wa-textPrimary block text-xs truncate">
                          {msg.locationData.name || 'Shared Location'}
                        </span>
                        <span className="text-[11px] text-wa-textSecondary block mt-0.5 truncate">
                          {msg.locationData.address || `Lat: ${msg.locationData.latitude}, Lng: ${msg.locationData.longitude}`}
                        </span>
                      </div>
                    </div>

                    <a
                      href={`https://www.google.com/maps?q=${msg.locationData.latitude},${msg.locationData.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-center py-1.5 bg-wa-surface hover:bg-wa-hover text-quantum-cyan rounded-lg font-semibold text-xs transition border border-wa-border"
                    >
                      Open in Google Maps &rarr;
                    </a>
                  </div>
                )}

                {/* Rich Media: Contact Card */}
                {msg.mediaType === 'contact' && msg.contactData && (
                  <div className="rounded-xl overflow-hidden bg-black/5 dark:bg-black/25 border border-black/10 dark:border-white/10 p-3 my-1 space-y-2.5">
                    <div className="flex items-center space-x-3">
                      <img
                        src={getResolvedAvatar(msg.contactData.avatarUrl, msg.contactData.email || msg.contactData.name, msg.contactData.name)}
                        alt={msg.contactData.name}
                        className="w-10 h-10 rounded-full object-cover bg-wa-surface border border-wa-border shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-wa-textPrimary block text-xs truncate">
                          {msg.contactData.name}
                        </span>
                        {msg.contactData.phone && (
                          <span className="text-[11px] text-quantum-cyan flex items-center gap-1 font-mono mt-0.5 truncate">
                            <Phone className="w-3 h-3 text-wa-green shrink-0" />
                            {msg.contactData.phone}
                          </span>
                        )}
                        {msg.contactData.email && (
                          <span className="text-[10px] text-wa-textSecondary flex items-center gap-1 mt-0.5 truncate">
                            <Mail className="w-3 h-3 shrink-0" />
                            {msg.contactData.email}
                          </span>
                        )}
                      </div>
                    </div>

                    {msg.contactData.phone && (
                      <a
                        href={`tel:${msg.contactData.phone}`}
                        className="block text-center py-1.5 bg-wa-green/20 hover:bg-wa-green/30 border border-wa-green/40 text-wa-green font-semibold rounded-lg text-xs transition"
                      >
                        Call Contact
                      </a>
                    )}
                  </div>
                )}

                {/* Rich Media: Sticker */}
                {msg.mediaType === 'sticker' && (
                  <div className="py-2 text-center my-1">
                    <div className="text-4xl drop-shadow-md">{msg.plaintextPreview?.split(' ')?.[0] || '✨'}</div>
                    <div className="text-[11px] text-quantum-cyan font-semibold mt-1">
                      {msg.plaintextPreview?.split(' ').slice(1).join(' ') || 'Quantum Sticker'}
                    </div>
                  </div>
                )}

                {/* Message Plaintext Body */}
                {msg.mediaType !== 'sticker' && (
                  <>
                    {msg.isDeletedForEveryone ? (
                      <span className="italic text-wa-textSecondary/80 text-xs flex items-center gap-1">
                        <Ban className="w-3.5 h-3.5 text-wa-textSecondary/70" />
                        <span>This message was deleted</span>
                      </span>
                    ) : (
                      msg.plaintextPreview && (
                        <div className="break-words leading-relaxed whitespace-pre-wrap">
                          {msg.plaintextPreview}
                        </div>
                      )
                    )}
                  </>
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

                {/* Footer: Timestamp, Edited badge, Star, Delivery Status */}
                <div className="flex items-center justify-end space-x-1.5 mt-1 text-[11px] text-wa-textSecondary/90 font-medium">
                  {msg.isEdited && (
                    <span className="text-[10px] text-wa-textSecondary/75 italic" title={`Edited ${msg.editedAt ? new Date(msg.editedAt).toLocaleTimeString() : ''}`}>
                      (edited)
                    </span>
                  )}
                  {isStarred && (
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" title="Starred" />
                  )}
                  <span>
                    {new Date(msg.createdAt || msg.sentAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  {renderDeliveryIcon(msg)}
                </div>
              </div>

              {/* Emoji Reaction Counter Badges Beneath Bubble */}
              {Object.keys(reactionCounts).length > 0 && (
                <div
                  className={`flex flex-wrap gap-1 mt-1 ${
                    isSender ? 'justify-end pr-1' : 'justify-start pl-1'
                  }`}
                >
                  {Object.entries(reactionCounts).map(([emoji, count]) => {
                    const userReacted = (msg.reactions || []).some(
                      (r) => r.emoji === emoji && String(r.userId?._id || r.userId) === myId
                    );
                    return (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleReact(msg._id, emoji)}
                        className={`px-1.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 border transition shadow-sm ${
                          userReacted
                            ? 'bg-quantum-cyan/20 border-quantum-cyan/50 text-wa-textPrimary'
                            : 'bg-wa-surface border-wa-border text-wa-textSecondary hover:text-wa-textPrimary'
                        }`}
                        title={`${count} reactions. Click to toggle.`}
                      >
                        <span>{emoji}</span>
                        {count > 1 && <span className="text-[10px] font-mono">{count}</span>}
                      </button>
                    );
                  })}
                </div>
              )}
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
              className="text-xs text-wa-textSecondary hover:text-wa-textPrimary shrink-0"
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

      {/* Replying Banner Above Input */}
      {replyingTo && (
        <div className="px-4 py-2 bg-wa-panel border-t border-wa-border flex items-center justify-between animate-in slide-in-from-bottom-2">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-1 h-8 bg-wa-green rounded-full shrink-0" />
            <div className="min-w-0">
              <span className="text-xs font-bold text-wa-green block leading-tight">
                Replying to {replyingTo.senderName}
              </span>
              <span className="text-[11px] text-wa-textSecondary truncate block">
                {replyingTo.textPreview}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setReplyingTo(null)}
            className="p-1 text-wa-textSecondary hover:text-wa-textPrimary rounded-full transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Editing Message Banner Above Input */}
      {editingMessage && (
        <div className="px-4 py-2 bg-amber-950/60 border-t border-amber-500/50 flex items-center justify-between animate-in slide-in-from-bottom-2">
          <div className="flex items-center space-x-2 text-xs text-amber-200 min-w-0">
            <Edit3 className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-semibold">Editing message</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingMessage(null);
              setInputText('');
            }}
            className="text-xs text-amber-300 hover:text-white underline font-semibold"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Blocked Contact Warning Bar or Message Input Bar */}
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
      ) : showVoiceRecorder ? (
        /* In-Line Voice Recorder Bar */
        <div className="p-2 bg-wa-surface border-t border-wa-border flex items-center shrink-0 z-20">
          <VoiceRecorder
            onSendVoice={handleSendVoice}
            onCancel={() => setShowVoiceRecorder(false)}
          />
        </div>
      ) : (
        /* Regular Message Input Bar */
        <div className="min-h-[54px] sm:min-h-[58px] py-1.5 sm:py-2 px-2 sm:px-3 bg-wa-surface flex items-center space-x-1.5 sm:space-x-2 border-t border-wa-border shrink-0 z-20 relative">
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

          {/* Emoji & Sticker Picker Toggle */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="Emojis & Stickers"
            className={`p-2 rounded-full transition shrink-0 ${
              showEmojiPicker ? 'text-wa-green bg-wa-hover' : 'text-wa-textSecondary hover:text-wa-textPrimary hover:bg-wa-hover'
            }`}
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Attachment Paperclip Menu Trigger */}
          <div className="relative" ref={attachMenuRef}>
            <button
              type="button"
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              disabled={uploading}
              title="Attach media, location, contact, document"
              className={`p-2 rounded-full transition shrink-0 ${
                showAttachMenu ? 'text-quantum-cyan bg-wa-hover' : 'text-wa-textSecondary hover:text-wa-textPrimary hover:bg-wa-hover'
              }`}
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {/* Attachment Dropdown Popover */}
            {showAttachMenu && (
              <div className="absolute bottom-12 left-0 w-48 bg-wa-surface border border-wa-border rounded-2xl shadow-2xl p-2 z-50 space-y-1 animate-in fade-in zoom-in-95">
                {/* Photos & Videos */}
                <button
                  type="button"
                  onClick={() => {
                    setShowAttachMenu(false);
                    fileInputRef.current?.click();
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-xs rounded-xl hover:bg-wa-hover text-wa-textPrimary transition"
                >
                  <div className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <span>Photos & Videos</span>
                </button>

                {/* Documents */}
                <button
                  type="button"
                  onClick={() => {
                    setShowAttachMenu(false);
                    docInputRef.current?.click();
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-xs rounded-xl hover:bg-wa-hover text-wa-textPrimary transition"
                >
                  <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span>Document</span>
                </button>

                {/* Location */}
                <button
                  type="button"
                  onClick={() => {
                    setShowAttachMenu(false);
                    setShowLocationModal(true);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-xs rounded-xl hover:bg-wa-hover text-wa-textPrimary transition"
                >
                  <div className="w-7 h-7 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span>Location</span>
                </button>

                {/* Contact */}
                <button
                  type="button"
                  onClick={() => {
                    setShowAttachMenu(false);
                    setShowContactModal(true);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-xs rounded-xl hover:bg-wa-hover text-wa-textPrimary transition"
                >
                  <div className="w-7 h-7 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <span>Contact Card</span>
                </button>
              </div>
            )}
          </div>

          {/* Hidden File Inputs */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,video/*"
          />
          <input
            type="file"
            ref={docInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.zip,.csv,.xls,.xlsx"
          />

          {/* Text Input Form */}
          <form onSubmit={handleSend} className="flex-1 flex items-center space-x-1.5 sm:space-x-2 min-w-0">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onFocus={() => setTimeout(() => scrollToBottom(true), 200)}
              placeholder={
                selectedAttack
                  ? `Simulating ${selectedAttack}...`
                  : editingMessage
                  ? 'Edit your message...'
                  : 'Type a message...'
              }
              className="w-full bg-wa-panel border border-wa-border rounded-xl px-3.5 py-2 sm:py-2.5 text-sm text-wa-textPrimary placeholder-wa-textSecondary focus:outline-none focus:border-wa-green transition min-w-0"
            />

            {/* If input has text or user is editing -> Show Send Button. Otherwise show Voice Note Mic Button */}
            {inputText.trim() || editingMessage ? (
              <button
                type="submit"
                disabled={!inputText.trim() || sending}
                className="p-2 sm:p-2.5 bg-wa-green hover:bg-wa-greenHover text-white rounded-full shadow-md transition disabled:opacity-40 disabled:hover:bg-wa-green shrink-0"
                title={editingMessage ? 'Save Edit' : 'Send message'}
              >
                {sending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : editingMessage ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowVoiceRecorder(true)}
                className="p-2 sm:p-2.5 bg-wa-green hover:bg-wa-greenHover text-white rounded-full shadow-md transition shrink-0"
                title="Record voice message"
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
          </form>
        </div>
      )}

      {/* Emoji & Sticker Picker Popover */}
      {showEmojiPicker && (
        <EmojiStickerPicker
          onSelectEmoji={handleSelectEmoji}
          onSelectSticker={handleSelectSticker}
          onClose={() => setShowEmojiPicker(false)}
        />
      )}

      {/* Location Share Modal */}
      {showLocationModal && (
        <LocationShareModal
          onSendLocation={handleSendLocation}
          onClose={() => setShowLocationModal(false)}
        />
      )}

      {/* Contact Share Modal */}
      {showContactModal && (
        <ContactShareModal
          chats={chats}
          currentUser={currentUser}
          onSendContact={handleSendContact}
          onClose={() => setShowContactModal(false)}
        />
      )}

      {/* Forward Message Modal */}
      {messageToForward && (
        <ForwardModal
          message={messageToForward}
          chats={chats}
          currentUser={currentUser}
          onForwarded={() => showToast('Message forwarded')}
          onClose={() => setMessageToForward(null)}
        />
      )}

      {/* Lightbox Image Preview Modal */}
      {lightboxImage && (
        <LightboxModal
          url={lightboxImage.url}
          filename={lightboxImage.filename}
          onClose={() => setLightboxImage(null)}
        />
      )}

      {/* Delete Message Confirmation Modal */}
      {deleteModalData && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-wa-surface border border-wa-border max-w-xs w-full rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="font-bold text-wa-textPrimary text-sm">Delete message?</h4>
              <p className="text-xs text-wa-textSecondary">
                Choose whether to delete this message for everyone or only for yourself.
              </p>
            </div>
            <div className="space-y-2 pt-1">
              {deleteModalData.isSender && (
                <button
                  type="button"
                  onClick={() => handleDeleteMessage(true)}
                  className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow"
                >
                  Delete for everyone
                </button>
              )}
              <button
                type="button"
                onClick={() => handleDeleteMessage(false)}
                className="w-full py-2 bg-wa-panel hover:bg-wa-hover text-wa-textPrimary rounded-xl text-xs font-semibold border border-wa-border transition"
              >
                Delete for me
              </button>
              <button
                type="button"
                onClick={() => setDeleteModalData(null)}
                className="w-full py-2 text-wa-textSecondary hover:text-wa-textPrimary rounded-xl text-xs transition"
              >
                Cancel
              </button>
            </div>
          </div>
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
              <h3 className="text-base font-bold text-wa-textPrimary">Clear this chat?</h3>
              <p className="text-xs text-wa-textSecondary leading-relaxed">
                Messages will be removed for your account. This will not affect other participants in this chat.
              </p>
            </div>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                disabled={clearing}
                className="px-4 py-2 bg-wa-panel hover:bg-wa-hover text-wa-textPrimary text-xs font-semibold rounded-lg transition border border-wa-border"
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
                  <h3 className="text-sm font-bold text-wa-textPrimary">Switch Conversation</h3>
                  <p className="text-[11px] text-wa-textSecondary">
                    {chats?.length || 0} active {chats?.length === 1 ? 'chat' : 'chats'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickSwitcher(false)}
                className="p-1.5 rounded-full hover:bg-wa-hover text-wa-textSecondary hover:text-wa-textPrimary transition"
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
                  className="w-full bg-transparent text-xs text-wa-textPrimary placeholder-wa-textSecondary focus:outline-none"
                  autoFocus
                />
                {quickSwitcherSearch && (
                  <button
                    type="button"
                    onClick={() => setQuickSwitcherSearch('')}
                    className="p-1 text-wa-textSecondary hover:text-wa-textPrimary"
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
                          <h4 className={`text-xs font-semibold truncate pr-2 ${isCurrent ? 'text-wa-green' : 'text-wa-textPrimary'}`}>
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
                className="flex-1 py-2 bg-wa-panel hover:bg-wa-hover border border-wa-border text-wa-textPrimary text-xs font-medium rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> All Chats
              </button>
              {onOpenUserProfile && (
                <button
                  type="button"
                  onClick={() => {
                    setShowQuickSwitcher(false);
                    onOpenUserProfile();
                  }}
                  className="py-2 px-3 bg-wa-panel hover:bg-wa-hover border border-wa-border text-wa-textPrimary text-xs font-medium rounded-xl transition flex items-center justify-center gap-1.5"
                  title="Open My Profile Settings"
                >
                  <User className="w-3.5 h-3.5 text-wa-green" /> Profile
                </button>
              )}
              {onOpenNewChat && (
                <button
                  type="button"
                  onClick={() => {
                    setShowQuickSwitcher(false);
                    onOpenNewChat();
                  }}
                  className="py-2 px-3 bg-wa-green hover:bg-wa-greenHover text-white text-xs font-medium rounded-xl transition flex items-center justify-center gap-1.5 shadow"
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
