import React, { useState } from 'react';
import { User, Phone, Mail, X, Send, Users } from 'lucide-react';
import { getResolvedAvatar } from '../utils/avatarHelper';

export default function ContactShareModal({ chats = [], currentUser, onSendContact, onClose }) {
  const [activeTab, setActiveTab] = useState('existing'); // 'existing' | 'custom'
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const myId = String(currentUser?.id || currentUser?._id || '');

  // Extract unique contacts from active chats
  const existingContacts = [];
  const seenIds = new Set();

  (chats || []).forEach((chat) => {
    (chat.participants || []).forEach((p) => {
      const pid = String(p?._id || p?.id || p);
      if (pid && pid !== myId && !seenIds.has(pid)) {
        seenIds.add(pid);
        existingContacts.push({
          id: pid,
          name: p.name || 'User',
          email: p.email || '',
          phone: p.phone || '',
          avatarUrl: p.avatarUrl || ''
        });
      }
    });
  });

  const handleSelectExisting = (contact) => {
    setName(contact.name);
    setEmail(contact.email);
    setPhone(contact.phone || '+91 98765 43210');
    setAvatarUrl(contact.avatarUrl || '');
    setActiveTab('custom');
  };

  const handleSend = () => {
    if (!name.trim()) {
      alert('Please provide a contact name.');
      return;
    }

    onSendContact({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      avatarUrl: avatarUrl || getResolvedAvatar(null, email || name, name)
    });
    onClose();
  };

  const previewAvatar = getResolvedAvatar(avatarUrl, email || name, name || 'User');

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 select-none">
      <div className="bg-wa-surface border border-wa-border max-w-md w-full rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col">
        {/* Header */}
        <div className="h-14 px-4 bg-wa-panel border-b border-wa-border flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-quantum-cyan/20 border border-quantum-cyan/40 flex items-center justify-center text-quantum-cyan">
              <User className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">Share Contact</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-wa-hover text-wa-textSecondary hover:text-white rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-wa-border bg-wa-surface/80 px-4 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('existing')}
            className={`py-2.5 px-3 font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'existing'
                ? 'border-quantum-cyan text-quantum-cyan'
                : 'border-transparent text-wa-textSecondary hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Select from Chats ({existingContacts.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`py-2.5 px-3 font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'custom'
                ? 'border-quantum-cyan text-quantum-cyan'
                : 'border-transparent text-wa-textSecondary hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Custom Contact Card</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 text-xs max-h-[60vh] overflow-y-auto">
          {activeTab === 'existing' ? (
            <div className="space-y-1.5">
              {existingContacts.length === 0 ? (
                <div className="py-8 text-center text-wa-textSecondary">
                  <p>No contacts found in existing chats.</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('custom')}
                    className="mt-2 text-quantum-cyan hover:underline font-semibold"
                  >
                    Enter contact info manually &rarr;
                  </button>
                </div>
              ) : (
                existingContacts.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => handleSelectExisting(contact)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-wa-panel border border-wa-border cursor-pointer transition"
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={getResolvedAvatar(contact.avatarUrl, contact.email || contact.name, contact.name)}
                        alt={contact.name}
                        className="w-9 h-9 rounded-full object-cover bg-wa-bg border border-wa-border"
                      />
                      <div>
                        <span className="font-semibold text-white block">{contact.name}</span>
                        <span className="text-[11px] text-wa-textSecondary block">{contact.email}</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-quantum-cyan font-medium">Select &rarr;</span>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Card Preview */}
              <div className="p-3.5 bg-wa-panel rounded-xl border border-quantum-cyan/30 flex items-center space-x-3.5">
                <img
                  src={previewAvatar}
                  alt={name || 'User'}
                  className="w-12 h-12 rounded-full object-cover bg-wa-surface border border-wa-border shadow"
                />
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-white text-sm block truncate">
                    {name || 'Contact Name'}
                  </span>
                  <span className="text-[11px] text-quantum-cyan flex items-center gap-1 font-mono mt-0.5 truncate">
                    <Phone className="w-3 h-3 text-wa-green shrink-0" />
                    {phone || 'Phone number'}
                  </span>
                  <span className="text-[11px] text-wa-textSecondary flex items-center gap-1 mt-0.5 truncate">
                    <Mail className="w-3 h-3 shrink-0" />
                    {email || 'Email address'}
                  </span>
                </div>
              </div>

              {/* Form Inputs */}
              <div className="space-y-2">
                <div>
                  <label className="text-[11px] text-wa-textSecondary font-semibold block mb-1">
                    Contact Full Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alice Quantum"
                    className="w-full bg-wa-panel border border-wa-border rounded-lg px-3 py-2 text-white placeholder-wa-textSecondary focus:outline-none focus:border-wa-green text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-wa-textSecondary font-semibold block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +1 555 123 4567"
                    className="w-full bg-wa-panel border border-wa-border rounded-lg px-3 py-2 text-white placeholder-wa-textSecondary focus:outline-none focus:border-wa-green text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-wa-textSecondary font-semibold block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. alice@quantum.io"
                    className="w-full bg-wa-panel border border-wa-border rounded-lg px-3 py-2 text-white placeholder-wa-textSecondary focus:outline-none focus:border-wa-green text-xs"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-wa-panel border-t border-wa-border flex items-center justify-end space-x-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 bg-wa-surface hover:bg-wa-hover text-wa-textSecondary hover:text-white text-xs font-semibold rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={!name.trim()}
            className="px-4 py-2 bg-wa-green hover:bg-wa-greenHover text-white text-xs font-bold rounded-lg transition shadow flex items-center gap-1.5 disabled:opacity-40"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Contact</span>
          </button>
        </div>
      </div>
    </div>
  );
}

