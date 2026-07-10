import 'dotenv/config';
import express from 'express';
import path from 'path';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { initDb, getScanById, saveScan, saveFindings, getFindingsByScanId, getLeaderboard, getOrCreateUser, incrementUserScanCount } from './server/db.js';
import { performScan } from './server/scanEngine.js';
import { Scan, Finding } from './src/types.js';

// Initialize Database
initDb();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-Memory IP-based rate limiter (10 scans per hour)
const rateLimitCache = new Map<string, { count: number; resetTime: number }>();
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitCache.get(ip);
  if (!limit) {
    rateLimitCache.set(ip, { count: 1, resetTime: now + 3600000 });
    return true;
  }
  if (now > limit.resetTime) {
    rateLimitCache.set(ip, { count: 1, resetTime: now + 3600000 });
    return true;
  }
  if (limit.count >= 10) {
    return false;
  }
  limit.count++;
  return true;
}

// Multer memory-storage setup for ZIP file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

// GET Leaderboard
app.get('/api/v1/leaderboard', (req, res) => {
  try {
    const items = getLeaderboard();
    res.json({ period: 'alltime', projects: items });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET Scan Results
app.get('/api/v1/scan/:id', (req, res) => {
  const scanId = req.params.id;
  const scan = getScanById(scanId);
  if (!scan) {
    res.status(404).json({ error: 'Scan not found' });
    return;
  }

  if (scan.status === 'completed') {
    const findings = getFindingsByScanId(scanId);
    res.json({
      ...scan,
      findings,
    });
  } else {
    // Return status and progress estimates
    let progress = 0;
    let stage = 'queued';
    if (scan.status === 'cloning') {
      progress = 20;
      stage = 'Cloning repository...';
    } else if (scan.status === 'scanning') {
      progress = 60;
      stage = 'Running security checks...';
    } else if (scan.status === 'processing') {
      progress = 90;
      stage = 'Analyzing results...';
    } else if (scan.status === 'failed') {
      progress = 100;
      stage = 'Failed';
    }

    res.json({
      ...scan,
      progress,
      stage,
    });
  }
});

// POST Scan GitHub Repository
app.post('/api/v1/scan/github', (req, res) => {
  const { repo_url, email } = req.body;
  
  if (!repo_url || typeof repo_url !== 'string') {
    res.status(400).json({ error: 'repo_url is required and must be a string' });
    return;
  }

  // Rate Limiting
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  if (!checkRateLimit(clientIp)) {
    res.status(429).json({ error: 'Too many scans. Rate limit exceeded (Max 10/hour). Upgrade to VibeGuard Pro for unlimited scans.' });
    return;
  }

  // Validate GitHub URL format
  const githubRegex = /github\.com\/[^/]+\/[^/]+/;
  if (!githubRegex.test(repo_url)) {
    res.status(400).json({ error: 'Invalid GitHub URL format. Use https://github.com/owner/repo format.' });
    return;
  }

  const scanId = `scan_${Math.random().toString(36).substring(2, 14)}`;
  const shareToken = Math.random().toString(36).substring(2, 18);

  const initialScan: Scan = {
    id: scanId,
    repoUrl: repo_url,
    repoName: repo_url.split('/').pop()?.replace(/\.git$/, '') || 'project',
    repoOwner: repo_url.split('/').slice(-2)[0] || 'user',
    status: 'cloning',
    createdAt: new Date().toISOString(),
    startedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(), // 30 days
    shareToken,
  };

  if (email) {
    initialScan.userEmail = email;
    getOrCreateUser(email);
    incrementUserScanCount(email);
  }

  saveScan(initialScan);

  // Run scanning asynchronously in the background
  const startTime = Date.now();
  performScan(repo_url, scanId)
    .then(({ scanData, findings }) => {
      const completedScan: Scan = {
        ...initialScan,
        ...scanData,
        status: 'completed',
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
      } as Scan;
      saveScan(completedScan);
      saveFindings(scanId, findings);
      console.log(`Scan ${scanId} completed successfully in ${Date.now() - startTime}ms.`);
    })
    .catch((err) => {
      console.error(`Scan ${scanId} failed:`, err);
      const failedScan: Scan = {
        ...initialScan,
        status: 'failed',
        completedAt: new Date().toISOString(),
        errorMessage: err instanceof Error ? err.message : String(err),
      };
      saveScan(failedScan);
    });

  res.status(202).json({
    scan_id: scanId,
    status: 'queued',
    estimated_time: 8,
    result_url: `/r/${scanId}`,
    queue_position: 1,
  });
});

// POST Upload ZIP file
app.post('/api/v1/scan/upload', upload.single('file'), (req, res) => {
  const email = req.body.email;
  
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded or invalid file format.' });
    return;
  }

  if (!req.file.originalname.endsWith('.zip')) {
    res.status(400).json({ error: 'Only ZIP archives are supported.' });
    return;
  }

  const scanId = `scan_${Math.random().toString(36).substring(2, 14)}`;
  const shareToken = Math.random().toString(36).substring(2, 18);

  const initialScan: Scan = {
    id: scanId,
    repoUrl: `ZIP Upload: ${req.file.originalname}`,
    repoName: req.file.originalname.replace(/\.zip$/, ''),
    repoOwner: 'uploaded',
    status: 'scanning',
    createdAt: new Date().toISOString(),
    startedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    shareToken,
  };

  if (email) {
    initialScan.userEmail = email;
    getOrCreateUser(email);
    incrementUserScanCount(email);
  }

  saveScan(initialScan);

  const startTime = Date.now();
  const fileBuffer = req.file.buffer;

  performScan(`zip://${req.file.originalname}`, scanId, fileBuffer)
    .then(({ scanData, findings }) => {
      const completedScan: Scan = {
        ...initialScan,
        ...scanData,
        status: 'completed',
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
      } as Scan;
      saveScan(completedScan);
      saveFindings(scanId, findings);
      console.log(`ZIP Scan ${scanId} completed successfully in ${Date.now() - startTime}ms.`);
    })
    .catch((err) => {
      console.error(`ZIP Scan ${scanId} failed:`, err);
      const failedScan: Scan = {
        ...initialScan,
        status: 'failed',
        completedAt: new Date().toISOString(),
        errorMessage: err instanceof Error ? err.message : String(err),
      };
      saveScan(failedScan);
    });

  res.status(202).json({
    scan_id: scanId,
    status: 'queued',
    estimated_time: 8,
    result_url: `/r/${scanId}`,
    queue_position: 1,
  });
});

// GET SVG Badge for scan
app.get('/api/v1/badge/:id.svg', (req, res) => {
  const scanId = req.params.id;
  const scan = getScanById(scanId);
  
  let score = 'N/A';
  let color = '#555555'; // grey
  
  if (scan && scan.status === 'completed' && scan.overallScore !== undefined) {
    score = `${scan.overallScore}/100`;
    if (scan.overallScore >= 90) {
      color = '#00e676'; // green
    } else if (scan.overallScore >= 70) {
      color = '#ffc107'; // yellow
    } else {
      color = '#ff1744'; // red
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="20">
    <linearGradient id="b" x2="0" y2="100%">
      <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
      <stop offset="1" stop-opacity=".1"/>
    </linearGradient>
    <mask id="a">
      <rect width="120" height="20" rx="3" fill="#fff"/>
    </mask>
    <g mask="url(#a)">
      <path fill="#0a0a0f" d="M0 0h65v20H0z"/>
      <path fill="${color}" d="M65 0h55v20H65z"/>
      <path fill="url(#b)" d="M0 0h120v20H0z"/>
    </g>
    <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
      <text x="32.5" y="15" fill="#010101" fill-opacity=".3">VibeScan</text>
      <text x="32.5" y="14">VibeScan</text>
      <text x="92.5" y="15" fill="#010101" fill-opacity=".3">${score}</text>
      <text x="92.5" y="14">${score}</text>
    </g>
  </svg>`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
  res.send(svg);
});

// POST Email Capture
app.post('/api/v1/email-capture', (req, res) => {
  const { email, scanId } = req.body;
  if (!email || !scanId) {
    res.status(400).json({ error: 'Email and scanId are required.' });
    return;
  }
  try {
    const scan = getScanById(scanId);
    if (scan) {
      scan.userEmail = email;
      saveScan(scan);
      getOrCreateUser(email);
      incrementUserScanCount(email);
    }
    res.json({ success: true, message: 'Your detailed fix guide is on the way!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Vite Setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
