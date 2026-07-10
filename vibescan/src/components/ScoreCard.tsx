import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, ShieldCheck, Key, Package, AlertOctagon, BrainCircuit, SearchCode } from 'lucide-react';
import { Scan } from '../types.js';

interface ScoreCardProps {
  scan: Scan;
  onCategoryFilter: (category: string | null) => void;
  activeFilter: string | null;
}

export default function ScoreCard({ scan, onCategoryFilter, activeFilter }: ScoreCardProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  const score = scan.overallScore ?? 0;
  const grade = scan.grade ?? 'F';
  const duration = scan.durationMs ? `${(scan.durationMs / 1000).toFixed(1)}s` : '7.2s';

  // Count up animation on mount
  useEffect(() => {
    let start = 0;
    const end = score;
    if (end === 0) return;
    const durationTime = 1200; // ms
    const increment = end / (durationTime / 16); // ~60fps
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setAnimatedScore(end);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [score]);

  // Color mappings
  const getScoreColorClass = (val: number) => {
    if (val >= 90) return 'text-green-400 border-green-500/20 bg-green-500/5';
    if (val >= 70) return 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5';
    return 'text-red-400 border-red-500/20 bg-red-500/5';
  };

  const getScoreStrokeColor = (val: number) => {
    if (val >= 90) return '#00e676';
    if (val >= 70) return '#ffc107';
    return '#ff1744';
  };

  const getGradeDesc = (g: string) => {
    switch (g) {
      case 'A+': return 'Secure Vibe';
      case 'A': return 'Good Vibe';
      case 'B': return 'Needs Work';
      case 'C': return 'Vulnerable';
      case 'D': return 'At Risk';
      default: return 'Critical Risk';
    }
  };

  const getCategoryColor = (score: number) => {
    if (score >= 80) return '#00e676';
    if (score >= 60) return '#ffc107';
    return '#ff1744';
  };

  const categoryMetadata = [
    { key: 'secrets', name: 'Secrets', icon: Key },
    { key: 'dependencies', name: 'Dependencies', icon: Package },
    { key: 'owasp', name: 'OWASP Top 10', icon: AlertOctagon },
    { key: 'hallucinate', name: 'AI Packages', icon: BrainCircuit },
    { key: 'smell', name: 'Security Smells', icon: SearchCode },
  ];

  return (
    <div className="space-y-6" id="scorecard-summary">
      {/* Top Banner Overall Score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Main Score & Grade */}
        <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
          <div className="space-y-3 text-center sm:text-left">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-[#00f0ff] border border-[#00f0ff]/30 bg-[#00f0ff]/10 px-2.5 py-1 rounded-full">
              <Sparkles className="h-3 w-3 text-[#00f0ff]" />
              Scan Completed
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white">{scan.repoName}</h2>
            <p className="text-xs text-[#e8e8f0]/60 font-mono">
              Scanned in {duration} • {scan.summary?.totalFilesScanned ?? 0} files • {scan.summary?.totalLinesScanned ?? 0} lines
            </p>
            <div className="text-sm font-sans font-medium text-[#e8e8f0]/80">
              Vibe status: <span className="font-bold" style={{ color: getScoreStrokeColor(score) }}>{getGradeDesc(grade)}</span>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="relative w-28 h-28 flex items-center justify-center">
              {/* Radial Score Ring */}
              <svg className="absolute w-full h-full transform -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  fill="transparent"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="8"
                />
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  fill="transparent"
                  stroke={getScoreStrokeColor(score)}
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 48}
                  strokeDashoffset={2 * Math.PI * 48 * (1 - animatedScore / 100)}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="text-center flex flex-col justify-center items-center z-10">
                <span className="text-3xl font-extrabold text-white font-mono">{animatedScore}</span>
                <span className="text-[10px] font-mono text-[#e8e8f0]/50">Score</span>
              </div>
            </div>

            <div className="text-center">
              <div 
                className="text-5xl font-black tracking-tighter font-mono px-3 py-1 rounded-2xl"
                style={{ color: getScoreStrokeColor(score) }}
              >
                {grade}
              </div>
              <span className="text-[10px] font-mono text-[#e8e8f0]/50">Security Grade</span>
            </div>
          </div>
        </div>

        {/* Scan Stat Panel */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-between shadow-xl space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-wider text-[#e8e8f0]/60">Scan Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#ff1744]/5 border border-[#ff1744]/10 rounded-xl p-3 text-center">
              <span className="text-xl font-extrabold text-[#ff1744] font-mono">
                {scan.summary?.criticalCount ?? 0}
              </span>
              <p className="text-[10px] text-[#e8e8f0]/40 font-mono mt-1">Critical</p>
            </div>
            <div className="bg-orange-500/5 border border-orange-500/10 rounded-xl p-3 text-center">
              <span className="text-xl font-extrabold text-orange-400 font-mono">
                {scan.summary?.highCount ?? 0}
              </span>
              <p className="text-[10px] text-[#e8e8f0]/40 font-mono mt-1">High</p>
            </div>
            <div className="bg-[#ffc107]/5 border border-[#ffc107]/10 rounded-xl p-3 text-center">
              <span className="text-xl font-extrabold text-[#ffc107] font-mono">
                {scan.summary?.mediumCount ?? 0}
              </span>
              <p className="text-[10px] text-[#e8e8f0]/40 font-mono mt-1">Medium</p>
            </div>
            <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-3 text-center">
              <span className="text-xl font-extrabold text-blue-400 font-mono">
                {scan.summary?.lowCount ?? 0}
              </span>
              <p className="text-[10px] text-[#e8e8f0]/40 font-mono mt-1">Low / Info</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown (5 Radial Bars) */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-mono uppercase tracking-wider text-[#e8e8f0]/60">Vibe Vectors (Category Breakdown)</h3>
          {activeFilter && (
            <button
              onClick={() => onCategoryFilter(null)}
              className="text-[10px] font-mono text-[#00f0ff] hover:underline"
            >
              Reset Filter
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {categoryMetadata.map((meta) => {
            const catScoreObj = scan.categories?.[meta.key as keyof typeof scan.categories] || {
              score: 100,
              findingsCount: 0,
              severity: 'NONE',
            };
            const catScore = catScoreObj.score;
            const findingsCount = catScoreObj.findingsCount;
            const Icon = meta.icon;
            const isActive = activeFilter === meta.key;
            const catColor = getCategoryColor(catScore);

            return (
              <div
                key={meta.key}
                onClick={() => onCategoryFilter(isActive ? null : meta.key)}
                style={{ borderColor: isActive ? '#00f0ff' : undefined }}
                className={`flex flex-col items-center p-4 rounded-xl cursor-pointer transition-all duration-300 border ${
                  isActive
                    ? 'bg-[#00f0ff]/10 shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                }`}
              >
                <div className="relative w-16 h-16 flex items-center justify-center mb-3">
                  <svg className="absolute w-full h-full transform -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="26"
                      fill="transparent"
                      stroke="rgba(255,255,255,0.05)"
                      strokeWidth="4"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="26"
                      fill="transparent"
                      stroke={catColor}
                      strokeWidth="4"
                      strokeDasharray={2 * Math.PI * 26}
                      strokeDashoffset={2 * Math.PI * 26 * (1 - catScore / 100)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <Icon className="h-5 w-5 text-[#e8e8f0]/80 z-10" />
                </div>
                <div className="text-center">
                  <span className="block text-xs font-medium text-white">{meta.name}</span>
                  <span className="text-[10px] font-mono font-semibold" style={{ color: catColor }}>
                    {catScore}/100
                  </span>
                  <p className="text-[9px] text-[#e8e8f0]/40 font-mono mt-0.5">
                    {findingsCount} {findingsCount === 1 ? 'finding' : 'findings'}
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
