import { BACKEND_BASE } from '../api';

/**
 * Resolves any avatar URL (data URLs, absolute HTTPS, relative backend paths, or fallback Dicebear)
 */
export const getResolvedAvatar = (avatarUrl, fallbackSeed = 'quantum', fallbackName = '') => {
  if (avatarUrl && typeof avatarUrl === 'string') {
    const trimmed = avatarUrl.trim();
    if (trimmed.startsWith('data:') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    if (trimmed.startsWith('/') || trimmed.startsWith('uploads/')) {
      const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
      const base = BACKEND_BASE || 'https://qchat-backend-8tbz.onrender.com';
      return `${base}${cleanPath}`;
    }
  }
  const seed = encodeURIComponent(fallbackSeed || fallbackName || 'quantum_user');
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;
};

/**
 * Resolves media attachment URLs (images, documents, voice)
 */
export const getResolvedMediaUrl = (mediaUrl) => {
  if (!mediaUrl || typeof mediaUrl !== 'string') return '';
  const trimmed = mediaUrl.trim();
  if (trimmed.startsWith('data:') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const base = BACKEND_BASE || 'https://qchat-backend-8tbz.onrender.com';
  return `${base}${cleanPath}`;
};

/**
 * Generic fallback handler for broken <img> elements
 */
export const handleAvatarError = (e, fallbackSeed = 'quantum', fallbackName = '') => {
  if (!e || !e.currentTarget) return;
  e.currentTarget.onerror = null; // Prevent infinite error trigger loops
  const seed = encodeURIComponent(fallbackSeed || fallbackName || 'quantum_user');
  e.currentTarget.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;
};

