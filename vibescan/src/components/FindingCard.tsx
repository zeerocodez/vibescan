import React, { useState } from 'react';
import { ShieldAlert, ChevronDown, ChevronUp, Copy, Check, ExternalLink, HelpCircle } from 'lucide-react';
import { Finding } from '../types.js';

interface FindingCardProps {
  finding: Finding;
  key?: string;
}

export default function FindingCard({ finding }: FindingCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopyState] = useState(false);

  const getSeverityStyles = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-[#ff1744]/10 border-[#ff1744]/25 text-[#ff1744]';
      case 'HIGH':
        return 'bg-orange-500/10 border-orange-500/25 text-orange-400';
      case 'MEDIUM':
        return 'bg-[#ffc107]/10 border-[#ffc107]/25 text-[#ffc107]';
      case 'LOW':
        return 'bg-blue-500/10 border-blue-500/25 text-blue-400';
      default:
        return 'bg-gray-500/10 border-gray-500/25 text-gray-400';
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'secrets': return 'Exposed Secrets';
      case 'dependencies': return 'Dependency CVEs';
      case 'owasp': return 'OWASP Top 10';
      case 'hallucinate': return 'AI Hallucinations';
      case 'smell': return 'Security Smell';
      default: return cat;
    }
  };

  const handleCopyFix = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!finding.fixSnippet) return;
    navigator.clipboard.writeText(finding.fixSnippet);
    setCopyState(true);
    setTimeout(() => setCopyState(false), 2000);
  };

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className={`border rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 shadow-lg cursor-pointer overflow-hidden ${
        expanded ? 'border-[#00f0ff]/40 shadow-[0_0_20px_rgba(0,240,255,0.05)]' : 'border-white/10'
      }`}
    >
      {/* Accordion Header */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3 w-full sm:w-auto">
          <div className={`p-2 rounded-lg mt-0.5 border ${getSeverityStyles(finding.severity)}`}>
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border uppercase font-bold tracking-wider ${getSeverityStyles(finding.severity)}`}>
                {finding.severity}
              </span>
              <span className="text-[10px] font-mono text-[#e8e8f0]/60 border border-white/10 bg-black/40 px-2 py-0.5 rounded-full">
                {getCategoryLabel(finding.category)}
              </span>
            </div>
            <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">{finding.title}</h4>
            <p className="text-xs text-[#e8e8f0]/40 font-mono flex items-center gap-1.5">
              <span>{finding.filePath}</span>
              {finding.lineNumber && (
                <>
                  <span className="text-white/20">•</span>
                  <span>Line {finding.lineNumber}</span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t border-white/10 sm:border-0 pt-3 sm:pt-0">
          <span className="text-xs font-mono text-[#e8e8f0]/40 hidden sm:inline">
            {expanded ? 'Click to collapse' : 'Click to expand'}
          </span>
          <div className="text-[#e8e8f0]/60 hover:text-white transition-all bg-black/40 p-1.5 rounded-lg border border-white/10">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </div>

      {/* Accordion Content */}
      {expanded && (
        <div className="border-t border-white/10 bg-black/20 p-5 space-y-5" onClick={(e) => e.stopPropagation()}>
          
          {/* Description */}
          <div className="space-y-1.5">
            <h5 className="text-xs font-mono uppercase tracking-wider text-[#00f0ff] font-bold">Vulnerability Description</h5>
            <p className="text-sm text-[#e8e8f0]/80 leading-relaxed font-sans">{finding.description}</p>
          </div>

          {/* Offending Code Snippet */}
          {finding.snippet && (
            <div className="space-y-2">
              <h5 className="text-xs font-mono uppercase tracking-wider text-[#ff1744] font-bold">Vulnerable Code</h5>
              <div className="bg-black/60 border border-[#ff1744]/20 rounded-xl p-4 overflow-x-auto">
                <code className="text-xs font-mono text-[#e8e8f0]/70 whitespace-pre block leading-relaxed">
                  {finding.snippet}
                </code>
              </div>
            </div>
          )}

          {/* Fix Action Recommendations */}
          {(finding.fixSuggestion || finding.fixSnippet) && (
            <div className="space-y-3.5 bg-[#00f0ff]/5 border border-[#00f0ff]/10 rounded-xl p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h5 className="text-xs font-mono uppercase tracking-wider text-[#00f0ff] font-bold">Recommended Remediation</h5>
                  {finding.fixSuggestion && <p className="text-xs text-cyan-200/80">{finding.fixSuggestion}</p>}
                </div>
                {finding.fixSnippet && (
                  <button
                    onClick={handleCopyFix}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00f0ff] hover:opacity-90 text-[#0a0a0f] font-mono text-[10px] rounded-lg font-bold uppercase transition-all duration-200 self-stretch sm:self-auto justify-center"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copy Fix
                      </>
                    )}
                  </button>
                )}
              </div>

              {finding.fixSnippet && (
                <div className="bg-black/60 border border-[#00f0ff]/10 rounded-xl p-4 overflow-x-auto">
                  <code className="text-xs font-mono text-[#00f0ff]/90 whitespace-pre block leading-relaxed">
                    {finding.fixSnippet}
                  </code>
                </div>
              )}
            </div>
          )}

          {/* References and CWE Linking */}
          {(finding.cweId || (finding.references && finding.references.length > 0)) && (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono text-[#e8e8f0]/40 border-t border-white/10 pt-4">
              {finding.cweId && (
                <a
                  href={`https://cwe.mitre.org/data/definitions/${finding.cweId.replace('CWE-', '')}.html`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[#00f0ff] hover:text-[#00f0ff]/80 transition-colors hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  MITRE Link: {finding.cweId}
                </a>
              )}
              {finding.cveId && (
                <span className="text-[#e8e8f0]/60 font-bold">CVE Reference: {finding.cveId}</span>
              )}
              {finding.references && finding.references.map((ref, idx) => (
                <a
                  key={idx}
                  href={ref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[#e8e8f0]/60 hover:text-white transition-colors hover:underline truncate max-w-[240px]"
                >
                  <HelpCircle className="h-3 w-3" />
                  Reference URL
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
