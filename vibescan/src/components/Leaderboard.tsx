import React, { useState, useEffect } from 'react';
import { Trophy, ShieldCheck, ArrowRight, Activity, HelpCircle } from 'lucide-react';
import { getLeaderboard } from '../lib/api.js';
import { LeaderboardItem } from '../types.js';

interface LeaderboardProps {
  onSelectScan: (scanId: string) => void;
}

export default function Leaderboard({ onSelectScan }: LeaderboardProps) {
  const [items, setItems] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await getLeaderboard();
        setItems(res.projects || []);
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleRowClick = (url: string) => {
    // Extract scanId from /r/scanId
    const parts = url.split('/');
    const scanId = parts[parts.length - 1];
    if (scanId) onSelectScan(scanId);
  };

  if (loading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl flex items-center justify-center min-h-[200px]">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border border-[#00f0ff]/20 border-t-[#00f0ff]"></div>
          <span className="text-xs font-mono text-[#e8e8f0]/40">Loading hall of fame...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl space-y-4" id="leaderboard-panel">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#00f0ff] font-mono text-xs uppercase tracking-wider font-bold">
          <Trophy className="h-4 w-4" />
          <span>Vibe Hall of Fame</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#e8e8f0]/40">
          <Activity className="h-3 w-3 text-[#00f0ff] animate-pulse" />
          <span>Live Scores</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base font-bold tracking-tight text-white">Top Secure Vibe-Coded Projects</h3>
        <p className="text-xs text-[#e8e8f0]/60">
          Only repositories achieving secure scores are listed here. Click on any repository to audit their scorecard.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="border border-white/10 bg-black/40 rounded-xl p-6 text-center">
          <p className="text-xs font-mono text-[#e8e8f0]/40">
            No secure scans completed yet. Be the first to secure your code and claim a spot!
          </p>
        </div>
      ) : (
        <div className="overflow-hidden border border-white/10 rounded-xl bg-black/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[10px] font-mono text-[#e8e8f0]/40 uppercase bg-black/40">
                  <th className="py-3.5 px-4 font-bold">Rank</th>
                  <th className="py-3.5 px-4 font-bold">Repository</th>
                  <th className="py-3.5 px-4 font-bold text-center">Security Score</th>
                  <th className="py-3.5 px-4 font-bold text-center">Grade</th>
                  <th className="py-3.5 px-4 font-bold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-xs">
                {items.map((item) => (
                  <tr
                    key={item.rank}
                    onClick={() => handleRowClick(item.scanUrl)}
                    className="hover:bg-white/10 cursor-pointer transition-all group"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-[#e8e8f0]/50">
                      {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : `#${item.rank}`}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-sans font-semibold text-white group-hover:text-[#00f0ff] transition-colors">
                        {item.projectName}
                      </div>
                      <div className="text-[10px] font-mono text-[#e8e8f0]/40">
                        @{item.owner}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-[#00e676]">
                      {item.score}/100
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-extrabold text-[#00f0ff]">
                      {item.grade}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="text-[10px] font-mono text-[#e8e8f0]/40 group-hover:text-[#00f0ff] inline-flex items-center gap-1 transition-colors">
                        View Audit
                        <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
