import React from 'react';
import { Key, Package, AlertOctagon, BrainCircuit, SearchCode, ShieldAlert } from 'lucide-react';

export default function Hero() {
  const scanFeatures = [
    {
      title: 'Secret Detection',
      desc: 'Exposed API credentials (OpenAI, AWS, Stripe, GitHub, etc.), JWT keys, and passwords.',
      icon: Key,
      color: 'text-[#ff1744] hover:border-[#ff1744]/30',
    },
    {
      title: 'Dependency CVEs',
      desc: 'Scans package manifests to flag known vulnerabilities, out-of-date, and unmaintained items.',
      icon: Package,
      color: 'text-[#00e676] hover:border-[#00e676]/30',
    },
    {
      title: 'OWASP Top 10',
      desc: 'Static analysis for XSS (innerHTML), SQL injections, unsafe evaluation functions, and exposed debug flags.',
      icon: AlertOctagon,
      color: 'text-[#ffc107] hover:border-[#ffc107]/30',
    },
    {
      title: 'AI Hallucinations',
      desc: 'Detects hallucinated dependency declarations that do not exist on npm, PyPI, or Cargo registries.',
      icon: BrainCircuit,
      color: 'text-[#00f0ff] hover:border-[#00f0ff]/30',
    },
    {
      title: 'Security Smells',
      desc: 'Anti-patterns like document.write, hardcoded IPs, security TODOs, and disabled SSL verifiers.',
      icon: SearchCode,
      color: 'text-[#ffc107] hover:border-[#ffc107]/30',
    },
  ];

  return (
    <div className="space-y-12 text-center" id="hero-section">
      
      {/* Title & Subtitle */}
      <div className="space-y-4 max-w-3xl mx-auto">
        <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-[#00f0ff] border border-[#00f0ff]/30 bg-[#00f0ff]/10 px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(0,240,255,0.05)]">
          <ShieldAlert className="h-4 w-4 text-[#00f0ff] animate-pulse" />
          Zero-Friction Code Security
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white font-sans sm:leading-none">
          Is your{' '}
          <span className="bg-gradient-to-r from-[#00f0ff] via-teal-300 to-[#00e676] bg-clip-text text-transparent font-black">
            vibe-coded
          </span>{' '}
          app secure?
        </h1>
        <p className="text-base sm:text-lg text-[#e8e8f0]/60 leading-relaxed font-sans font-medium">
          Paste your public GitHub repository URL or upload a ZIP folder. Receive your complete, AI-powered security scorecard and remediation handbook in under 10 seconds. No signup required.
        </p>
      </div>

      {/* Grid Features */}
      <div className="space-y-4 max-w-4xl mx-auto">
        <div className="text-left">
          <h3 className="text-xs font-mono uppercase tracking-wider text-[#e8e8f0]/40 mb-4 text-center sm:text-left">
            What gets scanned
          </h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {scanFeatures.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className={`border border-white/10 bg-white/5 rounded-xl p-4 flex flex-col items-center sm:items-start text-center sm:text-left space-y-3 transition-all duration-300 hover:scale-[1.02] cursor-default group ${feat.color}`}
              >
                <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 group-hover:scale-105 transition-all text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white font-sans">{feat.title}</h4>
                  <p className="text-[10px] text-[#e8e8f0]/40 font-medium leading-relaxed font-sans">
                    {feat.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
