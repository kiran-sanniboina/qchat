import React, { useState, useEffect } from 'react';
import { X, Search, Users, UserPlus, ShieldCheck } from 'lucide-react';
import api from '../api';

export default function NewChatModal({ onClose, onChatCreated, currentUser }) {
  const [activeTab, setActiveTab] = useState('direct'); // 'direct' | 'group'
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers('');
  }, []);

  const fetchUsers = async (query) => {
    setLoading(true);
    try {
      const res = await api.get(`/auth/users?query=${encodeURIComponent(query)}`);
      setUsers(res.data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    fetchUsers(val);
  };

  const handleCreateDirectChat = async (recipientId) => {
    setSubmitting(true);
    try {
      const res = await api.post('/chats', {
        recipientId,
        isGroup: false
      });
      onChatCreated(res.data.chat);
      onClose();
    } catch (err) {
      alert('Error creating chat: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleUserSelect = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleCreateGroupChat = async (e) => {
    e.preventDefault();
    if (!groupName.trim() || selectedUsers.length === 0) {
      alert('Please provide a group name and select at least one contact.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/chats', {
        name: groupName.trim(),
        isGroup: true,
        participantIds: selectedUsers
      });
      onChatCreated(res.data.chat);
      onClose();
    } catch (err) {
      alert('Error creating group: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-in fade-in select-none">
      <div className="w-full max-w-md bg-wa-panel rounded-xl border border-wa-border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="h-16 px-6 bg-wa-surface border-b border-wa-border flex items-center justify-between shrink-0">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-wa-green" /> New Quantum Chat
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-wa-hover text-wa-textSecondary hover:text-white rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-wa-border bg-wa-surface/40">
          <button
            onClick={() => setActiveTab('direct')}
            className={`flex-1 py-3 text-xs font-semibold border-b-2 transition ${
              activeTab === 'direct'
                ? 'border-wa-green text-wa-green'
                : 'border-transparent text-wa-textSecondary hover:text-white'
            }`}
          >
            1:1 Direct Chat
          </button>
          <button
            onClick={() => setActiveTab('group')}
            className={`flex-1 py-3 text-xs font-semibold border-b-2 transition flex items-center justify-center gap-1.5 ${
              activeTab === 'group'
                ? 'border-wa-green text-wa-green'
                : 'border-transparent text-wa-textSecondary hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Group Chat
          </button>
        </div>

        {/* Group Chat Configuration */}
        {activeTab === 'group' && (
          <div className="p-4 border-b border-wa-border bg-wa-surface/20 space-y-2">
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter Quantum Group Name..."
              className="w-full bg-wa-bg border border-wa-border rounded px-3 py-2 text-xs text-white placeholder-wa-textSecondary focus:outline-none focus:border-wa-green"
            />
            <div className="text-[11px] text-wa-textSecondary flex justify-between">
              <span>Select participants below ({selectedUsers.length} selected)</span>
              {selectedUsers.length > 0 && (
                <button
                  type="button"
                  onClick={handleCreateGroupChat}
                  disabled={submitting || !groupName.trim()}
                  className="text-wa-green hover:underline font-bold"
                >
                  Create Group &rarr;
                </button>
              )}
            </div>
          </div>
        )}

        {/* Search Contacts Input */}
        <div className="p-3 border-b border-wa-border bg-wa-surface/10">
          <div className="flex items-center bg-wa-bg rounded px-3 py-1.5 border border-wa-border">
            <Search className="w-3.5 h-3.5 text-wa-textSecondary mr-2 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search registered contacts..."
              className="w-full bg-transparent text-xs text-white placeholder-wa-textSecondary focus:outline-none"
            />
          </div>
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto divide-y divide-wa-border/50 p-2">
          {loading ? (
            <div className="text-center py-8 text-xs text-wa-textSecondary">Loading contacts...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-xs text-wa-textSecondary">No contacts found.</div>
          ) : (
            users.map((u) => {
              const isSelected = selectedUsers.includes(u._id);

              return (
                <div
                  key={u._id}
                  onClick={() => {
                    if (activeTab === 'group') {
                      handleToggleUserSelect(u._id);
                    } else {
                      handleCreateDirectChat(u._id);
                    }
                  }}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition ${
                    isSelected ? 'bg-wa-hover' : 'hover:bg-wa-surface'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={u.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.email}`}
                      alt={u.name}
                      className="w-10 h-10 rounded-full object-cover bg-wa-bg border border-wa-border"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        {u.name}
                        {u.isOnline && <span className="w-1.5 h-1.5 rounded-full bg-wa-green" />}
                      </h4>
                      <p className="text-[11px] text-wa-textSecondary">{u.email}</p>
                    </div>
                  </div>

                  {activeTab === 'group' ? (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="accent-wa-green w-4 h-4 rounded cursor-pointer"
                    />
                  ) : (
                    <span className="text-[11px] text-quantum-cyan hover:underline font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-wa-green" /> Connect
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

