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

app.listen(PORT, () => {
  logger.info(`[VibeAudit] Production Backend server running on port ${PORT}`);
});
