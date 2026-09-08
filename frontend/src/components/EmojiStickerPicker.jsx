import React, { useState } from 'react';
import { Search, Smile, Sparkles, X } from 'lucide-react';

const EMOJI_CATEGORIES = [
  {
    id: 'smileys',
    name: 'Smileys & Emotion',
    icon: '😀',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🥹', '😊',
      '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙',
      '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎',
      '🥸', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁',
      '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😮‍💨', '😤',
      '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰'
    ]
  },
  {
    id: 'gestures',
    name: 'Gestures & Reactions',
    icon: '👍',
    emojis: [
      '👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲',
      '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '👂', '👃', '🧠',
      '👀', '👁️', '👅', '👄', '👋', '🤚', '🖐️', '✋', '🖖', '👌',
      '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉',
      '👆', '🖕', '👇', '☝️', '🫵', '👍🏻', '👍🏽', '👍🏿', '❤️', '🔥'
    ]
  },
  {
    id: 'hearts',
    name: 'Hearts & Love',
    icon: '❤️',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❤️‍🔥', '❤️‍🩹', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝',
      '💟', '💌', '💐', '🌹', '🥀', '🌺', '🌸', '✨', '⭐', '🌟'
    ]
  },
  {
    id: 'quantum',
    name: 'Quantum & Tech',
    icon: '⚛️',
    emojis: [
      '⚛️', '🌀', '🛡️', '⚡', '🔒', '🔓', '🔑', '🗝️', '⚙️', '🔬',
      '🔭', '📡', '🛰️', '🌐', '💾', '💿', '🧮', '🧪', '🧬', '🔮',
      '💻', '🖥️', '📱', '🕹️', '🧩', '🚀', '🛸', '🛰️', '🤖', '👾'
    ]
  },
  {
    id: 'animals',
    name: 'Animals & Food',
    icon: '🐱',
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
      '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦆', '🦅',
      '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🦋', '🍕', '🍔',
      '🍟', '🌭', '🍿', '🥓', '🍣', '🍦', '🍩', '🍪', '☕', '🍺'
    ]
  }
];

const QUANTUM_STICKERS = [
  {
    id: 'stk_entangled',
    title: 'Entangled Pair',
    visual: '⚛️',
    subtitle: '|Ψ⁺⟩ = (|00⟩ + |11⟩)/√2',
    color: 'from-cyan-500/30 to-blue-600/30 border-cyan-400/50'
  },
  {
    id: 'stk_verified',
    title: 'QDS Verified',
    visual: '🛡️',
    subtitle: 'Signature Accepted (0.0% error)',
    color: 'from-emerald-500/30 to-green-600/30 border-emerald-400/50'
  },
  {
    id: 'stk_bell',
    title: 'Bell Bound',
    visual: '⚡',
    subtitle: 'S ≈ 2.828 (Tsirelson Bound)',
    color: 'from-amber-500/30 to-yellow-600/30 border-amber-400/50'
  },
  {
    id: 'stk_superposition',
    title: 'Superposition',
    visual: '🌀',
    subtitle: 'α|0⟩ + β|1⟩',
    color: 'from-purple-500/30 to-indigo-600/30 border-purple-400/50'
  },
  {
    id: 'stk_cat',
    title: "Schrödinger's Cat",
    visual: '🐱📦',
    subtitle: 'Alive & Dead simultaneously',
    color: 'from-pink-500/30 to-rose-600/30 border-pink-400/50'
  },
  {
    id: 'stk_teleport',
    title: 'Teleportation',
    visual: '🚀',
    subtitle: 'State Transferred via EPR',
    color: 'from-sky-500/30 to-teal-600/30 border-sky-400/50'
  },
  {
    id: 'stk_locked',
    title: 'AES-256 Sealed',
    visual: '🔒',
    subtitle: 'Galois Counter Mode',
    color: 'from-slate-500/30 to-zinc-600/30 border-slate-400/50'
  },
  {
    id: 'stk_hack_blocked',
    title: 'Threat Neutralized',
    visual: '🚨🚫',
    subtitle: 'Eavesdropper Intercepted',
    color: 'from-red-500/30 to-orange-600/30 border-red-400/50'
  }
];

export default function EmojiStickerPicker({ onSelectEmoji, onSelectSticker, onClose }) {
  const [activeTab, setActiveTab] = useState('emojis'); // 'emojis' | 'stickers'
  const [selectedCategory, setSelectedCategory] = useState('smileys');
  const [searchQuery, setSearchQuery] = useState('');

  const currentCategoryData = EMOJI_CATEGORIES.find((c) => c.id === selectedCategory) || EMOJI_CATEGORIES[0];

  const filteredEmojis = searchQuery.trim()
    ? EMOJI_CATEGORIES.flatMap((c) => c.emojis).filter((emoji) => emoji.includes(searchQuery.trim()))
    : currentCategoryData.emojis;

  return (
    <div className="absolute bottom-16 left-2 sm:left-4 z-40 w-80 sm:w-96 bg-wa-surface border border-wa-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[380px] animate-in fade-in zoom-in-95 select-none">
      {/* Top Header Tabs */}
      <div className="h-12 bg-wa-panel border-b border-wa-border flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => setActiveTab('emojis')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'emojis'
                ? 'bg-wa-surface text-quantum-cyan border border-quantum-cyan/30'
                : 'text-wa-textSecondary hover:text-white'
            }`}
          >
            <Smile className="w-4 h-4" /> Emojis
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('stickers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'stickers'
                ? 'bg-wa-surface text-quantum-cyan border border-quantum-cyan/30'
                : 'text-wa-textSecondary hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" /> Quantum Stickers
          </button>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-wa-textSecondary hover:text-white rounded-full transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {activeTab === 'emojis' && (
        <>
          {/* Search Bar */}
          <div className="p-2 border-b border-wa-border bg-wa-surface shrink-0">
            <div className="flex items-center bg-wa-panel rounded-lg px-2.5 py-1 text-xs border border-wa-border focus-within:border-wa-green">
              <Search className="w-3.5 h-3.5 text-wa-textSecondary mr-1.5 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search emojis..."
                className="w-full bg-transparent text-white placeholder-wa-textSecondary focus:outline-none text-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-wa-textSecondary hover:text-white"
                >
                  &times;
                </button>
              )}
            </div>
          </div>

          {/* Emoji Category Ribbon */}
          {!searchQuery && (
            <div className="flex items-center space-x-1 px-2 py-1.5 bg-wa-panel/70 border-b border-wa-border overflow-x-auto no-scrollbar shrink-0">
              {EMOJI_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  title={cat.name}
                  className={`p-1.5 text-sm rounded-lg transition ${
                    selectedCategory === cat.id
                      ? 'bg-wa-hover text-white scale-110 shadow-sm ring-1 ring-quantum-cyan/50'
                      : 'hover:bg-wa-hover/50 opacity-75 hover:opacity-100'
                  }`}
                >
                  {cat.icon}
                </button>
              ))}
            </div>
          )}

          {/* Emojis Grid */}
          <div className="flex-1 overflow-y-auto p-2.5 grid grid-cols-7 sm:grid-cols-8 gap-1 text-2xl">
            {filteredEmojis.map((emoji, index) => (
              <button
                key={index}
                type="button"
                onClick={() => onSelectEmoji(emoji)}
                className="h-10 w-10 flex items-center justify-center rounded-lg hover:bg-wa-hover active:scale-125 transition text-xl sm:text-2xl cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>
        </>
      )}

      {activeTab === 'stickers' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <div className="text-[11px] font-semibold text-quantum-cyan uppercase tracking-wider mb-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Quantum Physics & Security Stickers
          </div>
          <div className="grid grid-cols-2 gap-2">
            {QUANTUM_STICKERS.map((stk) => (
              <button
                key={stk.id}
                type="button"
                onClick={() => {
                  if (onSelectSticker) onSelectSticker(stk);
                  onClose();
                }}
                className={`p-3 rounded-xl border bg-gradient-to-br ${stk.color} text-left transition hover:scale-[1.02] active:scale-95 shadow-md flex flex-col justify-between`}
              >
                <div className="text-3xl mb-1.5">{stk.visual}</div>
                <div>
                  <div className="font-bold text-xs text-white leading-tight">{stk.title}</div>
                  <div className="text-[10px] text-white/80 font-mono mt-0.5 leading-snug">{stk.subtitle}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
