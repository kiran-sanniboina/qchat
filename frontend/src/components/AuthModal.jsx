import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Shield, Lock, Cpu, CheckCircle, ArrowRight, Smartphone, KeyRound, Mail, ArrowLeft, RefreshCw, Eye, EyeOff, Info, ExternalLink, Sun, Moon } from 'lucide-react';
import api from '../api';
import { useTheme } from '../context/ThemeContext';

export default function AuthModal({ onAuthSuccess }) {
  const { theme, toggleTheme, isDark } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [activeTab, setActiveTab] = useState('credentials'); // 'credentials' | 'qr'
  const [viewMode, setViewMode] = useState('auth'); // 'auth' | 'forgot_request' | 'forgot_verify' | 'forgot_success'
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [successMsg, setSuccessMsg] = useState('');
  const [sandboxCode, setSandboxCode] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isRealEmail, setIsRealEmail] = useState(false);

  // QR Code Login State
  const [qrSessionId, setQrSessionId] = useState(null);
  const [qrPairCode, setQrPairCode] = useState('');
  const [qrValue, setQrValue] = useState('');
  const [qrExpiresIn, setQrExpiresIn] = useState(120);
  const [qrStatus, setQrStatus] = useState('idle'); // 'idle' | 'loading' | 'ready' | 'authenticating' | 'authenticated' | 'expired'
  const [qrAuthorizing, setQrAuthorizing] = useState(false);
  const [showQrCredentials, setShowQrCredentials] = useState(false);
  const [qrManualEmail, setQrManualEmail] = useState('');
  const [qrManualPassword, setQrManualPassword] = useState('');

  // Resend cooldown timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Initialize QR Session
  const initQrSession = async () => {
    setQrStatus('loading');
    setError('');
    try {
      const res = await api.post('/auth/qr/init');
      setQrSessionId(res.data.sessionId);
      setQrPairCode(res.data.pairCode);
      setQrValue(res.data.qrValue || res.data.sessionId);
      setQrExpiresIn(res.data.expiresIn || 120);
      setQrStatus('ready');
    } catch (err) {
      console.warn('QR init fallback:', err.message);
      const fallbackId = 'qchat_qr_' + Math.random().toString(36).substring(2, 10);
      setQrSessionId(fallbackId);
      setQrPairCode('1234');
      setQrValue(JSON.stringify({ app: 'qchat', action: 'link_device', sessionId: fallbackId, pairCode: '1234' }));
      setQrExpiresIn(120);
      setQrStatus('ready');
    }
  };

  // Start QR session when switching to 'qr' tab
  useEffect(() => {
    if (activeTab === 'qr') {
      initQrSession();
    } else {
      setQrStatus('idle');
    }
  }, [activeTab]);

  // Countdown timer for QR expiration
  useEffect(() => {
    let timer;
    if (activeTab === 'qr' && qrStatus === 'ready' && qrExpiresIn > 0) {
      timer = setInterval(() => {
        setQrExpiresIn((prev) => {
          if (prev <= 1) {
            setQrStatus('expired');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeTab, qrStatus, qrExpiresIn]);

  // Poll for QR session authorization
  useEffect(() => {
    let pollInterval;
    if (activeTab === 'qr' && qrStatus === 'ready' && qrSessionId) {
      pollInterval = setInterval(async () => {
        try {
          const res = await api.get(`/auth/qr/status/${qrSessionId}`);
          if (res.data.status === 'authenticated') {
            setQrStatus('authenticated');
            clearInterval(pollInterval);
            const { token, user } = res.data;
            localStorage.setItem('qchat_token', token);
            localStorage.setItem('qchat_user', JSON.stringify(user));
            setTimeout(() => {
              onAuthSuccess(user);
            }, 600);
          } else if (res.data.status === 'expired') {
            setQrStatus('expired');
            clearInterval(pollInterval);
          }
        } catch (err) {
          if (err.response?.status === 404 || err.response?.status === 410) {
            setQrStatus('expired');
            clearInterval(pollInterval);
          }
        }
      }, 1500);
    }
    return () => clearInterval(pollInterval);
  }, [activeTab, qrStatus, qrSessionId]);

  // Handler to authorize QR code
  const handleAuthorizeQr = async (demoRole = null) => {
    if (!qrSessionId) return;
    setQrAuthorizing(true);
    setError('');
    try {
      const payload = demoRole
        ? { sessionId: qrSessionId, demoRole }
        : { sessionId: qrSessionId, email: qrManualEmail.trim(), password: qrManualPassword };

      await api.post('/auth/qr/authorize', payload);
      setQrStatus('authenticating');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Authorization failed');
    } finally {
      setQrAuthorizing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : { name: formData.name, email: formData.email, password: formData.password };

      const res = await api.post(endpoint, payload);
      const { token, user } = res.data;

      localStorage.setItem('qchat_token', token);
      localStorage.setItem('qchat_user', JSON.stringify(user));

      onAuthSuccess(user);
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Request 6-digit verification code to email
  const handleRequestResetCode = async (e) => {
    e?.preventDefault();
    if (!forgotEmail || !forgotEmail.trim()) {
      setError('Please enter your registered email address.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await api.post('/auth/forgot-password', { email: forgotEmail.trim() });
      setSuccessMsg(res.data.message || `A 6-digit code was generated for ${forgotEmail}`);
      setSandboxCode(res.data.devCode || null);
      setPreviewUrl(res.data.previewUrl || null);
      setIsRealEmail(!!res.data.isRealEmail);
      if (res.data.devCode) {
        setResetCode(res.data.devCode);
      }
      setViewMode('forgot_verify');
      setResendCooldown(60);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to send reset code.');
    } finally {
      setLoading(false);
    }
  };

  // Submit code and new password
  const handleResetPassword = async (e) => {
    e?.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanCode = resetCode.replace(/\D/g, '').trim();
    if (!cleanCode || cleanCode.length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', {
        email: forgotEmail.trim(),
        code: cleanCode,
        newPassword
      });
      setViewMode('forgot_success');
      setSuccessMsg(res.data.message || 'Password successfully updated!');
      setSandboxCode(null);
      setPreviewUrl(null);
      setResetCode('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  // Demo auto-login for testing with 1 click
  const handleQuickDemoLogin = async (role) => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    const demoEmail = role === 'alice' ? 'alice@qchat.quantum' : 'bob@qchat.quantum';
    const demoName = role === 'alice' ? 'Alice (Quantum Node A)' : 'Bob (Quantum Node B)';
    const demoPassword = 'password123';

    try {
      // Try login first, or register if not exists
      let res;
      try {
        res = await api.post('/auth/login', { email: demoEmail, password: demoPassword });
      } catch (loginErr) {
        res = await api.post('/auth/register', {
          name: demoName,
          email: demoEmail,
          password: demoPassword
        });
      }

      const { token, user } = res.data;
      localStorage.setItem('qchat_token', token);
      localStorage.setItem('qchat_user', JSON.stringify(user));
      onAuthSuccess(user);
    } catch (err) {
      setError('Demo quick login failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-wa-bg flex items-center justify-center p-4 z-50 overflow-y-auto">
      {/* Floating Theme Toggle Switch */}
      <div className="fixed top-4 right-4 z-50">
        <button
          type="button"
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-wa-panel/90 backdrop-blur border border-wa-border shadow-lg text-wa-textPrimary hover:bg-wa-hover transition text-xs font-medium"
        >
          {isDark ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-500" />
              <span className="hidden sm:inline">Dark Mode</span>
            </>
          )}
        </button>
      </div>

      {/* WhatsApp Web Green Top Banner Background */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-wa-green -z-10" />

      <div className="w-full max-w-4xl bg-wa-panel rounded-lg shadow-2xl overflow-hidden border border-wa-border flex flex-col md:flex-row my-8">
        {/* Left / Info Side */}
        <div className="md:w-5/12 bg-wa-surface p-6 sm:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-wa-border">
          <div>
            {/* Header / Brand */}
            <div className="flex items-center space-x-3.5 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-wa-green to-emerald-700 flex items-center justify-center text-white shadow-lg shadow-wa-green/20 border border-wa-green/30 shrink-0">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-wa-textPrimary tracking-tight flex items-center gap-2">
                  QChat <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-quantum-cyan/15 text-quantum-cyan border border-quantum-cyan/30 font-semibold">QDS v1.0</span>
                </h1>
                <p className="text-xs text-wa-textSecondary font-medium">Quantum Digital Signature Messenger</p>
              </div>
            </div>

            {/* Core Security Features */}
            <div className="space-y-3.5 mb-6">
              {/* Feature 1: Dual-Layer Security */}
              <div className="p-3.5 rounded-xl bg-wa-panel/75 border border-wa-border/80 hover:border-wa-green/40 transition">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-wa-green/20 text-wa-green flex items-center justify-center shrink-0 border border-wa-green/30">
                    <Lock className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-wa-textPrimary tracking-wide">Dual-Layer Security</h3>
                </div>
                <p className="text-xs text-wa-textSecondary leading-relaxed pl-9.5">
                  Full message privacy with authenticated <strong className="text-wa-textPrimary">AES-256-GCM</strong> encryption, paired with <strong className="text-wa-textPrimary">SHA-256</strong> integrity hashing to eliminate tampering.
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2.5 pl-9.5">
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-wa-hover text-wa-green border border-wa-green/25">AES-256-GCM</span>
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-wa-hover text-wa-green border border-wa-green/25">SHA-256 Hashing</span>
                </div>
              </div>

              {/* Feature 2: Teleportation QDS */}
              <div className="p-3.5 rounded-xl bg-wa-panel/75 border border-wa-border/80 hover:border-quantum-cyan/40 transition">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-quantum-cyan/20 text-quantum-cyan flex items-center justify-center shrink-0 border border-quantum-cyan/30">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-wa-textPrimary tracking-wide">Teleportation QDS</h3>
                </div>
                <p className="text-xs text-wa-textSecondary leading-relaxed pl-9.5">
                  Signs every payload by teleporting quantum signature states using entangled Bell pairs with feed-forward Pauli corrections.
                </p>
                <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pl-9.5">
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-quantum-cyan/15 text-quantum-cyan border border-quantum-cyan/30">|0⟩</span>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-quantum-cyan/15 text-quantum-cyan border border-quantum-cyan/30">|1⟩</span>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-quantum-cyan/15 text-quantum-cyan border border-quantum-cyan/30">|+⟩</span>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-quantum-cyan/15 text-quantum-cyan border border-quantum-cyan/30">|−⟩</span>
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-wa-hover text-wa-textSecondary border border-wa-border">Pauli Feed-Forward</span>
                </div>
              </div>

              {/* Feature 3: Dynamic E91 Layer */}
              <div className="p-3.5 rounded-xl bg-wa-panel/75 border border-wa-border/80 hover:border-emerald-500/40 transition">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-wa-textPrimary tracking-wide">Dynamic E91 Layer</h3>
                </div>
                <p className="text-xs text-wa-textSecondary leading-relaxed pl-9.5">
                  Real-time Ekert91 quantum channel monitoring. Verifies Bell correlation violation to instantly detect man-in-the-middle eavesdropping.
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2.5 pl-9.5">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">CHSH S ≈ 2.82</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">QBER &lt; 11%</span>
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-wa-hover text-wa-textSecondary border border-wa-border">Anti-Eavesdrop</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Demo Profiles */}
          <div className="bg-wa-panel/80 p-4 rounded-xl border border-wa-border">
            <p className="text-xs text-wa-textSecondary mb-2.5 font-medium flex items-center justify-between">
              <span className="font-semibold text-wa-textPrimary">Quick Demo Profiles:</span>
              <span className="text-[10px] text-wa-textSecondary font-mono">1-Click Instant Login</span>
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('alice')}
                className="px-3 py-2.5 bg-wa-hover hover:bg-wa-green/20 text-xs font-bold rounded-lg text-wa-green border border-wa-green/30 transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                Launch Alice 👩‍🔬
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('bob')}
                className="px-3 py-2.5 bg-wa-hover hover:bg-quantum-cyan/20 text-xs font-bold rounded-lg text-quantum-cyan border border-quantum-cyan/30 transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                Launch Bob 👨‍💻
              </button>
            </div>
          </div>
        </div>

        {/* Right / Form Side */}
        <div className="md:w-7/12 p-8 flex flex-col justify-center">
          {/* If inside Forgot Password workflow, show subheader back navigation */}
          {viewMode !== 'auth' ? (
            <div>
              {/* Step 1: Request Code */}
              {viewMode === 'forgot_request' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-200">
                  <button
                    type="button"
                    onClick={() => { setViewMode('auth'); setError(''); setSuccessMsg(''); }}
                    className="text-xs text-wa-textSecondary hover:text-wa-textPrimary flex items-center gap-1.5 mb-6 transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                  </button>

                  <div className="mb-6">
                    <div className="w-10 h-10 rounded-full bg-wa-green/20 text-wa-green flex items-center justify-center mb-3">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold text-wa-textPrimary mb-1">Forgot Password</h2>
                    <p className="text-xs text-wa-textSecondary leading-relaxed">
                      Enter your registered email address. We'll send a 6-digit quantum security code to verify your identity.
                    </p>
                  </div>

                  {error && (
                    <div className="p-3 mb-4 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleRequestResetCode} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-wa-textSecondary mb-1">
                        Registered Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="your-email@domain.com"
                        className="w-full bg-wa-bg border border-wa-border rounded px-3 py-2.5 text-sm text-wa-textPrimary placeholder-wa-textSecondary/50 focus:outline-none focus:border-wa-green"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-wa-green hover:bg-wa-greenHover text-white font-semibold py-2.5 rounded text-sm transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Sending Verification Code...</span>
                        </>
                      ) : (
                        <>
                          <span>Send 6-Digit Code</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* Step 2: Enter Code & Set New Password */}
              {viewMode === 'forgot_verify' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      type="button"
                      onClick={() => { setViewMode('forgot_request'); setError(''); }}
                      className="text-xs text-wa-textSecondary hover:text-wa-textPrimary flex items-center gap-1.5 transition"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Change Email
                    </button>
                    <span className="text-[11px] text-quantum-cyan font-mono bg-quantum-cyan/10 px-2 py-0.5 rounded border border-quantum-cyan/20">
                      OTP Sent
                    </span>
                  </div>

                  <div className="mb-5">
                    <div className="w-10 h-10 rounded-full bg-quantum-cyan/20 text-quantum-cyan flex items-center justify-center mb-3">
                      <Mail className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold text-wa-textPrimary mb-1">Enter Verification Code</h2>
                    <p className="text-xs text-wa-textSecondary leading-relaxed">
                      We sent a 6-digit code to <span className="text-wa-textPrimary font-semibold">{forgotEmail}</span>. Enter the code and your new password below.
                    </p>
                  </div>

                  {successMsg && (
                    <div className="p-3 mb-4 rounded bg-wa-green/10 border border-wa-green/30 text-wa-green text-xs">
                      {successMsg}
                    </div>
                  )}

                  {error && (
                    <div className="p-3 mb-4 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                      {error}
                    </div>
                  )}

                  {/* Real Email Dispatched Alert */}
                  {isRealEmail && (
                    <div className="p-3 mb-4 rounded bg-wa-green/10 border border-wa-green/30 text-wa-green text-xs flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 shrink-0 text-wa-green" />
                      <span>Email dispatched to <strong>{forgotEmail}</strong>. Please check your inbox and spam folder.</span>
                    </div>
                  )}

                  {/* Demonstration Sandbox Notice (when real SMTP is not configured) */}
                  {!isRealEmail && (
                    <div className="p-3.5 mb-4 rounded-lg bg-quantum-cyan/10 border border-quantum-cyan/30 text-xs text-wa-textPrimary space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-quantum-cyan flex items-center gap-1.5">
                          <Info className="w-4 h-4 text-quantum-cyan shrink-0" />
                          Demo / Sandbox Verification Code:
                        </span>
                        {sandboxCode && (
                          <span className="font-mono text-sm font-bold tracking-widest text-quantum-emerald bg-wa-panel px-2.5 py-0.5 rounded border border-quantum-emerald/40">
                            {sandboxCode}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-wa-textSecondary leading-normal">
                        Demonstration mode active (no external email API configured). The code has been generated and auto-filled below for instant password reset.
                      </p>
                      {previewUrl && (
                        <div className="pt-0.5">
                          <a
                            href={previewUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-quantum-cyan hover:underline inline-flex items-center gap-1 font-medium bg-quantum-cyan/10 px-2 py-1 rounded border border-quantum-cyan/20"
                          >
                            <span>Open Virtual Email Preview</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  <form onSubmit={handleResetPassword} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-medium text-wa-textSecondary mb-1">
                        6-Digit Security Code
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        className="w-full bg-wa-bg border border-wa-border rounded px-3 py-2 text-center text-xl font-mono tracking-[0.4em] font-bold text-quantum-cyan placeholder-wa-textSecondary/30 focus:outline-none focus:border-wa-green"
                      />
                      <p className="text-[11px] text-wa-textSecondary/70 mt-1 text-center">
                        Code valid for 15 minutes. Check spam folder if not received.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-wa-textSecondary mb-1">
                        New Password (min 6 characters)
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full bg-wa-bg border border-wa-border rounded px-3 py-2 text-sm text-wa-textPrimary placeholder-wa-textSecondary/50 focus:outline-none focus:border-wa-green pr-9"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-2.5 text-wa-textSecondary hover:text-wa-textPrimary"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-wa-textSecondary mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-wa-bg border border-wa-border rounded px-3 py-2 text-sm text-wa-textPrimary placeholder-wa-textSecondary/50 focus:outline-none focus:border-wa-green"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-wa-green hover:bg-wa-greenHover text-white font-semibold py-2.5 rounded text-sm transition shadow-md flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Resetting Password...</span>
                        </>
                      ) : (
                        <>
                          <span>Save & Set New Password</span>
                          <CheckCircle className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>

                  <div className="mt-4 pt-3 border-t border-wa-border/60 flex items-center justify-between text-xs text-wa-textSecondary">
                    <button
                      type="button"
                      disabled={resendCooldown > 0 || loading}
                      onClick={handleRequestResetCode}
                      className="text-wa-green hover:underline font-medium disabled:opacity-50 disabled:no-underline"
                    >
                      {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setViewMode('auth'); setError(''); }}
                      className="hover:text-wa-textPrimary transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Password Reset Successful */}
              {viewMode === 'forgot_success' && (
                <div className="text-center py-6 animate-in zoom-in-95 duration-200">
                  <div className="w-14 h-14 rounded-full bg-wa-green/20 text-wa-green flex items-center justify-center mx-auto mb-4 border border-wa-green/30 shadow-lg">
                    <CheckCircle className="w-8 h-8 text-wa-green" />
                  </div>
                  <h2 className="text-xl font-bold text-wa-textPrimary mb-2">Password Successfully Updated!</h2>
                  <p className="text-xs text-wa-textSecondary max-w-sm mx-auto mb-6 leading-relaxed">
                    Your password has been updated. You can now log into your QChat account using your new credentials.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('auth');
                      setIsLogin(true);
                      setFormData((prev) => ({ ...prev, email: forgotEmail, password: '' }));
                      setError('');
                      setSuccessMsg('Password updated! Please log in.');
                    }}
                    className="w-full bg-wa-green hover:bg-wa-greenHover text-white font-semibold py-2.5 rounded text-sm transition shadow-md flex items-center justify-center gap-2"
                  >
                    <span>Proceed to Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Tab Selector: Credentials vs QR Code */}
              <div className="flex border-b border-wa-border mb-6">
                <button
                  onClick={() => setActiveTab('credentials')}
                  className={`pb-3 px-4 text-sm font-semibold border-b-2 transition ${
                    activeTab === 'credentials'
                      ? 'border-wa-green text-wa-green'
                      : 'border-transparent text-wa-textSecondary hover:text-wa-textPrimary'
                  }`}
                >
                  Email & Password
                </button>
                <button
                  onClick={() => setActiveTab('qr')}
                  className={`pb-3 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
                    activeTab === 'qr'
                      ? 'border-wa-green text-wa-green'
                      : 'border-transparent text-wa-textSecondary hover:text-wa-textPrimary'
                  }`}
                >
                  <Smartphone className="w-4 h-4" /> Link via QR
                </button>
              </div>

              {activeTab === 'credentials' ? (
                <div>
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-wa-textPrimary mb-1">
                      {isLogin ? 'Sign in to QChat Web' : 'Create Quantum Identity'}
                    </h2>
                    <p className="text-xs text-wa-textSecondary">
                      {isLogin ? 'Enter your credentials to access encrypted quantum sessions.' : 'Register a new profile with quantum digital identity.'}
                    </p>
                  </div>

                  {successMsg && (
                    <div className="p-3 mb-4 rounded bg-wa-green/10 border border-wa-green/30 text-wa-green text-xs">
                      {successMsg}
                    </div>
                  )}

                  {error && (
                    <div className="p-3 mb-4 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                      <div>
                        <label className="block text-xs font-medium text-wa-textSecondary mb-1">Full Name</label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Dr. Alice Quantum"
                          className="w-full bg-wa-bg border border-wa-border rounded px-3 py-2.5 text-sm text-wa-textPrimary placeholder-wa-textSecondary/50 focus:outline-none focus:border-wa-green"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-medium text-wa-textSecondary mb-1">Email / Quantum ID</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="alice@qchat.quantum"
                        className="w-full bg-wa-bg border border-wa-border rounded px-3 py-2.5 text-sm text-wa-textPrimary placeholder-wa-textSecondary/50 focus:outline-none focus:border-wa-green"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-medium text-wa-textSecondary">Password</label>
                        {isLogin && (
                          <button
                            type="button"
                            onClick={() => {
                              setViewMode('forgot_request');
                              setForgotEmail(formData.email || '');
                              setError('');
                              setSuccessMsg('');
                            }}
                            className="text-xs text-wa-green hover:underline font-medium transition"
                          >
                            Forgot Password?
                          </button>
                        )}
                      </div>
                      <input
                        type="password"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="••••••••••••"
                        className="w-full bg-wa-bg border border-wa-border rounded px-3 py-2.5 text-sm text-wa-textPrimary placeholder-wa-textSecondary/50 focus:outline-none focus:border-wa-green"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-wa-green hover:bg-wa-greenHover text-white font-semibold py-2.5 rounded text-sm transition shadow-md flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                    >
                      {loading ? 'Processing...' : (isLogin ? 'Log In to Web' : 'Register Account')}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>

                  <div className="mt-6 text-center text-xs text-wa-textSecondary">
                    {isLogin ? "Don't have an account yet?" : 'Already have an account?'}
                    <button
                      type="button"
                      onClick={() => { setIsLogin(!isLogin); setError(''); setSuccessMsg(''); }}
                      className="ml-2 text-wa-green hover:underline font-medium"
                    >
                      {isLogin ? 'Create one now' : 'Sign in here'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-2 text-center animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-full bg-wa-green/20 text-wa-green flex items-center justify-center">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <h2 className="text-lg font-bold text-wa-textPrimary">Log in with QR Code</h2>
                  </div>
                  <p className="text-xs text-wa-textSecondary mb-3 max-w-sm leading-relaxed">
                    Scan with your mobile camera or use instant 1-click test pairing below to log into your quantum encrypted session.
                  </p>

                  {error && (
                    <div className="w-full max-w-sm p-2.5 mb-3 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                      {error}
                    </div>
                  )}

                  {/* QR Code Card with Overlays */}
                  <div className="relative p-4 bg-white rounded-2xl shadow-2xl mb-3 border-4 border-wa-green/40">
                    {qrStatus === 'loading' ? (
                      <div className="w-[180px] h-[180px] flex flex-col items-center justify-center text-gray-800 gap-2">
                        <RefreshCw className="w-7 h-7 animate-spin text-wa-green" />
                        <span className="text-xs font-semibold">Generating QR...</span>
                      </div>
                    ) : (
                      <QRCodeSVG value={qrValue || 'qchat_session'} size={180} level="H" />
                    )}

                    {/* Authenticated Overlay */}
                    {qrStatus === 'authenticated' && (
                      <div className="absolute inset-0 bg-wa-green/95 rounded-xl flex flex-col items-center justify-center text-white p-4 animate-in zoom-in-95">
                        <CheckCircle className="w-12 h-12 mb-2 animate-bounce" />
                        <span className="text-sm font-bold">Authorized!</span>
                        <span className="text-xs opacity-90">Logging in now...</span>
                      </div>
                    )}

                    {/* Expired Overlay */}
                    {qrStatus === 'expired' && (
                      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center text-white p-4 animate-in fade-in">
                        <p className="text-xs text-red-300 font-semibold mb-2">QR Code Expired</p>
                        <button
                          type="button"
                          onClick={initQrSession}
                          className="px-3.5 py-1.5 bg-wa-green hover:bg-wa-greenHover text-white text-xs font-bold rounded-lg shadow-md transition flex items-center gap-1.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Reload QR</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Pairing PIN and Expiry Countdown */}
                  {qrStatus !== 'loading' && qrStatus !== 'expired' && (
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <div className="bg-wa-panel border border-wa-border px-3 py-1.5 rounded-lg flex items-center gap-2">
                        <span className="text-[11px] text-gray-400 font-medium">Pairing PIN:</span>
                        <span className="font-mono text-sm font-extrabold tracking-widest text-quantum-cyan bg-black/40 px-2 py-0.5 rounded border border-quantum-cyan/30">
                          {qrPairCode || '----'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 font-mono">
                        ⏱️ {Math.floor(qrExpiresIn / 60)}:{(qrExpiresIn % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  )}

                  {/* Live Status Indicator */}
                  <div className="flex items-center gap-2 text-xs text-gray-300 mb-3.5">
                    {qrStatus === 'authenticating' ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-quantum-cyan" />
                        <span className="text-quantum-cyan font-semibold">Authorizing quantum handshake...</span>
                      </>
                    ) : qrStatus === 'authenticated' ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 text-wa-green" />
                        <span className="text-wa-green font-semibold">Handshake verified! Redirecting...</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-wa-green animate-ping" />
                        <span>Waiting for phone scan or instant authorization...</span>
                      </>
                    )}
                  </div>

                  {/* 1-Click Instant QR Login Simulator */}
                  <div className="w-full max-w-sm p-3 rounded-xl bg-wa-panel/80 border border-wa-border text-left mb-3">
                    <p className="text-[11px] font-semibold text-wa-textPrimary mb-2 flex items-center justify-between">
                      <span>⚡ Instant 1-Click QR Login (Test Handshake):</span>
                      <span className="text-[10px] text-wa-green font-mono">Simulate Scan</span>
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={qrAuthorizing || qrStatus === 'expired'}
                        onClick={() => handleAuthorizeQr('alice')}
                        className="px-3 py-2 bg-wa-hover hover:bg-wa-green/20 text-xs font-bold rounded-lg text-wa-green border border-wa-green/30 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {qrAuthorizing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <span>Authorize Alice 👩‍🔬</span>}
                      </button>
                      <button
                        type="button"
                        disabled={qrAuthorizing || qrStatus === 'expired'}
                        onClick={() => handleAuthorizeQr('bob')}
                        className="px-3 py-2 bg-wa-hover hover:bg-quantum-cyan/20 text-xs font-bold rounded-lg text-quantum-cyan border border-quantum-cyan/30 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {qrAuthorizing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <span>Authorize Bob 👨‍💻</span>}
                      </button>
                    </div>
                  </div>

                  {/* Manual Account Authorization Accordion */}
                  <div className="w-full max-w-sm text-left">
                    <button
                      type="button"
                      onClick={() => setShowQrCredentials(!showQrCredentials)}
                      className="text-xs text-wa-textSecondary hover:text-wa-textPrimary underline mb-2 transition block"
                    >
                      {showQrCredentials ? '▲ Hide manual credentials' : '▼ Or authorize this QR session with an existing account'}
                    </button>

                    {showQrCredentials && (
                      <form onSubmit={(e) => { e.preventDefault(); handleAuthorizeQr(); }} className="space-y-2 p-3 bg-wa-panel rounded-lg border border-wa-border">
                        <input
                          type="email"
                          required
                          placeholder="your-email@domain.com"
                          value={qrManualEmail}
                          onChange={(e) => setQrManualEmail(e.target.value)}
                          className="w-full bg-wa-bg border border-wa-border rounded px-3 py-1.5 text-xs text-wa-textPrimary focus:outline-none focus:border-wa-green"
                        />
                        <input
                          type="password"
                          required
                          placeholder="Password"
                          value={qrManualPassword}
                          onChange={(e) => setQrManualPassword(e.target.value)}
                          className="w-full bg-wa-bg border border-wa-border rounded px-3 py-1.5 text-xs text-wa-textPrimary focus:outline-none focus:border-wa-green"
                        />
                        <button
                          type="submit"
                          disabled={qrAuthorizing}
                          className="w-full bg-wa-green hover:bg-wa-greenHover text-white text-xs font-bold py-1.5 rounded transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                          {qrAuthorizing && <RefreshCw className="w-3 h-3 animate-spin" />}
                          <span>Authorize and Log In</span>
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
