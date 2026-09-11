import React, { useState, useEffect } from 'react';
import { Star, Search, X, Loader2, ArrowRight, FileText, Image as ImageIcon } from 'lucide-react';
import api from '../api';
import { getResolvedAvatar } from '../utils/avatarHelper';

export default function StarredMessagesModal({ onSelectChat, onClose }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchStarred();
  }, []);

  const fetchStarred = async () => {
    setLoading(true);
    try {
      const res = await api.get('/messages/starred');
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error('Failed to fetch starred messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnstar = async (e, msgId) => {
    e.stopPropagation();
    try {
      await api.put(`/messages/${msgId}/star`);
      setMessages((prev) => prev.filter((m) => m._id !== msgId));
    } catch (err) {
      alert('Failed to unstar message: ' + (err.response?.data?.error || err.message));
    }
  };

  const filteredMessages = messages.filter((m) => {
    if (!searchQuery.trim()) return true;
    const text = m.plaintextPreview || '';
    const sender = m.senderId?.name || '';
    const chat = m.chatId?.name || '';
    const q = searchQuery.toLowerCase();
    return text.toLowerCase().includes(q) || sender.toLowerCase().includes(q) || chat.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 select-none">
      <div className="bg-wa-surface border border-wa-border max-w-lg w-full rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="h-14 px-5 bg-wa-panel border-b border-wa-border flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-wa-textPrimary leading-tight">Starred Messages</h3>
              <p className="text-[11px] text-wa-textSecondary">{messages.length} saved messages</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-wa-hover text-wa-textSecondary hover:text-wa-textPrimary rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-wa-border bg-wa-surface shrink-0">
          <div className="flex items-center bg-wa-panel rounded-lg px-3 py-1.5 text-xs border border-wa-border focus-within:border-wa-green">
            <Search className="w-4 h-4 text-wa-textSecondary mr-2 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search starred messages..."
              className="w-full bg-transparent text-wa-textPrimary placeholder-wa-textSecondary focus:outline-none text-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-wa-textSecondary hover:text-wa-textPrimary"
              >
                &times;
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="p-4 flex-1 overflow-y-auto space-y-2.5 text-xs">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-wa-textSecondary space-y-2">
              <Loader2 className="w-8 h-8 text-quantum-cyan animate-spin" />
              <p className="text-wa-textPrimary font-medium">Fetching starred messages...</p>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="py-12 text-center text-wa-textSecondary bg-wa-panel/40 rounded-xl border border-wa-border">
              <Star className="w-8 h-8 text-amber-400/40 mx-auto mb-2" />
              <p className="text-wa-textPrimary font-medium">No starred messages found</p>
              <p className="text-[11px] text-wa-textSecondary mt-1">
                Hover over any message and click the star ⭐ to save it here.
              </p>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const sender = msg.senderId?.name || 'User';
              const chatName = msg.chatId?.name || (msg.chatId?.isGroup ? 'Group' : 'Direct Chat');

              return (
                <div
                  key={msg._id}
                  onClick={() => {
                    if (onSelectChat && msg.chatId) {
                      onSelectChat(msg.chatId);
                      onClose();
                    }
                  }}
                  className="p-3 bg-wa-panel hover:bg-wa-hover rounded-xl border border-wa-border hover:border-quantum-cyan/40 transition cursor-pointer space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 min-w-0">
                      <img
                        src={getResolvedAvatar(msg.senderId?.avatarUrl, msg.senderId?.email || sender, sender)}
                        alt={sender}
                        className="w-6 h-6 rounded-full object-cover bg-wa-bg border border-wa-border shrink-0"
                      />
                      <span className="font-semibold text-wa-textPrimary truncate">{sender}</span>
                      <span className="text-[10px] text-quantum-cyan bg-quantum-cyan/10 px-1.5 py-0.2 rounded border border-quantum-cyan/20 truncate">
                        {chatName}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-[10px] text-wa-textSecondary font-mono">
                        {new Date(msg.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleUnstar(e, msg._id)}
                        className="text-amber-400 hover:text-amber-200 p-1 rounded transition"
                        title="Unstar message"
                      >
                        <Star className="w-4 h-4 fill-amber-400" />
                      </button>
                    </div>
                  </div>

                  {/* Content Preview */}
                  <div className="text-wa-textPrimary text-xs pl-8 break-words leading-relaxed">
                    {msg.plaintextPreview}
                  </div>

                  <div className="flex items-center justify-end text-[10px] text-quantum-cyan font-semibold opacity-0 group-hover:opacity-100 transition pt-1">
                    <span>Jump to chat</span>
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-wa-panel border-t border-wa-border flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-wa-surface hover:bg-wa-hover text-wa-textPrimary text-xs font-semibold rounded-lg border border-wa-border transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

