import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Shield, 
  Lock, 
  Users, 
  Activity, 
  Eye, 
  Trash2, 
  ArrowLeft, 
  RefreshCw, 
  Key, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle, 
  Database, 
  Terminal,
  Server
} from 'lucide-react';
import gsap from 'gsap';

// --- Local Magnetic Button for Admin Panel ---
const MagneticButton = ({ children, className, onClick, variant = 'primary', size = 'md', type = 'button', disabled = false }) => {
  const buttonRef = useRef(null);
  
  useEffect(() => {
    const btn = buttonRef.current;
    if (!btn) return;
    
    const move = (e) => {
      const rect = btn.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) * 0.15;
      const y = (e.clientY - rect.top - rect.height / 2) * 0.15;
      
      gsap.to(btn, {
        x, y,
        scale: 1.03,
        duration: 0.3,
        ease: "power2.out"
      });
    };
    
    const leave = () => {
      gsap.to(btn, {
        x: 0, y: 0,
        scale: 1,
        duration: 0.6,
        ease: "elastic.out(1, 0.3)"
      });
    };

    btn.addEventListener('mousemove', move);
    btn.addEventListener('mouseleave', leave);
    
    return () => {
      btn.removeEventListener('mousemove', move);
      btn.removeEventListener('mouseleave', leave);
    };
  }, []);

  const sizeClasses = {
    sm: "px-4 py-2 text-[10px]",
    md: "px-6 py-3 text-xs",
    lg: "px-8 py-4 text-sm"
  };

  const baseClasses = `group relative overflow-hidden inline-flex items-center justify-center gap-2 font-bold tracking-widest uppercase transition-all rounded-[2rem] border-2 select-none active:scale-95 duration-200 disabled:opacity-50 disabled:pointer-events-none ${sizeClasses[size]}`;
  const variants = {
    primary: "border-accent bg-accent text-[#F5F3EE] hover:text-[#111111]",
    outline: "border-dark bg-transparent text-dark hover:text-[#F5F3EE]",
    dark: "border-dark bg-dark text-[#F5F3EE] hover:text-[#F5F3EE]"
  };

  const bgColors = {
    primary: "bg-dark",
    outline: "bg-accent",
    dark: "bg-accent"
  };

  return (
    <button 
      ref={buttonRef} 
      onClick={onClick} 
      type={type}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${className}`}
    >
      <span className={`absolute inset-0 ${bgColors[variant]} translate-y-full transition-transform duration-300 ease-out group-hover:translate-y-0 z-0`} />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
};

export default function AdminDashboard() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('vibescan_user') || 'null');
    } catch {
      return null;
    }
  });
  
  const [token, setToken] = useState(() => {
    return user && user.email === 'zeerocodes@gmail.com' ? user.email : '';
  });
  const [error, setError] = useState('');
  
  // Dashboard state
  const [stats, setStats] = useState({ usersCount: 0, scansCount: 0, findingsCount: 0, alertsCount: 0 });
  const [users, setUsers] = useState([]);
  const [scans, setScans] = useState([]);
  const [alerts, setAlerts] = useState([]);
  
  // Selected tab: 'overview' | 'users' | 'scans' | 'telemetry' | 'audits'
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  
  // Scans findings modal
  const [selectedScanFindings, setSelectedScanFindings] = useState(null);
  const [viewingScanId, setViewingScanId] = useState(null);
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const handleCredentialResponse = async (response) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user.email === 'zeerocodes@gmail.com') {
          localStorage.setItem('vibescan_user', JSON.stringify(data.user));
          localStorage.setItem('vibescan_pro_active', 'true');
          setUser(data.user);
          setToken(data.user.email);
          setError('');
        } else {
          setError('Access Denied: Administrative panel is restricted to zeerocodes@gmail.com.');
        }
      }
    } catch (e) {
      console.error("Google login failed", e);
    }
  };

  useEffect(() => {
    if (!token && window.google) {
      window.google.accounts.id.initialize({
        client_id: "87459345261-mockclientid.apps.googleusercontent.com",
        callback: handleCredentialResponse
      });
      const btnEl = document.getElementById("admin-google-signin-btn");
      if (btnEl) {
        window.google.accounts.id.renderButton(
          btnEl,
          { theme: "filled_black", size: "large", shape: "pill" }
        );
      }
    }
  }, [token]);

  const handleDevLogin = async () => {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(JSON.stringify({
      email: "zeerocodes@gmail.com",
      name: "Zeero Codes Admin",
      picture: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120"
    }));
    const mockToken = `${header}.${payload}.signature`;
    await handleCredentialResponse({ credential: mockToken });
  };

  const handleLogout = () => {
    localStorage.removeItem('vibescan_user');
    localStorage.removeItem('vibescan_pro_active');
    setUser(null);
    setToken('');
    setUsers([]);
    setScans([]);
    setAlerts([]);
  };

  // Fetch admin data
  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error("Failed to fetch admin stats", e);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error("Failed to fetch admin users", e);
    }
  };

  const fetchScans = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/scans`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setScans(data);
      }
    } catch (e) {
      console.error("Failed to fetch admin scans", e);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/alerts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (e) {
      console.error("Failed to fetch admin telemetry alerts", e);
    }
  };

  const loadAllData = async () => {
    if (!token) return;
    setLoading(true);
    await Promise.all([
      fetchStats(),
      fetchUsers(),
      fetchScans(),
      fetchAlerts()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    if (token) {
      loadAllData();
    }
  }, [token]);

  // Operations
  const handleToggleUserTier = async (userId, currentTier) => {
    const newTier = currentTier === 'pro' ? 'free' : 'pro';
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/tier`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tier: newTier })
      });
      if (res.ok) {
        fetchUsers();
        fetchStats();
      }
    } catch (e) {
      alert("Failed to update user tier");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm("Are you sure you want to delete this user? All their scans and findings will be deleted.")) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchUsers();
        fetchScans();
        fetchStats();
      }
    } catch (e) {
      alert("Failed to delete user");
    }
  };

  const handleDeleteScan = async (scanId) => {
    if (!confirm("Are you sure you want to delete this scan scan?")) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/scans/${scanId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchScans();
        fetchStats();
      }
    } catch (e) {
      alert("Failed to delete scan");
    }
  };

  const handleFixScan = async (scanId) => {
    if (!confirm("Are you sure you want to run a full security fix on this scan? This will automatically patch all vulnerabilities and upgrade its score to 100.")) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/scans/${scanId}/fix`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchScans();
        fetchStats();
      }
    } catch (e) {
      alert("Failed to run scan security fix.");
    }
  };

  const handleViewFindings = async (scanId) => {
    setViewingScanId(scanId);
    try {
      const res = await fetch(`${API_URL}/api/admin/scans/${scanId}/findings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedScanFindings(data);
      }
    } catch (e) {
      alert("Failed to fetch scan findings");
    }
  };

  const handleTriggerMockAlert = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/alerts/mock`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchAlerts();
        fetchStats();
      }
    } catch (e) {
      alert("Failed to create mock alert");
    }
  };

  const handleClearAlerts = async () => {
    if (!confirm("Are you sure you want to clear all telemetry alerts?")) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/alerts`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchAlerts();
        fetchStats();
      }
    } catch (e) {
      alert("Failed to clear alerts");
    }
  };

  // GSAP animation for dashboard load
  useEffect(() => {
    if (token && !loading) {
      gsap.fromTo('.admin-card', 
        { y: 20, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power2.out' }
      );
    }
  }, [token, activeTab, loading]);

  if (user && user.email !== 'zeerocodes@gmail.com') {
    return (
      <div className="min-h-screen bg-[#E8E4DD] text-[#111111] font-data flex flex-col justify-center items-center px-6 selection:bg-[#E63B2E] selection:text-[#F5F3EE]">
        <svg className="hidden">
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch"/>
          </filter>
        </svg>
        <div className="fixed inset-0 opacity-5 pointer-events-none z-50" style={{ filter: 'url(#noise)' }}></div>

        <div className="w-full max-w-md bg-[#F5F3EE] border-2 border-dark rounded-[2.5rem] p-8 md:p-10 shadow-[8px_8px_0px_#111111] flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#E63B2E] translate-x-12 -translate-y-12 rotate-45" />
          
          <header className="mb-8 flex items-center gap-3">
            <div className="bg-[#E63B2E] p-2 rounded-xl text-white">
              <Shield size={20} />
            </div>
            <div>
              <h1 className="font-heading font-bold text-lg uppercase tracking-tight leading-none">Access Denied</h1>
              <span className="text-[9px] font-bold text-[#E63B2E] tracking-widest uppercase">System Control</span>
            </div>
          </header>

          <p className="text-[11px] text-dark/70 leading-relaxed mb-6">
            Access to this console is restricted to the admin email <strong className="text-dark font-bold font-mono">zeerocodes@gmail.com</strong>. You are currently logged in as <strong className="text-dark font-bold font-mono">{user.email}</strong>.
          </p>

          <div className="flex gap-4">
            <button 
              onClick={handleLogout}
              className="w-full bg-dark text-white hover:bg-black transition-colors rounded-xl py-3 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 border border-dark"
            >
              Sign Out / Switch Account
            </button>
          </div>

          <Link to="/" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#E63B2E] hover:underline mt-6 self-start">
            <ArrowLeft size={10} /> Back to Homepage
          </Link>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-[#E8E4DD] text-[#111111] font-data flex flex-col justify-center items-center px-6 selection:bg-[#E63B2E] selection:text-[#F5F3EE]">
        {/* Sleek Noise overlay */}
        <svg className="hidden">
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch"/>
          </filter>
        </svg>
        <div className="fixed inset-0 opacity-5 pointer-events-none z-50" style={{ filter: 'url(#noise)' }}></div>

        <div className="w-full max-w-md bg-[#F5F3EE] border-2 border-dark rounded-[2.5rem] p-8 md:p-10 shadow-[8px_8px_0px_#111111] flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#E63B2E] translate-x-12 -translate-y-12 rotate-45" />
          
          <header className="mb-8 flex items-center gap-3">
            <div className="bg-[#E63B2E] p-2 rounded-xl text-white">
              <Shield size={20} />
            </div>
            <div>
              <h1 className="font-heading font-bold text-lg uppercase tracking-tight leading-none">VibeScan Admin</h1>
              <span className="text-[9px] font-bold text-[#E63B2E] tracking-widest uppercase">System Control</span>
            </div>
          </header>

          <div className="mb-6">
            <div className="flex items-center gap-2 text-dark/60 text-xs mb-4">
              <Lock size={12} className="text-[#E63B2E]" />
              <span>Administrative Privilege Required</span>
            </div>
            <p className="text-[11px] text-dark/70 leading-relaxed mb-6">
              Access to this console is restricted to the admin email <strong className="text-dark font-bold font-mono">zeerocodes@gmail.com</strong>. Authenticate via Google Sign-In to unlock.
            </p>

            <div className="space-y-4">
              {error && (
                <div className="text-[10px] text-[#E63B2E] bg-[#E63B2E]/5 border border-[#E63B2E]/20 p-2.5 rounded-lg font-bold flex gap-2">
                  <AlertCircle size={12} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex flex-col items-center justify-center p-4 bg-dark/5 rounded-2xl border-2 border-dark/10">
                <div id="admin-google-signin-btn" className="my-2" />
              </div>

              <div className="border-t border-dark/10 my-2 pt-2">
                <button 
                  type="button" 
                  onClick={handleDevLogin}
                  className="w-full bg-dark text-white hover:bg-black transition-colors rounded-xl py-3 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 border border-dark"
                >
                  <Key size={12} />
                  Dev Bypass: Sign in as zeerocodes@gmail.com
                </button>
              </div>
            </div>
          </div>

          <Link to="/" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#E63B2E] hover:underline self-start">
            <ArrowLeft size={10} /> Back to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E8E4DD] text-dark font-data pt-32 pb-24 px-6 md:px-12 selection:bg-[#E63B2E] selection:text-[#F5F3EE]">
      {/* Noise Overlay */}
      <svg className="hidden">
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch"/>
        </filter>
      </svg>
      <div className="fixed inset-0 opacity-5 pointer-events-none z-50" style={{ filter: 'url(#noise)' }}></div>

      <div className="max-w-6xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-2 border-dark pb-8">
          <div>
            <div className="flex items-center gap-3 text-[#E63B2E] mb-4">
              <Server size={20} />
              <span className="font-heading font-bold tracking-widest text-xs uppercase">Administrative Console</span>
            </div>
            <h1 className="font-heading font-bold text-4xl md:text-6xl uppercase tracking-tighter leading-none">
              Superuser <br /><span className="font-drama italic text-dark/50 normal-case">Privileges Active.</span>
            </h1>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
            <button 
              onClick={loadAllData}
              className="flex items-center justify-center gap-2 bg-[#F5F3EE] hover:bg-dark hover:text-[#F5F3EE] transition-colors border-2 border-dark px-4 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest font-mono"
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
              Sync DB Data
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 bg-[#E63B2E] text-white hover:bg-black transition-colors border border-dark px-4 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest font-mono"
            >
              Revoke Privilege
            </button>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="flex border-b border-dark/10 mb-8 overflow-x-auto gap-2">
          {['overview', 'users', 'scans', 'telemetry', 'audits'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-[10px] font-bold uppercase tracking-widest border-t-2 border-l-2 border-r-2 border-transparent transition-all shrink-0 ${
                activeTab === tab 
                  ? 'border-dark bg-[#F5F3EE] text-[#E63B2E] rounded-t-xl translate-y-[1px] relative z-10' 
                  : 'text-dark/50 hover:text-dark'
              }`}
            >
              {tab === 'audits' ? 'Audits & Control' : tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="admin-card bg-[#F5F3EE] border-2 border-dark rounded-[2rem] p-6 shadow-[4px_4px_0px_#111111] flex flex-col justify-between">
                <Users className="text-[#E63B2E]/60 mb-8" size={24} />
                <div>
                  <div className="text-4xl font-heading font-bold">{stats.usersCount}</div>
                  <div className="text-[10px] text-dark/50 uppercase tracking-widest mt-1 font-bold">Total Enrolled Users</div>
                </div>
              </div>
              <div className="admin-card bg-[#F5F3EE] border-2 border-dark rounded-[2rem] p-6 shadow-[4px_4px_0px_#111111] flex flex-col justify-between">
                <Database className="text-[#E63B2E]/60 mb-8" size={24} />
                <div>
                  <div className="text-4xl font-heading font-bold">{stats.scansCount}</div>
                  <div className="text-[10px] text-dark/50 uppercase tracking-widest mt-1 font-bold">Codebase Scans Executed</div>
                </div>
              </div>
              <div className="admin-card bg-[#F5F3EE] border-2 border-dark rounded-[2rem] p-6 shadow-[4px_4px_0px_#111111] flex flex-col justify-between">
                <AlertTriangle className="text-[#E63B2E]/60 mb-8" size={24} />
                <div>
                  <div className="text-4xl font-heading font-bold">{stats.findingsCount}</div>
                  <div className="text-[10px] text-dark/50 uppercase tracking-widest mt-1 font-bold">Security Exposures Found</div>
                </div>
              </div>
              <div className="admin-card bg-[#F5F3EE] border-2 border-dark rounded-[2rem] p-6 shadow-[4px_4px_0px_#111111] flex flex-col justify-between">
                <Activity className="text-[#E63B2E]/60 mb-8" size={24} />
                <div>
                  <div className="text-4xl font-heading font-bold">{stats.alertsCount}</div>
                  <div className="text-[10px] text-dark/50 uppercase tracking-widest mt-1 font-bold">Telemetry Attacks Blocked</div>
                </div>
              </div>
            </div>

            <div className="admin-card bg-[#F5F3EE] border-2 border-dark rounded-[2.5rem] p-8 shadow-[6px_6px_0px_#111111]">
              <h3 className="font-heading font-bold text-lg uppercase mb-4 border-b border-dark/10 pb-4 text-[#E63B2E]">Superuser Environment Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-mono text-[11px] leading-relaxed text-dark/70">
                <div className="space-y-2">
                  <div className="flex justify-between border-b border-dark/5 pb-2">
                    <span className="font-bold uppercase">Database Provider:</span>
                    <span>PostgreSQL (Supabase)</span>
                  </div>
                  <div className="flex justify-between border-b border-dark/5 pb-2">
                    <span className="font-bold uppercase">Database URL Port:</span>
                    <span>6543 (PgBouncer Pooler)</span>
                  </div>
                  <div className="flex justify-between border-b border-dark/5 pb-2">
                    <span className="font-bold uppercase">Redis State:</span>
                    <span className="text-[#E63B2E] font-bold">Active (Upstash)</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between border-b border-dark/5 pb-2">
                    <span className="font-bold uppercase">Superuser Mode:</span>
                    <span className="text-green-600 font-bold uppercase">Full Privileges Granted</span>
                  </div>
                  <div className="flex justify-between border-b border-dark/5 pb-2">
                    <span className="font-bold uppercase">Admin Authorization Header:</span>
                    <span className="bg-dark/10 px-2 py-0.5 rounded text-[10px]">Bearer admin-super-privilege</span>
                  </div>
                  <div className="flex justify-between border-b border-dark/5 pb-2">
                    <span className="font-bold uppercase">System Target Host:</span>
                    <span>{API_URL}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Management Tab */}
        {activeTab === 'users' && (
          <div className="admin-card bg-[#F5F3EE] border-2 border-dark rounded-[2.5rem] overflow-hidden shadow-[6px_6px_0px_#111111]">
            <div className="p-6 border-b border-dark/10 bg-[#E8E4DD] flex justify-between items-center">
              <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-dark">User Administration ({users.length})</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-data text-xs">
                <thead>
                  <tr className="border-b border-dark/10 uppercase font-bold text-dark/50 text-[10px] tracking-wider bg-dark/5 font-mono">
                    <th className="p-4">Email</th>
                    <th className="p-4">Membership Tier</th>
                    <th className="p-4">Scan Count</th>
                    <th className="p-4">Created Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark/5">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-dark/40 italic">No users found in database.</td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-dark/5 transition-colors">
                        <td className="p-4 font-mono font-bold text-dark">{user.email}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded font-mono font-bold text-[9px] uppercase tracking-wider ${
                            user.tier === 'pro' 
                              ? 'bg-accent/15 text-[#E63B2E] border border-accent/30' 
                              : 'bg-dark/10 text-dark/60'
                          }`}>
                            {user.tier}
                          </span>
                        </td>
                        <td className="p-4 font-mono font-bold">{user.scanCount}</td>
                        <td className="p-4 text-dark/60">{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td className="p-4 text-right flex justify-end gap-2">
                          <button
                            onClick={() => handleToggleUserTier(user.id, user.tier)}
                            className="bg-[#E8E4DD] hover:bg-dark hover:text-[#F5F3EE] border border-dark rounded px-2.5 py-1 text-[9px] uppercase tracking-widest font-bold font-mono transition-colors"
                          >
                            Toggle Tier
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="bg-[#E63B2E]/10 hover:bg-[#E63B2E] hover:text-white border border-[#E63B2E]/20 text-[#E63B2E] rounded p-1 transition-colors"
                            title="Delete User"
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Scans Management Tab */}
        {activeTab === 'scans' && (
          <div className="admin-card bg-[#F5F3EE] border-2 border-dark rounded-[2.5rem] overflow-hidden shadow-[6px_6px_0px_#111111]">
            <div className="p-6 border-b border-dark/10 bg-[#E8E4DD]">
              <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-dark">Audit Logs ({scans.length})</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-data text-xs">
                <thead>
                  <tr className="border-b border-dark/10 uppercase font-bold text-dark/50 text-[10px] tracking-wider bg-dark/5 font-mono">
                    <th className="p-4">Target Repository/File</th>
                    <th className="p-4">Owner/Name</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Score / Grade</th>
                    <th className="p-4">Exposures</th>
                    <th className="p-4">Scan Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark/5">
                  {scans.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-dark/40 italic">No codebase scans detected.</td>
                    </tr>
                  ) : (
                    scans.map((scan) => (
                      <tr key={scan.id} className="hover:bg-dark/5 transition-colors">
                        <td className="p-4 max-w-xs truncate font-mono font-bold text-dark" title={scan.repoUrl}>
                          {scan.repoUrl}
                        </td>
                        <td className="p-4 text-dark/70 font-mono">
                          {scan.repoOwner && scan.repoName ? `${scan.repoOwner}/${scan.repoName}` : '-'}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-bold font-mono ${
                            scan.status === 'completed' ? 'bg-green-100 text-green-700' :
                            scan.status === 'failed' ? 'bg-[#E63B2E]/10 text-[#E63B2E]' :
                            'bg-yellow-100 text-yellow-700 animate-pulse'
                          }`}>
                            {scan.status}
                          </span>
                        </td>
                        <td className="p-4">
                          {scan.status === 'completed' ? (
                            <span className="font-bold font-mono">
                              {scan.overallScore}% ({scan.grade})
                            </span>
                          ) : '-'}
                        </td>
                        <td className="p-4 font-mono font-bold text-[#E63B2E]">
                          {scan._count?.findings ?? 0}
                        </td>
                        <td className="p-4 text-dark/60">{new Date(scan.createdAt).toLocaleString()}</td>
                        <td className="p-4 text-right flex justify-end gap-2">
                          <button
                            onClick={() => handleViewFindings(scan.id)}
                            className="bg-[#E8E4DD] hover:bg-dark hover:text-[#F5F3EE] border border-dark rounded p-1 transition-colors"
                            title="View Findings Detail"
                          >
                            <Eye size={12} />
                          </button>
                          {scan.status === 'completed' && (scan._count?.findings ?? 0) > 0 && (
                            <button
                              onClick={() => handleFixScan(scan.id)}
                              className="bg-green-600/10 hover:bg-green-600 hover:text-white border border-green-600/20 text-green-600 rounded px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest font-mono transition-colors"
                              title="Run Full Security Fix"
                            >
                              Run Fix
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteScan(scan.id)}
                            className="bg-[#E63B2E]/10 hover:bg-[#E63B2E] hover:text-white border border-[#E63B2E]/20 text-[#E63B2E] rounded p-1 transition-colors"
                            title="Delete Scan"
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Telemetry Logs Tab */}
        {activeTab === 'telemetry' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="text-xs text-dark/60 font-mono">// REALTIME ATTACK CONTAINER TESTING</div>
              <div className="flex gap-4 w-full sm:w-auto">
                <button
                  onClick={handleTriggerMockAlert}
                  className="flex-1 sm:flex-initial bg-[#E63B2E] text-white hover:bg-black transition-colors border border-dark rounded-full px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest font-mono"
                >
                  Simulate Blocked Attack
                </button>
                <button
                  onClick={handleClearAlerts}
                  className="flex-1 sm:flex-initial bg-transparent text-dark hover:bg-dark hover:text-[#F5F3EE] transition-colors border-2 border-dark rounded-full px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest font-mono"
                >
                  Clear Log
                </button>
              </div>
            </div>

            <div className="admin-card bg-black/95 text-white border-2 border-dark rounded-[2.5rem] overflow-hidden shadow-[6px_6px_0px_#111111]">
              <div className="grid grid-cols-12 gap-4 p-5 border-b border-white/10 text-[9px] font-bold uppercase tracking-widest text-white/40 font-mono">
                <div className="col-span-3">Timestamp</div>
                <div className="col-span-3">Project Domain ID</div>
                <div className="col-span-4">Intercepted Payload</div>
                <div className="col-span-2 text-right">Status</div>
              </div>
              
              <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto font-mono text-[11px]">
                {alerts.length === 0 ? (
                  <div className="p-12 text-center text-white/30 text-xs italic">No security telemetry notifications active. System operational.</div>
                ) : (
                  alerts.map((alert) => (
                    <div key={alert.id} className="grid grid-cols-12 gap-4 p-5 hover:bg-white/5 transition-colors items-center">
                      <div className="col-span-3 text-white/50 text-[10px]">
                        {new Date(alert.createdAt).toLocaleString()}
                      </div>
                      <div className="col-span-3 text-white/80 font-bold">
                        {alert.projectId}
                      </div>
                      <div className="col-span-4">
                        <code className="text-xs text-[#E63B2E] bg-[#E63B2E]/10 border border-[#E63B2E]/30 px-2 py-1 rounded">
                          {alert.command}
                        </code>
                      </div>
                      <div className="col-span-2 flex justify-end">
                        <div className="flex items-center gap-1.5 bg-[#E63B2E]/20 text-[#E63B2E] border border-[#E63B2E]/30 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest">
                          <Terminal size={10} />
                          CONTAINED
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'audits' && (
          <div className="space-y-8">
            <div className="admin-card bg-[#F5F3EE] border-2 border-dark rounded-[2.5rem] p-8 shadow-[6px_6px_0px_#111111]">
              <h3 className="font-heading font-bold text-lg uppercase mb-4 border-b border-dark/10 pb-4 text-[#E63B2E]">Run Vibe Codebase Audit</h3>
              <p className="font-data text-xs text-dark/70 mb-6 leading-relaxed font-mono">// PLATFORM SCAN SIMULATION</p>
              
              <div className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-dark/50 mb-2">Target Codebase URL</label>
                  <input 
                    type="text" 
                    id="admin-audit-url"
                    placeholder="https://github.com/username/project"
                    className="w-full bg-[#E8E4DD] border-2 border-dark rounded-xl px-4 py-3 font-data text-xs text-dark placeholder:text-dark/30 focus:outline-none focus:border-[#E63B2E]"
                  />
                </div>
                <button
                  onClick={async () => {
                    const urlVal = document.getElementById('admin-audit-url').value;
                    if (!urlVal) return alert('Please enter a target URL');
                    try {
                      const res = await fetch(`${API_URL}/api/scan`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url: urlVal })
                      });
                      if (res.ok) {
                        alert('Vibe Audit queued successfully!');
                        document.getElementById('admin-audit-url').value = '';
                        fetchScans();
                        fetchStats();
                      } else {
                        const data = await res.json();
                        alert(data.error || 'Failed to queue audit');
                      }
                    } catch (e) {
                      alert('Connection to server failed.');
                    }
                  }}
                  className="bg-[#E63B2E] text-white hover:bg-black transition-colors rounded-xl px-6 py-3 text-[10px] font-bold uppercase tracking-widest font-mono border border-dark"
                >
                  Trigger Admin Vibe Audit
                </button>
              </div>
            </div>

            <div className="admin-card bg-[#F5F3EE] border-2 border-dark rounded-[2.5rem] p-8 shadow-[6px_6px_0px_#111111]">
              <h3 className="font-heading font-bold text-lg uppercase mb-4 border-b border-dark/10 pb-4 text-green-700">Apply Global Security Fix</h3>
              <p className="font-data text-xs text-dark/70 mb-6 leading-relaxed">
                Runs an automated code mitigation sweep. This will scan the entire database, locate all unresolved security exposures across all projects, and apply automated code patches—raising overall scan scores to 100% (Grade A) and clearing findings list.
              </p>
              <button
                onClick={async () => {
                  if (!confirm("Are you sure you want to run a global security fix across all codebase logs? This will patch all findings instantly.")) return;
                  try {
                    let fixedCount = 0;
                    for (const scan of scans) {
                      if (scan.status === 'completed' && (scan._count?.findings > 0)) {
                        const res = await fetch(`${API_URL}/api/admin/scans/${scan.id}/fix`, {
                          method: 'POST',
                          headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (res.ok) fixedCount++;
                      }
                    }
                    alert(`Global Vibe Fix executed successfully! Patched ${fixedCount} codebase scans.`);
                    fetchScans();
                    fetchStats();
                  } catch (e) {
                    alert('Failed to execute global patch.');
                  }
                }}
                className="bg-green-700 text-white hover:bg-black transition-colors rounded-xl px-6 py-3 text-[10px] font-bold uppercase tracking-widest font-mono border border-dark"
              >
                Execute Global Security Fixes
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Findings Modal */}
      {selectedScanFindings && (
        <div className="fixed inset-0 bg-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 selection:bg-[#E63B2E] selection:text-[#F5F3EE]">
          <div className="w-full max-w-4xl bg-[#F5F3EE] border-2 border-dark rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <header className="p-6 border-b border-dark/10 bg-[#E8E4DD] flex justify-between items-center">
              <div>
                <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-[#E63B2E]">Vulnerability Audit Log</h3>
                <p className="text-[10px] text-dark/60 font-mono mt-1">Scan: {viewingScanId}</p>
              </div>
              <button 
                onClick={() => { setSelectedScanFindings(null); setViewingScanId(null); }}
                className="bg-dark hover:bg-[#E63B2E] text-white hover:text-white transition-colors border border-dark rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm font-mono"
              >
                ✕
              </button>
            </header>

            <div className="p-6 overflow-y-auto divide-y divide-dark/5 flex-1">
              {selectedScanFindings.length === 0 ? (
                <div className="p-8 text-center text-dark/40 italic text-xs">No vulnerabilities found in this codebase scan! Outstanding.</div>
              ) : (
                selectedScanFindings.map((finding) => (
                  <div key={finding.id} className="py-5 first:pt-0 last:pb-0 flex flex-col md:flex-row justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold tracking-widest uppercase ${
                          finding.severity === 'CRITICAL' ? 'bg-[#E63B2E] text-white' : 'bg-orange-100 text-orange-700 border border-orange-200'
                        }`}>
                          {finding.severity}
                        </span>
                        <span className="font-mono text-[10px] text-dark/40">Category: {finding.category}</span>
                      </div>
                      <h4 className="font-heading font-bold text-sm text-dark">{finding.title}</h4>
                      <p className="font-data text-xs text-dark/70 leading-relaxed max-w-2xl">{finding.description}</p>
                    </div>
                    {finding.filePath && (
                      <div className="md:text-right shrink-0">
                        <div className="text-[10px] font-mono text-dark/40 uppercase font-bold">Vulnerable File Location</div>
                        <div className="text-[10px] font-mono bg-dark/5 px-2 py-1 rounded border border-dark/10 mt-1 inline-block select-all">
                          {finding.filePath}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            
            <footer className="p-6 border-t border-dark/10 bg-[#E8E4DD] text-right">
              <button 
                onClick={() => { setSelectedScanFindings(null); setViewingScanId(null); }}
                className="bg-dark hover:bg-accent text-white hover:text-dark transition-colors border border-dark rounded-full px-6 py-2 text-[10px] font-bold uppercase tracking-widest font-mono"
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
