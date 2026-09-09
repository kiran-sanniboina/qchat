import React from 'react';
import { ShieldAlert, RefreshCw, LogIn } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('QChat UI Crash caught by ErrorBoundary:', error, errorInfo);
  }

  handleReset = () => {
    localStorage.removeItem('qchat_token');
    localStorage.removeItem('qchat_user');
    window.location.href = window.location.origin;
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 w-full h-full bg-wa-bg flex items-center justify-center p-4 select-none z-50">
          <div className="max-w-md w-full bg-wa-panel border border-wa-border rounded-2xl p-6 text-center shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/30 flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert className="w-8 h-8 text-red-400" />
            </div>
            
            <div>
              <h2 className="text-xl font-bold text-white mb-1.5">QChat Interface Recovered</h2>
              <p className="text-xs text-wa-textSecondary leading-relaxed">
                A rendering issue occurred. Click below to clear stored cache and restore the login screen.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-2.5 rounded-lg bg-black/40 border border-wa-border text-[11px] font-mono text-red-300 text-left overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-3.5 py-2.5 bg-wa-hover hover:bg-wa-border text-white text-xs font-semibold rounded-xl border border-wa-border transition flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload</span>
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="px-3.5 py-2.5 bg-wa-green hover:bg-wa-greenHover text-white text-xs font-bold rounded-xl transition shadow-md flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Return to Login</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
