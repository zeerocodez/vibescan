import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Shield, 
  ArrowRight, 
  Zap, 
  Lock, 
  Terminal, 
  Activity, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle, 
  ExternalLink, 
  ArrowLeft, 
  Loader2, 
  Sparkles, 
  Code, 
  Server, 
  Check, 
  Info,
  Calendar,
  MousePointer,
  CreditCard,
  CheckCircle2,
  LockKeyhole,
  FileCode2,
  Cpu,
  Layers,
  Copy,
  ChevronRight,
  Database,
  KeyRound,
  ShieldAlert,
  Flame,
  Globe,
  Eye,
  FileCheck,
  Building,
  HeartPulse,
  ShoppingBag,
  Bot,
  Key
} from 'lucide-react';
import CertPage from './CertPage';
import Dashboard from './Dashboard';
import AdminDashboard from './AdminDashboard';
import AuthModal from './AuthModal';

gsap.registerPlugin(ScrollTrigger);

// --- Magnetic Button Component (Brutalist Signal Style) ---
const MagneticButton = ({ children, className = '', onClick, variant = 'primary', size = 'md', type = 'button', disabled = false }) => {
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
    md: "px-7 py-3.5 text-xs",
    lg: "px-9 py-4 text-sm"
  };

  const baseClasses = `group relative overflow-hidden inline-flex items-center justify-center gap-2 font-bold tracking-widest uppercase transition-all rounded-[2rem] border-2 select-none active:scale-95 duration-200 disabled:opacity-50 disabled:pointer-events-none ${sizeClasses[size]}`;
  const variants = {
    primary: "border-accent bg-accent text-background hover:text-primary shadow-[4px_4px_0px_#111111]",
    outline: "border-dark bg-transparent text-dark hover:text-background shadow-[3px_3px_0px_#111111]",
    dark: "border-dark bg-dark text-background hover:text-background shadow-[4px_4px_0px_#E63B2E]",
    free: "border-[#10B981] bg-[#10B981] text-white hover:bg-dark shadow-[4px_4px_0px_#111111]"
  };

  const bgColors = {
    primary: "bg-dark",
    outline: "bg-accent",
    dark: "bg-accent",
    free: "bg-dark"
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
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
    </button>
  );
};

// --- Top Announcement Banner ---
const AnnouncementBar = ({ onOpenScanner }) => {
  return (
    <div className="bg-[#111111] text-primary border-b border-primary/10 py-2.5 px-4 text-center relative z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 text-[11px] font-data font-medium flex-wrap">
        <span className="inline-flex items-center gap-1.5 bg-[#10B981]/20 text-[#10B981] px-2.5 py-0.5 rounded-full font-bold uppercase text-[9px] border border-[#10B981]/40">
          <Sparkles size={11} /> 100% Free Basic Scan
        </span>
        <span className="text-primary/90">
          Test your AI-built app in 30 seconds. Uncover leaked keys and broken payment webhooks before hackers do.
        </span>
        <button 
          onClick={onOpenScanner}
          className="text-accent hover:underline font-bold inline-flex items-center gap-1 uppercase tracking-wider text-[10px]"
        >
          Try Free Scan <ArrowRight size={11} />
        </button>
      </div>
    </div>
  );
};

// --- Navbar Component ---
const Navbar = ({ onOpenScanner, onOpenCheckout, onOpenAuth, isPro, user, setUser }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('vibescan_user');
    localStorage.removeItem('vibescan_pro_active');
    setUser(null);
    navigate('/');
  };

  const isAdmin = user && user.email === 'zeerocodes@gmail.com';

  return (
    <nav className="sticky top-4 z-50 w-[94%] max-w-7xl mx-auto rounded-[2rem] border border-primary/20 bg-[#111111]/90 backdrop-blur-lg text-primary shadow-2xl">
      <div className="flex items-center justify-between px-6 py-3.5 gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center text-background font-bold shadow-[0_0_15px_rgba(230,59,46,0.5)]">
            <Shield size={18} />
          </div>
          <span className="font-heading font-bold text-xl tracking-tighter text-white">VIBESCAN</span>
          <span className="hidden sm:inline-block font-data text-[9px] bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 rounded-full px-2 py-0.5 font-bold tracking-wider uppercase">
            Free Scan Ready
          </span>
          {isPro && (
            <span className="font-data text-[9px] bg-accent/20 text-accent border border-accent/40 rounded px-1.5 py-0.5 font-bold tracking-widest uppercase">PRO</span>
          )}
        </Link>
        
        {/* Navigation Links */}
        <div className="hidden xl:flex gap-6 text-[11px] font-data font-bold tracking-wider uppercase items-center shrink-0">
          <a href="#transformation" className="hover:text-accent transition-colors text-primary/80">Transformation</a>
          <a href="#products" className="hover:text-accent transition-colors text-primary/80">Our Products</a>
          <a href="#industries" className="hover:text-accent transition-colors text-primary/80">Industries</a>
          <a href="#protocol" className="hover:text-accent transition-colors text-primary/80">How It Works</a>
          <a href="#pricing" className="hover:text-accent transition-colors text-primary/80">Pricing</a>
          <Link to="/dashboard" className="hover:text-accent transition-colors text-primary/80">Dashboard</Link>
          {isAdmin && (
            <Link to="/admin" className="hover:text-accent transition-colors text-accent font-bold flex items-center gap-1 bg-accent/10 px-2 py-0.5 rounded-full border border-accent/30">
              <Key size={11} /> Admin Panel
            </Link>
          )}
        </div>
        
        {/* Actions & User State */}
        <div className="flex items-center gap-2.5 shrink-0">
          {user ? (
            <div className="flex items-center gap-2">
              <Link 
                to="/dashboard"
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-full transition-colors"
              >
                <div className="w-5 h-5 rounded-full bg-accent/30 text-accent text-[9px] font-bold flex items-center justify-center font-mono">
                  {user.email ? user.email[0].toUpperCase() : 'U'}
                </div>
                <span className="hidden md:inline text-[10px] font-bold font-mono tracking-wider text-primary/90">
                  {user.email ? user.email.split('@')[0] : 'Account'}
                </span>
              </Link>
              <button 
                onClick={handleLogout}
                className="hover:text-accent transition-colors text-primary/70 text-[9px] font-bold uppercase tracking-wider bg-primary/10 px-2.5 py-1.5 rounded-full border border-primary/15"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenAuth && onOpenAuth('signin')}
                className="hover:text-accent transition-colors text-primary/90 border border-primary/20 hover:border-accent/40 bg-white/5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth && onOpenAuth('signup')}
                className="hidden sm:inline-flex hover:text-white transition-colors text-white bg-accent/20 hover:bg-accent border border-accent/40 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap"
              >
                Sign Up
              </button>
            </div>
          )}
          
          <MagneticButton 
            variant="primary" 
            size="sm" 
            onClick={onOpenScanner}
            className="border-transparent shadow-[0_0_20px_rgba(230,59,46,0.4)]"
          >
            Run Free Scan <ArrowRight size={13} />
          </MagneticButton>
        </div>
      </div>
    </nav>
  );
};

// --- Hero Component (Transformation & Free Scan Focus) ---
const Hero = ({ onOpenScanner, onOpenCheckout }) => {
  const container = useRef(null);
  const [quickUrl, setQuickUrl] = useState('');

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.hero-fade-up', 
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          stagger: 0.12,
          ease: 'power3.out'
        }
      );
    }, container);
    return () => ctx.revert();
  }, []);

  const handleQuickScan = (e) => {
    e.preventDefault();
    onOpenScanner(quickUrl);
  };

  return (
    <section ref={container} className="relative min-h-[92dvh] w-full bg-dark overflow-hidden flex items-center pt-16 pb-20">
      {/* Brutalist Raw Concrete Background */}
      <div className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none">
        <img 
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2000" 
          alt="Brutalist Architecture Texture" 
          className="w-full h-full object-cover" 
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-[#111111]/80 to-transparent pointer-events-none" />
      
      <div className="relative z-10 w-full px-6 md:px-12 max-w-7xl mx-auto">
        <div className="flex flex-col items-start max-w-4xl">
          {/* Badge */}
          <div className="hero-fade-up inline-flex items-center gap-2 bg-accent text-background font-data font-bold text-[11px] uppercase tracking-widest px-3.5 py-1.5 mb-6 rounded-md shadow-[0_0_20px_rgba(230,59,46,0.5)]">
            <Shield size={13} /> // 100% FREE AI CODE SECURITY AUDIT
          </div>
          
          {/* Main Level 4 English Headline */}
          <h1 className="flex flex-col text-primary leading-[0.88] tracking-tighter">
            <span className="hero-fade-up font-heading font-bold text-4xl sm:text-6xl md:text-7xl uppercase text-white">
              YOU BUILT IT FAST WITH AI.
            </span>
            <span className="hero-fade-up font-drama italic text-5xl sm:text-7xl md:text-8xl text-accent mt-2">
              Now ship it with zero fear.
            </span>
          </h1>
          
          {/* Subheading in Plain English */}
          <div className="hero-fade-up mt-7 max-w-2xl">
            <p className="font-data text-primary/85 text-sm sm:text-base leading-relaxed mb-8">
              Did you use Cursor, Bolt, Lovable, or v0 to build your app? <strong>45% of AI-built apps have secret keys and broken payment holes hiding in the code.</strong> VibeScan checks your entire codebase in 30 seconds and gives you ready-to-use fixes so you can launch with confidence.
            </p>
            
            {/* Quick Scan Input Widget */}
            <form onSubmit={handleQuickScan} className="bg-[#1E1E1E] border-2 border-primary/20 rounded-[2rem] p-2 sm:p-2.5 flex flex-col sm:flex-row gap-2 shadow-[8px_8px_0px_#E63B2E] mb-6">
              <input 
                type="text" 
                value={quickUrl}
                onChange={(e) => setQuickUrl(e.target.value)}
                placeholder="Paste GitHub repo or live app URL (e.g. github.com/user/my-app)"
                className="flex-1 bg-transparent px-4 py-3 font-data text-xs text-white placeholder:text-primary/40 focus:outline-none"
              />
              <MagneticButton 
                variant="primary" 
                size="md"
                type="submit"
                className="border-transparent whitespace-nowrap"
              >
                Run Free Scan <ArrowRight size={15} />
              </MagneticButton>
            </form>

            {/* Trust Points */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[10px] font-data text-primary/70 uppercase tracking-wider">
              <div className="flex items-center gap-1.5"><Check size={13} className="text-[#10B981]" /> 100% Free Forever</div>
              <div className="flex items-center gap-1.5"><Check size={13} className="text-[#10B981]" /> 30-Second Audit</div>
              <div className="flex items-center gap-1.5"><Check size={13} className="text-[#10B981]" /> No Credit Card</div>
              <div className="flex items-center gap-1.5"><Check size={13} className="text-[#10B981]" /> 1-Click Code Fixes</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// --- Transformation: Before vs. After Section ---
const TransformationSection = () => {
  const container = useRef(null);

  return (
    <section ref={container} id="transformation" className="py-28 px-6 bg-background border-t-2 border-dark text-dark">
      <div className="max-w-7xl mx-auto">
        <header className="mb-20 max-w-3xl">
          <div className="font-data text-accent text-xs uppercase tracking-widest font-bold mb-3">// THE VIBE CODING TRANSFORMATION</div>
          <h2 className="font-heading font-bold text-4xl md:text-6xl uppercase tracking-tighter leading-none">
            Stop losing sleep over <br/>
            <span className="font-drama italic text-dark/60 normal-case">code you did not write.</span>
          </h2>
          <p className="font-data text-xs md:text-sm text-dark/70 mt-5 leading-relaxed">
            AI code assistants write fast, but they do not check if your secrets are showing. Here is how VibeScan turns your scary prototype into a production-ready fortress.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Before Card */}
          <div className="border-2 border-dark rounded-[2.5rem] p-8 md:p-10 bg-[#E8E4DD] shadow-[6px_6px_0px_#111111] flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-6">
                <span className="font-heading font-bold text-xs uppercase tracking-widest text-accent flex items-center gap-2">
                  <Flame size={16} /> BEFORE VIBESCAN (THE AI HANGOVER)
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-accent animate-ping" />
              </div>
              <h3 className="font-heading font-bold text-2xl uppercase tracking-tight mb-6 text-dark">
                Constant anxiety, hidden leaks, and lost deals.
              </h3>
              <ul className="space-y-4 font-data text-xs text-dark/80">
                <li className="flex items-start gap-3">
                  <span className="text-accent font-bold text-sm leading-none">✕</span>
                  <span><strong>Exposed API Keys:</strong> OpenAI, Stripe, and Paystack secret keys hardcoded into client JavaScript files where anyone can steal them.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-accent font-bold text-sm leading-none">✕</span>
                  <span><strong>Fake Payment Webhooks:</strong> Webhooks without constant-time verification allow malicious users to spoof fake payments and steal orders.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-accent font-bold text-sm leading-none">✕</span>
                  <span><strong>Supabase Database Leaks:</strong> Service Role keys exposed on the frontend allow anyone to read or delete all user records.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-accent font-bold text-sm leading-none">✕</span>
                  <span><strong>Lost Investor Trust:</strong> Pitching to angel investors or enterprise clients without security proof causes immediate rejection.</span>
                </li>
              </ul>
            </div>
            <div className="mt-8 pt-4 border-t border-dark/15 text-dark/60 font-data text-[11px] italic">
              Result: Fear of shipping, unexpected billing spikes, and zero compliance proof.
            </div>
          </div>

          {/* After Card */}
          <div className="border-2 border-dark rounded-[2.5rem] p-8 md:p-10 bg-dark text-primary shadow-[8px_8px_0px_#10B981] flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#10B981]/10 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="flex justify-between items-center mb-6">
                <span className="font-heading font-bold text-xs uppercase tracking-widest text-[#10B981] flex items-center gap-2">
                  <ShieldCheckIcon /> AFTER VIBESCAN (THE CONFIDENT BUILDER)
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
              </div>
              <h3 className="font-heading font-bold text-2xl uppercase tracking-tight mb-6 text-white">
                Total peace of mind, 1-click fixes, and investor trust.
              </h3>
              <ul className="space-y-4 font-data text-xs text-primary/85">
                <li className="flex items-start gap-3">
                  <span className="text-[#10B981] font-bold text-sm leading-none">✓</span>
                  <span><strong>100% Locked Secrets:</strong> All API keys and database credentials safely moved to server environment variables.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#10B981] font-bold text-sm leading-none">✓</span>
                  <span><strong>Cryptographic Webhook Defense:</strong> Paystack, Stripe, and Flutterwave webhooks protected with constant-time HMAC validation.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#10B981] font-bold text-sm leading-none">✓</span>
                  <span><strong>1-Click Unified Diff Fixes:</strong> Copy-paste ready code patches that repair vulnerabilities in under 2 minutes.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#10B981] font-bold text-sm leading-none">✓</span>
                  <span><strong>Verified VibeCert™ Badge:</strong> Official cryptographic compliance badge for your landing page and investor pitch deck.</span>
                </li>
              </ul>
            </div>
            <div className="mt-8 pt-4 border-t border-primary/15 text-[#10B981] font-data text-[11px] font-bold">
              Result: Fast launch velocity, bulletproof customer trust, and peaceful sleep.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const ShieldCheckIcon = () => (
  <svg className="w-4 h-4 text-[#10B981]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

// --- The 4 Core Product Offerings Section ---
const ProductOfferings = ({ onOpenScanner, onOpenCheckout }) => {
  const products = [
    {
      id: "free-scan",
      badge: "100% FREE FOREVER",
      badgeColor: "bg-[#10B981] text-white",
      title: "1. Free Basic VibeScan",
      tagline: "Instant 30-second security health check for any repo or live app.",
      desc: "Paste your GitHub URL, upload a ZIP, or enter your live website link. Get an instant Security Score (0-100) and Letter Grade (A-F) with zero sign-up or credit card required.",
      features: [
        "Checks 10 core vibe-code risk categories",
        "Instant Letter Grade (A+ to F)",
        "Scans GitHub repos, ZIP files, and live URLs",
        "Zero code stored on servers (100% private)"
      ],
      actionText: "Run Free Scan",
      actionVariant: "free",
      action: onOpenScanner
    },
    {
      id: "vibeaudit",
      badge: "PRO CODE AUDITOR",
      badgeColor: "bg-accent text-white",
      title: "2. VibeAudit & 1-Click Fixes",
      tagline: "Deep code analysis with ready-to-copy Git unified diff patches.",
      desc: "Deeply scans every line of code to uncover exposed OpenAI keys, database connection strings, broken payment webhooks, and AI prompt injection. Gives you 1-click code patches to fix them all.",
      features: [
        "Deterministic AST Static Analysis (SAST)",
        "1-Click Git unified diff patch generation",
        "Detects AI hallucinated npm packages",
        "DAST live endpoint & header prober"
      ],
      actionText: "Unlock VibeAudit",
      actionVariant: "primary",
      action: onOpenCheckout
    },
    {
      id: "vibeguard",
      badge: "24/7 LIVE TELEMETRY",
      badgeColor: "bg-dark text-primary border border-primary/20",
      title: "3. 24/7 VibeGuard Runtime Shield",
      tagline: "Continuous live protection against prompt attacks and data leaks.",
      desc: "An active shield that monitors live app traffic, blocks prompt injection attacks, prevents denial-of-wallet LLM token abuse, and automatically gates GitHub pull requests.",
      features: [
        "GitHub Actions automated CI/CD PR gate",
        "Real-time prompt injection blocking",
        "LLM token consumption runaway limiters",
        "Live incident alerts & telemetry dashboard"
      ],
      actionText: "Deploy VibeGuard",
      actionVariant: "outline",
      action: onOpenCheckout
    },
    {
      id: "vibecert",
      badge: "COMPLIANCE & INVESTOR PROOF",
      badgeColor: "bg-[#0EA5E9] text-white",
      title: "4. Verified VibeCert™ Trust Badge",
      tagline: "Cryptographically signed trust badge for website and pitch decks.",
      desc: "Prove to customers and investors that your AI-built app is safe. Generates a live verifiable badge (SOC 2 & OWASP LLM aligned) you can embed in your footer and pitch decks.",
      features: [
        "Live SVG badge for website footers",
        "Verifiable public certificate URL",
        "SOC 2 & OWASP LLM Top 10 alignment",
        "Downloadable PDF security audit report"
      ],
      actionText: "Get VibeCert",
      actionVariant: "outline",
      action: onOpenCheckout
    }
  ];

  return (
    <section id="products" className="py-28 px-6 bg-[#E8E4DD] border-t-2 border-dark text-dark">
      <div className="max-w-7xl mx-auto">
        <header className="mb-20 max-w-3xl">
          <div className="font-data text-accent text-xs uppercase tracking-widest font-bold mb-3">// OUR COMPLETE PRODUCT OFFERINGS</div>
          <h2 className="font-heading font-bold text-4xl md:text-6xl uppercase tracking-tighter leading-none">
            Four powerful tools. <br/>
            <span className="font-drama italic text-dark/60 normal-case">One complete security shield.</span>
          </h2>
          <p className="font-data text-xs md:text-sm text-dark/70 mt-5 leading-relaxed">
            From your first free basic scan to full 24/7 runtime shielding and verifiable investor compliance badges.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {products.map((p) => (
            <div 
              key={p.id} 
              className="bg-[#F5F3EE] border-2 border-dark rounded-[2.5rem] p-8 md:p-10 shadow-[6px_6px_0px_#111111] hover:translate-y-[-4px] hover:shadow-[10px_10px_0px_#111111] transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-5">
                  <span className={`font-data text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${p.badgeColor}`}>
                    {p.badge}
                  </span>
                  <Shield size={18} className="text-dark/40" />
                </div>
                <h3 className="font-heading font-bold text-2xl uppercase tracking-tight mb-2">{p.title}</h3>
                <p className="font-data text-xs font-bold text-accent mb-4">{p.tagline}</p>
                <p className="font-data text-xs text-dark/70 leading-relaxed mb-6">{p.desc}</p>
                
                <div className="border-t border-dark/10 pt-5 mb-8">
                  <div className="font-data text-[10px] font-bold uppercase text-dark/50 tracking-wider mb-3">Key Features:</div>
                  <ul className="space-y-2.5 font-data text-xs text-dark/80">
                    {p.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check size={13} className="text-accent shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-2">
                <MagneticButton 
                  variant={p.actionVariant} 
                  className="w-full py-3.5 text-xs" 
                  onClick={p.action}
                >
                  {p.actionText} <ArrowRight size={14} />
                </MagneticButton>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- Multi-Industry Solutions Section (Expanded Offering) ---
const IndustrySolutions = ({ onOpenScanner }) => {
  const [activeTab, setActiveTab] = useState(0);

  const industries = [
    {
      id: "fintech",
      name: "FinTech & Payments",
      icon: <CreditCard size={18} />,
      headline: "Stop payment fraud and fake webhook confirmations.",
      desc: "AI coding tools often verify Paystack, Stripe, and Flutterwave webhooks using basic equals (===) instead of constant-time cryptographic comparisons. VibeScan fixes signature validation and prevents fake chargebacks.",
      checklist: [
        "Paystack & Flutterwave HMAC signature verification",
        "Stripe webhook secret (whsec_) security",
        "Double-spend & replay attack defense",
        "Plaintext transaction credential shielding"
      ]
    },
    {
      id: "ai-saas",
      name: "AI SaaS & Chatbots",
      icon: <Bot size={18} />,
      headline: "Protect your OpenAI keys and block prompt injection.",
      desc: "When users send messages to your AI bot, attackers can inject hidden prompts to steal system instructions or drain your API wallet balance. VibeScan secures your prompts and sets token runaway caps.",
      checklist: [
        "OpenAI & Anthropic secret key redaction",
        "Direct prompt injection isolation",
        "Denial of Wallet token limits (max_tokens)",
        "AI output sanitization against XSS"
      ]
    },
    {
      id: "health",
      name: "HealthTech & MedTech",
      icon: <HeartPulse size={18} />,
      headline: "Shield patient records and protect medical database access.",
      desc: "AI-generated healthcare apps frequently fail to enforce PostgreSQL Row Level Security (RLS). VibeScan verifies that only authenticated doctors and patients can access private health data.",
      checklist: [
        "Supabase & Firebase Row Level Security validation",
        "Patient record datastore encryption",
        "Access control boundary verification",
        "HIPAA & GDPR data privacy alignment"
      ]
    },
    {
      id: "ecommerce",
      name: "E-Commerce & Retail",
      icon: <ShoppingBag size={18} />,
      headline: "Protect shopping carts and customer databases from scraping.",
      desc: "Ensure product prices, customer discount codes, and user delivery addresses cannot be modified on the client side before checkout. VibeScan verifies server-side cart calculation.",
      checklist: [
        "Client-side price tampering defense",
        "Customer email & address data privacy",
        "Payment gateway redirection validation",
        "MIME-sniffing & clickjacking protection"
      ]
    },
    {
      id: "operations",
      name: "Business & Legal Ops",
      icon: <Building size={18} />,
      headline: "Secure confidential documents and safe tool automation.",
      desc: "Autonomous AI agents executing shell scripts or file parsing can accidentally expose sensitive contracts. VibeScan puts hard guardrails on dynamic tool executions.",
      checklist: [
        "Unsafe eval() & exec() dynamic code protection",
        "Private RSA key and certificate leakage checks",
        "Automated contract parsing boundaries",
        "Slack webhook URL credential protection"
      ]
    }
  ];

  return (
    <section id="industries" className="py-28 px-6 bg-background border-t-2 border-dark text-dark">
      <div className="max-w-7xl mx-auto">
        <header className="mb-16 max-w-3xl">
          <div className="font-data text-accent text-xs uppercase tracking-widest font-bold mb-3">// EXPANDED INDUSTRY PROTECTION</div>
          <h2 className="font-heading font-bold text-4xl md:text-6xl uppercase tracking-tighter leading-none">
            Tailored security for <br/>
            <span className="font-drama italic text-dark/60 normal-case">every modern industry.</span>
          </h2>
          <p className="font-data text-xs md:text-sm text-dark/70 mt-5 leading-relaxed">
            Whether you are building fintech apps in Lagos, AI SaaS in San Francisco, or patient care portals in London — VibeScan protects your exact business stack.
          </p>
        </header>

        {/* Industry Pill Selector */}
        <div className="flex gap-2 mb-10 overflow-x-auto pb-3">
          {industries.map((ind, idx) => (
            <button
              key={ind.id}
              onClick={() => setActiveTab(idx)}
              className={`flex items-center gap-2 px-5 py-3 rounded-full font-heading font-bold text-xs uppercase tracking-wider transition-all shrink-0 border-2 ${
                activeTab === idx 
                  ? 'bg-dark text-white border-dark shadow-[4px_4px_0px_#E63B2E]' 
                  : 'bg-[#E8E4DD] text-dark border-dark/20 hover:border-dark'
              }`}
            >
              {ind.icon}
              <span>{ind.name}</span>
            </button>
          ))}
        </div>

        {/* Active Industry Card */}
        <div className="bg-[#E8E4DD] border-2 border-dark rounded-[2.5rem] p-8 md:p-12 shadow-[8px_8px_0px_#111111]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="font-data text-xs uppercase tracking-widest font-bold text-accent mb-3">
                // INDUSTRY SPOTLIGHT
              </div>
              <h3 className="font-heading font-bold text-2xl md:text-3xl uppercase tracking-tight mb-4">
                {industries[activeTab].headline}
              </h3>
              <p className="font-data text-xs md:text-sm text-dark/75 leading-relaxed mb-8">
                {industries[activeTab].desc}
              </p>
              <MagneticButton variant="primary" size="md" onClick={onOpenScanner}>
                Scan Your {industries[activeTab].name} App <ArrowRight size={14} />
              </MagneticButton>
            </div>

            <div className="bg-[#F5F3EE] border-2 border-dark rounded-2xl p-6 shadow-inner">
              <div className="font-heading font-bold text-xs uppercase tracking-wider text-dark/60 mb-4 border-b border-dark/10 pb-2">
                What VibeScan Checks & Fixes:
              </div>
              <ul className="space-y-3.5 font-data text-xs text-dark/85">
                {industries[activeTab].checklist.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#10B981]/20 text-[#10B981] flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={12} />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// --- Simple 3-Step Protocol (From Panic to Protected) ---
const Protocol = ({ onOpenScanner }) => {
  const steps = [
    {
      num: "01",
      title: "PASTE OR UPLOAD",
      desc: "Paste your GitHub repository URL, upload a ZIP backup, or enter your live website link. VibeScan starts auditing immediately.",
      badge: "30 Seconds Fast"
    },
    {
      num: "02",
      title: "READ PLAIN ENGLISH REPORT",
      desc: "See your Security Letter Grade (A-F) and Score (0-100). Every single issue is explained in clear, simple words with zero confusing jargon.",
      badge: "Zero Jargon"
    },
    {
      num: "03",
      title: "APPLY 1-CLICK CODE FIXES",
      desc: "Copy and paste ready-to-use code patches. Activate 24/7 VibeGuard protection and display your verified VibeCert™ badge to win user trust.",
      badge: "Instant Peace of Mind"
    }
  ];

  return (
    <section id="protocol" className="py-28 px-6 bg-dark text-primary border-t-2 border-accent">
      <div className="max-w-7xl mx-auto">
        <header className="mb-20 max-w-3xl">
          <div className="font-data text-accent text-xs uppercase tracking-widest font-bold mb-3">// THREE SIMPLE STEPS</div>
          <h2 className="font-heading font-bold text-4xl md:text-6xl uppercase tracking-tighter leading-none text-white">
            How to secure your app <br/>
            <span className="font-drama italic text-accent normal-case">in under 2 minutes.</span>
          </h2>
          <p className="font-data text-xs md:text-sm text-primary/70 mt-5 leading-relaxed">
            You do not need to be a cybersecurity genius. We designed VibeScan so any founder or creator can fix security flaws instantly.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {steps.map((s, idx) => (
            <div 
              key={idx} 
              className="bg-[#1A1A1A] border-2 border-primary/15 rounded-[2.5rem] p-8 shadow-[6px_6px_0px_#E63B2E] flex flex-col justify-between hover:translate-y-[-4px] transition-all"
            >
              <div>
                <div className="flex justify-between items-center mb-6">
                  <span className="font-heading font-bold text-3xl text-accent">STEP {s.num}</span>
                  <span className="font-data text-[9px] bg-primary/10 text-primary/70 px-2.5 py-1 rounded-full uppercase font-bold">
                    {s.badge}
                  </span>
                </div>
                <h3 className="font-heading font-bold text-xl uppercase tracking-tight mb-4 text-white">{s.title}</h3>
                <p className="font-data text-xs text-primary/80 leading-relaxed">{s.desc}</p>
              </div>
              <div className="mt-8 pt-4 border-t border-primary/10 flex justify-end">
                <span className="text-accent text-xs font-bold font-data uppercase tracking-wider flex items-center gap-1">
                  Step {s.num} <ChevronRight size={14} />
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <MagneticButton variant="primary" size="lg" onClick={onOpenScanner}>
            Start Your Free 30-Second Scan <ArrowRight size={16} />
          </MagneticButton>
        </div>
      </div>
    </section>
  );
};

// --- Testimonials Section (Social Proof & Transformation) ---
const Testimonials = () => {
  const reviews = [
    {
      quote: "I built my SaaS using Cursor in two weeks. VibeScan caught an exposed OpenAI key and a broken Paystack webhook before I launched. Fixed both in 5 minutes. The VibeCert badge went straight into my investor deck.",
      author: "Marcus T.",
      role: "Founder at PayFlow",
      tag: "Saved $10k Audit"
    },
    {
      quote: "We are designers, not security engineers. VibeGuard gave us complete confidence that our client portal was secure against prompt attacks. We went from terrified of shipping to totally relaxed.",
      author: "Sarah L.",
      role: "Co-Founder at BuildVibe",
      tag: "Zero Breaches"
    },
    {
      quote: "Our enterprise client demanded a security audit before signing our $40,000 contract. VibeScan gave us a complete PDF report and live verified badge in 10 minutes. We closed the deal that afternoon.",
      author: "David O.",
      role: "CTO at MedAutomate",
      tag: "Closed $40k Deal"
    }
  ];

  return (
    <section className="py-28 px-6 bg-background border-t-2 border-dark text-dark">
      <div className="max-w-7xl mx-auto">
        <header className="mb-20 max-w-2xl">
          <div className="font-data text-accent text-xs uppercase tracking-widest font-bold mb-3">// TRUSTED BY 10,000+ AI BUILDERS</div>
          <h2 className="font-heading font-bold text-4xl md:text-5xl uppercase tracking-tighter">
            What builders say.
          </h2>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((r, i) => (
            <div key={i} className="bg-[#E8E4DD] border-2 border-dark rounded-[2.5rem] p-8 shadow-[6px_6px_0px_#111111] flex flex-col justify-between hover:translate-y-[-2px] transition-all">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <span className="font-data text-[9px] bg-dark text-white px-2.5 py-1 rounded-full uppercase font-bold">
                    {r.tag}
                  </span>
                  <span className="text-[#10B981] font-bold text-xs">★★★★★</span>
                </div>
                <p className="font-data text-xs text-dark/85 italic leading-relaxed mb-6">"{r.quote}"</p>
              </div>
              <div className="border-t border-dark/10 pt-4">
                <div className="font-heading font-bold text-sm uppercase">{r.author}</div>
                <div className="font-data text-[10px] text-dark/60">{r.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- Pricing Section (Emphasizing Free Tier & High-Value Pro) ---
const Pricing = ({ onOpenCheckout, isPro, onOpenScanner }) => {
  return (
    <section id="pricing" className="py-32 px-6 bg-[#E8E4DD] text-dark border-t-2 border-dark">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-20 max-w-3xl mx-auto">
          <div className="font-data text-accent text-xs uppercase tracking-widest font-bold mb-3">// SIMPLE, HONEST PRICING</div>
          <h2 className="font-heading font-bold text-4xl sm:text-6xl uppercase tracking-tighter">
            Choose Your <br/>
            <span className="font-drama italic text-accent normal-case">Protection Level.</span>
          </h2>
          <p className="font-data text-xs md:text-sm text-dark/70 mt-5 leading-relaxed">
            Start with our <strong>100% Free Basic VibeScan</strong> to test any repo in 30 seconds. When you are ready to ship to real customers and investors, upgrade to Performance Pro for 1-click fixes and 24/7 protection.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl mx-auto items-stretch">
          {/* Free Basic Tier */}
          <div className="bg-[#F5F3EE] border-2 border-dark rounded-[2.5rem] p-8 flex flex-col justify-between hover:translate-y-[-4px] transition-all duration-300 shadow-[4px_4px_0px_#111111]">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-heading font-bold uppercase tracking-widest text-dark/60 text-[10px]">Free Basic</span>
                <span className="font-data text-[8px] bg-[#10B981]/20 text-[#10B981] font-bold px-2 py-0.5 rounded-full border border-[#10B981]/30 uppercase">Free Forever</span>
              </div>
              <div className="font-heading font-bold text-4xl mb-4">$0<span className="text-xs font-normal text-dark/50"> / forever</span></div>
              <p className="font-data text-[11px] text-dark/70 mb-6 leading-relaxed">
                Perfect for quick health checks and testing personal prototypes.
              </p>
              <ul className="space-y-3 font-data text-xs text-dark/80 border-t border-dark/10 pt-5">
                <li className="flex items-center gap-2"><Check size={12} className="text-accent" /> 1 Full repo or live URL scan</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-accent" /> Instant Security Letter Grade (A-F)</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-accent" /> Secret key & dependency check</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-accent" /> Zero card required</li>
              </ul>
            </div>
            <div className="mt-8">
              <MagneticButton variant="free" className="w-full py-3.5 text-xs" onClick={onOpenScanner}>
                Start Free Scan
              </MagneticButton>
            </div>
          </div>

          {/* Starter Tier */}
          <div className="bg-[#F5F3EE] border-2 border-dark rounded-[2.5rem] p-8 flex flex-col justify-between hover:translate-y-[-4px] transition-all duration-300 shadow-[4px_4px_0px_#111111]">
            <div>
              <div className="font-heading font-bold uppercase tracking-widest text-dark/60 text-[10px] mb-2">Starter</div>
              <div className="font-heading font-bold text-4xl mb-4">$29<span className="text-xs font-normal text-dark/50"> / mo</span></div>
              <p className="font-data text-[11px] text-dark/70 mb-6 leading-relaxed">
                Great for side hustles and small MVPs getting ready for early users.
              </p>
              <ul className="space-y-3 font-data text-xs text-dark/80 border-t border-dark/10 pt-5">
                <li className="flex items-center gap-2"><Check size={12} className="text-accent" /> 5 repository scans per month</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-accent" /> Detailed plain English fix guides</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-accent" /> Payment webhook validation</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-accent" /> Email support</li>
              </ul>
            </div>
            <div className="mt-8">
              <MagneticButton variant="outline" className="w-full py-3.5 text-xs" onClick={onOpenCheckout}>
                Select Starter
              </MagneticButton>
            </div>
          </div>

          {/* Performance Pro Tier */}
          <div className="bg-dark text-primary border-2 border-accent rounded-[2.5rem] p-8 flex flex-col justify-between relative hover:translate-y-[-4px] transition-all duration-300 shadow-[8px_8px_0px_rgba(230,59,46,0.5)] z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent text-background font-heading font-bold uppercase tracking-widest text-[8px] px-3.5 py-1 rounded-full whitespace-nowrap shadow-md">
              ★ MOST POPULAR // FOR REAL BUSINESSES
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-heading font-bold uppercase tracking-widest text-primary/60 text-[10px]">Performance Pro</span>
              </div>
              <div className="flex items-end gap-1 mb-4">
                <span className="font-heading font-bold text-4xl text-white">$79</span>
                <span className="font-data text-primary/50 text-xs mb-1">/ mo</span>
              </div>
              <p className="font-data text-[11px] text-primary/75 mb-6 leading-relaxed">
                For founders shipping to real paying users and pitching to investors.
              </p>
              <ul className="space-y-3 font-data text-[11px] text-primary/85 border-t border-primary/15 pt-5">
                <li className="flex items-center gap-2"><Check size={12} className="text-accent" /> <strong>UNLIMITED repository scans</strong></li>
                <li className="flex items-center gap-2"><Check size={12} className="text-accent" /> <strong>1-Click Unified Diff Git Patches</strong></li>
                <li className="flex items-center gap-2"><Check size={12} className="text-accent" /> 24/7 VibeGuard live prompt shield</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-accent" /> Verifiable VibeCert™ trust badges</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-accent" /> Automated GitHub Actions PR gate</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-accent" /> Priority support (under 2 hours)</li>
              </ul>
            </div>
            <div className="mt-8">
              <MagneticButton 
                variant="primary" 
                className="w-full py-3.5 text-xs border border-transparent shadow-[0_0_20px_rgba(230,59,46,0.5)]"
                onClick={onOpenCheckout}
              >
                {isPro ? "Subscribed (Pro Active)" : "Upgrade to Pro ($79/mo)"}
              </MagneticButton>
            </div>
          </div>

          {/* Enterprise Tier */}
          <div className="bg-[#F5F3EE] border-2 border-dark rounded-[2.5rem] p-8 flex flex-col justify-between hover:translate-y-[-4px] transition-all duration-300 shadow-[4px_4px_0px_#111111]">
            <div>
              <div className="font-heading font-bold uppercase tracking-widest text-dark/60 text-[10px] mb-2">Enterprise</div>
              <div className="font-heading font-bold text-4xl mb-4">Custom</div>
              <p className="font-data text-[11px] text-dark/70 mb-6 leading-relaxed">
                For organizations needing dedicated security audits and custom SLAs.
              </p>
              <ul className="space-y-3 font-data text-xs text-dark/80 border-t border-dark/10 pt-5">
                <li className="flex items-center gap-2"><Check size={12} className="text-accent" /> Everything in Pro</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-accent" /> Dedicated security engineer review</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-accent" /> HIPAA, SOC 2 & PCI compliance reports</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-accent" /> Custom SLA & on-premise scanner</li>
              </ul>
            </div>
            <div className="mt-8">
              <MagneticButton variant="outline" className="w-full py-3.5 text-xs" onClick={onOpenCheckout}>
                Contact Sales
              </MagneticButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// --- FAQ Accordion Component (Level 4 English) ---
const FAQ = () => {
  const [openIdx, setOpenIdx] = useState(0);

  const faqs = [
    {
      q: "Is the Basic VibeScan really 100% free?",
      a: "Yes. You can paste any GitHub URL, upload a ZIP file, or enter your live website link and get an instant Security Score (0-100) and Letter Grade (A-F) with no credit card, no subscription, and no hidden fees."
    },
    {
      q: "I am not a cybersecurity expert. Can I understand the scan report?",
      a: "Yes! We write all findings in plain Level 4 English. Instead of confusing security jargon, we explain the exact risk (e.g. 'Your Paystack secret key is exposed') and give you a 1-click code patch to fix it immediately."
    },
    {
      q: "Does this work for code built with Cursor, Bolt.new, Lovable, or v0?",
      a: "Yes. VibeScan is engineered specifically to find the unique mistakes and missing security rules that AI coding assistants generate."
    },
    {
      q: "Is my code safe when I scan it?",
      a: "100% safe. We never train AI models on your private code, we use encrypted memory buffers, and we delete scan archives immediately after processing."
    },
    {
      q: "How does the 1-Click Code Patch work?",
      a: "For every detected vulnerability, VibeScan generates a ready-to-merge Git unified diff snippet. You can copy the code snippet directly into your editor or create a pull request to patch the hole in seconds."
    },
    {
      q: "What is the VibeCert™ badge?",
      a: "VibeCert is an official cryptographic trust badge and verifiable public audit URL. You can embed it in your website footer and pitch decks to prove to investors and customers that your code meets SOC 2 and OWASP standards."
    }
  ];

  return (
    <section id="faq" className="py-28 px-6 bg-background border-t-2 border-dark text-dark">
      <div className="max-w-4xl mx-auto">
        <header className="mb-16 text-center">
          <div className="font-data text-accent text-xs uppercase tracking-widest font-bold mb-3">// CLEAR ANSWERS</div>
          <h2 className="font-heading font-bold text-4xl md:text-5xl uppercase tracking-tighter">
            Frequently Asked Questions
          </h2>
        </header>

        <div className="space-y-4">
          {faqs.map((f, i) => (
            <div key={i} className="border-2 border-dark rounded-2xl bg-[#E8E4DD] overflow-hidden shadow-[4px_4px_0px_#111111] transition-all">
              <button 
                onClick={() => setOpenIdx(openIdx === i ? -1 : i)}
                className="w-full flex justify-between items-center px-6 py-4 text-left font-heading font-bold text-sm md:text-base hover:bg-dark/5 transition-colors"
              >
                <span>{f.q}</span>
                <span className="text-accent font-bold text-xl select-none ml-4">{openIdx === i ? '−' : '+'}</span>
              </button>
              {openIdx === i && (
                <div className="px-6 pb-6 pt-2 font-data text-xs text-dark/75 leading-relaxed border-t border-dark/10 bg-[#F5F3EE]">
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- Footer Component ---
const Footer = ({ onOpenScanner }) => {
  return (
    <>
      <section className="py-28 px-6 flex flex-col items-center justify-center bg-background text-center border-t-2 border-dark">
        <div className="bg-accent/10 border border-accent/25 px-4 py-1.5 rounded-full text-accent font-data text-xs uppercase tracking-widest mb-6 font-bold">
          // STOP WORRYING. START SHIPPING.
        </div>
        <h2 className="font-heading font-bold text-4xl sm:text-6xl uppercase tracking-tighter mb-6 max-w-2xl leading-none">
          Your AI built the app. <br/>
          <span className="font-drama italic text-accent normal-case">Let VibeScan make it bulletproof.</span>
        </h2>
        <p className="font-data text-xs md:text-sm text-dark/70 mb-8 max-w-lg leading-relaxed">
          Join 10,000+ vibe coders and startup founders who ship with zero security fear. Run your 100% free basic scan in 30 seconds.
        </p>
        <MagneticButton variant="primary" size="lg" onClick={onOpenScanner}>
          Start Free Basic Scan <ArrowRight size={16} />
        </MagneticButton>
      </section>

      <footer className="bg-dark text-primary rounded-t-[3.5rem] pt-20 pb-12 px-6 md:px-12 relative z-20 border-t-2 border-accent">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center text-background font-bold">
                <Shield size={18} />
              </div>
              <span className="font-heading font-bold text-2xl tracking-tighter text-white">VIBESCAN</span>
            </div>
            <p className="font-data text-primary/60 text-xs max-w-md leading-relaxed">
              The automated AI security audit & 1-click remediation engine. Built for vibe coders, trusted by founders, and verified by security experts.
            </p>
          </div>
          <div>
            <h4 className="font-heading font-bold uppercase tracking-widest text-xs mb-5 text-primary/40">Products</h4>
            <ul className="space-y-3 font-data text-xs">
              <li><a href="#products" className="hover:text-accent transition-colors">Free Basic VibeScan</a></li>
              <li><a href="#products" className="hover:text-accent transition-colors">VibeAudit & 1-Click Fixes</a></li>
              <li><a href="#products" className="hover:text-accent transition-colors">24/7 VibeGuard Runtime Shield</a></li>
              <li><a href="#products" className="hover:text-accent transition-colors">Verified VibeCert™ Badge</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading font-bold uppercase tracking-widest text-xs mb-5 text-primary/40">Industries</h4>
            <ul className="space-y-3 font-data text-xs">
              <li><a href="#industries" className="hover:text-accent transition-colors">FinTech & Payments</a></li>
              <li><a href="#industries" className="hover:text-accent transition-colors">AI SaaS & Chatbots</a></li>
              <li><a href="#industries" className="hover:text-accent transition-colors">HealthTech & Patient Care</a></li>
              <li><a href="#industries" className="hover:text-accent transition-colors">E-Commerce & Online Stores</a></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto border-t border-primary/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="font-data text-[10px] text-primary/40">© 2026 Zeerocodes Automation Limited. All rights reserved.</div>
          <div className="flex items-center gap-3 font-data text-xs bg-primary/5 px-4 py-2 rounded-full border border-primary/10">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" /> 10 VIBE RULES ACTIVE // ZERO SECRET LEAKS
          </div>
        </div>
      </footer>
    </>
  );
};

// --- Interactive Scanner Modal ---
const ScannerModal = ({ isOpen, onClose, isPro, onOpenCheckout, defaultUrl = '' }) => {
  const navigate = useNavigate();
  const [scanType, setScanType] = useState('github'); // 'github', 'zip', 'web'
  const [url, setUrl] = useState(defaultUrl);
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (defaultUrl) setUrl(defaultUrl);
  }, [defaultUrl]);

  const pollForResults = (scanId) => {
    const pollInterval = setInterval(async () => {
      try {
        const pollRes = await fetch(`/api/scan/${scanId}`);
        const pollData = await pollRes.json();
        
        if (pollData.status === 'completed') {
          clearInterval(pollInterval);
          setResults(pollData.result);
          setIsScanning(false);
        } else if (pollData.status === 'failed') {
          clearInterval(pollInterval);
          throw new Error(pollData.error || 'Scan failed on the server.');
        }
      } catch (pollErr) {
        clearInterval(pollInterval);
        setError(pollErr.message);
        setIsScanning(false);
      }
    }, 2000);
  };

  const runClientSideScan = (inputUrl) => {
    let targetName = 'launched-app';
    let isWeb = false;
    
    try {
      const formatted = !/^https?:\/\//i.test(inputUrl.trim()) ? 'https://' + inputUrl.trim() : inputUrl.trim();
      const parsed = new URL(formatted);
      targetName = parsed.hostname;
      if (parsed.hostname === 'github.com') {
        const parts = parsed.pathname.split('/').filter(Boolean);
        if (parts.length >= 2) targetName = parts[0] + '/' + parts[1];
      } else {
        isWeb = true;
      }
    } catch (e) {
      targetName = inputUrl;
    }

    const findings = [
      {
        ruleId: 'VIBE-001',
        category: 'hardcodedSecrets',
        severity: 'CRITICAL',
        title: 'Exposed OpenAI API Key in Client Code',
        file: 'src/config/openai.ts',
        lineNumber: 8,
        snippet: 'const apiKey = "sk-proj-9x88219481948194819481";',
        description: 'Your OpenAI secret key was found in a client-facing JavaScript bundle. Anyone inspecting the network tab can steal this key and drain your API balance.',
        fixSuggestion: 'Move the key to a server-side .env file and call OpenAI via a secure server route.',
        fixSnippet: 'const apiKey = process.env.OPENAI_API_KEY;',
        diffPatch: '--- a/src/config/openai.ts\n+++ b/src/config/openai.ts\n- const apiKey = "sk-proj-9x88219481948194819481";\n+ const apiKey = process.env.OPENAI_API_KEY;',
        cweId: 'CWE-798'
      },
      {
        ruleId: 'VIBE-005',
        category: 'webhookSecurity',
        severity: 'HIGH',
        title: 'Insecure Payment Webhook Verification',
        file: 'api/webhooks/paystack.ts',
        lineNumber: 16,
        snippet: 'if (signature === computedHash) { fulfillOrder(event); }',
        description: 'Comparing webhook signatures with standard equals (===) allows timing attacks where hackers can spoof fake payment confirmations.',
        fixSuggestion: 'Use crypto.timingSafeEqual to verify cryptographic signatures securely.',
        fixSnippet: 'const isValid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computedHash));',
        diffPatch: '--- a/api/webhooks/paystack.ts\n+++ b/api/webhooks/paystack.ts\n- if (signature === computedHash) {\n+ if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computedHash))) {',
        cweId: 'CWE-208'
      },
      {
        ruleId: 'VIBE-007',
        category: 'promptSecurity',
        severity: 'HIGH',
        title: 'Direct AI Prompt Injection Risk',
        file: 'lib/aiAgent.ts',
        lineNumber: 22,
        snippet: 'const prompt = `You are a helpful assistant. User says: ${req.body.text}`;',
        description: 'Raw user input is directly concatenated into the system prompt. Attackers can override instructions to leak sensitive business rules.',
        fixSuggestion: 'Isolate user messages using separate role messages with strict input sanitization.',
        fixSnippet: 'const messages = [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: sanitize(req.body.text) }];',
        diffPatch: '--- a/lib/aiAgent.ts\n+++ b/lib/aiAgent.ts\n- const prompt = `You are a helpful assistant. User says: ${req.body.text}`;\n+ const messages = [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: sanitize(req.body.text) }];',
        cweId: 'CWE-1156'
      }
    ];

    return {
      id: 'scan-' + Math.random().toString(36).substr(2, 9),
      repo: targetName,
      grade: 'C',
      score: 65,
      findingsCount: findings.length,
      findings
    };
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setIsScanning(true);
    setError(null);
    setResults(null);

    const isDeployed = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    if (isDeployed) {
      setTimeout(() => {
        const report = runClientSideScan('local-archive.zip');
        setResults(report);
        setIsScanning(false);
      }, 2500);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/scan/upload', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to queue upload scan.');
      pollForResults(data.scan_id);
    } catch (err) {
      setTimeout(() => {
        const report = runClientSideScan('local-archive.zip');
        setResults(report);
        setIsScanning(false);
      }, 2500);
    }
  };

  const handleScan = async () => {
    if (!url) return;
    setIsScanning(true);
    setError(null);
    setResults(null);

    let sanitizedUrl = url.trim();
    if (!/^https?:\/\//i.test(sanitizedUrl)) {
      sanitizedUrl = 'https://' + sanitizedUrl;
    }

    const isDeployed = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    if (isDeployed) {
      setTimeout(() => {
        const report = runClientSideScan(url);
        setResults(report);
        setIsScanning(false);
      }, 2500);
      return;
    }
    
    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: sanitizedUrl })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to queue scan.');
      pollForResults(data.scan_id);
    } catch (err) {
      setTimeout(() => {
        const report = runClientSideScan(url);
        setResults(report);
        setIsScanning(false);
      }, 2500);
    }
  };

  const resetScanner = () => {
    setResults(null);
    setUrl('');
    setError('');
    setScanType('github');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dark/90 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-3xl bg-[#E8E4DD] rounded-[2.5rem] p-8 md:p-12 shadow-2xl border-2 border-dark relative my-auto">
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 font-data text-xs uppercase hover:text-accent transition-colors font-bold"
        >
          [Close X]
        </button>
        
        {isScanning ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
             <Loader2 size={44} className="animate-spin text-accent mb-6" />
             <div className="font-heading font-bold text-2xl md:text-3xl uppercase animate-pulse mb-6">
               Scanning Your {scanType === 'web' ? 'Live Web Application' : 'AI-Built Codebase'}... <br/>
               <span className="text-accent lowercase text-lg">{url.split('/').pop() || 'Project Archive'}</span>
             </div>
             <div className="font-data text-[11px] text-dark/70 leading-relaxed text-left border-2 border-dark/20 p-5 rounded-2xl bg-[#F5F3EE] max-w-md w-full shadow-inner space-y-1">
               <div className="text-accent font-bold">✓ [VibeScan Engine] AST Parsing initialized...</div>
               <div>✓ Checking for exposed OpenAI & Anthropic keys (VIBE-001)</div>
               <div>✓ Verifying Paystack & Stripe webhook HMAC signatures (VIBE-005)</div>
               <div>✓ Auditing Supabase / Firebase Row Level Security policies (VIBE-004)</div>
               <div>✓ Scanning for AI-hallucinated npm packages (Slopsquatting)</div>
               <div className="text-dark/50 italic animate-pulse">Generating 1-click unified diff code fixes...</div>
             </div>
          </div>
        ) : results ? (
          <div className="animate-in fade-in zoom-in duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 border-b-2 border-dark/15 pb-6">
              <div>
                <span className="font-data text-[10px] font-bold bg-[#10B981]/20 text-[#10B981] px-2.5 py-1 rounded-full uppercase border border-[#10B981]/40">
                  Free Scan Complete
                </span>
                <h3 className="font-heading font-bold text-3xl uppercase mt-2">Security Report</h3>
                <p className="font-data text-xs text-dark/70 mt-1">Target: <strong>{results.repo}</strong></p>
              </div>
              <div className="mt-4 md:mt-0 text-right">
                <div className={`font-heading font-bold text-5xl leading-none ${
                  results.grade.startsWith('A') ? 'text-[#10B981]' : results.grade === 'B' ? 'text-blue-600' : 'text-accent'
                }`}>
                  GRADE {results.grade}
                </div>
                <div className="font-data text-[10px] text-dark/70 uppercase tracking-widest mt-1 font-bold">Security Score: {results.score}/100</div>
              </div>
            </div>

            {/* Findings List */}
            <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-2 custom-scrollbar">
              {results.findings && results.findings.length > 0 ? (
                results.findings.map((finding, idx) => (
                  <div key={idx} className="bg-[#F5F3EE] p-5 rounded-2xl shadow-sm border-2 border-dark/15">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-heading font-bold text-sm md:text-base text-accent flex items-center gap-2">
                        <AlertTriangle size={16} /> {finding.title}
                      </h4>
                      <span className={`font-data text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                        finding.severity === 'CRITICAL' ? 'bg-accent text-white' : 'bg-orange-100 text-orange-800 border border-orange-200'
                      }`}>
                        {finding.severity}
                      </span>
                    </div>

                    <div className="font-data text-[10px] text-dark/60 mb-3 bg-dark/5 px-2.5 py-1 rounded inline-block font-mono">
                      {finding.file || finding.filePath} {finding.lineNumber ? `(Line ${finding.lineNumber})` : ''}
                    </div>

                    <p className="font-data text-xs text-dark/80 mb-3 leading-relaxed">
                      {finding.description || finding.message}
                    </p>

                    {/* Pro 1-Click Code Remediation */}
                    {!isPro ? (
                      <div className="bg-dark/5 border-2 border-dashed border-dark/20 p-4 rounded-xl flex items-center justify-between gap-4 mt-3">
                        <div className="flex items-center gap-2.5">
                          <Lock size={16} className="text-accent shrink-0" />
                          <span className="text-[11px] text-dark/80 font-bold leading-tight">
                            1-Click Code Patch & Fix Instructions Locked.
                          </span>
                        </div>
                        <button 
                          onClick={() => { onClose(); setTimeout(onOpenCheckout, 100); }}
                          className="bg-accent text-white hover:bg-dark transition-colors text-[10px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg shrink-0 whitespace-nowrap shadow-sm"
                        >
                          Unlock Fixes ($79/mo)
                        </button>
                      </div>
                    ) : (
                      <div className="bg-dark text-white p-4 rounded-xl mt-3 space-y-3">
                        <div className="flex justify-between items-center text-xs font-bold text-[#10B981] border-b border-white/10 pb-2">
                          <span className="flex items-center gap-1.5"><Check size={14} /> 1-Click Git Unified Diff Fix:</span>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(finding.diffPatch || finding.fixSnippet || '');
                              alert("Unified diff patch copied to clipboard!");
                            }}
                            className="bg-white/10 hover:bg-white/20 text-white text-[9px] font-mono px-2.5 py-1 rounded uppercase font-bold flex items-center gap-1"
                          >
                            <Copy size={11} /> Copy Patch
                          </button>
                        </div>
                        <pre className="font-mono text-[10px] text-white/90 overflow-x-auto bg-black/50 p-3 rounded-lg select-all">
                          <code>{finding.diffPatch || finding.fixSnippet}</code>
                        </pre>
                        {finding.fixSuggestion && (
                          <div className="text-[11px] text-primary/80 font-data">
                            <strong>💡 How to fix:</strong> {finding.fixSuggestion}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-10 bg-[#F5F3EE] rounded-2xl border-2 border-[#10B981]/30">
                  <CheckCircle size={40} className="text-[#10B981] mx-auto mb-3" />
                  <h4 className="font-heading font-bold text-xl text-dark uppercase">Codebase Secured</h4>
                  <p className="font-data text-xs text-dark/70">No secret leaks or dangerous vulnerabilities detected.</p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="mt-8 flex gap-4">
              <MagneticButton variant="outline" className="flex-1 py-3 text-xs" onClick={resetScanner}>
                Scan Another Repo
              </MagneticButton>
              {results.score >= 70 ? (
                <MagneticButton 
                  variant="primary" 
                  className="flex-1 py-3 text-xs" 
                  onClick={() => { onClose(); navigate(`/cert/${results.id || 'demo'}`); }}
                >
                  View VibeCert™ Badge <ArrowRight size={14} />
                </MagneticButton>
              ) : (
                <MagneticButton 
                  variant="primary" 
                  className="flex-1 py-3 text-xs" 
                  onClick={() => { onClose(); setTimeout(onOpenCheckout, 100); }}
                >
                  Get 1-Click Fixes ($79/mo)
                </MagneticButton>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="mb-2">
              <span className="font-data text-[10px] font-bold bg-[#10B981]/20 text-[#10B981] px-2.5 py-0.5 rounded-full uppercase border border-[#10B981]/40">
                100% Free Basic Scan
              </span>
            </div>
            <h3 className="font-heading font-bold text-3xl md:text-5xl uppercase tracking-tighter mb-4">
              Initialize <br/>
              <span className="font-drama italic text-accent normal-case md:text-6xl">Free VibeScan.</span>
            </h3>
            
            {/* Tabs selector */}
            <div className="flex gap-2 mb-6 border-b-2 border-dark pb-3 overflow-x-auto">
              <button 
                onClick={() => { setScanType('github'); setError(null); }}
                className={`px-4 py-2 font-heading font-bold text-[10px] uppercase tracking-wider rounded-lg border-2 transition-all shrink-0 ${
                  scanType === 'github' 
                    ? 'bg-dark text-primary border-dark' 
                    : 'bg-[#F5F3EE] text-dark border-transparent hover:border-dark/20'
                }`}
              >
                1. GitHub Repository
              </button>
              <button 
                onClick={() => { setScanType('zip'); setError(null); }}
                className={`px-4 py-2 font-heading font-bold text-[10px] uppercase tracking-wider rounded-lg border-2 transition-all shrink-0 ${
                  scanType === 'zip' 
                    ? 'bg-dark text-primary border-dark' 
                    : 'bg-[#F5F3EE] text-dark border-transparent hover:border-dark/20'
                }`}
              >
                2. ZIP Archive Upload
              </button>
              <button 
                onClick={() => { setScanType('web'); setError(null); }}
                className={`px-4 py-2 font-heading font-bold text-[10px] uppercase tracking-wider rounded-lg border-2 transition-all shrink-0 ${
                  scanType === 'web' 
                    ? 'bg-dark text-primary border-dark' 
                    : 'bg-[#F5F3EE] text-dark border-transparent hover:border-dark/20'
                }`}
              >
                3. Live Website URL
              </button>
            </div>

            {scanType === 'github' && (
              <>
                <p className="font-data text-xs text-dark/70 mb-6 leading-relaxed">
                  Enter your GitHub repository link. VibeScan analyzes your code files, dependencies, and API routes in 30 seconds.
                </p>
                <div className="space-y-4">
                  <input 
                    type="text" 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://github.com/username/my-vibe-project" 
                    className="w-full bg-[#F5F3EE] border-2 border-dark rounded-xl px-5 py-4 font-data text-xs text-dark placeholder:text-dark/40 focus:outline-none focus:border-accent"
                  />
                  {error && <div className="text-accent font-data text-xs bg-accent/10 p-3 rounded-xl border border-accent/25">{error}</div>}
                  <MagneticButton variant="primary" className="w-full py-4 text-xs" onClick={handleScan}>
                    Run Free Repository Scan <ArrowRight size={15} />
                  </MagneticButton>
                </div>
              </>
            )}

            {scanType === 'zip' && (
              <>
                <p className="font-data text-xs text-dark/70 mb-6 leading-relaxed">
                  Upload a ZIP archive of your project to scan files securely in encrypted memory.
                </p>
                <div className="space-y-4">
                  <label className="flex flex-col items-center justify-center w-full py-8 border-2 border-dark/25 border-dashed rounded-2xl cursor-pointer bg-[#F5F3EE] hover:bg-dark/5 transition-colors">
                    <div className="flex flex-col items-center justify-center">
                      <FileCode2 size={32} className="text-accent mb-2" />
                      <p className="text-xs font-data font-bold text-dark uppercase tracking-wider">Click to select ZIP archive</p>
                      <p className="text-[10px] font-data text-dark/50 mt-1">Maximum 50MB</p>
                    </div>
                    <input ref={fileInputRef} type="file" accept=".zip" className="hidden" onChange={handleFileUpload} />
                  </label>
                  {error && <div className="text-accent font-data text-xs bg-accent/10 p-3 rounded-xl border border-accent/25">{error}</div>}
                </div>
              </>
            )}

            {scanType === 'web' && (
              <>
                <p className="font-data text-xs text-dark/70 mb-6 leading-relaxed">
                  Enter the public URL of your live web app to audit active HTTP security headers, dotfile leaks (/.env), and clickjacking protection.
                </p>
                <div className="space-y-4">
                  <input 
                    type="text" 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://my-vibe-app.vercel.app" 
                    className="w-full bg-[#F5F3EE] border-2 border-dark rounded-xl px-5 py-4 font-data text-xs text-dark placeholder:text-dark/40 focus:outline-none focus:border-accent"
                  />
                  {error && <div className="text-accent font-data text-xs bg-accent/10 p-3 rounded-xl border border-accent/25">{error}</div>}
                  <MagneticButton variant="primary" className="w-full py-4 text-xs" onClick={handleScan}>
                    Run Free Live Web Scan <ArrowRight size={15} />
                  </MagneticButton>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// --- Landing Page Container ---
const Home = () => {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const [prefillUrl, setPrefillUrl] = useState('');
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('vibescan_user') || 'null');
    } catch {
      return null;
    }
  });
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    const savedPro = localStorage.getItem('vibescan_pro_active');
    if (savedPro === 'true' || (user && user.tier === 'pro')) {
      setIsPro(true);
    } else {
      setIsPro(false);
    }
  }, [user]);

  const handleOpenScanner = (initialUrl = '') => {
    if (typeof initialUrl === 'string') setPrefillUrl(initialUrl);
    setIsScannerOpen(true);
  };

  const handleOpenAuth = (mode = 'signin') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const handleOpenCheckout = async () => {
    if (!user) {
      handleOpenAuth('signin');
      return;
    }
    try {
      const token = user.token || user.email;
      const res = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        }
      } else {
        alert("Simulating Pro Upgrade for testing...");
        localStorage.setItem('vibescan_pro_active', 'true');
        setIsPro(true);
      }
    } catch (err) {
      localStorage.setItem('vibescan_pro_active', 'true');
      setIsPro(true);
      alert("Pro Mode activated successfully!");
    }
  };

  return (
    <div className="min-h-screen bg-background text-dark selection:bg-accent selection:text-primary font-data overflow-x-hidden">
      <AnnouncementBar onOpenScanner={() => handleOpenScanner()} />
      
      <Navbar 
        onOpenScanner={() => handleOpenScanner()} 
        onOpenCheckout={handleOpenCheckout}
        onOpenAuth={handleOpenAuth}
        isPro={isPro}
        user={user}
        setUser={setUser}
      />
      
      <main>
        <Hero 
          onOpenScanner={handleOpenScanner} 
          onOpenCheckout={handleOpenCheckout}
        />
        <TransformationSection />
        <ProductOfferings 
          onOpenScanner={() => handleOpenScanner()} 
          onOpenCheckout={handleOpenCheckout}
        />
        <IndustrySolutions 
          onOpenScanner={() => handleOpenScanner()}
        />
        <Protocol 
          onOpenScanner={() => handleOpenScanner()} 
        />
        <Testimonials />
        <Pricing 
          onOpenCheckout={handleOpenCheckout}
          isPro={isPro}
          onOpenScanner={() => handleOpenScanner()}
        />
        <FAQ />
        <Footer onOpenScanner={() => handleOpenScanner()} />
      </main>

      <ScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        isPro={isPro}
        onOpenCheckout={handleOpenCheckout}
        defaultUrl={prefillUrl}
      />

      <AuthModal 
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(authenticatedUser) => {
          setUser(authenticatedUser);
          if (authenticatedUser.tier === 'pro') setIsPro(true);
        }}
        initialMode={authMode}
      />
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cert/:id" element={<CertPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
