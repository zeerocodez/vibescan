import React, { useState } from 'react';
import { Mail, Check, AlertCircle, Sparkles } from 'lucide-react';
import { submitEmail } from '../lib/api.js';

interface EmailCaptureProps {
  scanId: string;
}

export default function EmailCapture({ scanId }: EmailCaptureProps) {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !consent) return;

    setSubmitting(true);
    setStatus('idle');
    try {
      const res = await submitEmail(email.trim(), scanId);
      setStatus('success');
      setMessage(res.message || 'Guide requested! Check your inbox shortly.');
      setEmail('');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Failed to submit email. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl" id="email-capture">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-[#00f0ff] font-mono text-xs uppercase tracking-wider font-bold">
          <Sparkles className="h-4 w-4" />
          <span>Get Detailed Fix Guide</span>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-bold tracking-tight text-white">Need a production-ready remediation roadmap?</h3>
          <p className="text-xs text-[#e8e8f0]/60 leading-relaxed font-sans">
            Enter your email to receive a customized security fix booklet with fully production-tested, clean code examples resolving every finding uncovered in this live run.
          </p>
        </div>

        {status === 'success' ? (
          <div className="border border-[#00e676]/20 bg-[#00e676]/5 rounded-xl p-4 flex items-start gap-3">
            <div className="bg-[#00e676]/10 p-2 rounded-lg text-[#00e676] shrink-0">
              <Check className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Check Your Inbox</h4>
              <p className="text-xs text-[#e8e8f0]/60 font-sans mt-0.5">{message}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <div className="absolute left-4 top-3.5 text-[#e8e8f0]/40">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-[#e8e8f0]/30 focus:outline-none focus:border-[#00f0ff] transition-all font-sans"
              />
            </div>

            {/* GDPR Consent */}
            <label className="flex items-start gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                required
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 rounded border-white/10 bg-black/40 text-[#00f0ff] focus:ring-0 focus:ring-offset-0 accent-[#00f0ff] cursor-pointer"
              />
              <span className="text-[10px] text-[#e8e8f0]/40 leading-relaxed font-sans select-none group-hover:text-gray-400 transition-colors">
                I agree to the Terms of Service and consent to receive a weekly security digest. I can unsubscribe with a single click at any time.
              </span>
            </label>

            {status === 'error' && (
              <div className="border border-[#ff1744]/20 bg-[#ff1744]/5 rounded-xl p-3 flex items-center gap-2 text-xs text-[#ff1744] font-mono">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{message}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !consent}
              className={`w-full py-3 rounded-xl font-mono text-xs uppercase tracking-wider font-bold transition-all ${
                consent
                  ? 'bg-[#00f0ff] text-[#0a0a0f] hover:opacity-90'
                  : 'bg-white/5 text-[#e8e8f0]/30 cursor-not-allowed border border-white/5'
              }`}
            >
              {submitting ? 'Generating Fix Pack...' : 'Email Me the Guide'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
