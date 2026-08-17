import React, { useState } from 'react';
import { Shield, Lock, Mail, User, Key, ArrowRight, X, AlertCircle, Sparkles, CheckCircle2, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, initialMode = 'signin' }) {
  const [mode, setMode] = useState(initialMode); // 'signin' | 'signup' | 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let endpoint = '/api/auth/login';
      let payload = { email, password };

      if (mode === 'signup') {
        endpoint = '/api/auth/signup';
        payload = { email, password, name };
      } else if (mode === 'admin') {
        endpoint = '/api/auth/admin-access';
        payload = {};
      }

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok && data.user) {
        localStorage.setItem('vibescan_user', JSON.stringify(data.user));
        if (data.user.tier === 'pro') {
          localStorage.setItem('vibescan_pro_active', 'true');
        }
        if (onAuthSuccess) {
          onAuthSuccess(data.user);
        }
        onClose();
      } else {
        setError(data.error || 'Authentication failed. Please check your credentials.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdminLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/admin-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok && data.user) {
        localStorage.setItem('vibescan_user', JSON.stringify(data.user));
        localStorage.setItem('vibescan_pro_active', 'true');
        if (onAuthSuccess) {
          onAuthSuccess(data.user);
        }
        onClose();
      } else {
        setError(data.error || 'Failed to authenticate admin.');
      }
    } catch (e) {
      setError('Connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-[#121218] border-2 border-primary/20 rounded-[2rem] p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] text-primary overflow-hidden font-data"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#10B981]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-primary/70 hover:text-white flex items-center justify-center transition-colors border border-white/10"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-white font-bold shadow-[0_0_20px_rgba(230,59,46,0.4)]">
            <Shield size={20} />
          </div>
          <div>
            <h2 className="font-heading font-bold text-xl uppercase tracking-tight text-white leading-none">
              {mode === 'signup' ? 'Create Account' : mode === 'admin' ? 'Super Admin Console' : 'Welcome Back'}
            </h2>
            <span className="text-[10px] font-mono font-bold text-accent tracking-widest uppercase">
              {mode === 'signup' ? 'Join Free Basic Scan' : mode === 'admin' ? 'zeerocodes@gmail.com' : 'VibeScan Security'}
            </span>
          </div>
        </div>

        {/* Mode Tabs */}
        <div className="flex bg-white/5 p-1 rounded-xl mb-6 border border-white/10">
          <button
            type="button"
            onClick={() => { setMode('signin'); setError(''); }}
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
              mode === 'signin' 
                ? 'bg-accent text-white shadow-lg' 
                : 'text-primary/60 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(''); }}
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
              mode === 'signup' 
                ? 'bg-accent text-white shadow-lg' 
                : 'text-primary/60 hover:text-white'
            }`}
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => { setMode('admin'); setError(''); }}
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1 ${
              mode === 'admin' 
                ? 'bg-dark border border-accent text-accent shadow-lg' 
                : 'text-primary/60 hover:text-accent'
            }`}
          >
            <Key size={11} /> Admin
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-accent/15 border border-accent/30 text-accent text-xs flex items-center gap-2 animate-shake">
            <AlertCircle size={15} className="shrink-0" />
            <span className="leading-tight">{error}</span>
          </div>
        )}

        {/* Form Body */}
        {mode === 'admin' ? (
          <div className="space-y-4">
            <div className="bg-dark/60 border border-accent/30 rounded-xl p-4 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-accent/20 text-accent flex items-center justify-center mb-3">
                <Shield size={24} />
              </div>
              <h3 className="font-heading font-bold text-sm uppercase text-white mb-1">Super-Admin Authorization</h3>
              <p className="text-[11px] text-primary/70 mb-4 font-mono">
                Direct cryptographic session generation for <strong className="text-accent">zeerocodes@gmail.com</strong> with full root control across all dashboards.
              </p>
              <button
                type="button"
                onClick={handleQuickAdminLogin}
                disabled={loading}
                className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(230,59,46,0.4)] flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Key size={16} />}
                Authenticate As Super-Admin
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-primary/70 mb-1.5 font-mono">Full Name</label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary/40" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-primary/30 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-primary/70 mb-1.5 font-mono">Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary/40" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-primary/30 focus:outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-primary/70 mb-1.5 font-mono">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary/40" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-primary/30 focus:outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-accent hover:bg-accent/90 text-white font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(230,59,46,0.4)] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  {mode === 'signup' ? 'Create Free Account' : 'Sign In To Dashboard'}
                  <ArrowRight size={14} />
                </>
              )}
            </button>

            {/* Admin Quick Shortcut */}
            <div className="pt-3 border-t border-white/10 text-center">
              <button
                type="button"
                onClick={handleQuickAdminLogin}
                className="text-[10px] font-mono text-accent hover:underline inline-flex items-center gap-1 uppercase tracking-wider font-bold"
              >
                <Key size={11} /> Quick Login as Super-Admin (zeerocodes@gmail.com)
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
