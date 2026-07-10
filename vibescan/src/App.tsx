import React, { useState, useEffect } from 'react';
import { ShieldAlert, ArrowLeft, Terminal, Sparkles, ExternalLink, ChevronRight, CheckCircle2, ShieldAlert as AlertIcon, CreditCard, Clock } from 'lucide-react';
import Hero from './components/Hero.js';
import ScanInput from './components/ScanInput.js';
import ScoreCard from './components/ScoreCard.js';
import FindingCard from './components/FindingCard.js';
import ShareButtons from './components/ShareButtons.js';
import EmailCapture from './components/EmailCapture.js';
import Leaderboard from './components/Leaderboard.js';
import { getScan } from './lib/api.js';
import { Scan, Finding } from './types.js';

export default function App() {
  const [view, setView] = useState<'landing' | 'result'>('landing');
  const [activeScanId, setActiveScanId] = useState<string | null>(null);
  const [scan, setScan] = useState<Scan | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse path on initial mount
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      const match = path.match(/^\/r\/([A-Za-z0-9_]+)/);
      if (match && match[1]) {
        setActiveScanId(match[1]);
        setView('result');
        loadScanDetails(match[1]);
      } else {
        setView('landing');
        setActiveScanId(null);
        setScan(null);
        setFindings([]);
        setCategoryFilter(null);
      }
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Fetch scan details and handle polling if queued/scanning
  const loadScanDetails = async (scanId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getScan(scanId);
      setScan(data);
      if (data.findings) {
        setFindings(data.findings);
      }

      // If scan is still in progress, set up a polling interval
      if (data.status !== 'completed' && data.status !== 'failed') {
        const interval = setInterval(async () => {
          try {
            const polledData = await getScan(scanId);
            setScan(polledData);
            if (polledData.status === 'completed') {
              if (polledData.findings) setFindings(polledData.findings);
              clearInterval(interval);
              setLoading(false);
            } else if (polledData.status === 'failed') {
              setError(polledData.errorMessage || 'Security analysis scan failed to complete. Please try another public repository.');
              clearInterval(interval);
              setLoading(false);
            }
          } catch (e) {
            clearInterval(interval);
            setLoading(false);
          }
        }, 1500);

        return () => clearInterval(interval);
      } else {
        if (data.status === 'failed') {
          setError(data.errorMessage || 'Security analysis scan failed to complete. Please try another public repository.');
        }
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load scorecard.');
      setLoading(false);
    }
  };

  const handleScanStarted = (scanId: string) => {
    setActiveScanId(scanId);
    setView('result');
    // Navigate without full reload
    window.history.pushState({}, '', `/r/${scanId}`);
    loadScanDetails(scanId);
  };

  const handleBackToLanding = () => {
    setView('landing');
    setActiveScanId(null);
    setScan(null);
    setFindings([]);
    setCategoryFilter(null);
    window.history.pushState({}, '', '/');
  };

  // Sort findings: CRITICAL > HIGH > MEDIUM > LOW > INFO
  const severityOrder: Record<string, number> = {
    CRITICAL: 5,
    HIGH: 4,
    MEDIUM: 3,
    LOW: 2,
    INFO: 1,
  };

  const sortedFindings = [...findings].sort((a, b) => {
    return (severityOrder[b.severity] ?? 0) - (severityOrder[a.severity] ?? 0);
  });

  const filteredFindings = categoryFilter
    ? sortedFindings.filter((f) => f.category === categoryFilter)
    : sortedFindings;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0] font-sans antialiased selection:bg-[#00f0ff]/20 selection:text-[#00f0ff]">
      
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950/10 via-[#0a0a0f] to-[#0a0a0f] pointer-events-none z-0"></div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-[#0a0a0f]/80 backdrop-blur-md sticky top-0" id="header-nav">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleBackToLanding}>
            <div className="bg-[#00f0ff]/10 border border-[#00f0ff]/30 p-1.5 rounded-lg text-[#00f0ff]">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <span className="font-sans font-black tracking-tight text-white text-lg">
              Vibe<span className="text-[#00f0ff]">Scan</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono text-[#e8e8f0]/40 bg-black/40 px-2 py-0.5 rounded border border-white/10">
              v1.0 MVP
            </span>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#e8e8f0]/40 hover:text-white transition-all text-xs font-mono flex items-center gap-1"
            >
              GitHub <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-12">
        {error && (
          <div className="border border-[#ff1744]/20 bg-[#ff1744]/5 rounded-2xl p-5 flex items-start gap-3.5 max-w-2xl mx-auto">
            <div className="bg-[#ff1744]/10 p-2 rounded-lg border border-[#ff1744]/20 text-[#ff1744] shrink-0">
              <AlertIcon className="h-5 w-5" />
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="text-sm font-bold text-white font-sans">Scan Error</h4>
              <p className="text-xs text-[#e8e8f0]/60 font-sans leading-relaxed">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-xs font-mono text-[#e8e8f0]/40 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}

        {view === 'landing' ? (
          /* LANDING PAGE VIEW */
          <div className="space-y-12">
            <Hero />
            <ScanInput onScanStarted={handleScanStarted} onError={(err) => setError(err)} />
            
            {/* Split Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Leaderboard Column */}
              <div className="md:col-span-2">
                <Leaderboard onSelectScan={handleScanStarted} />
              </div>

              {/* Sidebar Info/Tips Panel */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[#00f0ff] font-mono text-xs uppercase tracking-wider font-bold">
                    <Terminal className="h-4 w-4" />
                    <span>How it works</span>
                  </div>
                  <h3 className="text-base font-bold text-white tracking-tight">Security in under 10 seconds</h3>
                  <div className="space-y-3.5 text-xs text-[#e8e8f0]/60 font-sans">
                    <div className="flex gap-2">
                      <span className="text-[#00f0ff] font-mono font-bold shrink-0">01.</span>
                      <p>Download the public GitHub repository manifest structure or unpack your local ZIP archive instantly.</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-[#00f0ff] font-mono font-bold shrink-0">02.</span>
                      <p>Run instant regex parsers on file structures to check for exposed API tokens, Private keys, and config leakages.</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-[#00f0ff] font-mono font-bold shrink-0">03.</span>
                      <p>Launch structured Gemini AI static analysis to detect AST issues, OWASP vulnerabilities, and unverified package dependencies.</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4 text-[10px] font-mono text-[#e8e8f0]/40 leading-relaxed">
                  🔐 VibeScan strictly respects code privacy. Any hardcoded secrets detected in files are masked immediately in memory and are never saved or stored in database systems or log exports.
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* RESULT SCORECARD VIEW */
          <div className="space-y-8 max-w-4xl mx-auto">
            {/* Back Button */}
            <button
              onClick={handleBackToLanding}
              className="inline-flex items-center gap-2 text-xs font-mono text-[#00f0ff] hover:text-[#00f0ff]/80 transition-colors bg-white/5 border border-white/10 hover:border-white/20 px-4 py-2.5 rounded-xl cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Scan Room
            </button>

            {scan ? (
              scan.status === 'failed' ? (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-2xl space-y-6 max-w-2xl mx-auto text-center" id="scan-failed-view">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="bg-[#ff1744]/10 p-4 rounded-full border border-[#ff1744]/20 text-[#ff1744]">
                      <AlertIcon className="h-10 w-10 animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white tracking-tight">Security Scan Failed</h3>
                      <p className="text-xs text-[#e8e8f0]/60 max-w-md mx-auto leading-relaxed">
                        We encountered an issue while trying to access or analyze your project repository.
                      </p>
                    </div>
                  </div>

                  <div className="bg-black/40 border border-white/10 rounded-xl p-5 text-left space-y-3.5 max-w-lg mx-auto">
                    <div>
                      <span className="text-[10px] font-mono text-[#e8e8f0]/40 uppercase tracking-widest font-bold block">Target Repository</span>
                      <span className="text-xs text-white font-mono break-all font-semibold block mt-1">{scan.repoUrl}</span>
                    </div>

                    <div className="border-t border-white/5 pt-3">
                      <span className="text-[10px] font-mono text-[#ff1744] uppercase tracking-widest font-bold block">Error Details</span>
                      <p className="text-xs text-[#ff1744]/95 font-mono leading-relaxed mt-1 whitespace-pre-wrap break-words">
                        {scan.errorMessage || 'Failed to clone or access repository. Verify that it is public and matches https://github.com/{owner}/{repo} format.'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#00f0ff]/5 border border-[#00f0ff]/10 rounded-xl p-5 text-left space-y-2.5 max-w-lg mx-auto">
                    <h4 className="text-xs font-mono text-[#00f0ff] uppercase tracking-widest font-bold flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-[#00f0ff]" />
                      Troubleshooting Tips
                    </h4>
                    <ul className="text-xs text-[#e8e8f0]/60 list-disc list-inside space-y-2 font-sans leading-relaxed pl-1">
                      <li>
                        <strong>Verify Visibility:</strong> Make sure the repository is completely public. Private repositories cannot be downloaded directly via public URLs.
                      </li>
                      <li>
                        <strong>Verify URL:</strong> Ensure the URL format matches <code>https://github.com/owner/repo</code>.
                      </li>
                      <li>
                        <strong>Alternative (ZIP Upload):</strong> If your repository is private or requires authentication, you can download it as a ZIP and upload it in the "Browse computer" area on the home screen! This runs the scan completely locally and privately.
                      </li>
                    </ul>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleBackToLanding}
                      className="inline-flex items-center gap-2 py-3 px-6 bg-[#00f0ff] hover:opacity-90 text-[#0a0a0f] font-bold rounded-xl text-xs uppercase tracking-wider font-mono transition-all cursor-pointer"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Return to Scan Room
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <ScoreCard
                    scan={scan}
                    onCategoryFilter={(cat) => setCategoryFilter(cat)}
                    activeFilter={categoryFilter}
                  />

                  {/* Main Results Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Expandable Findings List */}
                    <div className="md:col-span-2 space-y-4">
                      <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <h3 className="text-base font-bold text-white tracking-tight">
                          Discovered Vulnerabilities ({filteredFindings.length})
                        </h3>
                        {categoryFilter && (
                          <span className="text-xs text-[#00f0ff] font-mono bg-[#00f0ff]/10 px-2.5 py-0.5 rounded-full border border-[#00f0ff]/20 uppercase font-bold">
                            Filtered by category
                          </span>
                        )}
                      </div>

                      {filteredFindings.length === 0 ? (
                        <div className="border border-[#00e676]/20 bg-[#00e676]/5 rounded-2xl p-8 text-center space-y-3">
                          <div className="inline-flex p-3 rounded-full bg-[#00e676]/10 text-[#00e676] border border-[#00e676]/20">
                            <CheckCircle2 className="h-8 w-8" />
                          </div>
                          <h4 className="text-lg font-bold text-white">Primacy Secured!</h4>
                          <p className="text-xs text-[#e8e8f0]/60 max-w-md mx-auto leading-relaxed">
                            No findings detected for this security vector. Your repository looks incredibly secure according to our scanning engines. Keep up the high coding standards!
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {filteredFindings.map((finding) => (
                            <FindingCard key={finding.id} finding={finding} />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Sidebar conversion panels */}
                    <div className="space-y-6">
                      <ShareButtons scanId={scan.id} score={scan.overallScore ?? 0} />
                      <EmailCapture scanId={scan.id} />

                      {/* Pro products checkout mockups */}
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl space-y-5">
                        <div className="flex items-center gap-2 text-purple-400 font-mono text-xs uppercase tracking-wider font-bold">
                          <CreditCard className="h-4 w-4" />
                          <span>Premium Upgrades</span>
                        </div>

                        <div className="space-y-4">
                          {/* Audit Pack */}
                          <div className="border border-purple-500/10 hover:border-purple-500/30 transition-all bg-purple-500/5 p-4 rounded-xl space-y-3">
                            <div>
                              <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest font-bold">One-Time Pack</span>
                              <h4 className="text-sm font-bold text-white mt-0.5">VibeAudit Pro Report</h4>
                              <p className="text-[11px] text-[#e8e8f0]/60 mt-1 leading-relaxed">
                                Get an extensive, beautifully stylized PDF security checklist containing precise remediation instructions ready to present to stakeholders and developers.
                              </p>
                            </div>
                            <div className="flex items-center justify-between gap-4 pt-1">
                              <span className="text-sm font-bold font-mono text-white">$9</span>
                              <button
                                onClick={() => alert('VibeAudit Pro Report is an MVP concept. Your scan findings have been prioritized!')}
                                className="px-3.5 py-1.5 bg-purple-500 hover:bg-purple-400 transition-colors text-white font-mono text-[10px] font-bold uppercase rounded-lg cursor-pointer"
                              >
                                Get Report
                              </button>
                            </div>
                          </div>

                          {/* Guard monitoring */}
                          <div className="border border-[#00f0ff]/10 hover:border-[#00f0ff]/30 transition-all bg-[#00f0ff]/5 p-4 rounded-xl space-y-3">
                            <div>
                              <span className="text-[10px] font-mono text-[#00f0ff] uppercase tracking-widest font-bold">SaaS subscription</span>
                              <h4 className="text-sm font-bold text-white mt-0.5">VibeGuard Continuous</h4>
                              <p className="text-[11px] text-[#e8e8f0]/60 mt-1 leading-relaxed">
                                Continuous code security checking. Activates auto-monitoring scanners linked with GitHub commit webhooks. Scan every push automatically!
                              </p>
                            </div>
                            <div className="flex items-center justify-between gap-4 pt-1">
                              <span className="text-sm font-bold font-mono text-white">$29<span className="text-[10px] text-[#e8e8f0]/40 font-normal">/mo</span></span>
                              <button
                                onClick={() => alert('VibeGuard Pro is an MVP concept. webhook triggers are coming in v2.0!')}
                                className="px-3.5 py-1.5 bg-[#00f0ff] hover:opacity-90 transition-colors text-black font-mono text-[10px] font-bold uppercase rounded-lg cursor-pointer"
                              >
                                Unlock 7-day trial
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )
            ) : (
              /* Polling / Skeleton loading state */
              <div className="bg-white/5 border border-white/10 rounded-2xl p-12 backdrop-blur-md shadow-xl text-center space-y-6">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#00f0ff]/20 border-t-[#00f0ff]"></div>
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold text-white">Compiling Security Report</h3>
                    <p className="text-xs text-[#e8e8f0]/50 font-mono">Running automated heuristic scanners & AI analysis...</p>
                  </div>
                </div>

                <div className="max-w-md mx-auto space-y-3">
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="bg-[#00f0ff] h-full animate-pulse" style={{ width: '75%' }}></div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#e8e8f0]/40">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-[#00f0ff]" />
                      Elapsing ~8 seconds
                    </span>
                    <span>Hold tight...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-[#06060a]/90 text-[#e8e8f0]/40 py-10 mt-20" id="footer-panel">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left text-xs font-mono">
          <div className="space-y-1.5">
            <span className="text-[#e8e8f0]/60 font-sans font-bold">VibeScan AI security toolkit</span>
            <p className="text-[10px] text-[#e8e8f0]/30">
              © {new Date().getFullYear()} VibeScan. Providing instant, zero-friction code auditing for builders.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[10px]">
            <a href="#" className="hover:text-[#00f0ff] transition-colors">Documentation</a>
            <a href="#" className="hover:text-[#00f0ff] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#00f0ff] transition-colors">Terms of Service</a>
            <span className="text-[#e8e8f0]/10">|</span>
            <span className="text-[#e8e8f0]/20">Built in Google AI Studio</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
