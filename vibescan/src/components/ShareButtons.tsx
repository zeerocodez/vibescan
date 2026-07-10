import React, { useState } from 'react';
import { Share2, Twitter, Linkedin, Copy, Check, Code } from 'lucide-react';

interface ShareButtonsProps {
  scanId: string;
  score: number;
}

export default function ShareButtons({ scanId, score }: ShareButtonsProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  const shareUrl = `${window.location.origin}/r/${scanId}`;
  const badgeUrl = `${window.location.origin}/api/v1/badge/${scanId}.svg`;

  // Markdown snippet
  const embedCode = `[![VibeScan Score Badge](${badgeUrl})](${shareUrl})`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  // Pre-filled social URLs
  const tweetText = encodeURIComponent(
    `I just scanned my app with @VibeScan. Security Score: ${score}/100. What's yours? Check the scorecard here: ${shareUrl}`
  );
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;

  const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl space-y-5" id="share-panel">
      <div className="flex items-center gap-2 mb-2 text-[#00f0ff] font-mono text-xs uppercase tracking-wider font-bold">
        <Share2 className="h-4 w-4" />
        <span>Brag and Embed Badge</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Twitter */}
        <a
          href={twitterShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-3 bg-black/40 hover:bg-white/10 border border-white/10 rounded-xl font-medium text-xs text-white transition-all"
        >
          <Twitter className="h-4 w-4 text-[#1da1f2]" />
          Share on X / Twitter
        </a>

        {/* LinkedIn */}
        <a
          href={linkedinShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-3 bg-black/40 hover:bg-white/10 border border-white/10 rounded-xl font-medium text-xs text-white transition-all"
        >
          <Linkedin className="h-4 w-4 text-[#0a66c2]" />
          Share on LinkedIn
        </a>

        {/* Copy Link */}
        <button
          onClick={handleCopyLink}
          className="flex items-center justify-center gap-2 py-3 bg-[#00f0ff] hover:opacity-90 text-[#0a0a0f] font-bold rounded-xl text-xs transition-all"
        >
          {copiedLink ? (
            <>
              <Check className="h-4 w-4" />
              Copied Scorecard Link!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy Scorecard Link
            </>
          )}
        </button>
      </div>

      {/* Embed Badge Snippet */}
      <div className="border-t border-white/10 pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-mono text-[#e8e8f0]/60 uppercase tracking-wider font-semibold">
            GitHub README Badge Markdown
          </label>
          <button
            onClick={handleCopyEmbed}
            className="text-[10px] font-mono text-[#00f0ff] hover:underline flex items-center gap-1"
          >
            {copiedEmbed ? 'Copied Snippet!' : 'Copy Code'}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-black/40 p-4 rounded-xl border border-white/10">
          <div className="flex-1 overflow-x-auto">
            <code className="text-[10px] font-mono text-[#e8e8f0]/60 whitespace-nowrap block select-all">
              {embedCode}
            </code>
          </div>
          <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto border-t border-white/10 sm:border-0 pt-3 sm:pt-0">
            <span className="text-[10px] font-mono text-[#e8e8f0]/40">Live preview:</span>
            <img src={badgeUrl} alt="VibeScan Score Badge" className="h-5 shrink-0" referrerPolicy="no-referrer" />
          </div>
        </div>
      </div>
    </div>
  );
}
