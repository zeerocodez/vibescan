import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Shield, ArrowRight, Zap, Lock, Terminal } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

// --- Magnetic Button Component ---
const MagneticButton = ({ children, className, onClick, variant = 'primary' }) => {
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

  const baseClasses = "relative overflow-hidden inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold tracking-widest uppercase transition-colors rounded-[2rem]";
  const variants = {
    primary: "bg-accent text-primary hover:bg-red-700",
    outline: "border-2 border-dark text-dark hover:bg-dark hover:text-primary",
    dark: "bg-dark text-primary hover:bg-black"
  };

  return (
    <button ref={buttonRef} onClick={onClick} className={`${baseClasses} ${variants[variant]} ${className}`}>
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
};

// --- Navbar Component ---
const Navbar = ({ onOpenScanner }) => {
  return (
    <nav className="absolute top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-5xl rounded-[2rem] bg-transparent text-primary">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="font-heading font-bold text-xl tracking-tight">VibeGuard</div>
        <div className="hidden md:flex gap-8 text-sm font-bold tracking-widest uppercase opacity-80">
          <a href="#features" className="hover:text-accent transition-colors">Features</a>
          <a href="#protocol" className="hover:text-accent transition-colors">Protocol</a>
        </div>
        <MagneticButton variant="primary" className="py-2 px-6 text-xs" onClick={onOpenScanner}>Run a free scan</MagneticButton>
      </div>
    </nav>
  );
};

// --- Hero Component ---
const Hero = ({ onOpenScanner }) => {
  const container = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.hero-element', {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.15,
        ease: 'power3.out',
        delay: 0.2
      });
    }, container);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={container} className="relative h-[100dvh] w-full bg-dark overflow-hidden flex items-end">
      {/* Brutalist Background */}
      <div className="absolute inset-0 opacity-40 mix-blend-overlay">
        <img src="https://images.unsplash.com/photo-1542385150-13655b3eb4f6?q=80&w=2000" alt="Brutalist concrete texture" className="w-full h-full object-cover" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/50 to-transparent" />
      
      <div className="relative z-10 w-full p-8 md:p-16 max-w-7xl mx-auto mb-10 md:mb-20">
        <h1 className="flex flex-col text-primary leading-[0.9]">
          <span className="hero-element font-heading font-bold text-5xl md:text-7xl uppercase tracking-tighter">Secure the</span>
          <span className="hero-element font-drama italic text-8xl md:text-[12rem] text-accent mt-[-2rem] md:mt-[-4rem]">AI.</span>
        </h1>
        <div className="hero-element mt-12 max-w-xl">
          <p className="font-data text-primary/80 text-sm md:text-base leading-relaxed mb-8">
            The first security suite built exclusively for AI-generated codebases and autonomous agents. Detect hallucinated dependencies, block rogue LLM commands at runtime, and prove your security to investors.
          </p>
          <MagneticButton variant="primary" className="hero-element" onClick={onOpenScanner}>
            Run Free AI Security Audit <ArrowRight size={18} />
          </MagneticButton>
        </div>
      </div>
    </section>
  );
};

// --- Features: Diagnostic Shuffler ---
const DiagnosticShuffler = () => {
  const [cards, setCards] = useState([
    { id: 1, title: 'Hallucinated Packages', desc: 'Verify imports against live NPM registries' },
    { id: 2, title: 'OWASP for AI', desc: 'Scan for Prompt Injection & RCE' },
    { id: 3, title: 'Hardcoded Secrets', desc: 'Detect exposed API keys and tokens' },
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
    <div className="relative h-64 w-full bg-primary rounded-[2rem] p-6 shadow-xl border border-dark/10 overflow-hidden flex flex-col justify-end">
      <div className="absolute top-6 left-6 font-heading font-bold uppercase text-xs tracking-widest text-dark/50">VibeAudit (Static)</div>
      <div className="relative h-32 w-full mt-auto">
        {cards.map((card, i) => (
          <div 
            key={card.id}
            className="absolute bottom-0 left-0 w-full bg-background rounded-2xl p-4 border border-dark/10 transition-all duration-700 shadow-sm"
            style={{
              transform: `translateY(-${i * 12}px) scale(${1 - i * 0.05})`,
              zIndex: 10 - i,
              opacity: 1 - (i * 0.3)
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                <Shield size={16} />
              </div>
              <div>
                <h4 className="font-heading font-bold text-sm">{card.title}</h4>
                <p className="font-data text-[10px] text-dark/60">{card.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 z-20">
        <h3 className="font-heading font-bold text-xl mb-1">Catch AI Hallucinations</h3>
        <p className="font-data text-xs text-dark/70 leading-relaxed">The only scanner that cross-references AI-generated imports with live registries to prevent supply chain attacks.</p>
      </div>
    </div>
  );
};

// --- Features: SecretShield ---
const SecretShieldTypewriter = () => {
  const [text, setText] = useState('');
  const messages = [
    "[AGENTGUARD] Intercepting child_process.exec()",
    "[AGENTGUARD] Command string matched: rm -rf /",
    "[AGENTGUARD] Threat detected. Blocking execution.",
    "[AGENTGUARD] Threat logged to telemetry server.",
    "[AGENTGUARD] Sandbox integrity verified."
  ];

  useEffect(() => {
    let current = 0;
    const type = () => {
      setText(messages[current % messages.length]);
      current++;
      if (current <= messages.length) {
        setTimeout(type, 1500);
      } else {
        setTimeout(() => { current = 0; type(); }, 4000);
      }
    };
    type();
  }, []);

  return (
    <div className="relative h-64 w-full bg-dark text-primary rounded-[2rem] p-6 shadow-xl overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div className="font-heading font-bold uppercase text-xs tracking-widest text-primary/50">AgentGuard (Runtime)</div>
        <div className="flex items-center gap-2 text-[10px] font-data text-accent">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" /> LIVE LOGS
        </div>
      </div>
      <div className="flex-1 bg-black/50 rounded-xl p-4 font-data text-xs whitespace-pre-wrap flex flex-col justify-end">
        <span>{text}<span className="inline-block w-2 h-3 bg-accent ml-1 animate-pulse" /></span>
      </div>
      <div className="mt-6 z-20">
        <h3 className="font-heading font-bold text-xl mb-1">Monkey-patches Node.js</h3>
        <p className="font-data text-xs text-primary/70 leading-relaxed">
          {(() => {
            const steps = [
              { num: '01', title: 'The Free Audit', desc: 'Scan your repository in seconds. See exactly where your AI left you exposed to supply chain attacks.' },
              { num: '02', title: 'AgentGuard Sandbox', desc: 'Upgrade to Pro. Drop in our SDK to physically block dangerous commands and prompt injections at runtime.' },
              { num: '03', title: 'The VibeCert Badge', desc: 'Embed your passing security score on your landing page to build trust and close enterprise deals.' }
            ];
            return null;
          })()}
          Blocks rogue autonomous agents from executing destructive system commands or exfiltrating data.
        </p>
      </div>
    </div>
  );
};

// --- Features: Cursor Protocol Scheduler ---
const CursorProtocolScheduler = () => {
  const container = useRef(null);
  
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });
      
      // Reset state
      tl.set('.cursor-svg', { x: -20, y: 150, opacity: 0 });
      tl.set('.day-cell', { backgroundColor: 'transparent', color: '#111111' });
      tl.set('.save-btn', { scale: 1, backgroundColor: 'rgba(17,17,17,0.1)', color: '#111111' });

      // Enter cursor
      tl.to('.cursor-svg', { opacity: 1, duration: 0.3 });
      
      // Move to a day cell (Wednesday)
      tl.to('.cursor-svg', { x: 95, y: 45, duration: 0.8, ease: "power2.inOut" });
      
      // Click simulation
      tl.to('.cursor-svg', { scale: 0.8, duration: 0.1 });
      tl.to('.day-cell.wed', { backgroundColor: '#E63B2E', color: '#F5F3EE', duration: 0.1 }, "<");
      tl.to('.cursor-svg', { scale: 1, duration: 0.1 });
      
      // Move to Save button
      tl.to('.cursor-svg', { x: 150, y: 110, duration: 0.6, ease: "power2.inOut", delay: 0.3 });
      
      // Click Save
      tl.to('.cursor-svg', { scale: 0.8, duration: 0.1 });
      tl.to('.save-btn', { scale: 0.95, duration: 0.1 }, "<");
      tl.to('.cursor-svg', { scale: 1, duration: 0.1 });
      tl.to('.save-btn', { scale: 1, duration: 0.1 }, "<");
      tl.to('.save-btn', { backgroundColor: '#111111', color: '#F5F3EE', duration: 0.3 });
      
      // Exit cursor
      tl.to('.cursor-svg', { opacity: 0, duration: 0.3, delay: 0.5 });
    }, container);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={container} className="relative h-64 w-full bg-primary rounded-[2rem] p-6 shadow-xl border border-dark/10 overflow-hidden flex flex-col justify-end">
      <div className="absolute top-6 left-6 font-heading font-bold uppercase text-xs tracking-widest text-dark/50">VibeCert</div>
      
      <div className="relative mt-auto mb-6 bg-background rounded-xl p-4 border border-dark/10">
        <div className="flex justify-between font-data text-[10px] text-dark/50 mb-2">
          <span>S</span><span>M</span><span>T</span><span className="text-dark font-bold">W</span><span>T</span><span>F</span><span>S</span>
        </div>
        <div className="flex justify-between gap-1">
          {[0,1,2,3,4,5,6].map(i => (
            <div key={i} className={`day-cell w-6 h-6 rounded border border-dark/20 flex items-center justify-center font-data text-[10px] transition-colors ${i === 3 ? 'wed' : ''}`}>
              {10 + i}
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-end">
          <div className="save-btn px-3 py-1 bg-dark/10 rounded-full font-heading text-[10px] font-bold uppercase transition-colors">Generate Badge</div>
        </div>
        
        {/* SVG Cursor */}
        <svg className="cursor-svg absolute top-0 left-0 w-6 h-6 z-10 drop-shadow-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" fill="#111111" stroke="#F5F3EE" />
        </svg>
      </div>

      <div className="mt-auto z-20">
        <h3 className="font-heading font-bold text-xl mb-1">Public Trust Badges</h3>
        <p className="font-data text-xs text-dark/70 leading-relaxed">Embed your passing security score on your landing page. Prove to customers that your AI codebase is secure.</p>
      </div>
    </div>
  );
};

// --- Features: AgentGuard ---
const AgentGuardRadar = () => {
  const container = useRef(null);
  
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to('.radar-sweep', { rotation: 360, transformOrigin: "50% 50%", duration: 4, repeat: -1, ease: "linear" });
      
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });
      tl.set('.radar-ping', { scale: 0, opacity: 0 });
      tl.to('.radar-ping', { scale: 1.5, opacity: 1, duration: 0.2, ease: "power2.out" });
      tl.to('.radar-ping', { scale: 3, opacity: 0, duration: 1, ease: "power2.out" });
      
      tl.set('.blocked-text', { opacity: 0, y: 10 });
      tl.to('.blocked-text', { opacity: 1, y: 0, duration: 0.2 }, "-=1");
      tl.to('.blocked-text', { opacity: 0, duration: 0.2, delay: 1.5 });
    }, container);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={container} className="relative h-64 w-full bg-dark text-primary rounded-[2rem] p-6 shadow-xl border border-dark/10 overflow-hidden flex flex-col justify-end">
      <div className="absolute top-6 left-6 font-heading font-bold uppercase text-xs tracking-widest text-primary/50">AgentGuard</div>
      
      <div className="relative mt-auto mb-6 flex justify-center items-center h-24">
        <div className="absolute w-24 h-24 rounded-full border border-primary/20" />
        <div className="absolute w-16 h-16 rounded-full border border-primary/20" />
        <div className="absolute w-8 h-8 rounded-full border border-primary/20" />
        
        <div className="absolute w-24 h-24 rounded-full overflow-hidden">
          <div className="radar-sweep absolute top-0 left-12 w-12 h-12 bg-gradient-to-br from-accent/40 to-transparent origin-bottom-left" />
        </div>
        
        <div className="absolute w-2 h-2 rounded-full bg-accent radar-ping" style={{ top: '30%', left: '30%' }} />
        
        <div className="blocked-text absolute top-0 bg-accent text-primary font-data text-[8px] font-bold px-2 py-1 rounded shadow-lg uppercase whitespace-nowrap">
          Access Denied: rm -rf /
        </div>
      </div>

      <div className="mt-auto z-20">
        <h3 className="font-heading font-bold text-xl mb-1">Monitors AI agents</h3>
        <p className="font-data text-xs text-primary/70 leading-relaxed">As builders move to "AI-agent" workflows, AI gets broad access. We block dangerous operations.</p>
      </div>
    </div>
  );
};

const Features = () => {
  return (
    <section id="features" className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
      <div className="mb-16">
        <h2 className="font-heading font-bold text-4xl md:text-5xl uppercase tracking-tighter">Functional <br/>Artifacts.</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <DiagnosticShuffler />
        <SecretShieldTypewriter />
        <AgentGuardRadar />
        <CursorProtocolScheduler />
      </div>
    </section>
  );
};

// --- Philosophy ---
const Philosophy = () => {
  const container = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.manifesto-line', {
        scrollTrigger: {
          trigger: container.current,
          start: "top 70%",
        },
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: "power3.out"
      });
    }, container);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={container} className="relative py-32 px-6 md:px-12 bg-dark text-primary overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <img src="https://images.unsplash.com/photo-1563293885-3e2b20253fce?q=80&w=2000" alt="Industrial texture" className="w-full h-full object-cover" />
      </div>
      <div className="relative z-10 max-w-4xl mx-auto">
        <p className="manifesto-line font-data text-primary/60 text-sm md:text-lg mb-8 tracking-widest uppercase">
          Legacy security scanners look for bad code.
        </p>
        <p className="manifesto-line font-heading font-bold text-3xl md:text-6xl leading-[1.1] uppercase tracking-tighter">
          We hunt <br/>
          <span className="font-drama italic text-accent normal-case md:text-[5.5rem]">AI Hallucinations.</span>
        </p>
        <p className="manifesto-line font-data text-primary/80 mt-8 text-lg max-w-2xl leading-relaxed">
          Traditional tools miss the massive supply chain risks introduced by AI coding assistants. We actively ping the NPM registry to catch non-existent packages before attackers register them with malware.
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
        gsap.to('.gear-path', { rotation: 360, transformOrigin: "50% 50%", duration: 10, repeat: -1, ease: "linear" });
      } else if (animType === 'scan') {
        gsap.to('.laser-line', { y: 100, duration: 2, repeat: -1, yoyo: true, ease: "power1.inOut" });
      } else if (animType === 'pulse') {
        gsap.to('.pulse-path', { strokeDashoffset: 0, duration: 2, repeat: -1, ease: "power2.inOut" });
      }
    }, svgRef);
    return () => ctx.revert();
  }, [animType]);

  return (
    <div className={`protocol-card sticky top-0 h-[100dvh] w-full flex items-center justify-center bg-background border-t border-dark/10 ${isLast ? 'pb-24' : ''}`}>
      <div className="w-[90%] max-w-5xl bg-primary rounded-[3rem] p-8 md:p-16 shadow-2xl border border-dark/5 flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1">
          <div className="font-data text-accent font-bold text-lg mb-4">STEP // {step}</div>
          <h3 className="font-heading font-bold text-4xl md:text-6xl uppercase tracking-tighter mb-6">{title}</h3>
          <p className="font-data text-dark/70 leading-relaxed text-sm md:text-base max-w-md">{desc}</p>
        </div>
        <div className="flex-1 flex justify-center items-center">
          <div ref={svgRef} className="w-64 h-64 bg-dark rounded-full flex items-center justify-center p-8 relative overflow-hidden">
            {animType === 'rotate' && (
              <svg viewBox="0 0 100 100" className="w-full h-full text-accent">
                <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" className="gear-path" />
                <rect x="45" y="10" width="10" height="80" fill="currentColor" className="gear-path opacity-50" />
                <rect x="10" y="45" width="80" height="10" fill="currentColor" className="gear-path opacity-50" />
              </svg>
            )}
            {animType === 'scan' && (
              <svg viewBox="0 0 100 100" className="w-full h-full text-primary">
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" className="opacity-30" />
                </pattern>
                <rect width="100" height="100" fill="url(#grid)" />
                <line x1="0" y1="0" x2="100" y2="0" stroke="#E63B2E" strokeWidth="2" className="laser-line" />
              </svg>
            )}
            {animType === 'pulse' && (
              <svg viewBox="0 0 100 100" className="w-full h-full text-accent">
                <path className="pulse-path" fill="none" stroke="currentColor" strokeWidth="3" strokelinecap="round" strokeDasharray="200" strokeDashoffset="200" d="M 10 50 L 30 50 L 40 20 L 60 80 L 70 50 L 90 50" />
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
          animation: gsap.to(card.querySelector('.bg-primary'), {
            scale: 0.9,
            opacity: 0.5,
            filter: "blur(10px)",
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
      <ProtocolCard step="01" title="The Free Audit" desc="Scan your repository in seconds. See exactly where your AI left you exposed to supply chain attacks and hallucinated packages." animType="scan" />
      <ProtocolCard step="02" title="AgentGuard Sandbox" desc="Upgrade to Pro. Drop in our SDK to physically block dangerous commands and prompt injections at runtime." animType="rotate" />
      <ProtocolCard step="03" title="The VibeCert Badge" desc="Embed your passing security score on your landing page to build trust and close enterprise deals." animType="pulse" isLast={true} />
    </section>
  );
};

// --- Get Started & Footer ---
const Footer = ({ onOpenScanner }) => {
  return (
    <>
      <section className="py-32 px-6 flex flex-col items-center justify-center bg-background text-center">
        <h2 className="font-heading font-bold text-5xl md:text-7xl uppercase tracking-tighter mb-8">Execute the <br/><span className="font-drama italic text-accent normal-case">Scan.</span></h2>
        <MagneticButton variant="primary" className="text-lg px-12 py-6" onClick={onOpenScanner}>Run a free scan</MagneticButton>
      </section>

      <footer className="bg-dark text-primary rounded-t-[4rem] pt-24 pb-12 px-12 mt-[-2rem] relative z-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-24">
          <div className="md:col-span-2">
            <div className="font-heading font-bold text-3xl tracking-tight mb-4">VibeGuard</div>
            <p className="font-data text-primary/50 text-sm max-w-sm">Selling peace of mind to a generation of builders who have the power to create but not the knowledge to protect.</p>
          </div>
          <div>
            <h4 className="font-heading font-bold uppercase tracking-widest text-xs mb-6 text-primary/50">Product</h4>
            <ul className="space-y-4 font-data text-sm">
              <li><a href="#" className="hover:text-accent transition-colors">VibeAudit</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">SecretShield</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">VibeCert</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading font-bold uppercase tracking-widest text-xs mb-6 text-primary/50">Legal</h4>
            <ul className="space-y-4 font-data text-sm">
              <li><a href="#" className="hover:text-accent transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-primary/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="font-data text-xs text-primary/40">© 2026 Zeerocodes Automation Limited.</div>
          <div className="flex items-center gap-3 font-data text-xs bg-primary/5 px-4 py-2 rounded-full border border-primary/10">
            <span className="w-2 h-2 rounded-full bg-[#00FF00] animate-pulse" /> SYSTEM OPERATIONAL
          </div>
        </div>
      </footer>
    </>
  );
};

// --- Pricing Section ---
const Pricing = () => {
  return (
    <section id="pricing" className="py-32 px-6 md:px-12 bg-primary text-dark">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="font-heading font-bold text-5xl md:text-7xl uppercase tracking-tighter">Protect Your <br/><span className="font-drama italic text-accent normal-case">Livelihood.</span></h2>
          <p className="font-data text-sm text-dark/70 mt-6 max-w-xl mx-auto">Don't let a hardcoded API key ruin your indie hacking journey. Upgrade to continuous, automated protection.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <div className="border border-dark/20 rounded-[3rem] p-10 flex flex-col transition-transform hover:-translate-y-2 bg-background">
            <div className="font-heading font-bold uppercase tracking-widest text-dark/50 text-sm mb-4">Starter</div>
            <div className="font-heading font-bold text-6xl mb-8">Free</div>
            <ul className="space-y-4 font-data text-sm text-dark/80 mb-12 flex-1">
              <li className="flex items-center gap-3"><Shield size={16} className="text-dark/40" /> 1 Manual Scan per month</li>
              <li className="flex items-center gap-3"><Shield size={16} className="text-dark/40" /> Basic hardcoded secrets detection</li>
              <li className="flex items-center gap-3"><Shield size={16} className="text-dark/40" /> Public repo support only</li>
            </ul>
            <MagneticButton variant="outline" className="w-full py-4 text-xs">Run Free Scan</MagneticButton>
          </div>
          
          {/* Pro Tier */}
          <div className="border-2 border-accent rounded-[3rem] p-10 flex flex-col bg-dark text-primary shadow-2xl relative transition-transform hover:-translate-y-2">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent text-primary font-heading font-bold uppercase tracking-widest text-[10px] px-4 py-2 rounded-full whitespace-nowrap">Recommended for Builders</div>
            <div className="font-heading font-bold uppercase tracking-widest text-primary/50 text-sm mb-4">Pro</div>
            <div className="flex items-end gap-2 mb-8">
              <div className="font-heading font-bold text-6xl">$49</div>
              <div className="font-data text-primary/50 text-sm mb-2">/ month</div>
            </div>
            <ul className="space-y-4 font-data text-sm text-primary/80 mb-12 flex-1">
              <li className="flex items-center gap-3"><Shield size={16} className="text-accent" /> Unlimited automated VibeAudits</li>
              <li className="flex items-center gap-3"><Shield size={16} className="text-accent" /> SecretShield auto-rotation enabled</li>
              <li className="flex items-center gap-3 bg-accent/20 border border-accent/40 rounded-xl p-3 -mx-3">
                <Shield size={16} className="text-accent" /> 
                <span><strong className="text-white">AgentGuard Sandbox</strong> <span className="text-accent animate-pulse font-bold ml-2">NEW</span><br/><span className="text-xs text-primary/60">Runtime protection against rogue AI commands.</span></span>
              </li>
              <li className="flex items-center gap-3"><Shield size={16} className="text-accent" /> Official VibeCert Trust Badge</li>
            </ul>
            <MagneticButton variant="primary" className="w-full py-4 text-xs border border-transparent shadow-[0_0_20px_rgba(230,59,46,0.3)]">Upgrade to Pro</MagneticButton>
          </div>
        </div>
      </div>
    </section>
  );
};

const ScannerModal = ({ isOpen, onClose }) => {
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
      if (!response.ok) throw new Error(data.error || 'Failed to queue the upload scan.');
      
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
        throw new Error(data.error || 'Failed to queue the scan.');
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dark/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-3xl bg-primary rounded-[2rem] p-8 md:p-12 shadow-2xl border border-dark/10 relative my-auto">
        <button onClick={onClose} className="absolute top-6 right-6 font-data text-xs uppercase hover:text-accent transition-colors">Close [X]</button>
        
        {isScanning ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
             <div className="font-heading font-bold text-3xl uppercase animate-pulse mb-6">Scanning <br/><span className="text-accent">{url.split('/').pop() || 'Repository'}</span></div>
             <div className="font-data text-xs text-dark/50">&gt; ROTATING_STATIC_ANALYSIS...<br/>&gt; VERIFYING_NPM_REGISTRY...<br/>&gt; EXTRACTING_VULNERABILITIES...</div>
          </div>
        ) : results ? (
          <div className="animate-in fade-in zoom-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b border-dark/10 pb-8">
              <div>
                <h3 className="font-heading font-bold text-3xl mb-2">Scan Complete</h3>
                <p className="font-data text-sm text-dark/70">Target: {results.repo}</p>
              </div>
              <div className="mt-4 md:mt-0 text-right">
                <div className="font-heading font-bold text-6xl text-accent leading-none mb-2">{results.grade}</div>
                <div className="font-data text-xs text-dark/70 uppercase tracking-widest">Security Score: {results.score}/100</div>
              </div>
            </div>

            <div className="relative space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              {results.findings && results.findings.length > 0 ? (
                <>
                  <div className="space-y-4 mb-32">
                    {results.findings.map((finding, idx) => (
                      <div key={idx} className="bg-white p-6 rounded-[2rem] shadow-sm border border-dark/5 relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-heading font-bold text-lg text-accent flex items-center gap-2">
                            <Shield size={16} /> {finding.title}
                          </h4>
                          <span className="font-data text-xs px-3 py-1 bg-accent/10 text-accent rounded-full uppercase">
                            {finding.category}
                          </span>
                        </div>
                        <div className="font-data text-xs text-dark/50 mb-4 bg-dark/5 px-3 py-2 rounded-xl inline-block">
                          {finding.file}
                        </div>
                        
                        <div className="relative">
                          <p className="text-dark/80 blur-sm select-none pointer-events-none">{finding.message || "This vulnerability allows remote code execution or data exfiltration. Remediation involves rewriting the affected logic and ensuring proper input sanitization."}</p>
                          <div className="absolute inset-0 flex items-center justify-center bg-white/40">
                            <div className="bg-dark text-primary font-data text-[10px] uppercase px-3 py-1 rounded-full flex items-center gap-2">
                              <Lock size={12} className="text-accent" /> Remediation Locked
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background to-transparent pt-20 pb-4 px-2">
                    <div className="bg-dark text-primary p-6 rounded-[2rem] shadow-[0_0_40px_rgba(230,59,46,0.2)] border-2 border-accent relative text-center">
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-primary font-heading font-bold uppercase tracking-widest text-[10px] px-4 py-2 rounded-full whitespace-nowrap">
                        Critical Action Required
                      </div>
                      <h4 className="font-heading font-bold text-2xl mb-2 text-white mt-2">Your codebase is exposed.</h4>
                      <p className="font-data text-xs text-primary/70 mb-6 leading-relaxed max-w-lg mx-auto">
                        Don't just find vulnerabilities—block them. Upgrade to VibeGuard Pro to unlock 1-click remediations and deploy the <strong className="text-white">AgentGuard Sandbox</strong> to protect against rogue AI commands.
                      </p>
                      <button 
                        onClick={() => { onClose(); setTimeout(() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }), 100); }}
                        className="w-full bg-accent text-white px-8 py-4 rounded-xl font-heading font-bold uppercase tracking-wide hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(230,59,46,0.4)]"
                      >
                        Upgrade to Pro - $49/mo
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 text-green-600 mb-4">
                    <Shield size={32} />
                  </div>
                  <h4 className="font-heading font-bold text-xl mb-2">No Vulnerabilities Found</h4>
                  <p className="text-dark/70">Your codebase looks clean and secure.</p>
                </div>
              )}
            </div>
            <div className="mt-8 flex gap-4">
              <MagneticButton variant="outline" className="flex-1" onClick={resetScanner}>Scan Another</MagneticButton>
              {results.score >= 80 && (
                <MagneticButton variant="primary" className="flex-1" onClick={() => navigate(`/cert/${results.id || 'demo'}`)}>View VibeCert</MagneticButton>
              )}
            </div>
          </div>
        ) : (
          <>
            <h3 className="font-heading font-bold text-3xl md:text-5xl uppercase tracking-tighter mb-4">Initialize <br/><span className="font-drama italic text-accent normal-case md:text-6xl">VibeAudit.</span></h3>
            <p className="font-data text-sm text-dark/70 mb-8 max-w-md">Paste a GitHub repo URL (e.g. `https://github.com/owner/repo`) to run a plain-language security scan across the codebase.</p>
            
            <div className="space-y-4">
              <input 
                type="text" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://github.com/your-username/vibe-project" 
                className="w-full bg-background border border-dark/20 rounded-xl px-6 py-4 font-data text-sm text-dark placeholder:text-dark/40 focus:outline-none focus:border-accent"
              />
              
              <div className="flex items-center justify-center w-full my-2">
                <label className="flex flex-col items-center justify-center w-full py-6 border-2 border-dark/20 border-dashed rounded-xl cursor-pointer bg-background hover:bg-dark/5 transition-colors">
                  <div className="flex flex-col items-center justify-center">
                    <p className="text-xs font-data text-dark/50 uppercase tracking-widest"><span className="font-bold text-dark">Click to upload</span> a local .zip file instead</p>
                  </div>
                  <input ref={fileInputRef} type="file" accept=".zip" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
              {error && <div className="text-accent font-data text-xs">{error}</div>}
              <div className="flex gap-4">
                <MagneticButton variant="primary" className="flex-1" onClick={handleScan}>Start Scan</MagneticButton>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const Home = () => {
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-dark selection:bg-accent selection:text-primary font-data overflow-x-hidden">
      <svg className="hidden">
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch"/>
        </filter>
      </svg>
      <div className="fixed inset-0 opacity-5 pointer-events-none z-50" style={{ filter: 'url(#noise)' }}></div>
      
      <Navbar onOpenScanner={() => setIsScannerOpen(true)} />
      
      <main>
        <Hero onOpenScanner={() => setIsScannerOpen(true)} />
        <Features />
        <Philosophy />
        <Protocol />
        <Pricing />
        <Footer onOpenScanner={() => setIsScannerOpen(true)} />
      </main>
      <ScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} />
    </div>
  );
};

import CertPage from './CertPage';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cert/:id" element={<CertPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
