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
  LockKeyhole
} from 'lucide-react';
import CertPage from './CertPage';
import Dashboard from './Dashboard';

gsap.registerPlugin(ScrollTrigger);

// --- Magnetic Button Component (Preset C Brutalist Style) ---
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
    md: "px-8 py-4 text-xs",
    lg: "px-10 py-5 text-sm"
  };

  const baseClasses = `group relative overflow-hidden inline-flex items-center justify-center gap-2 font-bold tracking-widest uppercase transition-all rounded-[2rem] border-2 select-none active:scale-95 duration-200 disabled:opacity-50 disabled:pointer-events-none ${sizeClasses[size]}`;
  const variants = {
    primary: "border-accent bg-accent text-background hover:text-primary",
    outline: "border-dark bg-transparent text-dark hover:text-background",
    dark: "border-dark bg-dark text-background hover:text-background"
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
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
    </button>
  );
};

// --- Navbar Component ---
const Navbar = ({ onOpenScanner, onOpenCheckout, isPro }) => {
  return (
    <nav className="absolute top-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-6xl rounded-[2rem] border border-primary/15 bg-[#111111]/45 backdrop-blur-md text-primary">
      <div className="flex items-center justify-between px-6 py-3 gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <Shield size={18} className="text-accent" />
          <span className="font-heading font-bold text-lg tracking-tighter">VIBESCAN</span>
          {isPro && (
            <span className="font-data text-[9px] bg-accent/20 text-accent border border-accent/40 rounded px-1.5 py-0.5 ml-2 font-bold tracking-widest uppercase">PRO</span>
          )}
        </div>
        
        <div className="hidden lg:flex gap-6 text-[10px] font-data font-bold tracking-widest uppercase items-center shrink-0">
          <a href="#vulnerabilities" className="hover:text-accent transition-colors text-primary/80">Risks</a>
          <a href="#features" className="hover:text-accent transition-colors text-primary/80">Suite</a>
          <a href="#protocol" className="hover:text-accent transition-colors text-primary/80">Steps</a>
          <a href="#pricing" className="hover:text-accent transition-colors text-primary/80">Pricing</a>
          <a href="#faq" className="hover:text-accent transition-colors text-primary/80">FAQ</a>
          <Link to="/dashboard" className="hover:text-accent transition-colors text-primary/80">Dashboard</Link>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          {!isPro ? (
            <MagneticButton 
              variant="outline" 
              size="sm"
              className="border-primary text-primary hover:border-accent" 
              onClick={onOpenCheckout}
            >
              Subscribe to Pro
            </MagneticButton>
          ) : (
            <Link to="/dashboard">
              <MagneticButton 
                variant="outline" 
                size="sm"
                className="border-primary text-primary"
              >
                Telemetry Logs
              </MagneticButton>
            </Link>
          )}
          <MagneticButton 
            variant="primary" 
            size="sm" 
            onClick={onOpenScanner}
          >
            Run Scan
          </MagneticButton>
        </div>
      </div>
    </nav>
  );
};

// --- Hero Component ---
const Hero = ({ onOpenScanner, onOpenCheckout }) => {
  const container = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.hero-fade-up', 
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          stagger: 0.15,
          ease: 'power3.out'
        }
      );
    }, container);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={container} className="relative min-h-[100dvh] md:h-[100dvh] w-full bg-dark overflow-hidden flex items-center pt-28 pb-12">
      {/* Brutalist Concrete Background */}
      <div className="absolute inset-0 opacity-45 mix-blend-overlay">
        <img 
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2000" 
          alt="Brutalist raw concrete" 
          className="w-full h-full object-cover" 
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-[#111111]/75 to-transparent" />
      
      <div className="relative z-10 w-full p-6 md:p-16 max-w-7xl mx-auto">
        <div className="flex flex-col items-start max-w-4xl">
          <div className="hero-fade-up bg-accent text-background font-data font-bold text-xs uppercase tracking-widest px-3 py-1.5 mb-6 rounded">
            // VIBESCAN SECURITY SUITE
          </div>
          
          <h1 className="flex flex-col text-primary leading-[0.85] tracking-tighter">
            <span className="hero-fade-up font-heading font-bold text-4xl sm:text-6xl md:text-7xl uppercase">
              BUILD FAST. STAY SAFE.
            </span>
            <span className="hero-fade-up font-drama italic text-6xl sm:text-8xl md:text-[8.5rem] text-accent mt-2">
              Sleep at Night.
            </span>
          </h1>
          
          <div className="hero-fade-up mt-8 max-w-2xl">
            <p className="font-data text-primary/80 text-sm md:text-base leading-relaxed mb-8">
              You used AI to build your app in days. Now you worry if it is safe enough to ship. You are not alone. 45% of AI-generated code contains security flaws. VibeScan turns your AI-built app into a production-ready fortress, so you can launch with confidence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <MagneticButton 
                variant="primary" 
                size="md"
                className="border-transparent shadow-[0_0_25px_rgba(230,59,46,0.4)]"
                onClick={onOpenScanner}
              >
                Start Free Scan <ArrowRight size={16} />
              </MagneticButton>
              <MagneticButton 
                variant="outline" 
                size="md"
                className="border-primary text-primary hover:border-accent"
                onClick={onOpenCheckout}
              >
                Upgrade to Pro ($79/mo)
              </MagneticButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// --- Vulnerability & Pain Points Matrix Section ---
const VulnerabilityMatrix = () => {
  const container = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.matrix-card', 
        { y: 45, opacity: 0 },
        {
          scrollTrigger: {
            trigger: container.current,
            start: 'top 75%',
            toggleActions: 'play none none none'
          },
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: 'power2.out'
        }
      );
    }, container);
    return () => ctx.revert();
  }, []);

  const concerns = [
    {
      title: "Hardcoded Credentials",
      desc: "Your AI hardcoded API keys and database passwords into your source code. One public commit and your entire app is exposed."
    },
    {
      title: "Silent Vulnerabilities",
      desc: "SQL injection, broken authentication, and cross-site scripting (XSS) are hiding in code you did not write and do not fully understand."
    },
    {
      title: "Unverified Production",
      desc: "You shipped a prototype that became production. Now users trust you with their data, but you have no idea if it is secure."
    },
    {
      title: "The Vibe Coding Hangover",
      desc: "Hits at month three — your app is a black box. Bugs multiply. Fixing one thing breaks three others."
    },
    {
      title: "Audit & Investor Pressure",
      desc: "Regulators, investors, and customers are asking about security. You have no audit trail, no compliance proof, and no time to figure it out."
    },
    {
      title: "Want to Sleep at Night?",
      desc: "Deploy VibeScan now. Get instant codebase audits, real-time threat protection with VibeGuard, and SOC 2 aligned security badges.",
      isPromo: true
    }
  ];

  return (
    <section ref={container} id="vulnerabilities" className="py-28 px-6 bg-background border-t border-dark/10">
      <div className="max-w-7xl mx-auto">
        <header className="mb-20 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-12 border-b border-dark/10 pb-12">
          <div className="max-w-2xl">
            <div className="font-data text-accent text-xs uppercase tracking-widest font-bold mb-4">// THE HIDDEN COST OF VIBE CODING</div>
            <h2 className="font-heading font-bold text-4xl md:text-5xl lg:text-6xl uppercase tracking-tighter leading-none">
              What keeps vibe <br/>
              <span className="font-drama italic text-dark/60 normal-case">coders awake at night.</span>
            </h2>
            <p className="font-data text-xs text-dark/70 mt-6 leading-relaxed">
              Vibe coding feels amazing — until it does not. If you shipped AI-generated code straight into production, you might be carrying critical exposure.
            </p>
          </div>
          
          <div className="w-full lg:w-[380px] shrink-0 h-48 md:h-56 bg-dark rounded-[2.5rem] border-2 border-dark overflow-hidden shadow-[6px_6px_0px_#111111] relative">
            <img 
              src="https://images.unsplash.com/photo-1542385150-13655b3eb4f6?q=80&w=800" 
              alt="Brutalist concrete texture" 
              className="w-full h-full object-cover opacity-80" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark/60 to-transparent" />
            <div className="absolute bottom-4 left-6 font-data text-[9px] text-[#E8E4DD] tracking-wider uppercase font-bold">
              [ Exposure Matrix Vector ]
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {concerns.map((item, idx) => (
            <div 
              key={idx} 
              className={`matrix-card border-2 border-dark rounded-[2rem] p-8 shadow-[6px_6px_0px_#111111] hover:translate-y-[-4px] hover:shadow-[10px_10px_0px_#111111] transition-all duration-300 flex flex-col justify-between min-h-[220px] ${
                item.isPromo 
                  ? 'bg-accent text-background border-accent shadow-[6px_6px_0px_#111111]' 
                  : 'bg-[#E8E4DD] text-dark'
              }`}
            >
              <div>
                <div className="flex justify-between items-center mb-6">
                  <span className={`font-data text-xs font-bold ${item.isPromo ? 'text-white' : 'text-accent'}`}>
                    {item.isPromo ? 'SOLUTION' : `CONCERN // 0${idx + 1}`}
                  </span>
                  <span className={`w-1.5 h-1.5 rounded-full ${item.isPromo ? 'bg-white' : 'bg-accent'} animate-pulse`} />
                </div>
                <h3 className="font-heading font-bold text-xl uppercase tracking-tight mb-4">{item.title}</h3>
                <p className={`font-data text-xs leading-relaxed ${item.isPromo ? 'text-white/80' : 'text-dark/70'}`}>{item.desc}</p>
              </div>
              
              {item.isPromo && (
                <div className="mt-6 border-t border-white/20 pt-4 flex justify-end">
                  <a href="#pricing" className="font-heading font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 hover:text-white text-white">
                    Unlock Performance Pro <ArrowRight size={14} />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Warning Alert Banner */}
        <div className="bg-[#111111] border-2 border-accent text-primary rounded-[2.5rem] p-8 md:p-12 shadow-[8px_8px_0px_#E63B2E] flex flex-col md:flex-row items-center gap-8">
          <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center text-accent shrink-0">
            <AlertTriangle size={32} />
          </div>
          <div>
            <div className="font-heading font-bold text-xl text-white uppercase tracking-tight mb-2">The Moltbook Breach Alert</div>
            <p className="font-data text-xs text-primary/70 leading-relaxed max-w-3xl">
              A recent vibe-coded app with zero security review was compromised, exposing <span className="text-accent font-bold">1.5 million API keys in three days</span>. That could be you. Don't launch without verification.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

// --- Features: Diagnostic Shuffler Card (VibeAudit) ---
const DiagnosticShuffler = () => {
  const [cards, setCards] = useState([
    { id: 1, title: 'SQL Injection Hole (VibeAudit)', desc: 'Unsanitized variables found in db helper. Severity: High.' },
    { id: 2, title: 'Leaked JWT Credentials', desc: 'Private key exposed in configuration commits. Severity: Critical.' },
    { id: 3, title: 'Misconfigured Database Port', desc: 'Exposed public port with default access. Severity: High.' },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCards(prev => {
        const newArr = [...prev];
        const last = newArr.pop();
        newArr.unshift(last);
        return newArr;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-76 w-full bg-[#E8E4DD] rounded-[2.5rem] border-2 border-dark p-6 shadow-[6px_6px_0px_#111111] overflow-hidden flex flex-col justify-end">
      <div className="absolute top-6 left-6 font-data font-bold uppercase text-[10px] tracking-widest text-dark/50 flex items-center gap-2">
        <Terminal size={12} className="text-accent" /> Tool // VibeAudit
      </div>
      <div className="relative h-32 w-full mt-auto">
        {cards.map((card, i) => (
          <div 
            key={card.id}
            className="absolute bottom-0 left-0 w-full bg-[#F5F3EE] rounded-2xl p-4 border border-dark/20 transition-all duration-700 shadow-sm flex items-center gap-3"
            style={{
              transform: `translateY(-${i * 12}px) scale(${1 - i * 0.05})`,
              zIndex: 10 - i,
              opacity: 1 - (i * 0.25),
              transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0">
              <AlertTriangle size={15} />
            </div>
            <div className="overflow-hidden">
              <h4 className="font-heading font-bold text-xs truncate">{card.title}</h4>
              <p className="font-data text-[9px] text-dark/60 truncate">{card.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 z-20 border-t border-dark/10 pt-4">
        <h3 className="font-heading font-bold text-lg mb-1 uppercase tracking-tight">VibeAudit</h3>
        <p className="font-data text-[10px] text-dark/70 leading-relaxed">
          Know what is wrong before hackers do. Scans 50+ vulnerability types and explains findings in plain English — no jargon, no complexity.
        </p>
      </div>
    </div>
  );
};

// --- Features: Telemetry Typewriter Card (VibeGuard) ---
const TelemetryTypewriter = () => {
  const [text, setText] = useState('');
  const messages = [
    "[VIBEGUARD] Monitoring telemetry port 24/7",
    "[VIBEGUARD] Intercepted payload injection attack",
    "[VIBEGUARD] Threat Blocked: credential exfiltration dropped",
    "[VIBEGUARD] App status: 100% secure runtime shielded"
  ];

  useEffect(() => {
    let currentIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    let typingSpeed = 50;

    const handleType = () => {
      const currentMsg = messages[currentIdx % messages.length];
      if (!isDeleting) {
        setText(currentMsg.substring(0, charIdx + 1));
        charIdx++;
        if (charIdx === currentMsg.length) {
          isDeleting = true;
          typingSpeed = 3000;
        } else {
          typingSpeed = 40;
        }
      } else {
        setText(currentMsg.substring(0, charIdx - 1));
        charIdx--;
        if (charIdx === 0) {
          isDeleting = false;
          currentIdx++;
          typingSpeed = 500;
        } else {
          typingSpeed = 20;
        }
      }
      setTimeout(handleType, typingSpeed);
    };

    const timer = setTimeout(handleType, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative h-76 w-full bg-dark text-primary rounded-[2.5rem] p-6 shadow-[6px_6px_0px_#E63B2E] overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-4 border-b border-primary/10 pb-3">
        <div className="font-data font-bold uppercase text-[10px] tracking-widest text-primary/50 flex items-center gap-2">
          <Activity size={12} className="text-accent animate-pulse" /> Tool // VibeGuard
        </div>
        <div className="flex items-center gap-2 text-[9px] font-data text-accent font-bold">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" /> ACTIVE SHIELD
        </div>
      </div>
      <div className="flex-1 bg-black/40 border border-primary/15 rounded-xl p-4 font-data text-[10px] whitespace-pre-wrap flex flex-col justify-end relative">
        <span className="text-accent/90">{text}<span className="inline-block w-2.5 h-3 bg-accent ml-1 animate-pulse" /></span>
      </div>
      <div className="mt-6 z-20">
        <h3 className="font-heading font-bold text-lg mb-1 uppercase tracking-tight text-white">VibeGuard</h3>
        <p className="font-data text-[10px] text-primary/70 leading-relaxed">
          Stop breaches before they happen. Monitored 24/7, blocking injection attacks, credential stuffing, and data exfiltration automatically.
        </p>
      </div>
    </div>
  );
};

// --- Features: Cursor Protocol Scheduler Card (VibeCert) ---
const CursorProtocolScheduler = () => {
  const container = useRef(null);
  
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.5 });
      
      tl.set('.cursor-mock', { x: -10, y: 120, opacity: 0 });
      tl.set('.scheduler-day', { backgroundColor: 'transparent', color: '#111111' });
      tl.set('.badge-gen-btn', { scale: 1, backgroundColor: 'rgba(17,17,17,0.1)', color: '#111111' });
      tl.set('.cert-badge-success', { opacity: 0, scale: 0.8 });

      tl.to('.cursor-mock', { opacity: 1, duration: 0.3 });
      tl.to('.cursor-mock', { x: 105, y: 35, duration: 0.8, ease: "power2.inOut" });
      tl.to('.cursor-mock', { scale: 0.8, duration: 0.1 });
      tl.to('.scheduler-day.wed', { backgroundColor: '#E63B2E', color: '#F5F3EE', duration: 0.1 }, "<");
      tl.to('.cursor-mock', { scale: 1, duration: 0.1 });
      tl.to('.cursor-mock', { x: 175, y: 90, duration: 0.7, ease: "power2.inOut", delay: 0.2 });
      tl.to('.cursor-mock', { scale: 0.8, duration: 0.1 });
      tl.to('.badge-gen-btn', { scale: 1, duration: 0.1 }, "<");
      tl.to('.cursor-mock', { scale: 1, duration: 0.1 });
      tl.to('.badge-gen-btn', { backgroundColor: '#111111', color: '#F5F3EE', duration: 0.2 });
      tl.to('.cert-badge-success', { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(1.7)" });
      tl.to('.cursor-mock', { opacity: 0, duration: 0.3, delay: 0.8 });
    }, container);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={container} className="relative h-76 w-full bg-[#E8E4DD] rounded-[2.5rem] border-2 border-dark p-6 shadow-[6px_6px_0px_#111111] overflow-hidden flex flex-col justify-end">
      <div className="absolute top-6 left-6 font-data font-bold uppercase text-[10px] tracking-widest text-dark/50 flex items-center gap-2">
        <Calendar size={12} className="text-accent" /> Tool // VibeCert
      </div>
      
      <div className="relative mt-auto mb-4 bg-[#F5F3EE] rounded-xl p-3 border border-dark/15 max-w-xs overflow-hidden">
        <div className="flex justify-between font-data text-[9px] text-dark/50 mb-1.5">
          <span>S</span><span>M</span><span>T</span><span className="text-dark font-bold">W</span><span>T</span><span>F</span><span>S</span>
        </div>
        <div className="flex justify-between gap-1">
          {[0, 1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className={`scheduler-day w-5 h-5 rounded border border-dark/20 flex items-center justify-center font-data text-[8px] transition-colors ${i === 3 ? 'wed font-bold' : ''}`}>
              {14 + i}
            </div>
          ))}
        </div>
        <div className="mt-2.5 flex justify-between items-center">
          <span className="font-data text-[8px] text-accent tracking-tighter animate-pulse uppercase">SOC2 READY</span>
          <div className="badge-gen-btn px-2 py-0.5 bg-dark/10 rounded font-heading text-[8px] font-bold uppercase transition-colors">Verifiable Cert</div>
        </div>
        
        {/* Certificate Success */}
        <div className="cert-badge-success absolute inset-0 bg-[#F5F3EE] flex flex-col justify-center items-center p-3 border-2 border-dark rounded-xl">
          <CheckCircle2 className="text-accent mb-1" size={20} />
          <div className="font-heading font-bold text-[10px] uppercase text-dark">VIBECERT SIGNED</div>
          <div className="font-data text-[7px] text-dark/60 mt-0.5">Compliant // SOC 2 Aligned</div>
        </div>

        <svg className="cursor-mock absolute top-0 left-0 w-5 h-5 z-20 drop-shadow-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" fill="#111111" stroke="#F5F3EE" />
        </svg>
      </div>

      <div className="mt-auto z-20 border-t border-dark/10 pt-4">
        <h3 className="font-heading font-bold text-lg mb-1 uppercase tracking-tight">VibeCert</h3>
        <p className="font-data text-[10px] text-dark/70 leading-relaxed">
          Prove your app is secure. Generates a professional certificate you can show investors and compliance teams — SOC 2 and GDPR aligned.
        </p>
      </div>
    </div>
  );
};

// --- Features Grid Container ---
const Features = () => {
  return (
    <section id="features" className="py-28 px-6 bg-background border-t border-dark/10">
      <div className="max-w-7xl mx-auto">
        <header className="mb-20 max-w-3xl">
          <div className="font-data text-accent text-xs uppercase tracking-widest font-bold mb-4">// MEET THE SECURITY SUITE</div>
          <h2 className="font-heading font-bold text-4xl md:text-6xl uppercase tracking-tighter leading-none">
            Three tools. <br/>
            <span className="font-drama italic text-dark/60 normal-case">Just security that works.</span>
          </h2>
          <p className="font-data text-xs text-dark/70 mt-6 leading-relaxed">
            We built tools that solve the exact problems vibe coders face. No jargon. No complexity. Just security that works.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <DiagnosticShuffler />
          <TelemetryTypewriter />
          <CursorProtocolScheduler />
        </div>
      </div>
    </section>
  );
};

// --- Philosophy Section ("The Manifesto") ---
const Philosophy = () => {
  const container = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.manifesto-reveal', 
        { y: 40, opacity: 0 },
        {
          scrollTrigger: {
            trigger: container.current,
            start: "top 75%",
            toggleActions: 'play none none none'
          },
          y: 0,
          opacity: 1,
          duration: 1,
          stagger: 0.2,
          ease: "power3.out"
        }
      );
    }, container);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={container} className="relative py-36 px-6 bg-dark text-primary overflow-hidden">
      <div className="absolute inset-0 opacity-15 mix-blend-color-dodge pointer-events-none">
        <img 
          src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2000" 
          alt="Brutalist concrete background" 
          className="w-full h-full object-cover" 
        />
      </div>
      <div className="relative z-10 max-w-5xl mx-auto text-left">
        <div className="manifesto-reveal font-data text-accent text-xs uppercase tracking-widest font-bold mb-6">// THE MANIFESTO</div>
        <p className="manifesto-reveal font-data text-primary/60 text-sm md:text-lg mb-8 tracking-wide max-w-2xl">
          AI code assistants write fast, but they don't check security. VibeScan was made for people like you — vibe coders, founders, and builders who move fast but refuse to ship broken things.
        </p>
        <p className="manifesto-reveal font-heading font-bold text-3xl sm:text-5xl md:text-7xl leading-[1.1] uppercase tracking-tighter">
          We focus on building a <br/>
          <span className="font-drama italic text-accent normal-case">Production-Ready Fortress.</span>
        </p>
        <p className="manifesto-reveal font-data text-primary/80 mt-10 text-xs md:text-sm max-w-3xl leading-relaxed">
          Don't let a prototype leak database passwords on the first public commit. Secure your codebase and deploy continuous 24/7 telemetry protection.
        </p>
      </div>
    </section>
  );
};

// --- Protocol: Sticky Stacking Archive ---
const ProtocolCard = ({ step, title, desc, animType, isLast }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (animType === 'rotate') {
        gsap.to('.gear-rotate', { rotation: 360, transformOrigin: "50% 50%", duration: 8, repeat: -1, ease: "linear" });
      } else if (animType === 'scan') {
        gsap.to('.scanning-laser', { y: 110, duration: 2.2, repeat: -1, yoyo: true, ease: "power1.inOut" });
      } else if (animType === 'pulse') {
        gsap.to('.pulse-stroke', { strokeDashoffset: 0, duration: 2.5, repeat: -1, ease: "power1.inOut" });
      }
    }, svgRef);
    return () => ctx.revert();
  }, [animType]);

  return (
    <div className={`protocol-card sticky top-0 h-[100dvh] w-full flex items-center justify-center bg-background border-t border-dark/10 ${isLast ? 'pb-24' : ''}`}>
      <div className="protocol-card-inner w-[92%] max-w-5xl bg-[#E8E4DD] rounded-[3rem] p-8 md:p-14 border-2 border-dark shadow-[8px_8px_0px_#111111] flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1">
          <div className="font-data text-accent font-bold text-sm mb-4">// FROM PANIC TO PROTECTED STEP {step}</div>
          <h3 className="font-heading font-bold text-3xl md:text-5xl uppercase tracking-tighter mb-6">{title}</h3>
          <p className="font-data text-dark/70 leading-relaxed text-xs md:text-sm max-w-md">{desc}</p>
        </div>
        <div className="flex-1 flex justify-center items-center w-full">
          <div ref={svgRef} className="w-56 h-56 bg-dark rounded-[2rem] border-2 border-dark flex items-center justify-center p-6 relative overflow-hidden">
            {animType === 'scan' && (
              <svg viewBox="0 0 120 120" className="w-full h-full text-[#E8E4DD]">
                <pattern id="brutalist-grid" width="12" height="12" patternUnits="userSpaceOnUse">
                  <path d="M 12 0 L 0 0 0 12" fill="none" stroke="currentColor" strokeWidth="0.5" className="opacity-25" />
                </pattern>
                <rect width="120" height="120" fill="url(#brutalist-grid)" />
                <line x1="0" y1="5" x2="120" y2="5" stroke="#E63B2E" strokeWidth="2.5" className="scanning-laser" />
              </svg>
            )}
            {animType === 'rotate' && (
              <svg viewBox="0 0 100 100" className="w-full h-full text-accent">
                <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="6,4" className="gear-rotate" />
                <rect x="47" y="15" width="6" height="70" fill="currentColor" className="gear-rotate opacity-40" />
                <rect x="15" y="47" width="70" height="6" fill="currentColor" className="gear-rotate opacity-40" />
                <circle cx="50" cy="50" r="10" fill="#111111" stroke="currentColor" strokeWidth="2" />
              </svg>
            )}
            {animType === 'pulse' && (
              <svg viewBox="0 0 120 100" className="w-full h-full text-accent">
                <path className="pulse-stroke" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="300" strokeDashoffset="300" d="M 10 50 L 35 50 L 45 15 L 60 85 L 75 40 L 85 60 L 95 50 L 110 50" />
              </svg>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Protocol = () => {
  const container = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray('.protocol-card');
      cards.forEach((card, i) => {
        if (i === cards.length - 1) return;
        ScrollTrigger.create({
          trigger: card,
          start: "top top",
          endTrigger: cards[i + 1],
          end: "top top",
          pin: true,
          pinSpacing: false,
          animation: gsap.to(card.querySelector('.protocol-card-inner'), {
            scale: 0.92,
            opacity: 0.4,
            filter: "blur(8px)",
            ease: "none"
          }),
          scrub: true,
        });
      });
    }, container);
    return () => ctx.revert();
  }, []);

  return (
    <section id="protocol" ref={container} className="relative bg-background">
      <ProtocolCard 
        step="01" 
        title="CONNECT" 
        desc="Link your GitHub repo or upload your codebase. VibeAudit scans everything in under 2 minutes." 
        animType="scan" 
      />
      <ProtocolCard 
        step="02" 
        title="FIX" 
        desc="Review your personalized security report. Follow plain-English instructions to patch every vulnerability." 
        animType="rotate" 
      />
      <ProtocolCard 
        step="03" 
        title="SHIELD" 
        desc="Activate VibeGuard for ongoing protection. Download your VibeCert to show the world your app is safe." 
        animType="pulse" 
        isLast={true} 
      />
    </section>
  );
};

// --- Testimonials Section ---
const Testimonials = () => {
  const quotes = [
    {
      text: "I built my entire SaaS with Cursor in two weeks. VibeAudit found 12 critical issues I never would have caught. Fixed them in an afternoon. VibeCert went straight into my investor deck.",
      author: "Marcus T.",
      role: "Solo Founder"
    },
    {
      text: "We are a team of designers, not engineers. VibeGuard blocked three attacks in our first month. We went from terrified to confident.",
      author: "Sarah L.",
      role: "Co-Founder at BuildVibe"
    },
    {
      text: "The compliance report from VibeCert saved us a $15,000 security audit. Our enterprise customers love seeing that badge.",
      author: "James R.",
      role: "CTO at FlowApp"
    }
  ];
  
  return (
    <section className="py-28 px-6 bg-background border-t border-dark/10">
      <div className="max-w-7xl mx-auto">
        <header className="mb-20 max-w-2xl">
          <div className="font-data text-accent text-xs uppercase tracking-widest font-bold mb-4">// TRUSTED BY 10,000+ BUILDERS</div>
          <h2 className="font-heading font-bold text-4xl md:text-5xl uppercase tracking-tighter">
            What founders say.
          </h2>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {quotes.map((q, i) => (
            <div key={i} className="bg-[#E8E4DD] border-2 border-dark rounded-[2rem] p-8 shadow-[6px_6px_0px_#111111] hover:translate-y-[-2px] transition-all">
              <p className="font-data text-xs text-dark/80 italic leading-relaxed mb-6">"{q.text}"</p>
              <div className="border-t border-dark/10 pt-4">
                <div className="font-heading font-bold text-sm uppercase">{q.author}</div>
                <div className="font-data text-[10px] text-dark/50">{q.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- Pricing / Subscription Section ---
const Pricing = ({ onOpenCheckout, isPro }) => {
  return (
    <section id="pricing" className="py-32 px-6 bg-[#E8E4DD] text-dark border-t-2 border-dark">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-24 max-w-2xl mx-auto">
          <div className="font-data text-accent text-xs uppercase tracking-widest font-bold mb-4">// CHOOSE YOUR PROTECTION LEVEL</div>
          <h2 className="font-heading font-bold text-4xl sm:text-6xl uppercase tracking-tighter">
            Choose Your <br/>
            <span className="font-drama italic text-accent normal-case">Shield Level.</span>
          </h2>
          <p className="font-data text-xs text-dark/70 mt-6 leading-relaxed">
            Most vibe coders start with the Starter plan to get a quick health check. But if you are shipping to real users, handling real data, or talking to investors — the Performance (Pro) plan is what you actually need.
          </p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl mx-auto items-stretch">
          {/* Starter Tier */}
          <div className="bg-[#F5F3EE] border-2 border-dark rounded-[2.5rem] p-8 flex flex-col justify-between hover:translate-y-[-4px] transition-all duration-300 shadow-[4px_4px_0px_#111111]">
            <div>
              <div className="font-heading font-bold uppercase tracking-widest text-dark/50 text-[10px] mb-2">Starter</div>
              <div className="font-heading font-bold text-4xl mb-4">$0<span className="text-xs font-normal text-dark/50"> / mo</span></div>
              <p className="font-data text-[10px] text-dark/70 mb-6 leading-relaxed">
                Good for: Hobby projects and learning.
              </p>
              <ul className="space-y-3.5 font-data text-xs text-dark/80 border-t border-dark/10 pt-5">
                <li className="flex items-center gap-2"><Check size={12} className="text-accent" /> 1 repo scan per month</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-accent" /> Basic vulnerability report</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-accent" /> Community support</li>
              </ul>
            </div>
            <div className="mt-8">
              <MagneticButton variant="outline" className="w-full py-3 text-xs">
                Select Starter
              </MagneticButton>
            </div>
          </div>

          {/* Growth Tier */}
          <div className="bg-[#F5F3EE] border-2 border-dark rounded-[2.5rem] p-8 flex flex-col justify-between hover:translate-y-[-4px] transition-all duration-300 shadow-[4px_4px_0px_#111111]">
            <div>
              <div className="font-heading font-bold uppercase tracking-widest text-dark/50 text-[10px] mb-2">Growth</div>
              <div className="font-heading font-bold text-4xl mb-4">$29<span className="text-xs font-normal text-dark/50"> / mo</span></div>
              <p className="font-data text-[10px] text-dark/70 mb-6 leading-relaxed">
                Good for: Side projects and early MVPs.
              </p>
              <ul className="space-y-3.5 font-data text-xs text-dark/80 border-t border-dark/10 pt-5">
                <li className="flex items-center gap-2"><Check size={12} className="text-accent" /> 5 repo scans per month</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-accent" /> Detailed fix instructions</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-accent" /> Email support</li>
              </ul>
            </div>
            <div className="mt-8">
              <MagneticButton variant="outline" className="w-full py-3 text-xs">
                Select Growth
              </MagneticButton>
            </div>
          </div>
          
          {/* Pro / Performance Tier */}
          <div className="bg-dark text-primary border-2 border-accent rounded-[2.5rem] p-8 flex flex-col justify-between relative hover:translate-y-[-4px] transition-all duration-300 shadow-[8px_8px_0px_rgba(230,59,46,0.3)] z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent text-background font-heading font-bold uppercase tracking-widest text-[8px] px-3.5 py-1 rounded-full whitespace-nowrap">
              ★ MOST POPULAR
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-heading font-bold uppercase tracking-widest text-primary/50 text-[10px]">Performance (Pro)</span>
              </div>
              <div className="flex items-end gap-1 mb-4">
                <span className="font-heading font-bold text-4xl text-white">$79</span>
                <span className="font-data text-primary/50 text-xs mb-1">/ mo</span>
              </div>
              <p className="font-data text-[10px] text-primary/70 mb-6 leading-relaxed">
                Good for: Founders shipping to production, teams handling user data.
              </p>
              <ul className="space-y-3 font-data text-[11px] text-primary/80 border-t border-primary/10 pt-5">
                <li className="flex items-center gap-2"><Check size={12} className="text-accent" /> <strong>UNLIMITED repo scans</strong></li>
                <li className="flex items-center gap-2"><Check size={12} className="text-accent" /> VibeAudit PRO suggestions</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-accent" /> VibeGuard PRO real-time block</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-accent" /> VibeCert PRO SOC 2 badges</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-accent" /> Priority support (under 2h)</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-accent" /> Team collaboration (5 members)</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-accent" /> CI/CD integration automatic pull</li>
              </ul>
            </div>
            <div className="mt-8">
              <MagneticButton 
                variant="primary" 
                className="w-full py-3 text-xs border border-transparent shadow-[0_0_20px_rgba(230,59,46,0.5)]"
                onClick={onOpenCheckout}
              >
                {isPro ? "Subscribed" : "Upgrade to Pro"}
              </MagneticButton>
            </div>
          </div>
          
          {/* Enterprise Tier */}
          <div className="bg-[#F5F3EE] border-2 border-dark rounded-[2.5rem] p-8 flex flex-col justify-between hover:translate-y-[-4px] transition-all duration-300 shadow-[4px_4px_0px_#111111]">
            <div>
              <div className="font-heading font-bold uppercase tracking-widest text-dark/50 text-[10px] mb-2">Enterprise</div>
              <div className="font-heading font-bold text-4xl mb-4">Custom</div>
              <p className="font-data text-[10px] text-dark/70 mb-6 leading-relaxed">
                Good for: Teams with strict compliance needs.
              </p>
              <ul className="space-y-3.5 font-data text-xs text-dark/80 border-t border-dark/10 pt-5">
                <li className="flex items-center gap-2"><Check size={12} className="text-accent" /> Everything in Pro plus manager</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-accent" /> HIPAA, PCI-DSS compliance</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-accent" /> On-premise deployment option</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-accent" /> SLA guarantees</li>
              </ul>
            </div>
            <div className="mt-8">
              <MagneticButton variant="outline" className="w-full py-3 text-xs">
                Contact Sales
              </MagneticButton>
            </div>
          </div>
        </div>

        {/* Why Performance (Pro) is the Smart Move Banner */}
        <div className="mt-20 max-w-5xl mx-auto border-2 border-dark rounded-[3rem] p-8 md:p-12 bg-[#F5F3EE] shadow-[6px_6px_0px_#111111]">
          <h3 className="font-heading font-bold text-2xl uppercase mb-6 text-dark border-b border-dark/10 pb-4">
            Why Performance (Pro) Is the Smart Move
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 font-data text-xs text-dark/80 leading-relaxed">
            <div>
              <p className="mb-4">
                Here is the truth: a single data breach costs an average of <strong>$4.88 million</strong>. A security audit from a traditional firm starts at <strong>$10,000</strong>. Performance (Pro) costs less than $80 a month.
              </p>
              <p>
                With Pro, you get unlimited scans. That means every time your AI writes new code, you know it is safe before you ship. You get VibeGuard watching your app 24/7.
              </p>
            </div>
            <div>
              <p className="mb-4">
                You get compliance certificates that close deals. You get peace of mind that no free tool can match. Save thousands on security consultants and deploy safely.
              </p>
              <p className="text-accent font-bold mt-6 text-sm uppercase">
                The founders who upgrade to Pro do not regret it. They regret not doing it sooner.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// --- FAQ Accordion Item Component ---
const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-2 border-dark rounded-2xl bg-[#E8E4DD] overflow-hidden shadow-[4px_4px_0px_#111111] transition-all">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center px-6 py-4 text-left font-heading font-bold text-sm md:text-base hover:bg-dark/5 transition-colors"
      >
        <span>{question}</span>
        <span className="text-accent font-bold text-lg select-none ml-4">{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && (
        <div className="px-6 pb-6 pt-2 font-data text-xs text-dark/70 leading-relaxed border-t border-dark/10 bg-[#F5F3EE]">
          {answer}
        </div>
      )}
    </div>
  );
};

// --- FAQ Section ---
const FAQ = () => {
  const faqs = [
    {
      q: "I am not a professional developer. Will I understand the reports?",
      a: "Yes. Every finding is explained in plain English with copy-paste fix instructions. No security background needed."
    },
    {
      q: "Does this work with apps built using Cursor, Bolt, Lovable, or Replit?",
      a: "Absolutely. VibeScan is built specifically for AI-generated code from any platform."
    },
    {
      q: "Can I upgrade from Starter to Pro later?",
      a: "Yes, and your scan history and certificates transfer over instantly."
    },
    {
      q: "What if I find a vulnerability I cannot fix?",
      a: "Pro users get priority support with step-by-step guidance. We also offer a one-time 'Vibe Code Cleanup' service if you need hands-on help."
    },
    {
      q: "Is my code safe when I upload it?",
      a: "Yes. We use bank-level encryption, never train AI on your code, and you can delete your data anytime."
    }
  ];

  return (
    <section id="faq" className="py-28 px-6 bg-background border-t border-dark/10">
      <div className="max-w-4xl mx-auto">
        <header className="mb-16 text-center">
          <div className="font-data text-accent text-xs uppercase tracking-widest font-bold mb-4">// RESOLVING CONCERNS</div>
          <h2 className="font-heading font-bold text-4xl uppercase tracking-tighter">
            Questions You Might Have
          </h2>
        </header>
        <div className="space-y-4">
          {faqs.map((f, i) => (
            <FAQItem key={i} question={f.q} answer={f.a} />
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
      <section className="py-32 px-6 flex flex-col items-center justify-center bg-background text-center border-t border-dark/10">
        <div className="bg-accent/10 border border-accent/20 px-3 py-1.5 rounded text-accent font-data text-xs uppercase tracking-widest mb-6 font-bold">
          // STOP WORRYING. START SHIPPING.
        </div>
        <h2 className="font-heading font-bold text-4xl sm:text-6xl uppercase tracking-tighter mb-8 max-w-xl">
          Your AI built the app. <br/>
          <span className="font-drama italic text-accent normal-case">Let VibeScan secure it.</span>
        </h2>
        <p className="font-data text-xs text-dark/60 mb-8 max-w-md">
          Join 10,000+ vibe coders who ship with confidence. 30-day money-back guarantee. Cancel anytime.
        </p>
        <MagneticButton variant="primary" className="text-sm px-10 py-5" onClick={onOpenScanner}>
          Start Free Scan
        </MagneticButton>
      </section>

      <footer className="bg-dark text-primary rounded-t-[3.5rem] pt-24 pb-12 px-6 md:px-12 mt-[-2rem] relative z-20 border-t-2 border-accent">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-24">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={20} className="text-accent" />
              <span className="font-heading font-bold text-2xl tracking-tighter">VIBESCAN</span>
            </div>
            <p className="font-data text-primary/50 text-xs max-w-sm leading-relaxed">
              VibeScan Security Suite — VibeAudit | VibeGuard | VibeCert <br/>
              Built for vibe coders. Trusted by founders. Proven by security experts.
            </p>
          </div>
          <div>
            <h4 className="font-heading font-bold uppercase tracking-widest text-xs mb-6 text-primary/50">Products</h4>
            <ul className="space-y-4 font-data text-xs">
              <li><a href="#vulnerabilities" className="hover:text-accent transition-colors">VibeAudit</a></li>
              <li><a href="#features" className="hover:text-accent transition-colors">VibeGuard</a></li>
              <li><a href="#features" className="hover:text-accent transition-colors">VibeCert</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading font-bold uppercase tracking-widest text-xs mb-6 text-primary/50">Compliance</h4>
            <ul className="space-y-4 font-data text-xs">
              <li><a href="#" className="hover:text-accent transition-colors">GDPR & SOC 2</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-primary/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="font-data text-[10px] text-primary/40">© 2026 Zeerocodes Automation Limited. All rights reserved.</div>
          <div className="flex items-center gap-3 font-data text-xs bg-primary/5 px-4 py-2 rounded-full border border-primary/10">
            <span className="w-2 h-2 rounded-full bg-[#00FF00] animate-pulse" /> SECURITY COMPLIANT
          </div>
        </div>
      </footer>
    </>
  );
};

// --- Interactive Checkout Modal (Subscription Flow) ---
const CheckoutModal = ({ isOpen, onClose, onSubscribeSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ card: '', name: '', exp: '', cvv: '' });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      setLoading(false);
      setStep(2);
      onSubscribeSuccess();
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dark/85 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-xl bg-[#E8E4DD] rounded-[2.5rem] p-8 md:p-10 shadow-2xl border-2 border-dark relative my-auto">
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 font-data text-xs uppercase hover:text-accent transition-colors font-bold"
        >
          [Close X]
        </button>

        {step === 1 ? (
          <div>
            <header className="mb-8 border-b border-dark/10 pb-4">
              <div className="flex items-center gap-2 text-accent mb-2">
                <LockKeyhole size={18} />
                <span className="font-data text-xs font-bold uppercase tracking-widest">SECURE CHECKOUT</span>
              </div>
              <h3 className="font-heading font-bold text-3xl uppercase tracking-tighter">
                Upgrade to Pro
              </h3>
              <p className="font-data text-xs text-dark/70 mt-1">
                Deploy VibeGuard 24/7 protection & generate unlimited VibeCert compliance assets for $79/mo.
              </p>
            </header>

            <form onSubmit={handlePaymentSubmit} className="space-y-5">
              <div>
                <label className="block font-data text-[10px] font-bold uppercase text-dark/60 mb-2">Card Number</label>
                <div className="relative">
                  <input 
                    type="text" 
                    name="card"
                    required
                    maxLength="19"
                    value={formData.card}
                    onChange={handleInputChange}
                    placeholder="4000 1234 5678 9010" 
                    className="w-full bg-[#F5F3EE] border-2 border-dark rounded-xl px-4 py-3.5 font-data text-xs text-dark placeholder:text-dark/30 focus:outline-none focus:border-accent"
                  />
                  <CreditCard size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-dark/40" />
                </div>
              </div>

              <div>
                <label className="block font-data text-[10px] font-bold uppercase text-dark/60 mb-2">Cardholder Name</label>
                <input 
                  type="text" 
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Alexander Wright" 
                  className="w-full bg-[#F5F3EE] border-2 border-dark rounded-xl px-4 py-3.5 font-data text-xs text-dark placeholder:text-dark/30 focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-data text-[10px] font-bold uppercase text-dark/60 mb-2">Expiration</label>
                  <input 
                    type="text" 
                    name="exp"
                    required
                    maxLength="5"
                    value={formData.exp}
                    onChange={handleInputChange}
                    placeholder="MM/YY" 
                    className="w-full bg-[#F5F3EE] border-2 border-dark rounded-xl px-4 py-3.5 font-data text-xs text-dark placeholder:text-dark/30 focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block font-data text-[10px] font-bold uppercase text-dark/60 mb-2">CVV</label>
                  <input 
                    type="password" 
                    name="cvv"
                    required
                    maxLength="4"
                    value={formData.cvv}
                    onChange={handleInputChange}
                    placeholder="***" 
                    className="w-full bg-[#F5F3EE] border-2 border-dark rounded-xl px-4 py-3.5 font-data text-xs text-dark placeholder:text-dark/30 focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="bg-[#F5F3EE] border border-dark/10 p-4 rounded-xl flex items-start gap-3">
                <Info size={16} className="text-accent shrink-0 mt-0.5" />
                <p className="font-data text-[10px] text-dark/60 leading-relaxed">
                  You are subscribing to VibeScan Performance (Pro). Secure billing via Stripe. 30-day money-back guarantee. Cancel anytime.
                </p>
              </div>

              <div className="pt-4">
                <MagneticButton 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-4 text-xs shadow-[0_0_20px_rgba(230,59,46,0.3)]"
                >
                  {loading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Authorizing Transaction...
                    </>
                  ) : (
                    <>
                      Subscribe & Activate Shield ($79/mo)
                    </>
                  )}
                </MagneticButton>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-6 animate-in fade-in zoom-in duration-300">
            <div className="mx-auto w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mb-6 text-accent">
              <CheckCircle2 size={48} />
            </div>
            
            <h3 className="font-heading font-bold text-3xl uppercase tracking-tighter mb-2 text-dark">
              Subscription Active
            </h3>
            <p className="font-data text-xs text-dark/70 mb-8 max-w-sm mx-auto">
              Your codespace is now secured under the AgentGuard telemetry loop.
            </p>

            <div className="bg-dark text-primary p-6 rounded-2xl border-2 border-accent text-left mb-8 space-y-4">
              <div>
                <div className="font-data text-[8px] text-primary/40 uppercase tracking-widest">Active License Token</div>
                <code className="font-data text-[10px] text-accent block bg-black/40 px-3 py-2 rounded border border-primary/10 mt-1 select-all">
                  ag_live_7x82b9e120fbc35da0b1
                </code>
              </div>
              
              <div>
                <div className="font-data text-[8px] text-primary/40 uppercase tracking-widest">Quick Integration (NodeJS)</div>
                <code className="font-data text-[10px] text-white block bg-black/40 px-3 py-2 rounded border border-primary/10 mt-1">
                  import 'agentguard';
                </code>
              </div>
            </div>

            <div className="flex gap-4">
              <Link to="/dashboard" className="flex-1">
                <MagneticButton variant="primary" className="w-full py-3.5 text-xs">
                  Go to Live Telemetry
                </MagneticButton>
              </Link>
              <MagneticButton variant="outline" className="flex-1 py-3.5 text-xs" onClick={onClose}>
                Dismiss
              </MagneticButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Interactive Scanner Modal ---
const ScannerModal = ({ isOpen, onClose, isPro, onOpenCheckout }) => {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

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

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setIsScanning(true);
    setError(null);
    setResults(null);

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
      setError(err.message);
      setIsScanning(false);
    }
  };

  const handleScan = async () => {
    if (!url) return;
    setIsScanning(true);
    setError(null);
    setResults(null);
    
    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to queue codebase audit.');
      }
      
      pollForResults(data.scan_id);
    } catch (err) {
      setError(err.message);
      setIsScanning(false);
    }
  };

  const resetScanner = () => {
    setResults(null);
    setUrl('');
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dark/85 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-3xl bg-[#E8E4DD] rounded-[2.5rem] p-8 md:p-12 shadow-2xl border-2 border-dark relative my-auto">
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 font-data text-xs uppercase hover:text-accent transition-colors font-bold"
        >
          [Close X]
        </button>
        
        {isScanning ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
             <Loader2 size={40} className="animate-spin text-accent mb-6" />
             <div className="font-heading font-bold text-2xl md:text-3xl uppercase animate-pulse mb-6">
               Scanning Repository <br/>
               <span className="text-accent lowercase">{url.split('/').pop() || 'Archive'}</span>
             </div>
             <div className="font-data text-[10px] text-dark/60 leading-relaxed text-left border border-dark/10 p-4 rounded-xl bg-[#F5F3EE] max-w-md w-full">
               &gt; INITIATING_REGISTRY_METADATA_STREAM...<br/>
               &gt; QUERYING_LIVE_REGISTRIES_FOR_HALLUCINATIONS...<br/>
               &gt; SEARCHING_FOR_UNSECURE_CHILD_PROCESS_STREAMING...<br/>
               &gt; AUDITING_OWASP_LLM_TOP_10_THREATS...
             </div>
          </div>
        ) : results ? (
          <div className="animate-in fade-in zoom-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b border-dark/10 pb-6">
              <div>
                <h3 className="font-heading font-bold text-3xl uppercase">Scan Results</h3>
                <p className="font-data text-xs text-dark/70 mt-1">Repo: {results.repo}</p>
              </div>
              <div className="mt-4 md:mt-0 text-right">
                <div className="font-heading font-bold text-5xl text-accent leading-none">{results.grade}</div>
                <div className="font-data text-[10px] text-dark/70 uppercase tracking-widest mt-1">Score: {results.score}/100</div>
              </div>
            </div>

            <div className="relative space-y-4 max-h-[45vh] overflow-y-auto pr-2 custom-scrollbar">
              {results.findings && results.findings.length > 0 ? (
                <>
                  <div className="space-y-4 mb-28">
                    {results.findings.map((finding, idx) => (
                      <div key={idx} className="bg-[#F5F3EE] p-5 rounded-2xl shadow-sm border border-dark/10 relative overflow-hidden">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-heading font-bold text-base text-accent flex items-center gap-2">
                            <AlertTriangle size={15} /> {finding.title}
                          </h4>
                          <span className="font-data text-[9px] px-2.5 py-0.5 bg-accent/15 text-accent rounded-full uppercase font-bold">
                            {finding.category}
                          </span>
                        </div>
                        <div className="font-data text-[10px] text-dark/50 mb-3 bg-dark/5 px-2 py-1 rounded inline-block">
                          {finding.file}
                        </div>
                        
                        <div className="relative">
                          {!isPro ? (
                            <>
                              <p className="text-dark/80 blur-sm select-none pointer-events-none text-xs">
                                This vulnerability allows remote code execution or data exfiltration. Remediation involves patching imports to verify registries.
                              </p>
                              <div className="absolute inset-0 flex items-center justify-center bg-white/20">
                                <button 
                                  onClick={() => { onClose(); setTimeout(onOpenCheckout, 100); }}
                                  className="bg-dark hover:bg-accent text-primary font-data text-[9px] uppercase px-3.5 py-1.5 rounded-full flex items-center gap-2 border border-accent/20 transition-colors shadow-lg"
                                >
                                  <Lock size={10} className="text-accent" /> Remediation locked - Upgrade to Pro
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="bg-green-500/5 border border-green-500/20 p-3 rounded-lg">
                              <p className="text-dark/80 text-xs leading-relaxed">
                                {finding.message || "Dependency hallucination verified. Sandbox module has actively scrubbed and isolated this import."}
                              </p>
                              <div className="font-data text-[9px] text-green-600 mt-2 flex items-center gap-1 font-bold">
                                <Check size={12} /> Sandbox Mitigation Active
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {!isPro && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#E8E4DD] via-[#E8E4DD]/95 to-transparent pt-16 pb-2 px-1">
                      <div className="bg-dark text-primary p-5 rounded-2xl shadow-[0_0_30px_rgba(230,59,46,0.25)] border-2 border-accent relative text-center">
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-accent text-background font-heading font-bold uppercase tracking-widest text-[9px] px-3.5 py-1 rounded-full whitespace-nowrap">
                          CRITICAL ACTION REQUIRED
                        </div>
                        <h4 className="font-heading font-bold text-xl mb-1 text-white">Your codebase is vulnerable.</h4>
                        <p className="font-data text-[9px] text-primary/70 mb-4 max-w-md mx-auto">
                          Unlock 1-click remediation scripts and run the AgentGuard Sandbox package to block shell command injections.
                        </p>
                        <button 
                          onClick={() => { onClose(); setTimeout(onOpenCheckout, 100); }}
                          className="w-full bg-accent text-white px-6 py-3 rounded-xl font-heading font-bold text-xs uppercase tracking-wider hover:scale-[1.02] transition-transform shadow-[0_0_15px_rgba(230,59,46,0.3)]"
                        >
                          Upgrade to Pro - $79/mo
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 text-green-600 mb-4 border border-green-500/20">
                    <CheckCircle size={32} />
                  </div>
                  <h4 className="font-heading font-bold text-xl mb-2">Codebase Secured</h4>
                  <p className="font-data text-xs text-dark/70">No package hallucinations or dynamic injection vectors detected.</p>
                </div>
              )}
            </div>
            <div className="mt-8 flex gap-4">
              <MagneticButton variant="outline" className="flex-1 py-3 text-xs" onClick={resetScanner}>Scan Another</MagneticButton>
              {results.score >= 80 && (
                <MagneticButton 
                  variant="primary" 
                  className="flex-1 py-3 text-xs" 
                  onClick={() => { onClose(); navigate(`/cert/${results.id || 'demo'}`); }}
                >
                  View VibeCert Badge
                </MagneticButton>
              )}
            </div>
          </div>
        ) : (
          <>
            <h3 className="font-heading font-bold text-3xl md:text-5xl uppercase tracking-tighter mb-3">
              Initialize <br/>
              <span className="font-drama italic text-accent normal-case md:text-6xl">VibeAudit.</span>
            </h3>
            <p className="font-data text-xs text-dark/70 mb-8 max-w-md leading-relaxed">
              Paste a repository GitHub URL (e.g. `https://github.com/user/project`) to perform a dependency audit and scan for OWASP LLM vulnerabilities.
            </p>
            
            <div className="space-y-4">
              <input 
                type="text" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://github.com/username/vibe-coded-project" 
                className="w-full bg-[#F5F3EE] border-2 border-dark rounded-xl px-5 py-4 font-data text-xs text-dark placeholder:text-dark/30 focus:outline-none focus:border-accent"
              />
              
              <div className="flex items-center justify-center w-full my-2">
                <label className="flex flex-col items-center justify-center w-full py-7 border-2 border-dark/20 border-dashed rounded-xl cursor-pointer bg-[#F5F3EE] hover:bg-dark/5 transition-colors">
                  <div className="flex flex-col items-center justify-center">
                    <p className="text-[10px] font-data text-dark/50 uppercase tracking-widest"><span className="font-bold text-dark">Click to upload</span> a zip backup archive</p>
                  </div>
                  <input ref={fileInputRef} type="file" accept=".zip" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
              {error && <div className="text-accent font-data text-[10px] bg-accent/5 p-2 rounded border border-accent/25">{error}</div>}
              <div className="flex gap-4">
                <MagneticButton variant="primary" className="flex-1 py-4 text-xs" onClick={handleScan}>
                  Execute Diagnostic Scan
                </MagneticButton>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// --- Landing Page Container ---
const Home = () => {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    const savedPro = localStorage.getItem('vibescan_pro_active');
    if (savedPro === 'true') {
      setIsPro(true);
    }
  }, []);

  const handleSubscribeSuccess = () => {
    setIsPro(true);
    localStorage.setItem('vibescan_pro_active', 'true');
  };

  return (
    <div className="min-h-screen bg-background text-dark selection:bg-accent selection:text-primary font-data overflow-x-hidden">
      <svg className="hidden">
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch"/>
        </filter>
      </svg>
      <div className="fixed inset-0 opacity-5 pointer-events-none z-50" style={{ filter: 'url(#noise)' }}></div>
      
      <Navbar 
        onOpenScanner={() => setIsScannerOpen(true)} 
        onOpenCheckout={() => setIsCheckoutOpen(true)}
        isPro={isPro}
      />
      
      <main>
        <Hero 
          onOpenScanner={() => setIsScannerOpen(true)} 
          onOpenCheckout={() => setIsCheckoutOpen(true)}
        />
        <VulnerabilityMatrix />
        <Features />
        <Philosophy />
        <Protocol />
        <Testimonials />
        <Pricing 
          onOpenCheckout={() => setIsCheckoutOpen(true)}
          isPro={isPro}
        />
        <FAQ />
        <Footer onOpenScanner={() => setIsScannerOpen(true)} />
      </main>

      <ScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        isPro={isPro}
        onOpenCheckout={() => setIsCheckoutOpen(true)}
      />

      <CheckoutModal 
        isOpen={isCheckoutOpen} 
        onClose={() => setIsCheckoutOpen(false)} 
        onSubscribeSuccess={handleSubscribeSuccess}
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
      </Routes>
    </BrowserRouter>
  );
};

export default App;
