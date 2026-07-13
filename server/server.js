import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import multer from 'multer';
import pino from 'pino';
import { scanQueue, connection } from './queue.js';
import { runScan } from './scanner.js';
import { generateBadge } from './badge.js';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const app = express();
const PORT = process.env.PORT || 3001;

const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

app.use(helmet());
app.use(cors());
app.use(express.json());

const fallbackStore = new Map();
let isRedisConnected = true;

connection.on('error', (err) => {
  logger.error({ action: 'redis_connection_error', error: err.message });
  isRedisConnected = false;
});

connection.on('connect', () => {
  logger.info({ action: 'redis_connected' });
  isRedisConnected = true;
});

const scanLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 10, 
  message: { error: 'Too many scans initiated from this IP.' }
});

const scanSchema = z.object({
  url: z.string().url('Must be a valid URL (GitHub repository or launched web app)'),
});

app.post('/api/scan', scanLimiter, async (req, res) => {
  try {
    let { url } = req.body;
    if (typeof url === 'string') {
      url = url.trim();
      if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
      }
    }
    const validatedData = scanSchema.parse({ url });
    const validatedUrl = validatedData.url;
    logger.info({ action: 'scan_queued', url: validatedUrl });
    
    if (!isRedisConnected) {
      const scanId = 'mock-' + Math.random().toString(36).substr(2, 9);
      fallbackStore.set(scanId, { status: 'active' });
      
      setTimeout(async () => {
        try {
          const report = await runScan(url);
          fallbackStore.set(scanId, { status: 'completed', result: report });
        } catch (err) {
          fallbackStore.set(scanId, { status: 'failed', error: err.message });
        }
      }, 3000);
      
      return res.status(202).json({ scan_id: scanId, status: 'queued' });
    }
    
    const job = await scanQueue.add('scan-repo', { url });
    
    res.status(202).json({ scan_id: job.id, status: 'queued' });
  } catch (error) {
    logger.error({ action: 'scan_failed', error: error.message, stack: error.stack });
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message || error.message });
    }
    logger.error({ action: 'queue_failed', error: error.message });
    res.status(500).json({ error: 'Internal server error while queueing scan.' });
  }
});

app.post('/api/scan/upload', scanLimiter, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'ZIP file is required.' });
    logger.info({ action: 'zip_uploaded', file: req.file.path });
    
    if (!isRedisConnected) {
      const scanId = 'mock-' + Math.random().toString(36).substr(2, 9);
      fallbackStore.set(scanId, { status: 'active' });
      
      const filePath = req.file.path;
      setTimeout(async () => {
        try {
          const report = await runScan(null, filePath);
          fallbackStore.set(scanId, { status: 'completed', result: report });
        } catch (err) {
          fallbackStore.set(scanId, { status: 'failed', error: err.message });
        }
      }, 3000);
      
      return res.status(202).json({ scan_id: scanId, status: 'queued' });
    }
    
    const job = await scanQueue.add('scan-zip', { filePath: req.file.path });
    
    res.status(202).json({ scan_id: job.id, status: 'queued' });
  } catch (error) {
    logger.error({ action: 'upload_failed', error: error.message });
    res.status(500).json({ error: 'Internal server error processing upload.' });
  }
});

app.get('/api/scan/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (id.startsWith('mock-') || !isRedisConnected) {
      const job = fallbackStore.get(id);
      if (job) {
        return res.json(job);
      }
    }
    
    const job = await scanQueue.getJob(id);
    if (!job) return res.status(404).json({ error: 'Scan not found' });
    
    const state = await job.getState();
    if (state === 'completed') return res.json({ status: 'completed', result: job.returnvalue });
    else if (state === 'failed') return res.status(500).json({ status: 'failed', error: job.failedReason });
    else return res.json({ status: state });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching scan status.' });
  }
});

app.get('/api/badge/:id.svg', async (req, res) => {
  try {
    const scan = await prisma.scan.findUnique({ where: { id: req.params.id } });
    if (!scan) return res.status(404).send('Badge not found');
    
    const svg = generateBadge(scan.overallScore, scan.grade || 'C');
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
  } catch (error) {
    res.status(500).send('Error generating badge');
  }
});

// AgentGuard Alert Endpoint
app.post('/api/agent/alert', async (req, res) => {
  try {
    const { projectId, command } = req.body;
    
    await prisma.agentAlert.create({
      data: {
        projectId: projectId || 'demo-project',
        command,
        blocked: true
      }
    });
    
    logger.warn({ action: 'agent_blocked', projectId, command });
    res.status(200).json({ status: 'logged' });
  } catch (error) {
    logger.error({ action: 'agent_alert_failed', error: error.message });
    res.status(500).json({ error: 'Failed to log alert' });
  }
});

// AgentGuard Telemetry Fetch
app.get('/api/agent/telemetry', async (req, res) => {
  try {
    const alerts = await prisma.agentAlert.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' }
    });
    res.json(alerts);
  } catch (error) {
    logger.error({ action: 'fetch_telemetry_failed', error: error.message });
    res.status(500).json({ error: 'Failed to fetch telemetry' });
  }
});

// POST /api/auth/google
app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Credential token is required.' });
    }
    
    const parts = credential.split('.');
    if (parts.length !== 3) {
      return res.status(400).json({ error: 'Invalid Google credential token.' });
    }
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
    
    const email = payload.email;
    const name = payload.name || email.split('@')[0];
    const picture = payload.picture || '';
    
    if (!email) {
      return res.status(400).json({ error: 'Email could not be verified from token.' });
    }
    
    let user = await prisma.user.findUnique({ where: { email } });
    const tierToSet = email === 'zeerocodes@gmail.com' ? 'pro' : 'free';
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          tier: tierToSet,
        }
      });
      logger.info({ action: 'user_created', email, tier: tierToSet });
    } else if (email === 'zeerocodes@gmail.com' && user.tier !== 'pro') {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { tier: 'pro' }
      });
      logger.info({ action: 'admin_auto_promoted', email });
    }
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        tier: user.tier,
        name,
        picture
      }
    });
  } catch (error) {
    logger.error({ action: 'google_auth_failed', error: error.message });
    res.status(500).json({ error: 'Failed to authenticate Google user.' });
  }
});

// Admin Authorization Middleware
const checkAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || (authHeader !== 'Bearer admin-super-privilege' && authHeader !== 'Bearer zeerocodes@gmail.com')) {
    return res.status(401).json({ error: 'Unauthorized administrative access.' });
  }
  next();
};

// Admin Endpoints
app.get('/api/admin/stats', checkAdmin, async (req, res) => {
  try {
    const usersCount = await prisma.user.count();
    const scansCount = await prisma.scan.count();
    const findingsCount = await prisma.finding.count();
    const alertsCount = await prisma.agentAlert.count();
    res.json({ usersCount, scansCount, findingsCount, alertsCount });
  } catch (error) {
    logger.error({ action: 'admin_stats_failed', error: error.message });
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

app.get('/api/admin/users', checkAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    logger.error({ action: 'admin_users_failed', error: error.message });
    res.status(500).json({ error: 'Failed to fetch admin users' });
  }
});

app.put('/api/admin/users/:id/tier', checkAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { tier } = req.body;
    const updated = await prisma.user.update({
      where: { id },
      data: { tier }
    });
    res.json(updated);
  } catch (error) {
    logger.error({ action: 'admin_update_tier_failed', error: error.message });
    res.status(500).json({ error: 'Failed to update user tier' });
  }
});

app.delete('/api/admin/users/:id', checkAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({
      where: { id }
    });
    res.json({ success: true });
  } catch (error) {
    logger.error({ action: 'admin_delete_user_failed', error: error.message });
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

app.get('/api/admin/scans', checkAdmin, async (req, res) => {
  try {
    const scans = await prisma.scan.findMany({
      include: {
        _count: {
          select: { findings: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(scans);
  } catch (error) {
    logger.error({ action: 'admin_scans_failed', error: error.message });
    res.status(500).json({ error: 'Failed to fetch admin scans' });
  }
});

app.get('/api/admin/scans/:id/findings', checkAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const findings = await prisma.finding.findMany({
      where: { scanId: id }
    });
    res.json(findings);
  } catch (error) {
    logger.error({ action: 'admin_findings_failed', error: error.message });
    res.status(500).json({ error: 'Failed to fetch findings' });
  }
});

app.delete('/api/admin/scans/:id', checkAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.scan.delete({
      where: { id }
    });
    res.json({ success: true });
  } catch (error) {
    logger.error({ action: 'admin_delete_scan_failed', error: error.message });
    res.status(500).json({ error: 'Failed to delete scan' });
  }
});

// Admin Scan Fix
app.post('/api/admin/scans/:id/fix', checkAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.finding.deleteMany({
      where: { scanId: id }
    });
    const updated = await prisma.scan.update({
      where: { id },
      data: {
        overallScore: 100,
        grade: 'A',
        status: 'completed'
      }
    });
    logger.warn({ action: 'admin_scan_fixed', scanId: id });
    res.json(updated);
  } catch (error) {
    logger.error({ action: 'admin_fix_scan_failed', error: error.message });
    res.status(500).json({ error: 'Failed to apply security fix' });
  }
});

app.get('/api/admin/alerts', checkAdmin, async (req, res) => {
  try {
    const alerts = await prisma.agentAlert.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(alerts);
  } catch (error) {
    logger.error({ action: 'admin_alerts_failed', error: error.message });
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

app.post('/api/admin/alerts/mock', checkAdmin, async (req, res) => {
  try {
    const alert = await prisma.agentAlert.create({
      data: {
        projectId: 'mock-admin-testing',
        command: 'rm -rf /var/www/html/secure_endpoint',
        blocked: true
      }
    });
    res.json(alert);
  } catch (error) {
    logger.error({ action: 'admin_mock_alert_failed', error: error.message });
    res.status(500).json({ error: 'Failed to create mock alert' });
  }
});

app.delete('/api/admin/alerts', checkAdmin, async (req, res) => {
  try {
    await prisma.agentAlert.deleteMany({});
    res.json({ success: true });
  } catch (error) {
    logger.error({ action: 'admin_clear_alerts_failed', error: error.message });
    res.status(500).json({ error: 'Failed to clear alerts' });
  }
});

app.listen(PORT, () => {
  logger.info(`[VibeAudit] Production Backend server running on port ${PORT}`);
});

