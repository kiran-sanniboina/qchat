import React, { useState, useEffect } from 'react';
import { HardDrive, Trash2, X, RefreshCw, Loader2, Image as ImageIcon, Video, Mic, FileText, CheckCircle2 } from 'lucide-react';
import api from '../api';
import { getResolvedAvatar } from '../utils/avatarHelper';

export default function StorageManagerModal({ onClose, onStorageCleared }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [clearingChatId, setClearingChatId] = useState(null);
  const [clearedSuccess, setClearedSuccess] = useState(null);

  useEffect(() => {
    fetchStorageOverview();
  }, []);

  const fetchStorageOverview = async () => {
    setLoading(true);
    try {
      const res = await api.get('/chats/storage/overview');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load storage overview:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChatMedia = async (chatId, chatName) => {
    if (!window.confirm(`Clear all media in "${chatName}"? Text messages will remain preserved.`)) {
      return;
    }

    setClearingChatId(chatId);
    try {
      await api.delete(`/chats/${chatId}/storage`);
      setClearedSuccess(`Media cleared for ${chatName}`);
      setTimeout(() => setClearedSuccess(null), 3000);
      if (onStorageCleared) {
        onStorageCleared(chatId);
      }
      fetchStorageOverview();
    } catch (err) {
      alert('Failed to clear storage: ' + (err.response?.data?.error || err.message));
    } finally {
      setClearingChatId(null);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const overview = data?.overview || {
    totalSize: 0,
    totalFiles: 0,
    imagesSize: 0,
    videosSize: 0,
    audioSize: 0,
    docsSize: 0
  };

  const total = overview.totalSize || 1;
  const imgPct = Math.round((overview.imagesSize / total) * 100);
  const vidPct = Math.round((overview.videosSize / total) * 100);
  const audPct = Math.round((overview.audioSize / total) * 100);
  const docPct = Math.round((overview.docsSize / total) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 select-none">
      <div className="bg-wa-surface border border-wa-border max-w-lg w-full rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="h-14 px-5 bg-wa-panel border-b border-wa-border flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-quantum-cyan/20 border border-quantum-cyan/40 flex items-center justify-center text-quantum-cyan">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">Storage Manager</h3>
              <p className="text-[11px] text-wa-textSecondary">Media breakdown & 1-click cleanup</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={fetchStorageOverview}
              disabled={loading}
              title="Refresh usage"
              className="p-1.5 hover:bg-wa-hover text-wa-textSecondary hover:text-white rounded-full transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-wa-hover text-wa-textSecondary hover:text-white rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notification Banner */}
        {clearedSuccess && (
          <div className="px-4 py-2 bg-wa-green/20 border-b border-wa-green/40 text-wa-green text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>{clearedSuccess}</span>
          </div>
        )}

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto text-xs">
          {loading && !data ? (
            <div className="py-12 flex flex-col items-center justify-center text-wa-textSecondary space-y-2">
              <Loader2 className="w-8 h-8 text-quantum-cyan animate-spin" />
              <p className="text-white font-medium">Calculating media storage footprint...</p>
            </div>
          ) : (
            <>
              {/* Storage Overview Bar */}
              <div className="bg-wa-panel p-4 rounded-xl border border-wa-border space-y-3">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-extrabold text-white">
                      {formatBytes(overview.totalSize)}
                    </span>
                    <span className="text-wa-textSecondary text-xs ml-1.5">used</span>
                  </div>
                  <span className="text-xs text-quantum-cyan font-semibold">
                    {overview.totalFiles} media files
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-3 w-full bg-wa-surface rounded-full overflow-hidden flex border border-wa-border">
                  <div style={{ width: `${imgPct}%` }} className="bg-sky-400" title={`Images: ${imgPct}%`} />
                  <div style={{ width: `${vidPct}%` }} className="bg-purple-500" title={`Videos: ${vidPct}%`} />
                  <div style={{ width: `${audPct}%` }} className="bg-wa-green" title={`Audio: ${audPct}%`} />
                  <div style={{ width: `${docPct}%` }} className="bg-amber-400" title={`Documents: ${docPct}%`} />
                </div>

                {/* Legend */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                  <div className="flex items-center gap-1.5 text-wa-textSecondary">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shrink-0" />
                    <span>Photos ({formatBytes(overview.imagesSize)})</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-wa-textSecondary">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
                    <span>Videos ({formatBytes(overview.videosSize)})</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-wa-textSecondary">
                    <span className="w-2.5 h-2.5 rounded-full bg-wa-green shrink-0" />
                    <span>Audio ({formatBytes(overview.audioSize)})</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-wa-textSecondary">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                    <span>Docs ({formatBytes(overview.docsSize)})</span>
                  </div>
                </div>
              </div>

              {/* Per-Chat Media Breakdown */}
              <div className="space-y-2">
                <span className="text-[11px] text-wa-textSecondary font-semibold uppercase tracking-wider block">
                  Chats with Media ({(data?.chatsBreakdown || []).length})
                </span>

                {(data?.chatsBreakdown || []).length === 0 ? (
                  <div className="py-8 text-center text-wa-textSecondary bg-wa-panel/40 rounded-xl border border-wa-border">
                    <p>No media files stored in your conversations.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(data?.chatsBreakdown || []).map((chat) => (
                      <div
                        key={chat.chatId}
                        className="flex items-center justify-between p-3 bg-wa-panel rounded-xl border border-wa-border hover:border-quantum-cyan/40 transition"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <img
                            src={getResolvedAvatar(chat.avatar, chat.chatId, chat.name)}
                            alt={chat.name}
                            className="w-10 h-10 rounded-full object-cover bg-wa-surface border border-wa-border shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="font-semibold text-white block truncate">{chat.name}</span>
                            <span className="text-[11px] text-wa-textSecondary block">
                              {chat.mediaCount} files &bull; <strong className="text-quantum-cyan font-mono">{formatBytes(chat.totalSize)}</strong>
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleClearChatMedia(chat.chatId, chat.name)}
                          disabled={clearingChatId === chat.chatId}
                          className="px-3 py-1.5 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 hover:text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shrink-0"
                          title="Delete media for this conversation"
                        >
                          {clearingChatId === chat.chatId ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          <span className="hidden sm:inline">Free Space</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-wa-panel border-t border-wa-border flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-wa-surface hover:bg-wa-hover text-white text-xs font-semibold rounded-lg border border-wa-border transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

