import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import multer from 'multer';
import pino from 'pino';
import { scanQueue } from './queue.js';
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

const scanLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 10, 
  message: { error: 'Too many scans initiated from this IP.' }
});

const scanSchema = z.object({
  url: z.string().url().regex(/^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/, 'Must be a valid GitHub repository URL'),
});

app.post('/api/scan', scanLimiter, async (req, res) => {
  try {
    const { url } = scanSchema.parse(req.body);
    logger.info({ action: 'scan_queued', url });
    
    const job = await scanQueue.add('scan-repo', { url });
    
    res.status(202).json({ scan_id: job.id, status: 'queued' });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors[0].message });
    logger.error({ action: 'queue_failed', error: error.message });
    res.status(500).json({ error: 'Internal server error while queueing scan.' });
  }
});

app.post('/api/scan/upload', scanLimiter, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'ZIP file is required.' });
    logger.info({ action: 'zip_uploaded', file: req.file.path });
    
    const job = await scanQueue.add('scan-zip', { filePath: req.file.path });
    
    res.status(202).json({ scan_id: job.id, status: 'queued' });
  } catch (error) {
    logger.error({ action: 'upload_failed', error: error.message });
    res.status(500).json({ error: 'Internal server error processing upload.' });
  }
});

app.get('/api/scan/:id', async (req, res) => {
  try {
    const job = await scanQueue.getJob(req.params.id);
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

app.listen(PORT, () => {
  logger.info(`[VibeAudit] Production Backend server running on port ${PORT}`);
});
