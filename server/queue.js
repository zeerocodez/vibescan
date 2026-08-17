import 'dotenv/config';
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { runScan } from './scanner.js';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import pkg from '@prisma/client';
import { EventEmitter } from 'events';

const { PrismaClient } = pkg;

let prisma = null;
try {
  if (process.env.DATABASE_URL) {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });
  }
} catch (e) {
  console.warn('[Queue] Database connection initialization warning:', e.message);
}

// Resilient Redis Connection & Queue Wrapper
let connection = null;
let scanQueue = null;
let scanWorker = null;

if (process.env.REDIS_URL && process.env.NODE_ENV !== 'test') {
  try {
    connection = new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      connectTimeout: 5000,
      retryStrategy: (times) => Math.min(times * 1000, 10000)
    });

    connection.on('error', (err) => {
      // Catch error without crashing the server process
      console.warn('[Queue] Redis warning (running in resilient direct-processing mode):', err.message);
    });

    scanQueue = new Queue('scan-jobs', { connection });

    // Only start background worker in non-serverless persistent environment
    if (!process.env.VERCEL) {
      scanWorker = new Worker('scan-jobs', async (job) => {
        const { url, filePath, userId } = job.data;
        const identifier = url || filePath;
        console.log(`[Worker] Starting job ${job.id} for ${identifier}`);
        
        try {
          let scanRecord = null;
          if (prisma) {
            scanRecord = await prisma.scan.create({
              data: { id: job.id, repoUrl: identifier, status: 'scanning', userId, localFilePath: filePath || null }
            }).catch(() => null);
          }
          
          const startTime = Date.now();
          const report = await runScan(url, filePath);
          const durationMs = Date.now() - startTime;
          
          if (prisma && scanRecord) {
            await prisma.scan.update({
              where: { id: scanRecord.id },
              data: {
                status: 'completed',
                overallScore: report.score,
                grade: report.grade,
                durationMs,
                repoName: report.repo?.split('/')[1] || 'repo',
                repoOwner: report.repo?.split('/')[0] || 'owner',
                findings: {
                  create: report.findings.map(f => ({
                    category: f.category,
                    severity: f.severity || (f.category === 'hardcodedSecrets' ? 'CRITICAL' : 'HIGH'),
                    title: f.title,
                    description: f.description || f.message,
                    filePath: f.file || f.filePath,
                    lineNumber: f.lineNumber || null,
                    snippet: f.snippet || null,
                    fixSuggestion: f.fixSuggestion || null,
                    fixSnippet: f.fixSnippet || null,
                    cweId: f.cweId || null,
                    cveId: f.cveId || null
                  }))
                }
              }
            }).catch(() => null);
          }
          
          console.log(`[Worker] Job ${job.id} completed.`);
          return report;
        } catch (err) {
          console.error(`[Worker] Job failed: ${err.message}`);
          if (prisma) {
            await prisma.scan.update({
              where: { id: job.id },
              data: { status: 'failed' }
            }).catch(() => null);
          }
          throw err;
        }
      }, { connection });
    }
  } catch (e) {
    console.warn('[Queue] Failed to initialize BullMQ worker:', e.message);
  }
}

// Mock fallback event emitter connection if Redis is not configured
if (!connection) {
  connection = new EventEmitter();
  connection.status = 'fallback-memory';
}

export { connection, scanQueue, scanWorker };
