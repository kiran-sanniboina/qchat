import React, { useState } from 'react';
import { Forward, Search, X, Loader2, Check } from 'lucide-react';
import api from '../api';
import { getResolvedAvatar } from '../utils/avatarHelper';

export default function ForwardModal({ message, chats = [], currentUser, onForwarded, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [forwarding, setForwarding] = useState(false);
  const [success, setSuccess] = useState(false);

  const myId = String(currentUser?.id || currentUser?._id || '');

  const filteredChats = chats.filter((chat) => {
    if (!searchQuery.trim()) return true;
    const name = chat.isGroup
      ? chat.name
      : chat.participants?.find((p) => String(p?._id || p?.id || p) !== myId)?.name || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleForward = async () => {
    if (!selectedChatId || !message?._id) return;

    setForwarding(true);
    try {
      await api.post(`/messages/${message._id}/forward`, {
        targetChatId: selectedChatId
      });
      setSuccess(true);
      setTimeout(() => {
        if (onForwarded) onForwarded(selectedChatId);
        onClose();
      }, 700);
    } catch (err) {
      alert('Failed to forward message: ' + (err.response?.data?.error || err.message));
      setForwarding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 select-none">
      <div className="bg-wa-surface border border-wa-border max-w-sm w-full rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="h-14 px-4 bg-wa-panel border-b border-wa-border flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-quantum-cyan/20 border border-quantum-cyan/40 flex items-center justify-center text-quantum-cyan">
              <Forward className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-wa-textPrimary">Forward Message</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-wa-hover text-wa-textSecondary hover:text-wa-textPrimary rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Preview Snippet */}
        <div className="p-3 bg-wa-panel/60 border-b border-wa-border text-xs text-wa-textSecondary italic truncate">
          Forwarding: "{message?.plaintextPreview || '[Media/Attachment]'}"
        </div>

        {/* Search */}
        <div className="p-2.5 border-b border-wa-border bg-wa-surface shrink-0">
          <div className="flex items-center bg-wa-panel rounded-lg px-2.5 py-1.5 text-xs border border-wa-border focus-within:border-quantum-cyan">
            <Search className="w-3.5 h-3.5 text-wa-textSecondary mr-1.5 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chat or contact..."
              className="w-full bg-transparent text-wa-textPrimary placeholder-wa-textSecondary focus:outline-none text-xs"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs">
          {filteredChats.length === 0 ? (
            <div className="py-8 text-center text-wa-textSecondary">
              No matching chats found.
            </div>
          ) : (
            filteredChats.map((chat) => {
              const isSelected = selectedChatId === chat._id;
              const other = chat.isGroup
                ? null
                : chat.participants?.find((p) => String(p?._id || p?.id || p) !== myId);
              const name = chat.isGroup ? chat.name : (other?.name || 'User');
              const avatar = getResolvedAvatar(
                chat.isGroup ? chat.avatar : other?.avatarUrl,
                chat.isGroup ? chat._id : (other?.email || name),
                name
              );

              return (
                <div
                  key={chat._id}
                  onClick={() => setSelectedChatId(chat._id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition ${
                    isSelected
                      ? 'bg-wa-active border border-wa-green/50 shadow-sm'
                      : 'hover:bg-wa-panel border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <img
                      src={avatar}
                      alt={name}
                      className="w-9 h-9 rounded-full object-cover bg-wa-bg border border-wa-border shrink-0"
                    />
                    <div className="min-w-0">
                      <span className={`font-semibold block truncate ${isSelected ? 'text-wa-green' : 'text-wa-textPrimary'}`}>
                        {name}
                      </span>
                      <span className="text-[10px] text-wa-textSecondary block">
                        {chat.isGroup ? 'Group' : 'Direct Quantum Chat'}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition shrink-0 ${
                      isSelected
                        ? 'bg-wa-green border-wa-green text-white'
                        : 'border-wa-border bg-wa-surface'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-wa-panel border-t border-wa-border flex items-center justify-end space-x-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={forwarding}
            className="px-3 py-2 bg-wa-surface hover:bg-wa-hover text-wa-textSecondary hover:text-wa-textPrimary text-xs font-semibold rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleForward}
            disabled={!selectedChatId || forwarding}
            className="px-4 py-2 bg-wa-green hover:bg-wa-greenHover text-white text-xs font-bold rounded-lg transition shadow flex items-center gap-1.5 disabled:opacity-40"
          >
            {forwarding ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Forwarding...</span>
              </>
            ) : success ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Sent!</span>
              </>
            ) : (
              <>
                <Forward className="w-3.5 h-3.5" />
                <span>Forward</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

