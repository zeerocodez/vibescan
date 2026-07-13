import React, { useState, useEffect, useRef } from 'react';
import { Shield, Activity, Terminal, AlertTriangle, Eye, Trash2, ArrowLeft, RefreshCw, Key, Lock, CheckCircle, Database } from 'lucide-react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';

const VIBEGUARD_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Dashboard() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('vibescan_user') || 'null');
    } catch {
      return null;
    }
  });

  const [isPro, setIsPro] = useState(() => {
    return localStorage.getItem('vibescan_pro_active') === 'true' || (user && user.tier === 'pro');
  });

  const token = user ? (user.token || user.email) : '';

  const [activeTab, setActiveTab] = useState('scans'); // 'scans' | 'threats'
  const [alerts, setAlerts] = useState([]);
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedScanFindings, setSelectedScanFindings] = useState(null);
  const [viewingScanId, setViewingScanId] = useState(null);

  const fetchTelemetry = async () => {
    try {
      const response = await fetch(`${VIBEGUARD_URL}/api/agent/telemetry`);
      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
      }
    } catch (e) {
      console.error('Failed to fetch telemetry', e);
    }
  };

  const fetchScans = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${VIBEGUARD_URL}/api/scans`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setScans(data);
      }
    } catch (e) {
      console.error('Failed to fetch user scans', e);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      fetchTelemetry(),
      fetchScans()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    loadData();
    const interval = setInterval(() => {
      fetchTelemetry();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!loading && (alerts.length > 0 || scans.length > 0)) {
      gsap.fromTo('.log-entry', 
        { y: 20, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.05, ease: 'power2.out' }
      );
    }
  }, [loading, activeTab]);

  const handleViewFindings = async (scanId) => {
    setViewingScanId(scanId);
    try {
      const res = await fetch(`${VIBEGUARD_URL}/api/scans/${scanId}/findings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedScanFindings(data);
      } else {
        alert("Failed to fetch scan findings.");
      }
    } catch (e) {
      alert("Failed to fetch scan findings.");
    }
  };

  const handleFixScan = async (scanId) => {
    if (!isPro) {
      alert("Vulnerability auto-remediation requires a Pro subscription.");
      return;
    }
    if (!confirm("Are you sure you want to run a full security fix on this scan? This will automatically patch all vulnerabilities and upgrade its score to 100.")) return;
    try {
      const res = await fetch(`${VIBEGUARD_URL}/api/scans/${scanId}/fix`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchScans();
        setSelectedScanFindings(null);
        alert("Security fix successfully applied!");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to run scan security fix.");
      }
    } catch (e) {
      alert("Failed to run scan security fix.");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-dark text-primary font-data flex flex-col justify-center items-center px-6 selection:bg-accent selection:text-primary">
        <svg className="hidden">
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch"/>
          </filter>
        </svg>
        <div className="fixed inset-0 opacity-5 pointer-events-none z-50" style={{ filter: 'url(#noise)' }}></div>
        <div className="w-full max-w-md bg-background/5 border border-primary/10 rounded-[2rem] p-8 md:p-10 shadow-2xl flex flex-col relative overflow-hidden">
          <header className="mb-8 flex items-center gap-3">
            <div className="bg-accent p-2 rounded-xl text-white">
              <Shield size={20} />
            </div>
            <div>
              <h1 className="font-heading font-bold text-lg uppercase tracking-tight leading-none text-primary">Authentication Required</h1>
              <span className="text-[9px] font-bold text-accent tracking-widest uppercase font-mono">VibeScan Dashboard</span>
            </div>
          </header>
          <p className="text-[11px] text-primary/70 leading-relaxed mb-6 font-mono">
            Please log in from the home page to access your secure dashboard.
          </p>
          <Link to="/" className="inline-flex items-center justify-center gap-2 bg-accent text-white hover:bg-black transition-colors rounded-xl py-3 text-[10px] font-bold uppercase tracking-widest border border-dark">
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark text-primary font-data pt-32 pb-24 px-6 md:px-12 selection:bg-accent selection:text-primary">
      <svg className="hidden">
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch"/>
        </filter>
      </svg>
      <div className="fixed inset-0 opacity-5 pointer-events-none z-50" style={{ filter: 'url(#noise)' }}></div>

      <div className="max-w-6xl mx-auto">
        <header className="mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-primary/10 pb-8">
          <div>
            <div className="flex items-center gap-3 text-accent mb-4">
              <Shield size={24} />
              <span className="font-heading font-bold tracking-widest text-sm uppercase">VibeScan Dashboard</span>
            </div>
            <h1 className="font-heading font-bold text-5xl md:text-7xl uppercase tracking-tighter leading-none">
              Client <br /><span className="font-drama italic text-primary/50 normal-case">Console.</span>
            </h1>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
            <button 
              onClick={loadData}
              className="flex items-center justify-center gap-2 bg-background/5 hover:bg-primary hover:text-dark transition-colors border border-primary/10 px-4 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest font-mono"
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
              Refresh Data
            </button>
            <Link 
              to="/"
              className="flex items-center justify-center gap-2 bg-accent text-white hover:bg-black transition-colors border border-dark px-4 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest font-mono"
            >
              <ArrowLeft size={12} />
              Exit to Home
            </Link>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="flex border-b border-primary/10 mb-8 overflow-x-auto gap-2">
          {['scans', 'threats'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-[10px] font-bold uppercase tracking-widest border-t-2 border-l-2 border-r-2 border-transparent transition-all shrink-0 ${
                activeTab === tab 
                  ? 'border-primary/20 bg-background/5 text-accent rounded-t-xl translate-y-[1px] relative z-10' 
                  : 'text-primary/50 hover:text-primary'
              }`}
            >
              {tab === 'scans' ? 'Codebase Audits' : 'Threat Telemetry'}
            </button>
          ))}
        </div>

        {/* Codebase Audits Panel */}
        {activeTab === 'scans' && (
          <div className="space-y-6">
            <div className="bg-black/60 border border-primary/10 rounded-[2rem] overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-primary/10 bg-background/5 flex justify-between items-center">
                <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-primary">Your Codebase Audits ({scans.length})</h3>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono tracking-widest uppercase ${isPro ? 'bg-accent/20 text-accent border border-accent/40' : 'bg-primary/10 text-primary/60 border border-primary/20'}`}>
                  Subscription Tier: {isPro ? 'PRO' : 'FREE'}
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-data text-xs">
                  <thead>
                    <tr className="border-b border-primary/10 uppercase font-bold text-primary/40 text-[10px] tracking-wider bg-background/5 font-mono">
                      <th className="p-4">Target Repository</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Score / Grade</th>
                      <th className="p-4">Exposures</th>
                      <th className="p-4">Scan Date</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/5">
                    {scans.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-primary/40 italic font-mono">No audits recorded. Run a scan from the home page.</td>
                      </tr>
                    ) : (
                      scans.map((scan) => (
                        <tr key={scan.id} className="log-entry hover:bg-white/5 transition-colors">
                          <td className="p-4 max-w-xs truncate font-mono font-bold text-primary" title={scan.repoUrl}>
                            <div>{scan.repoUrl}</div>
                            {scan.prLink && (
                              <div className="mt-1">
                                <a 
                                  href={scan.prLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[9px] bg-accent/20 hover:bg-accent text-accent hover:text-dark px-2 py-0.5 rounded font-mono font-bold transition-all border border-accent/25"
                                >
                                  PR Opened
                                </a>
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-bold font-mono ${
                              scan.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                              scan.status === 'failed' ? 'bg-accent/10 text-accent' :
                              'bg-yellow-500/10 text-yellow-400 animate-pulse'
                            }`}>
                              {scan.status}
                            </span>
                          </td>
                          <td className="p-4">
                            {scan.status === 'completed' ? (
                              <span className="font-bold font-mono text-primary/90">
                                {scan.overallScore}% ({scan.grade})
                              </span>
                            ) : '-'}
                          </td>
                          <td className="p-4 font-mono font-bold text-accent">
                            {scan._count?.findings ?? 0}
                          </td>
                          <td className="p-4 text-primary/60">{new Date(scan.createdAt).toLocaleString()}</td>
                          <td className="p-4 text-right flex justify-end gap-2 items-center">
                            <button
                              onClick={() => handleViewFindings(scan.id)}
                              className="bg-background/5 hover:bg-primary hover:text-dark border border-primary/20 rounded p-1.5 transition-colors"
                              title="View Findings Detail"
                            >
                              <Eye size={12} />
                            </button>
                            {scan.status === 'completed' && scan.localFilePath && (
                              <a
                                href={`${VIBEGUARD_URL}/api/scans/${scan.id}/download?Authorization=Bearer ${token}`}
                                download
                                onClick={(e) => {
                                  e.preventDefault();
                                  window.open(`${VIBEGUARD_URL}/api/scans/${scan.id}/download?Authorization=Bearer ${token}`, '_blank');
                                }}
                                className="bg-green-600/25 hover:bg-green-600 border border-green-600/35 text-green-400 hover:text-white px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-widest font-mono transition-all"
                                title="Download Patched ZIP"
                              >
                                Download Fix
                              </a>
                            )}
                            {scan.status === 'completed' && (scan._count?.findings ?? 0) > 0 && (
                              <button
                                onClick={() => handleFixScan(scan.id)}
                                className={`rounded px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest font-mono transition-colors ${
                                  isPro 
                                    ? 'bg-green-600/25 hover:bg-green-600 hover:text-white border border-green-600/35 text-green-400'
                                    : 'bg-primary/5 border border-primary/10 text-primary/40 cursor-not-allowed opacity-50'
                                }`}
                                title="Run Vibe Fix"
                              >
                                {isPro ? 'Run Fix' : '🔒 Fix (Pro)'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Threat Telemetry Panel */}
        {activeTab === 'threats' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
              <div className="bg-background/5 border border-primary/10 rounded-[2rem] p-6 flex flex-col justify-between">
                <Activity className="text-primary/40 mb-8" size={24} />
                <div>
                  <div className="text-3xl font-heading font-bold text-primary">{alerts.length}</div>
                  <div className="text-xs text-primary/50 uppercase tracking-widest mt-1">Total Threats Blocked</div>
                </div>
              </div>
              <div className="bg-background/5 border border-primary/10 rounded-[2rem] p-6 flex flex-col justify-between md:col-span-3">
                <Terminal className="text-primary/40 mb-8" size={24} />
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex-1">
                    <div className="text-sm font-heading font-bold mb-2 text-primary">Node.js Intercept Shield</div>
                    <div className="text-xs text-primary/50 leading-relaxed">AgentGuard intercepts child_process and actively blocks rogue autonomous agents from executing destructive system commands.</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-heading font-bold mb-2 text-primary">Data Leak Prevention (DLP)</div>
                    <div className="text-xs text-primary/50 leading-relaxed">Scrubbing API keys, credentials, and configuration secrets from model parameters dynamically.</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-black/60 border border-primary/10 rounded-[2rem] overflow-hidden shadow-2xl">
              <div className="grid grid-cols-12 gap-4 p-6 border-b border-primary/10 text-[10px] font-bold uppercase tracking-widest text-primary/40 font-mono">
                <div className="col-span-3">Timestamp</div>
                <div className="col-span-2">Project ID</div>
                <div className="col-span-5">Blocked Payload</div>
                <div className="col-span-2 text-right">Status</div>
              </div>
              
              <div className="divide-y divide-primary/5 h-[500px] overflow-y-auto">
                {loading ? (
                  <div className="p-12 text-center text-primary/30 text-sm animate-pulse font-mono">Connecting to threat feeds...</div>
                ) : alerts.length === 0 ? (
                  <div className="p-12 text-center text-primary/30 text-sm font-mono">No threats intercepted recently. System safe.</div>
                ) : (
                  alerts.map((alert) => (
                    <div key={alert.id} className="log-entry grid grid-cols-12 gap-4 p-6 hover:bg-white/5 transition-colors items-center font-mono text-[11px]">
                      <div className="col-span-3 text-xs text-primary/50">
                        {new Date(alert.createdAt).toLocaleString()}
                      </div>
                      <div className="col-span-2 text-xs text-primary/80 font-bold">
                        {alert.projectId || 'demo-project'}
                      </div>
                      <div className="col-span-5">
                        <code className="text-xs text-accent bg-accent/10 px-2 py-1 rounded border border-accent/20">
                          {alert.command}
                        </code>
                      </div>
                      <div className="col-span-2 flex justify-end">
                        <div className="flex items-center gap-2 bg-accent/20 text-accent border border-accent/30 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                          <AlertTriangle size={12} />
                          Blocked
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View Findings Modal */}
      {selectedScanFindings && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 selection:bg-accent selection:text-primary">
          <div className="w-full max-w-4xl bg-dark border border-primary/20 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <header className="p-6 border-b border-primary/10 bg-background/5 flex justify-between items-center">
              <div>
                <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-accent">Vulnerability Audit Log</h3>
                <p className="text-[10px] text-primary/60 font-mono mt-1">Scan: {viewingScanId}</p>
              </div>
              <button 
                onClick={() => { setSelectedScanFindings(null); setViewingScanId(null); }}
                className="bg-background/10 hover:bg-accent text-primary hover:text-dark transition-colors border border-primary/20 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm font-mono"
              >
                ✕
              </button>
            </header>

            <div className="p-6 overflow-y-auto divide-y divide-primary/5 flex-1 space-y-4">
              {selectedScanFindings.length === 0 ? (
                <div className="p-8 text-center text-primary/40 italic text-xs font-mono">No vulnerabilities found in this codebase scan! Outstanding.</div>
              ) : (
                selectedScanFindings.map((finding) => (
                  <div key={finding.id} className="py-5 first:pt-0 last:pb-0 flex flex-col md:flex-row justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded text-[8px] font-bold tracking-widest uppercase ${
                          finding.severity === 'CRITICAL' ? 'bg-accent text-white' : 'bg-primary/10 text-primary/70 border border-primary/20'
                        }`}>
                          {finding.severity}
                        </span>
                        <span className="font-mono text-[9px] text-primary/40">Category: {finding.category}</span>
                        {finding.cweId && (
                          <span className="font-mono text-[9px] text-primary/40 font-bold bg-background/10 px-1.5 py-0.5 rounded">
                            {finding.cweId}
                          </span>
                        )}
                      </div>
                      <h4 className="font-heading font-bold text-sm text-primary">{finding.title}</h4>
                      <p className="font-data text-xs text-primary/70 leading-relaxed max-w-2xl">
                        {finding.description || finding.message}
                      </p>

                      {/* Display snippet if user is Pro */}
                      {isPro && finding.snippet && (
                        <div className="mt-3">
                          <div className="text-[9px] font-mono text-primary/40 uppercase font-bold mb-1">Vulnerable Code:</div>
                          <div className="bg-black text-white p-3 rounded-lg font-mono text-[10px] overflow-x-auto relative group/code select-all">
                            <code>{finding.snippet}</code>
                          </div>
                        </div>
                      )}

                      {isPro && finding.fixSuggestion && (
                        <div className="text-primary/80 text-[11px] leading-relaxed pt-1">
                          <span className="font-bold text-accent">💡 Fix suggestion:</span> {finding.fixSuggestion}
                        </div>
                      )}

                      {isPro && finding.fixSnippet && (
                        <div className="mt-2">
                          <div className="text-[9px] font-mono text-primary/40 uppercase font-bold mb-1">Recommended Fix Patch:</div>
                          <div className="bg-green-950/40 text-green-300 p-3 rounded-lg font-mono text-[10px] overflow-x-auto relative group/fix select-all border border-green-500/10">
                            <code>{finding.fixSnippet}</code>
                          </div>
                        </div>
                      )}
                    </div>
                    {finding.filePath && (
                      <div className="md:text-right shrink-0">
                        <div className="text-[9px] font-mono text-primary/40 uppercase font-bold">Location</div>
                        <div className="text-[10px] font-mono bg-background/10 px-2 py-1 rounded border border-primary/10 mt-1 inline-block">
                          {finding.filePath} {finding.lineNumber ? ` : L${finding.lineNumber}` : ''}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            
            <footer className="p-6 border-t border-primary/10 bg-background/5 text-right">
              <button 
                onClick={() => { setSelectedScanFindings(null); setViewingScanId(null); }}
                className="bg-background/10 hover:bg-accent text-primary hover:text-dark transition-colors border border-primary/20 rounded-full px-6 py-2 text-[10px] font-bold uppercase tracking-widest font-mono"
              >
                Close Audit Logs
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
