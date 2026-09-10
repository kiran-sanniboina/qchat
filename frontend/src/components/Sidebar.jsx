import React, { useState } from 'react';
import {
  MessageSquarePlus,
  MoreVertical,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  LogOut,
  Users,
  Check,
  CheckCheck,
  Sparkles,
  User,
  MessageSquare,
  Settings,
  Pin,
  PinOff,
  BellOff,
  Bell,
  HardDrive,
  Star,
  Trash2,
  Folder,
  Sun,
  Moon
} from 'lucide-react';
import api from '../api';
import { getResolvedAvatar, handleAvatarError } from '../utils/avatarHelper';
import { useTheme } from '../context/ThemeContext';

export default function Sidebar({
  currentUser,
  chats,
  activeChat,
  onSelectChat,
  onOpenNewChatModal,
  onOpenSecurityDashboard,
  onOpenUserProfile,
  onOpenStorageManager,
  onOpenStarredMessages,
  onChatsUpdated,
  onLogout
}) {
  const { theme, toggleTheme, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeFolder, setActiveFolder] = useState('all'); // 'all' | 'unread' | 'groups' | 'pinned'
  const [chatMenuOpenId, setChatMenuOpenId] = useState(null);
  const [muteModalChat, setMuteModalChat] = useState(null);

  const myId = String(currentUser?.id || currentUser?._id || '');

  const handleTogglePin = async (e, chatId) => {
    e.stopPropagation();
    setChatMenuOpenId(null);
    try {
      await api.put(`/chats/${chatId}/pin`);
      if (onChatsUpdated) onChatsUpdated();
    } catch (err) {
      alert('Failed to update pin: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleToggleMute = async (chatId, duration) => {
    try {
      await api.put(`/chats/${chatId}/mute`, { duration });
      setMuteModalChat(null);
      if (onChatsUpdated) onChatsUpdated();
    } catch (err) {
      alert('Failed to update mute: ' + (err.response?.data?.error || err.message));
    }
  };

  const filteredChats = chats.filter((chat) => {
    const otherParticipant = chat.isGroup
      ? null
      : chat.participants?.find((p) => String(p?._id || p?.id || p) !== myId);
    const name = chat.isGroup ? chat.name : (otherParticipant?.name || 'User');

    if (searchQuery.trim() && !name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    if (activeFolder === 'groups') {
      return chat.isGroup;
    }
    if (activeFolder === 'unread') {
      const rawMsg = chat.lastMessage;
      const isDel = Boolean(
        rawMsg?.deletedForUsers &&
        rawMsg.deletedForUsers.some((id) => String(id?._id || id) === myId)
      );
      const lastMsg = isDel ? null : rawMsg;
      const isMyMsg = lastMsg && String(lastMsg.senderId?._id || lastMsg.senderId) === myId;
      return lastMsg && !isMyMsg && lastMsg.deliveryState !== 'read';
    }
    if (activeFolder === 'pinned') {
      return chat.pinnedBy && chat.pinnedBy.some((id) => String(id?._id || id) === myId);
    }

    return true;
  });

  const formatTimestamp = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="w-full md:w-[380px] lg:w-[420px] h-full bg-wa-panel flex flex-col border-r border-wa-border shrink-0 select-none">
      {/* Sidebar Header */}
      <div className="h-16 px-4 bg-wa-surface flex items-center justify-between border-b border-wa-border">
        {/* Current User Info (Clickable for Profile & Details) */}
        <div
          onClick={onOpenUserProfile}
          title="Click to view and edit your profile"
          className="flex items-center space-x-3 cursor-pointer group p-1 -ml-1 rounded-xl hover:bg-wa-hover/70 transition"
        >
          <div className="relative">
            <img
              src={getResolvedAvatar(currentUser?.avatarUrl, currentUser?.email, currentUser?.name)}
              alt={currentUser?.name || 'User'}
              onError={(e) => handleAvatarError(e, currentUser?.email, currentUser?.name)}
              className="w-10 h-10 rounded-full object-cover border border-wa-border group-hover:border-wa-green transition bg-wa-bg"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-wa-green ring-2 ring-wa-surface" title="Online" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-wa-textPrimary leading-tight flex items-center gap-1.5 group-hover:text-wa-green transition truncate max-w-[130px] sm:max-w-[180px]">
              {currentUser.name}
            </span>
            <span className="text-[11px] text-quantum-cyan flex items-center gap-1 font-mono">
              <ShieldCheck className="w-3 h-3 text-wa-green" /> QDS Active
            </span>
          </div>
        </div>

        {/* Action Icons */}
        <div className="flex items-center space-x-1 sm:space-x-1.5 text-wa-textSecondary relative">
          {/* Security Dashboard Button */}
          <button
            onClick={onOpenSecurityDashboard}
            title="Open Quantum Security Dashboard"
            className="p-2 hover:bg-wa-hover hover:text-quantum-cyan rounded-full transition relative group"
          >
            <Shield className="w-5 h-5 text-quantum-cyan" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-quantum-cyan animate-ping" />
          </button>

          {/* Quick Theme Toggle Button (Light/Dark) */}
          <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 hover:bg-wa-hover text-wa-textSecondary hover:text-wa-textPrimary rounded-full transition relative"
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-amber-400 hover:rotate-45 transition-transform duration-300" />
            ) : (
              <Moon className="w-5 h-5 text-indigo-500 hover:-rotate-12 transition-transform duration-300" />
            )}
          </button>

          {/* New Chat Button */}
          <button
            onClick={onOpenNewChatModal}
            title="New Chat / Group"
            className="p-2 hover:bg-wa-hover hover:text-wa-textPrimary rounded-full transition"
          >
            <MessageSquarePlus className="w-5 h-5" />
          </button>

          {/* Menu Dropdown Toggle */}
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            title="Menu"
            className="p-2 hover:bg-wa-hover hover:text-wa-textPrimary rounded-full transition"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {/* Menu Popup */}
          {showDropdown && (
            <div className="absolute right-0 top-12 w-52 bg-wa-surface rounded-lg shadow-xl border border-wa-border py-1.5 z-50 text-sm text-wa-textPrimary animate-in fade-in zoom-in-95">
              <button
                onClick={() => { setShowDropdown(false); onOpenUserProfile(); }}
                className="w-full px-4 py-2 text-left hover:bg-wa-hover flex items-center gap-2.5 text-xs text-wa-textPrimary"
              >
                <User className="w-4 h-4 text-wa-green" /> Profile & Details
              </button>
              <button
                onClick={() => { setShowDropdown(false); toggleTheme(); }}
                className="w-full px-4 py-2 text-left hover:bg-wa-hover flex items-center justify-between text-xs text-wa-textPrimary"
              >
                <div className="flex items-center gap-2.5">
                  {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                  <span>{isDark ? 'Light Theme' : 'Dark Theme'}</span>
                </div>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-wa-bg border border-wa-border text-wa-textSecondary">
                  {theme}
                </span>
              </button>
              <button
                onClick={() => { setShowDropdown(false); onOpenNewChatModal(); }}
                className="w-full px-4 py-2 text-left hover:bg-wa-hover flex items-center gap-2.5 text-xs"
              >
                <Users className="w-4 h-4" /> New Group Chat
              </button>
              {onOpenStorageManager && (
                <button
                  onClick={() => { setShowDropdown(false); onOpenStorageManager(); }}
                  className="w-full px-4 py-2 text-left hover:bg-wa-hover flex items-center gap-2.5 text-xs text-quantum-cyan"
                >
                  <HardDrive className="w-4 h-4 text-quantum-cyan" /> Storage Manager
                </button>
              )}
              {onOpenStarredMessages && (
                <button
                  onClick={() => { setShowDropdown(false); onOpenStarredMessages(); }}
                  className="w-full px-4 py-2 text-left hover:bg-wa-hover flex items-center gap-2.5 text-xs text-amber-400"
                >
                  <Star className="w-4 h-4 fill-amber-400/40" /> Starred Messages
                </button>
              )}
              <button
                onClick={() => { setShowDropdown(false); onOpenSecurityDashboard(); }}
                className="w-full px-4 py-2 text-left hover:bg-wa-hover flex items-center gap-2.5 text-xs text-quantum-cyan"
              >
                <Sparkles className="w-4 h-4" /> Security Dashboard
              </button>
              <div className="border-t border-wa-border my-1" />
              <button
                onClick={() => { setShowDropdown(false); onLogout(); }}
                className="w-full px-4 py-2 text-left hover:bg-wa-hover flex items-center gap-2.5 text-xs text-red-400"
              >
                <LogOut className="w-4 h-4" /> Log out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quantum Channel Global Status Banner */}
      <div
        onClick={onOpenSecurityDashboard}
        className="px-4 py-2.5 bg-gradient-to-r from-wa-surface via-wa-panel to-wa-surface border-b border-wa-border flex items-center justify-between cursor-pointer hover:brightness-110 transition"
      >
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-full bg-quantum-purple/20 border border-quantum-purple/50 flex items-center justify-center text-quantum-cyan">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-wa-textPrimary flex items-center gap-1.5">
              Quantum Entanglement Shield
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-wa-green/20 text-wa-green border border-wa-green/30">
                PASS
              </span>
            </div>
            <div className="text-[11px] text-wa-textSecondary flex items-center gap-2 font-mono">
              <span>CHSH S ≈ 2.82</span>
              <span>•</span>
              <span>QBER: 0.0%</span>
            </div>
          </div>
        </div>
        <span className="text-[11px] text-quantum-cyan hover:underline font-medium">Inspect &rarr;</span>
      </div>

      {/* Search Bar */}
      <div className="p-2 border-b border-wa-border bg-wa-panel">
        <div className="flex items-center bg-wa-surface rounded-lg px-3 py-1.5 focus-within:ring-1 focus-within:ring-wa-green">
          <Search className="w-4 h-4 text-wa-textSecondary mr-2.5 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search or start a new chat"
            className="w-full bg-transparent text-xs text-wa-textPrimary placeholder-wa-textSecondary focus:outline-none"
          />
        </div>
      </div>

      {/* Chat Folders / Filter Tabs */}
      <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-wa-panel border-b border-wa-border overflow-x-auto no-scrollbar shrink-0">
        {[
          { id: 'all', label: 'All', count: chats.length },
          {
            id: 'unread',
            label: 'Unread',
            count: chats.filter((c) => {
              const rawMsg = c.lastMessage;
              const isDel = Boolean(
                rawMsg?.deletedForUsers &&
                rawMsg.deletedForUsers.some((id) => String(id?._id || id) === myId)
              );
              const lastMsg = isDel ? null : rawMsg;
              return (
                lastMsg &&
                String(lastMsg.senderId?._id || lastMsg.senderId) !== myId &&
                lastMsg.deliveryState !== 'read'
              );
            }).length
          },
          { id: 'pinned', label: 'Pinned', count: chats.filter(c => c.pinnedBy && c.pinnedBy.some(id => String(id?._id || id) === myId)).length },
          { id: 'groups', label: 'Groups', count: chats.filter(c => c.isGroup).length }
        ].map((tab) => {
          const isActive = activeFolder === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFolder(tab.id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition flex items-center gap-1.5 ${
                isActive
                  ? 'bg-wa-green text-black shadow-sm'
                  : 'bg-wa-surface text-wa-textSecondary hover:text-white hover:bg-wa-hover border border-wa-border'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  isActive ? 'bg-black/20 text-black' : 'bg-wa-panel text-quantum-cyan'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto divide-y divide-wa-border/50">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-wa-textSecondary h-48">
            <p className="text-sm mb-2">No chats found in this folder.</p>
            <button
              onClick={onOpenNewChatModal}
              className="text-xs text-wa-green hover:underline font-semibold"
            >
              Start a new quantum chat &rarr;
            </button>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const isSelected = activeChat?._id === chat._id;
            const otherParticipant = chat.isGroup
              ? null
              : chat.participants?.find((p) => String(p?._id || p?.id || p) !== myId);

            const displayName = chat.isGroup ? chat.name : (otherParticipant?.name || 'Unknown User');
            const rawAvatar = chat.isGroup ? chat.avatar : otherParticipant?.avatarUrl;
            const fallbackSeed = chat.isGroup ? chat._id : (otherParticipant?.email || displayName);
            const displayAvatar = getResolvedAvatar(rawAvatar, fallbackSeed, displayName);

            const rawLastMsg = chat.lastMessage;
            const isDeletedForMe = Boolean(
              rawLastMsg?.deletedForUsers &&
              rawLastMsg.deletedForUsers.some((id) => String(id?._id || id) === myId)
            );
            const lastMsg = isDeletedForMe ? null : rawLastMsg;
            const isLastMsgRejected = lastMsg?.deliveryState === 'rejected';
            const isLastMsgVerified = lastMsg?.deliveryState === 'verified';

            const isPinned = chat.pinnedBy && chat.pinnedBy.some((id) => String(id?._id || id) === myId);
            const userMute = chat.mutedBy && chat.mutedBy.find((m) => String(m.userId?._id || m.userId) === myId);
            const isMuted = Boolean(userMute && (!userMute.until || new Date(userMute.until) > new Date()));
            const isMenuOpen = chatMenuOpenId === chat._id;

            return (
              <div
                key={chat._id}
                onClick={() => onSelectChat(chat)}
                className={`flex items-center px-4 py-3 cursor-pointer transition relative group ${
                  isSelected ? 'bg-wa-active' : 'hover:bg-wa-hover'
                }`}
              >
                {/* Avatar with Presence Dot */}
                <div className="relative shrink-0 mr-3.5">
                  <img
                    src={displayAvatar}
                    alt={displayName}
                    onError={(e) => handleAvatarError(e, fallbackSeed, displayName)}
                    className="w-12 h-12 rounded-full object-cover bg-wa-surface border border-wa-border"
                  />
                  {!chat.isGroup && otherParticipant?.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-wa-green border-2 border-wa-panel" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-1.5 min-w-0 pr-2">
                      <h3 className="text-sm font-semibold text-wa-textPrimary truncate">
                        {displayName}
                      </h3>
                      {isPinned && (
                        <Pin className="w-3.5 h-3.5 text-wa-green fill-wa-green shrink-0" title="Pinned chat" />
                      )}
                      {isMuted && (
                        <BellOff className="w-3.5 h-3.5 text-wa-textSecondary shrink-0" title="Muted chat" />
                      )}
                    </div>
                    <div className="flex items-center space-x-1.5 shrink-0">
                      <span className="text-[11px] text-wa-textSecondary font-medium">
                        {lastMsg ? formatTimestamp(lastMsg.createdAt) : ''}
                      </span>

                      {/* Chat Options Trigger */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setChatMenuOpenId(isMenuOpen ? null : chat._id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-wa-textSecondary hover:text-wa-textPrimary rounded-full transition"
                        title="Chat options"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Dropdown Menu on Chat Item */}
                  {isMenuOpen && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-4 top-10 w-40 bg-wa-surface border border-wa-border rounded-xl shadow-2xl py-1 z-50 text-xs text-wa-textPrimary animate-in fade-in zoom-in-95"
                    >
                      <button
                        type="button"
                        onClick={(e) => handleTogglePin(e, chat._id)}
                        className="w-full px-3.5 py-2 text-left hover:bg-wa-hover flex items-center gap-2"
                      >
                        {isPinned ? (
                          <>
                            <PinOff className="w-3.5 h-3.5 text-wa-textSecondary" />
                            <span>Unpin Chat</span>
                          </>
                        ) : (
                          <>
                            <Pin className="w-3.5 h-3.5 text-wa-green" />
                            <span>Pin Chat</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setChatMenuOpenId(null);
                          setMuteModalChat(chat);
                        }}
                        className="w-full px-3.5 py-2 text-left hover:bg-wa-hover flex items-center gap-2"
                      >
                        {isMuted ? (
                          <>
                            <Bell className="w-3.5 h-3.5 text-wa-green" />
                            <span>Unmute Chat</span>
                          </>
                        ) : (
                          <>
                            <BellOff className="w-3.5 h-3.5 text-wa-textSecondary" />
                            <span>Mute Chat...</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1 text-xs text-wa-textSecondary truncate">
                      {/* QDS delivery status icon */}
                      {lastMsg && (
                        <>
                          {isLastMsgRejected ? (
                            <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0 mr-0.5" />
                          ) : isLastMsgVerified ? (
                            <ShieldCheck className="w-3.5 h-3.5 text-wa-green shrink-0 mr-0.5" />
                          ) : (
                            <CheckCheck className="w-3.5 h-3.5 text-wa-textSecondary shrink-0 mr-0.5" />
                          )}
                        </>
                      )}
                      <span className="truncate">
                        {lastMsg ? (
                          lastMsg.isDeletedForEveryone ? (
                            <span className="italic text-wa-textSecondary/70">This message was deleted</span>
                          ) : (
                            lastMsg.plaintextPreview || (lastMsg.mediaUrl ? `[Media: ${lastMsg.mediaType}]` : 'Encrypted Message')
                          )
                        ) : (
                          <span className="text-quantum-cyan/80 italic">E91 Channel established</span>
                        )}
                      </span>
                    </div>

                    {/* Verification badge pill */}
                    {isLastMsgVerified && (
                      <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-wa-green/20 text-wa-green border border-wa-green/30 font-medium shrink-0">
                        QDS
                      </span>
                    )}
                    {isLastMsgRejected && (
                      <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-medium shrink-0">
                        Rejected
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Mobile Bottom Navigation Taskbar (Docked at bottom of screen on mobile) */}
      <div className="md:hidden h-14 bg-wa-surface border-t border-wa-border flex items-center justify-around px-2 shrink-0 z-20">
        {/* Chats Tab */}
        <button
          type="button"
          className="flex flex-col items-center justify-center flex-1 py-1 text-wa-green transition"
          title="Chats"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5" />
            {chats?.length > 0 && (
              <span className="absolute -top-1 -right-2 min-w-[15px] h-3.5 px-1 rounded-full bg-wa-green text-black font-bold text-[9px] flex items-center justify-center">
                {chats.length}
              </span>
            )}
          </div>
          <span className="text-[10px] font-semibold mt-0.5">Chats</span>
        </button>

        {/* Quantum Security Dashboard */}
        <button
          type="button"
          onClick={onOpenSecurityDashboard}
          className="flex flex-col items-center justify-center flex-1 py-1 text-wa-textSecondary hover:text-quantum-cyan transition"
          title="Quantum Security Panel"
        >
          <Shield className="w-5 h-5 text-quantum-cyan" />
          <span className="text-[10px] font-medium mt-0.5">Security</span>
        </button>

        {/* New Chat Action Button */}
        <button
          type="button"
          onClick={onOpenNewChatModal}
          className="flex flex-col items-center justify-center flex-1 py-1 text-wa-textSecondary hover:text-white transition"
          title="Start New Chat"
        >
          <div className="w-9 h-9 rounded-full bg-wa-green hover:bg-wa-greenHover text-white flex items-center justify-center shadow-lg -mt-4 border-2 border-wa-surface transition active:scale-95">
            <MessageSquarePlus className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-medium mt-0.5 text-wa-textSecondary">New</span>
        </button>

        {/* Profile Settings Taskbar Tab */}
        <button
          type="button"
          onClick={onOpenUserProfile}
          className="flex flex-col items-center justify-center flex-1 py-1 text-wa-textSecondary hover:text-white transition group"
          title="Open Profile Settings"
        >
          <div className="relative">
            <img
              src={getResolvedAvatar(currentUser?.avatarUrl, currentUser?.email, currentUser?.name)}
              alt={currentUser?.name || 'User'}
              onError={(e) => handleAvatarError(e, currentUser?.email, currentUser?.name)}
              className="w-5 h-5 rounded-full object-cover border border-wa-border group-hover:border-wa-green transition bg-wa-bg"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-wa-green ring-1 ring-wa-surface" />
          </div>
          <span className="text-[10px] font-medium mt-0.5 text-white">Profile</span>
        </button>

        {/* More Settings Menu */}
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex flex-col items-center justify-center flex-1 py-1 text-wa-textSecondary hover:text-white transition"
          title="More Settings"
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5">Settings</span>
        </button>
      </div>

      {/* Mute Duration Dialog Modal */}
      {muteModalChat && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-wa-surface border border-wa-border max-w-xs w-full rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-2 text-white font-bold text-sm">
              <BellOff className="w-5 h-5 text-quantum-cyan" />
              <span>Mute notifications for {muteModalChat.name || 'this chat'}?</span>
            </div>
            <p className="text-xs text-wa-textSecondary">
              Other participants will not see that you muted this chat.
            </p>
            <div className="space-y-1.5 pt-1">
              {[
                { label: '8 Hours', value: '8h' },
                { label: '1 Week', value: '1w' },
                { label: 'Always', value: 'forever' }
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleToggleMute(muteModalChat._id, opt.value)}
                  className="w-full text-left px-3 py-2 rounded-lg bg-wa-panel hover:bg-wa-hover text-white text-xs font-medium border border-wa-border transition"
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setMuteModalChat(null)}
                className="px-3 py-1.5 bg-wa-panel hover:bg-wa-hover text-wa-textSecondary hover:text-white rounded-lg text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

