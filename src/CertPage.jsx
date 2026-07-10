import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Shield, CheckCircle, ExternalLink, ArrowLeft } from 'lucide-react';

const CertPage = () => {
  const { id } = useParams();
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchScan() {
      try {
        const res = await fetch(`/api/scan/${id}`);
        const data = await res.json();
        if (data.status === 'completed') {
          setScan(data.result);
        } else {
          setError('Scan not found or still processing.');
        }
      } catch (err) {
        setError('Failed to load certificate.');
      } finally {
        setLoading(false);
      }
    }
    fetchScan();
  }, [id]);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-dark font-data">Verifying Certificate...</div>;
  if (error) return <div className="min-h-screen bg-background flex items-center justify-center text-accent font-data">{error}</div>;

  const isSecure = scan.score >= 80;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ filter: 'url(#noise)' }}></div>
      <svg className="hidden"><filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch"/></filter></svg>

      <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-dark/50 hover:text-dark font-data text-sm transition-colors z-20">
        <ArrowLeft size={16} /> Back to VibeGuard
      </Link>

      <div className="max-w-2xl w-full bg-primary rounded-[3rem] p-12 md:p-16 shadow-2xl border border-dark/10 text-center relative z-10">
        <div className={`mx-auto w-32 h-32 rounded-full flex items-center justify-center mb-8 shadow-inner ${isSecure ? 'bg-green-500/10 text-green-600' : 'bg-accent/10 text-accent'}`}>
          {isSecure ? <CheckCircle size={64} /> : <Shield size={64} />}
        </div>
        
        <h1 className="font-heading font-bold text-4xl md:text-5xl uppercase tracking-tight mb-2">VibeCert <br/><span className={isSecure ? "text-green-600" : "text-accent"}>{isSecure ? "Verified" : "Unverified"}</span></h1>
        
        <p className="font-data text-dark/60 mb-12 max-w-md mx-auto">
          This certificate proves the security posture of the codebase against AI-generated vulnerabilities, hardcoded secrets, and supply chain hallucinations.
        </p>

        <div className="bg-white rounded-3xl p-8 border border-dark/5 text-left mb-12 shadow-sm">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="font-data text-xs text-dark/40 uppercase tracking-widest mb-1">Target Repository</div>
              <div className="font-heading font-bold text-xl">{scan.repo}</div>
            </div>
            <div>
              <div className="font-data text-xs text-dark/40 uppercase tracking-widest mb-1">Security Score</div>
              <div className={`font-heading font-bold text-3xl ${isSecure ? 'text-green-600' : 'text-accent'}`}>{scan.score}/100 ({scan.grade})</div>
            </div>
          </div>
        </div>

        <div className="font-data text-xs text-dark/40 uppercase tracking-widest flex items-center justify-center gap-2">
          Protected by VibeGuard <ExternalLink size={12} />
        </div>
      </div>
    </div>
  );
};

export default CertPage;
