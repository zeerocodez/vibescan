import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { runScan } from './scanner.js';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379/0', {
  maxRetriesPerRequest: null,
});

export const scanQueue = new Queue('scan-jobs', { connection });

export const scanWorker = new Worker('scan-jobs', async (job) => {
  const { url, filePath } = job.data;
  const identifier = url || filePath;
  console.log(`[Worker] Starting job ${job.id} for ${identifier}`);
  
  try {
    const scanRecord = await prisma.scan.create({
      data: { id: job.id, repoUrl: identifier, status: 'scanning' }
    });
    
    const startTime = Date.now();
    const report = await runScan(url, filePath);
    const durationMs = Date.now() - startTime;
    
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
            severity: f.category === 'hardcodedSecrets' ? 'CRITICAL' : 'HIGH',
            title: f.title,
            description: f.message,
            filePath: f.file
          }))
        }
      }
    });
    
    console.log(`[Worker] Job ${job.id} completed.`);
    return report;
  } catch (err) {
    console.error(`[Worker] Job failed: ${err.message}`);
    await prisma.scan.update({
      where: { id: job.id },
      data: { status: 'failed' }
    }).catch(() => {});
    throw err;
  }
}, { connection });
