import React, { useState, useRef } from 'react';
import { Upload, Link, CheckCircle2, AlertTriangle, FileText, X } from 'lucide-react';
import { startScan, uploadZip } from '../lib/api.js';

interface ScanInputProps {
  onScanStarted: (scanId: string) => void;
  onError: (err: string) => void;
}

export default function ScanInput({ onScanStarted, onError }: ScanInputProps) {
  const [repoUrl, setRepoUrl] = useState('');
  const [email, setEmail] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('Initiating scan...');
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(8);
  const [cancelRequested, setCancelRequested] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Validate GitHub URL
  const validateUrl = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) {
      setIsValid(null);
      return;
    }
    // HTTPS or SSH GitHub URL formats
    const httpsRegex = /^https?:\/\/(www\.)?github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(\/)?$/;
    const sshRegex = /^git@github\.com:[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\.git$/;
    
    setIsValid(httpsRegex.test(trimmed) || sshRegex.test(trimmed));
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRepoUrl(value);
    validateUrl(value);
  };

  // Drag and Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith('.zip')) {
      onError('Only ZIP files are supported.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      onError('ZIP file exceeds the 50MB limit.');
      return;
    }
    setUploadedFile(file);
    setRepoUrl('');
    setIsValid(true);
  };

  const removeFile = () => {
    setUploadedFile(null);
    setIsValid(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Simulated progress timer for smooth UX under 10s
  const startProgressTimer = () => {
    setProgress(0);
    setTimeRemaining(8);
    setCancelRequested(false);
    
    let count = 0;
    timerRef.current = setInterval(() => {
      count += 1;
      if (count <= 3) {
        setLoadingStage('Cloning repository...');
        setProgress(Math.round(count * 10)); // 0% to 30%
      } else if (count <= 7) {
        setLoadingStage('Running security checks...');
        setProgress(Math.round(30 + (count - 3) * 12.5)); // 30% to 80%
      } else if (count <= 9) {
        setLoadingStage('Analyzing results...');
        setProgress(Math.round(80 + (count - 7) * 10)); // 80% to 100%
      }
      
      setTimeRemaining((prev) => Math.max(1, prev - 1));
      
      if (count >= 10) {
        if (timerRef.current) clearInterval(timerRef.current);
      }
    }, 900);
  };

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    startProgressTimer();

    try {
      let result;
      if (uploadedFile) {
        result = await uploadZip(uploadedFile, email || undefined);
      } else {
        result = await startScan(repoUrl.trim(), email || undefined);
      }

      // Check if user cancelled while loading was happening
      if (cancelRequested) return;

      // Finish loading
      setProgress(100);
      setLoadingStage('Ready!');
      setTimeout(() => {
        onScanStarted(result.scan_id);
        setLoading(false);
        if (timerRef.current) clearInterval(timerRef.current);
      }, 500);

    } catch (err: any) {
      if (timerRef.current) clearInterval(timerRef.current);
      setLoading(false);
      onError(err.message || 'Scan failed to start. Verify your repository is public.');
    }
  };

  const handleCancel = () => {
    setCancelRequested(true);
    setLoading(false);
    if (timerRef.current) clearInterval(timerRef.current);
    onError('Scan cancelled by user.');
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-1" id="scan-input-container">
      {loading ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-2xl text-center">
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="relative w-24 h-24 flex items-center justify-center">
              {/* Radial loading effect */}
              <div className="absolute inset-0 border-4 border-[#00f0ff]/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-t-[#00f0ff] rounded-full animate-spin"></div>
              <span className="text-sm font-mono text-[#00f0ff]">{progress}%</span>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-medium tracking-tight text-white">{loadingStage}</h3>
              <p className="text-xs text-[#e8e8f0]/50 font-mono">
                Estimated time remaining: {timeRemaining}s
              </p>
            </div>

            {/* Linear Progress Bar */}
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-[#00f0ff] h-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>

            <button
              onClick={handleCancel}
              className="text-xs font-mono text-[#ff1744] hover:text-[#ff1744]/80 transition-colors border border-[#ff1744]/20 bg-[#ff1744]/5 px-4 py-2 rounded-lg"
            >
              Cancel Scan
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleScanSubmit} className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-2xl space-y-5">
            {/* Input URL or drag/drop */}
            {!uploadedFile ? (
              <div className="space-y-3">
                <label className="block text-xs font-mono text-[#e8e8f0]/60 uppercase tracking-wider">
                  Paste Repository URL
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-[#e8e8f0]/40">
                    <Link className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    value={repoUrl}
                    onChange={handleUrlChange}
                    placeholder="https://github.com/username/repository"
                    className="w-full pl-12 pr-12 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder-[#e8e8f0]/30 focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/50 transition-all font-sans text-sm"
                  />
                  {isValid === true && (
                    <div className="absolute right-4 text-[#00e676]">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  )}
                  {isValid === false && (
                    <div className="absolute right-4 text-[#ff1744]">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                  )}
                </div>
                {isValid === false && (
                  <p className="text-xs text-[#ff1744] flex items-center gap-1 font-mono">
                    Please paste a valid public GitHub repository URL.
                  </p>
                )}
              </div>
            ) : (
              <div className="border border-[#00f0ff]/20 bg-[#00f0ff]/5 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-[#00f0ff]/10 p-2.5 rounded-lg text-[#00f0ff]">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white truncate max-w-[280px]">
                      {uploadedFile.name}
                    </h4>
                    <p className="text-xs text-[#e8e8f0]/40 font-mono">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB • Ready to scan
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="p-1 text-[#e8e8f0]/40 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* Drag & Drop Upload Zone */}
            {!repoUrl && !uploadedFile && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 ${
                  isDragOver
                    ? 'border-[#00f0ff] bg-[#00f0ff]/5 text-[#00f0ff]'
                    : 'border-white/10 hover:border-[#00f0ff]/30 hover:bg-white/5 text-[#e8e8f0]/40'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".zip"
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <Upload className="h-8 w-8 text-[#e8e8f0]/30 mb-1" />
                  <p className="text-xs font-sans text-[#e8e8f0]/60 font-medium">
                    Or <span className="text-[#00f0ff] hover:underline">browse your computer</span> to upload a ZIP
                  </p>
                  <p className="text-[10px] font-mono text-[#e8e8f0]/30">
                    ZIP file up to 50MB (No executable binaries)
                  </p>
                </div>
              </div>
            )}

            {/* Email Gate Input (Optional) */}
            <div className="space-y-2 border-t border-white/10 pt-4">
              <label className="block text-[11px] font-mono text-[#e8e8f0]/60 uppercase tracking-wider">
                Notify Email (Optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@vibe-coder.com"
                className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder-[#e8e8f0]/30 focus:outline-none focus:border-[#00f0ff] transition-all font-sans text-xs"
              />
              <p className="text-[10px] text-[#e8e8f0]/40 font-mono">
                Receive the detailed PDF report and security fixes guide when complete.
              </p>
            </div>

            {/* CTA Scan Button */}
            <button
              type="submit"
              disabled={!isValid}
              className={`w-full py-3.5 rounded-xl font-mono text-sm uppercase tracking-wider font-bold transition-all duration-300 ${
                isValid
                  ? 'bg-[#00f0ff] text-[#0a0a0f] hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(0,240,255,0.3)]'
                  : 'bg-white/5 text-[#e8e8f0]/30 cursor-not-allowed border border-white/5'
              }`}
            >
              Scan Project Now
            </button>
          </div>

          {/* Social Proof Badges */}
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 pt-2 text-[11px] font-mono text-[#e8e8f0]/40">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#00f0ff]" />
              Trusted by 2,000+ vibe coders
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#00f0ff]" />
              No signup required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#00f0ff]" />
              Free forever
            </span>
          </div>
        </form>
      )}
    </div>
  );
}
