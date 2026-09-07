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
  User
} from 'lucide-react';
import { getResolvedAvatar, handleAvatarError } from '../utils/avatarHelper';

export default function Sidebar({
  currentUser,
  chats,
  activeChat,
  onSelectChat,
  onOpenNewChatModal,
  onOpenSecurityDashboard,
  onOpenUserProfile,
  onLogout
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredChats = chats.filter((chat) => {
    if (!searchQuery.trim()) return true;
    const name = chat.isGroup
      ? chat.name
      : chat.participants?.find((p) => p._id !== currentUser.id)?.name || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
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
            <span className="text-sm font-semibold text-white leading-tight flex items-center gap-1.5 group-hover:text-wa-green transition truncate max-w-[130px] sm:max-w-[180px]">
              {currentUser.name}
            </span>
            <span className="text-[11px] text-quantum-cyan flex items-center gap-1 font-mono">
              <ShieldCheck className="w-3 h-3 text-wa-green" /> QDS Active
            </span>
          </div>
        </div>

        {/* Action Icons */}
        <div className="flex items-center space-x-2 text-wa-textSecondary relative">
          {/* Security Dashboard Button */}
          <button
            onClick={onOpenSecurityDashboard}
            title="Open Quantum Security Dashboard"
            className="p-2 hover:bg-wa-hover hover:text-quantum-cyan rounded-full transition relative group"
          >
            <Shield className="w-5 h-5 text-quantum-cyan" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-quantum-cyan animate-ping" />
          </button>

          {/* New Chat Button */}
          <button
            onClick={onOpenNewChatModal}
            title="New Chat / Group"
            className="p-2 hover:bg-wa-hover hover:text-white rounded-full transition"
          >
            <MessageSquarePlus className="w-5 h-5" />
          </button>

          {/* Menu Dropdown Toggle */}
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            title="Menu"
            className="p-2 hover:bg-wa-hover hover:text-white rounded-full transition"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {/* Menu Popup */}
          {showDropdown && (
            <div className="absolute right-0 top-12 w-48 bg-wa-surface rounded-lg shadow-xl border border-wa-border py-1.5 z-50 text-sm text-wa-textPrimary animate-in fade-in zoom-in-95">
              <button
                onClick={() => { setShowDropdown(false); onOpenUserProfile(); }}
                className="w-full px-4 py-2 text-left hover:bg-wa-hover flex items-center gap-2.5 text-xs text-white"
              >
                <User className="w-4 h-4 text-wa-green" /> Profile & Details
              </button>
              <button
                onClick={() => { setShowDropdown(false); onOpenNewChatModal(); }}
                className="w-full px-4 py-2 text-left hover:bg-wa-hover flex items-center gap-2.5 text-xs"
              >
                <Users className="w-4 h-4" /> New Group Chat
              </button>
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
            <div className="text-xs font-semibold text-white flex items-center gap-1.5">
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
            className="w-full bg-transparent text-xs text-white placeholder-wa-textSecondary focus:outline-none"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto divide-y divide-wa-border/50">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-wa-textSecondary h-48">
            <p className="text-sm mb-2">No chats found.</p>
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
            const myId = String(currentUser?.id || currentUser?._id || '');
            const otherParticipant = chat.isGroup
              ? null
              : chat.participants?.find((p) => String(p?._id || p?.id || p) !== myId);

            const displayName = chat.isGroup ? chat.name : (otherParticipant?.name || 'Unknown User');
            const rawAvatar = chat.isGroup ? chat.avatar : otherParticipant?.avatarUrl;
            const fallbackSeed = chat.isGroup ? chat._id : (otherParticipant?.email || displayName);
            const displayAvatar = getResolvedAvatar(rawAvatar, fallbackSeed, displayName);

            const lastMsg = chat.lastMessage;
            const isLastMsgRejected = lastMsg?.deliveryState === 'rejected';
            const isLastMsgVerified = lastMsg?.deliveryState === 'verified';

            return (
              <div
                key={chat._id}
                onClick={() => onSelectChat(chat)}
                className={`flex items-center px-4 py-3 cursor-pointer transition relative ${
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
                    <h3 className="text-sm font-semibold text-white truncate pr-2">
                      {displayName}
                    </h3>
                    <span className="text-[11px] text-wa-textSecondary shrink-0 font-medium">
                      {formatTimestamp(lastMsg?.createdAt || chat.updatedAt)}
                    </span>
                  </div>

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
                        QDS Verified
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
    </div>
  );
}

