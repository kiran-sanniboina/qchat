import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Shield, Lock, Cpu, CheckCircle, ArrowRight, Smartphone } from 'lucide-react';
import api from '../api';

export default function AuthModal({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [activeTab, setActiveTab] = useState('credentials'); // 'credentials' | 'qr'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [qrValue] = useState(`qchat-link-session-${Math.random().toString(36).substring(2, 12)}`);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
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

  // Demo auto-login for testing with 1 click
  const handleQuickDemoLogin = async (role) => {
    setLoading(true);
    setError('');
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
      {/* WhatsApp Web Green Top Banner Background */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-wa-green -z-10" />

      <div className="w-full max-w-4xl bg-wa-panel rounded-lg shadow-2xl overflow-hidden border border-wa-border flex flex-col md:flex-row my-8">
        {/* Left / Info Side */}
        <div className="md:w-5/12 bg-wa-surface p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-wa-border">
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-wa-green flex items-center justify-center text-white shadow-lg">
                <Shield className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  QChat <span className="text-xs px-2 py-0.5 rounded bg-quantum-purple/30 text-quantum-cyan border border-quantum-cyan/30">QDS v1.0</span>
                </h1>
                <p className="text-xs text-wa-textSecondary">Quantum Digital Signature Messenger</p>
              </div>
            </div>

            <div className="space-y-4 text-sm text-wa-textSecondary mb-8">
              <div className="flex items-start space-x-3">
                <Lock className="w-5 h-5 text-wa-green shrink-0 mt-0.5" />
                <div>
                  <span className="text-white font-medium">Dual-Layer Security:</span> AES-256-GCM message encryption paired with SHA-256 integrity hashing.
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Cpu className="w-5 h-5 text-quantum-cyan shrink-0 mt-0.5" />
                <div>
                  <span className="text-white font-medium">Teleportation QDS:</span> Teleports signature Pauli eigenstates ($|0\rangle, |1\rangle, |+\rangle, |-\rangle$) to Bob with Pauli corrections.
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-quantum-emerald shrink-0 mt-0.5" />
                <div>
                  <span className="text-white font-medium">Dynamic E91 Layer:</span> Continuous Bell correlation monitoring with real-time CHSH ($S \approx 2.82$) and QBER tracking.
                </div>
              </div>
            </div>
          </div>

          <div className="bg-wa-panel/60 p-4 rounded-lg border border-wa-border">
            <p className="text-xs text-wa-textSecondary mb-2 font-medium">Quick Demo Profiles (Instant Test):</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('alice')}
                className="px-3 py-2 bg-wa-hover hover:bg-wa-green/20 text-xs font-semibold rounded text-wa-green border border-wa-green/30 transition flex items-center justify-center gap-1.5"
              >
                Launch Alice 👩‍🔬
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('bob')}
                className="px-3 py-2 bg-wa-hover hover:bg-quantum-cyan/20 text-xs font-semibold rounded text-quantum-cyan border border-quantum-cyan/30 transition flex items-center justify-center gap-1.5"
              >
                Launch Bob 👨‍💻
              </button>
            </div>
          </div>
        </div>

        {/* Right / Form Side */}
        <div className="md:w-7/12 p-8 flex flex-col justify-center">
          {/* Tab Selector: Credentials vs QR Code */}
          <div className="flex border-b border-wa-border mb-6">
            <button
              onClick={() => setActiveTab('credentials')}
              className={`pb-3 px-4 text-sm font-semibold border-b-2 transition ${
                activeTab === 'credentials'
                  ? 'border-wa-green text-wa-green'
                  : 'border-transparent text-wa-textSecondary hover:text-white'
              }`}
            >
              Email & Password
            </button>
            <button
              onClick={() => setActiveTab('qr')}
              className={`pb-3 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
                activeTab === 'qr'
                  ? 'border-wa-green text-wa-green'
                  : 'border-transparent text-wa-textSecondary hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4" /> Link via QR
            </button>
          </div>

          {activeTab === 'credentials' ? (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-1">
                  {isLogin ? 'Sign in to QChat Web' : 'Create Quantum Identity'}
                </h2>
                <p className="text-xs text-wa-textSecondary">
                  {isLogin ? 'Enter your credentials to access encrypted quantum sessions.' : 'Register a new profile with quantum digital identity.'}
                </p>
              </div>

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
                      className="w-full bg-wa-bg border border-wa-border rounded px-3 py-2.5 text-sm text-white placeholder-wa-textSecondary/50 focus:outline-none focus:border-wa-green"
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
                    className="w-full bg-wa-bg border border-wa-border rounded px-3 py-2.5 text-sm text-white placeholder-wa-textSecondary/50 focus:outline-none focus:border-wa-green"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-wa-textSecondary mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••••••"
                    className="w-full bg-wa-bg border border-wa-border rounded px-3 py-2.5 text-sm text-white placeholder-wa-textSecondary/50 focus:outline-none focus:border-wa-green"
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
                  onClick={() => { setIsLogin(!isLogin); setError(''); }}
                  className="ml-2 text-wa-green hover:underline font-medium"
                >
                  {isLogin ? 'Create one now' : 'Sign in here'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <h2 className="text-lg font-bold text-white mb-1">Link a Device with QR Code</h2>
              <p className="text-xs text-wa-textSecondary mb-6 max-w-xs">
                To link WhatsApp Web, open QChat on your phone, tap Settings &gt; Linked Devices, and point your camera here.
              </p>

              <div className="p-4 bg-white rounded-xl shadow-lg mb-6 border-4 border-wa-green/40">
                <QRCodeSVG value={qrValue} size={180} level="H" />
              </div>

              <div className="flex items-center gap-2 text-xs text-wa-textSecondary">
                <span className="w-2 h-2 rounded-full bg-wa-green animate-ping" />
                <span>Waiting for pairing handshake... (or use Quick Demo login)</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

