import React, { useState, useEffect } from 'react';
import { Shield, Activity, Terminal, AlertTriangle } from 'lucide-react';
import gsap from 'gsap';

const VIBEGUARD_URL = import.meta.env.VITE_VIBEGUARD_URL || 'http://localhost:3001';

export default function Dashboard() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const response = await fetch(`${VIBEGUARD_URL}/api/agent/telemetry`);
        if (response.ok) {
          const data = await response.json();
          setAlerts(data);
        }
      } catch (e) {
        console.error('Failed to fetch telemetry', e);
      } finally {
        setLoading(false);
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!loading && alerts.length > 0) {
      gsap.fromTo('.log-entry', 
        { y: 20, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.05, ease: 'power2.out' }
      );
    }
  }, [loading, alerts.length]);

  return (
    <div className="min-h-screen bg-dark text-primary font-data pt-32 pb-24 px-6 md:px-12 selection:bg-accent selection:text-primary">
      <div className="max-w-6xl mx-auto">
        <header className="mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-primary/10 pb-8">
          <div>
            <div className="flex items-center gap-3 text-accent mb-4">
              <Shield size={24} />
              <span className="font-heading font-bold tracking-widest text-sm uppercase">AgentGuard Pro</span>
            </div>
            <h1 className="font-heading font-bold text-5xl md:text-7xl uppercase tracking-tighter leading-none">
              Threat <br /><span className="font-drama italic text-primary/50 normal-case">Telemetry.</span>
            </h1>
          </div>
          <div className="flex items-center gap-4 bg-black/40 px-6 py-3 rounded-full border border-primary/10">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-xs uppercase tracking-widest font-bold text-primary/60">Live Feed Active</span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="bg-background/5 border border-primary/10 rounded-[2rem] p-6 flex flex-col justify-between">
            <Activity className="text-primary/40 mb-8" size={24} />
            <div>
              <div className="text-3xl font-heading font-bold">{alerts.length}</div>
              <div className="text-xs text-primary/50 uppercase tracking-widest mt-1">Total Threats Blocked</div>
            </div>
          </div>
          <div className="bg-background/5 border border-primary/10 rounded-[2rem] p-6 flex flex-col justify-between md:col-span-3">
            <Terminal className="text-primary/40 mb-8" size={24} />
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1">
                <div className="text-sm font-heading font-bold mb-2">Monkey-Patched Node.js Executions</div>
                <div className="text-xs text-primary/50 leading-relaxed">AgentGuard intercepts child_process and actively blocks rogue autonomous agents from executing destructive system commands.</div>
              </div>
              <div className="flex-1">
                <div className="text-sm font-heading font-bold mb-2">Data Loss Prevention (DLP)</div>
                <div className="text-xs text-primary/50 leading-relaxed">Scrubbing API keys, SSNs, and emails from LLM outputs before they hit the wire.</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-black/60 border border-primary/10 rounded-[2rem] overflow-hidden shadow-2xl">
          <div className="grid grid-cols-12 gap-4 p-6 border-b border-primary/10 text-[10px] font-bold uppercase tracking-widest text-primary/40">
            <div className="col-span-3">Timestamp</div>
            <div className="col-span-2">Project ID</div>
            <div className="col-span-5">Blocked Payload</div>
            <div className="col-span-2 text-right">Status</div>
          </div>
          
          <div className="divide-y divide-primary/5 h-[500px] overflow-y-auto">
            {loading ? (
              <div className="p-12 text-center text-primary/30 text-sm animate-pulse">Establishing secure connection to telemetry server...</div>
            ) : alerts.length === 0 ? (
              <div className="p-12 text-center text-primary/30 text-sm">No threats detected recently. System secure.</div>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className="log-entry grid grid-cols-12 gap-4 p-6 hover:bg-white/5 transition-colors items-center">
                  <div className="col-span-3 text-xs text-primary/50">
                    {new Date(alert.createdAt).toLocaleString()}
                  </div>
                  <div className="col-span-2 text-xs text-primary/80 font-bold">
                    {alert.projectId || 'demo-project'}
                  </div>
                  <div className="col-span-5">
                    <code className="text-xs text-accent bg-accent/10 px-2 py-1 rounded">
                      {alert.command.length > 50 ? alert.command.substring(0, 50) + '...' : alert.command}
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
    </div>
  );
}
