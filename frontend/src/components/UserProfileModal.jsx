import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  Upload,
  User,
  Phone,
  Mail,
  Key,
  Check,
  Copy,
  Loader2,
  Sparkles,
  ShieldCheck,
  Smile,
  Smartphone
} from 'lucide-react';
import api from '../api';
import { getResolvedAvatar, handleAvatarError } from '../utils/avatarHelper';

export default function UserProfileModal({ currentUser, onClose, onUpdateUser }) {
  const [name, setName] = useState(currentUser?.name || '');
  const [statusBio, setStatusBio] = useState(currentUser?.statusBio || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Link Web QR Desktop Session State
  const [webPairCode, setWebPairCode] = useState('');
  const [pairingWeb, setPairingWeb] = useState(false);
  const [pairResultMsg, setPairResultMsg] = useState(null);

  const handleAuthorizeDesktopSession = async () => {
    if (!webPairCode.trim()) return;
    setPairingWeb(true);
    setPairResultMsg(null);
    try {
      const res = await api.post('/auth/qr/authorize', {
        pairCode: webPairCode.trim()
      });
      setPairResultMsg({ success: true, text: res.data.message || 'Desktop session authorized successfully!' });
      setWebPairCode('');
    } catch (err) {
      setPairResultMsg({
        success: false,
        text: err.response?.data?.error || err.message || 'Could not authorize desktop session. Check the PIN.'
      });
    } finally {
      setPairingWeb(false);
    }
  };

  const fileInputRef = useRef(null);

  // Preset avatar generators based on user seeds
  const avatarPresets = [
    {
      id: 'bottts',
      name: 'Quantum Bot',
      url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(currentUser?.email || 'qchat')}`
    },
    {
      id: 'cyberpunk',
      name: 'Cyberpunk Qubit',
      url: `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(currentUser?.name || 'Cyber')}`
    },
    {
      id: 'executive',
      name: 'Cryptographer',
      url: `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(currentUser?.name || 'Director')}`
    },
    {
      id: 'identicon',
      name: 'E91 Identicon',
      url: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(currentUser?.publicIdentity || 'QDS')}`
    },
    {
      id: 'pixel',
      name: 'Pixel Pauli',
      url: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(currentUser?.name || 'Quantum')}`
    }
  ];

  const quickStatusOptions = [
    'Secured with Quantum Digital Signatures (QDS)',
    'Available for Entangled Communications',
    'Busy with Quantum Computing experiment',
    'At work • Do not disturb',
    'Offline • In the Faraday Cage'
  ];

  const handleCopyKey = () => {
    if (!currentUser?.publicIdentity) return;
    navigator.clipboard.writeText(currentUser.publicIdentity);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const image = new Image();
        image.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 256;
          let width = image.width;
          let height = image.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(image, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        image.onerror = (err) => reject(err);
        image.src = readerEvent.target.result;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select an image file (PNG, JPG, WebP, SVG).');
      return;
    }

    setUploadingAvatar(true);
    setErrorMsg(null);

    try {
      // 1. Immediately create compressed Data URL for persistent storage in MongoDB
      const compressedDataUrl = await compressImage(file);
      setAvatarUrl(compressedDataUrl);
      setSuccessMsg('Profile photo selected and compressed. Click Save to apply.');

      // 2. Also upload to backend /media/upload in background
      const formData = new FormData();
      formData.append('file', file);
      api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }).catch((err) => console.warn('Background upload note:', err.message));
    } catch (err) {
      setErrorMsg('Failed to process image: ' + err.message);
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Full Name cannot be empty.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await api.put('/auth/profile', {
        name: name.trim(),
        statusBio: statusBio.trim(),
        avatarUrl: avatarUrl.trim(),
        phone: phone.trim()
      });

      setSuccessMsg('Profile updated successfully!');
      if (onUpdateUser) {
        onUpdateUser(res.data.user);
      }
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const resolvedAvatar = getResolvedAvatar(avatarUrl, currentUser?.email, currentUser?.name);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-wa-surface border border-wa-border max-w-lg w-full rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[95vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="h-14 sm:h-16 px-4 sm:px-6 bg-wa-panel border-b border-wa-border flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-wa-green/20 border border-wa-green/40 flex items-center justify-center text-wa-green shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white leading-tight truncate">Edit Profile</h2>
              <p className="text-[11px] text-wa-textSecondary truncate">Manage identity & credentials</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-wa-hover text-wa-textSecondary hover:text-white rounded-full transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="user-profile-form" onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              <img
                src={resolvedAvatar}
                alt={name}
                onError={(e) => handleAvatarError(e, currentUser?.email, currentUser?.name)}
                className="w-24 h-24 rounded-full object-cover border-2 border-wa-border group-hover:border-quantum-cyan transition bg-wa-panel shadow-lg"
              />
              {uploadingAvatar ? (
                <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-quantum-cyan animate-spin" />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload profile picture"
                  className="absolute bottom-0 right-0 p-2 bg-wa-green hover:bg-wa-greenHover text-white rounded-full shadow-md border-2 border-wa-surface transition transform group-hover:scale-110"
                >
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*"
            />

            <div className="flex items-center gap-2 mt-3 text-xs">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-quantum-cyan hover:underline flex items-center gap-1 font-semibold"
              >
                <Upload className="w-3.5 h-3.5" /> Upload Photo
              </button>
              <span className="text-wa-textSecondary">•</span>
              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="text-wa-textSecondary hover:text-white underline"
              >
                {showUrlInput ? 'Hide URL input' : 'Image URL'}
              </button>
            </div>

            {/* Custom URL Input Accordion */}
            {showUrlInput && (
              <div className="w-full mt-2.5 flex items-center gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/avatar.png"
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  className="flex-1 bg-wa-panel border border-wa-border rounded-lg px-3 py-1.5 text-xs text-white placeholder-wa-textSecondary focus:outline-none focus:border-quantum-cyan"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customUrlInput.trim()) {
                      setAvatarUrl(customUrlInput.trim());
                      setCustomUrlInput('');
                      setShowUrlInput(false);
                    }
                  }}
                  className="px-3 py-1.5 bg-quantum-cyan/20 hover:bg-quantum-cyan/30 text-quantum-cyan border border-quantum-cyan/40 rounded-lg text-xs font-semibold"
                >
                  Set
                </button>
              </div>
            )}

            {/* Preset Avatars Row */}
            <div className="w-full mt-4 bg-wa-panel/60 p-3 rounded-xl border border-wa-border">
              <div className="text-[11px] text-wa-textSecondary font-semibold uppercase tracking-wider mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-quantum-cyan" /> Choose Quantum Avatar Preset
              </div>
              <div className="grid grid-cols-5 gap-2">
                {avatarPresets.map((preset) => {
                  const isSelected = avatarUrl === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setAvatarUrl(preset.url)}
                      title={preset.name}
                      className={`relative p-1 rounded-xl border transition group ${
                        isSelected
                          ? 'border-quantum-cyan bg-quantum-cyan/20 ring-1 ring-quantum-cyan'
                          : 'border-wa-border hover:border-wa-textSecondary bg-wa-surface'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        onError={(e) => handleAvatarError(e, preset.id, preset.name)}
                        className="w-full h-10 rounded-lg object-contain"
                      />
                      <span className="block text-[9px] text-center truncate text-wa-textSecondary mt-0.5 group-hover:text-white">
                        {preset.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4 text-xs">
            {/* Full Name */}
            <div>
              <label className="block text-wa-textSecondary font-semibold mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-wa-green" /> Full Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
                maxLength={60}
                className="w-full bg-wa-panel border border-wa-border rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-wa-textSecondary focus:outline-none focus:border-wa-green transition"
              />
            </div>

            {/* Status Bio */}
            <div>
              <label className="block text-wa-textSecondary font-semibold mb-1 flex items-center gap-1.5">
                <Smile className="w-3.5 h-3.5 text-quantum-cyan" /> Status Bio / About
              </label>
              <textarea
                value={statusBio}
                onChange={(e) => setStatusBio(e.target.value)}
                placeholder="Say something about yourself..."
                rows={2}
                maxLength={140}
                className="w-full bg-wa-panel border border-wa-border rounded-lg px-3.5 py-2 text-xs text-white placeholder-wa-textSecondary focus:outline-none focus:border-quantum-cyan transition resize-none"
              />
              {/* Quick Status Chips */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {quickStatusOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setStatusBio(opt)}
                    className="text-[10px] px-2 py-1 rounded bg-wa-surface hover:bg-wa-hover border border-wa-border text-wa-textSecondary hover:text-white transition truncate max-w-[200px]"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-wa-textSecondary font-semibold mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-quantum-purple" /> Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 019-2834"
                maxLength={30}
                className="w-full bg-wa-panel border border-wa-border rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-wa-textSecondary focus:outline-none focus:border-quantum-purple transition font-mono"
              />
            </div>

            {/* Email Address (Read-only) */}
            <div>
              <label className="block text-wa-textSecondary font-semibold mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-wa-textSecondary" /> Account Email
              </label>
              <div className="w-full bg-wa-panel/40 border border-wa-border rounded-lg px-3.5 py-2.5 text-xs text-wa-textSecondary font-mono select-all">
                {currentUser?.email}
              </div>
            </div>

            {/* Public Quantum Identity Fingerprint */}
            <div>
              <label className="block text-wa-textSecondary font-semibold mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-quantum-cyan" /> Public Quantum Identity Key
                </span>
                <span className="text-[10px] text-quantum-cyan flex items-center gap-1 font-mono">
                  <ShieldCheck className="w-3 h-3" /> QDS Fingerprint
                </span>
              </label>
              <div className="w-full bg-wa-panel/80 border border-quantum-cyan/30 rounded-lg p-2.5 flex items-center justify-between font-mono text-xs text-quantum-cyan">
                <span className="truncate mr-2 select-all">
                  {currentUser?.publicIdentity || 'pk_quantum_verified'}
                </span>
                <button
                  type="button"
                  onClick={handleCopyKey}
                  className="px-2.5 py-1 bg-quantum-cyan/20 hover:bg-quantum-cyan/30 text-quantum-cyan rounded border border-quantum-cyan/40 text-[10px] font-bold flex items-center gap-1 transition shrink-0"
                >
                  {copiedKey ? <Check className="w-3 h-3 text-wa-green" /> : <Copy className="w-3 h-3" />}
                  {copiedKey ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Link Desktop Web Session (QR Code Authorization) */}
            <div className="p-3.5 rounded-xl bg-wa-panel/60 border border-wa-border space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-quantum-cyan" />
                  <span className="text-xs font-bold text-white">Link Desktop Web (QR PIN)</span>
                </div>
                <span className="text-[10px] text-quantum-cyan font-mono bg-quantum-cyan/10 px-2 py-0.5 rounded border border-quantum-cyan/30">
                  Web Pairing
                </span>
              </div>
              <p className="text-[11px] text-wa-textSecondary leading-relaxed">
                Looking at the QChat Web login screen on another computer? Enter the 4-digit PIN showing under the QR code to log into that desktop instantly.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={8}
                  value={webPairCode}
                  onChange={(e) => setWebPairCode(e.target.value.replace(/\s+/g, ''))}
                  placeholder="e.g. 4-digit PIN"
                  className="flex-1 bg-wa-bg border border-wa-border rounded-lg px-3 py-2 text-xs font-mono tracking-widest text-center text-white placeholder-wa-textSecondary/40 focus:outline-none focus:border-quantum-cyan"
                />
                <button
                  type="button"
                  disabled={!webPairCode.trim() || pairingWeb}
                  onClick={handleAuthorizeDesktopSession}
                  className="px-3.5 py-2 bg-quantum-cyan hover:bg-quantum-cyan/80 text-black text-xs font-bold rounded-lg transition disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                >
                  {pairingWeb ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Authorize</span>
                </button>
              </div>
              {pairResultMsg && (
                <div className={`p-2 rounded text-[11px] font-medium ${pairResultMsg.success ? 'bg-wa-green/20 text-wa-green border border-wa-green/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
                  {pairResultMsg.text}
                </div>
              )}
            </div>
          </div>

          {/* Feedback Banners */}
          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-xs text-red-200">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-wa-green/20 border border-wa-green/40 rounded-xl text-xs text-wa-green flex items-center gap-1.5">
              <Check className="w-4 h-4" /> {successMsg}
            </div>
          )}
        </form>

        {/* Docked Sticky Bottom Action Taskbar (Always Visible on Mobile & Desktop) */}
        <div className="h-14 sm:h-16 px-4 sm:px-6 bg-wa-panel border-t border-wa-border flex items-center justify-between shrink-0">
          <div className="text-[11px] text-wa-textSecondary flex items-center gap-1.5 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-wa-green shrink-0" />
            <span className="hidden xs:inline">QDS Identity Secured</span>
          </div>
          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 sm:px-4 py-2 text-xs text-wa-textSecondary hover:text-white hover:bg-wa-hover rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="user-profile-form"
              disabled={saving || !name.trim()}
              className="px-4 sm:px-5 py-2 bg-wa-green hover:bg-wa-greenHover text-white text-xs font-bold rounded-lg shadow-md transition flex items-center gap-1.5 disabled:opacity-50 disabled:hover:bg-wa-green"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
