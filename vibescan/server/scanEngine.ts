import fs from 'fs';
import path from 'path';
import https from 'https';
import os from 'os';
import AdmZip from 'adm-zip';
import { Finding, Scan, ScanCategories, ScanSummary } from '../src/types.js';
import { runAIAudit } from './gemini.js';

// Heuristic Scan regex patterns
const PATTERNS = {
  openai: /sk-[a-zA-Z0-9]{48}/g,
  awsAccessKey: /AKIA[0-9A-Z]{16}/g,
  awsSecretKey: /(?<![A-Za-z0-9+/])[A-Za-z0-9+/]{40}(?![A-Za-z0-9+/])/g,
  githubToken: /ghp_[a-zA-Z0-9]{36}/g,
  stripeKey: /sk_live_[0-9a-zA-Z]{24}/g,
  jwtToken: /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,
  privateKey: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/g,
  slackWebhook: /https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9_]{8}\/B[A-Z0-9_]{8}\/[A-Za-z0-9_]{24}/g,
  databaseUrl: /[a-z]+:\/\/[^:]+:[^@]+@[^/]+/g,
  
  eval: /\beval\s*\(/g,
  innerHTML: /\.innerHTML\s*=/g,
  sqlConcatenation: /\.(query|execute|select|where)\s*\(\s*['"\`].*\$\{.*['"\`]\s*\)/g,
  debugTrue: /\b(DEBUG\s*=\s*True|debug\s*:\s*true)\b/i,
  verifyFalse: /\b(verify\s*=\s*False|rejectUnauthorized\s*:\s*false)\b/i,
  corsWildcard: /cors.*origin.*['"'\`]\*['"'\`]/i,
  
  documentWrite: /\bdocument\.write\s*\(/g,
  hardcodedIp: /\b(?!(127\.0\.0\.1|0\.0\.0\.0))\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
  todoSecurity: /\/\/.*(TODO|FIXME).*(security|auth|password|bypass|login|session)/i,
};

// Mask sensitive matches
export function maskSecret(secret: string, type: string): string {
  if (type === 'openai') {
    return `sk-...${secret.slice(-6)}`;
  }
  if (type === 'githubToken') {
    return `ghp_...${secret.slice(-6)}`;
  }
  if (type === 'stripeKey') {
    return `sk_live_...${secret.slice(-4)}`;
  }
  return `${secret.substring(0, 4)}...[REDACTED]...`;
}

// Helper to download GitHub ZIP
function downloadUrl(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'vibe-scan-app' } }, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        // Handle redirect
        downloadUrl(res.headers.location!).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download: Status Code ${res.statusCode}`));
        return;
      }
      const data: Buffer[] = [];
      res.on('data', (chunk) => data.push(chunk));
      res.on('end', () => resolve(Buffer.concat(data)));
    }).on('error', reject);
  });
}

// Extract and return flat list of files with paths and content
export async function getFilesFromZip(zipBuffer: Buffer): Promise<{
  files: Array<{ filePath: string; content: string }>;
  totalLines: number;
  totalFiles: number;
}> {
  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries();
  const files: Array<{ filePath: string; content: string }> = [];
  let totalLines = 0;
  let totalFiles = 0;

  for (const entry of entries) {
    if (entry.isDirectory) continue;
    
    // Skip lockfiles, binaries, media, git files, and node_modules
    const name = entry.entryName.toLowerCase();
    if (
      name.includes('node_modules/') ||
      name.includes('.git/') ||
      name.includes('dist/') ||
      name.includes('.png') ||
      name.includes('.jpg') ||
      name.includes('.jpeg') ||
      name.includes('.gif') ||
      name.includes('.ico') ||
      name.includes('.woff') ||
      name.includes('.woff2') ||
      name.includes('package-lock.json') ||
      name.includes('yarn.lock') ||
      name.includes('pnpm-lock.yaml') ||
      name.includes('.zip')
    ) {
      continue;
    }

    const content = entry.getData().toString('utf8');
    // Ensure we only scan text files or source files
    if (content.includes('\u0000')) continue; // Skip binary files

    // Normalize paths (strip the top-level directory GitHub puts in ZIPs)
    const parts = entry.entryName.split('/');
    const filePath = parts.slice(1).join('/') || entry.entryName;

    files.push({ filePath, content });
    totalLines += content.split('\n').length;
    totalFiles++;
  }

  return { files, totalLines, totalFiles };
}

// Orchestrate local scan
export function runHeuristicScan(
  files: Array<{ filePath: string; content: string }>,
  scanId: string
): Finding[] {
  const findings: Finding[] = [];

  for (const file of files) {
    const lines = file.content.split('\n');
    
    // Check for committed .env files
    if (file.filePath.toLowerCase().endsWith('.env') && !file.filePath.toLowerCase().includes('.example')) {
      findings.push({
        id: `f_local_env_${Math.random().toString(36).substring(2, 9)}`,
        scanId,
        category: 'secrets',
        severity: 'HIGH',
        title: 'Committed Environment File',
        description: 'A committed .env file was found. This can lead to leaked environment secrets.',
        filePath: file.filePath,
        lineNumber: 1,
        snippet: '.env file structure',
        fixSuggestion: 'Add .env to your .gitignore and store secrets securely using provider dashboards.',
        cweId: 'CWE-522',
      });
    }

    // Iterate through lines for line-based regexes
    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // 1. Secrets detection
      if (PATTERNS.openai.test(line)) {
        findings.push({
          id: `f_sec_${Math.random().toString(36).substring(2, 9)}`,
          scanId,
          category: 'secrets',
          severity: 'CRITICAL',
          title: 'Exposed OpenAI API Key',
          description: 'A hardcoded OpenAI API key was detected.',
          filePath: file.filePath,
          lineNumber: lineNum,
          snippet: line.replace(PATTERNS.openai, (match) => maskSecret(match, 'openai')).trim(),
          fixSuggestion: 'Store your secret key in an environment variable (e.g., process.env.OPENAI_API_KEY).',
          fixSnippet: 'const OPENAI_KEY = process.env.OPENAI_API_KEY;',
          cweId: 'CWE-798',
        });
      }

      if (PATTERNS.githubToken.test(line)) {
        findings.push({
          id: `f_sec_${Math.random().toString(36).substring(2, 9)}`,
          scanId,
          category: 'secrets',
          severity: 'CRITICAL',
          title: 'Exposed GitHub Token',
          description: 'A hardcoded GitHub personal access token was detected.',
          filePath: file.filePath,
          lineNumber: lineNum,
          snippet: line.replace(PATTERNS.githubToken, (match) => maskSecret(match, 'githubToken')).trim(),
          fixSuggestion: 'Use environment variables or GitHub Actions secrets instead of hardcoding tokens.',
          cweId: 'CWE-798',
        });
      }

      if (PATTERNS.stripeKey.test(line)) {
        findings.push({
          id: `f_sec_${Math.random().toString(36).substring(2, 9)}`,
          scanId,
          category: 'secrets',
          severity: 'CRITICAL',
          title: 'Exposed Stripe API Key',
          description: 'A hardcoded Stripe live secret key was detected.',
          filePath: file.filePath,
          lineNumber: lineNum,
          snippet: line.replace(PATTERNS.stripeKey, (match) => maskSecret(match, 'stripeKey')).trim(),
          fixSuggestion: 'Always initialize Stripe using environment variables on the backend server.',
          cweId: 'CWE-798',
        });
      }

      if (PATTERNS.privateKey.test(line)) {
        findings.push({
          id: `f_sec_${Math.random().toString(36).substring(2, 9)}`,
          scanId,
          category: 'secrets',
          severity: 'CRITICAL',
          title: 'Hardcoded Private Key',
          description: 'An exposed RSA/EC Private Key was detected in code.',
          filePath: file.filePath,
          lineNumber: lineNum,
          snippet: '-----BEGIN PRIVATE KEY----- ... [REDACTED]',
          fixSuggestion: 'Load the key file dynamically using a file path configured in environment variables.',
          cweId: 'CWE-321',
        });
      }

      // 2. OWASP vulnerabilities
      if (PATTERNS.eval.test(line)) {
        findings.push({
          id: `f_owa_${Math.random().toString(36).substring(2, 9)}`,
          scanId,
          category: 'owasp',
          severity: 'HIGH',
          title: 'Unsafe eval() Usage',
          description: 'Using eval() is extremely dangerous as it can execute arbitrary code.',
          filePath: file.filePath,
          lineNumber: lineNum,
          snippet: line.trim(),
          fixSuggestion: 'Refactor code to use standard JSON.parse() or dynamic lookup objects instead of eval.',
          cweId: 'CWE-94',
        });
      }

      if (PATTERNS.innerHTML.test(line)) {
        findings.push({
          id: `f_owa_${Math.random().toString(36).substring(2, 9)}`,
          scanId,
          category: 'owasp',
          severity: 'HIGH',
          title: 'Potential XSS via innerHTML',
          description: 'Setting innerHTML without sanitization can execute arbitrary scripts, leading to Cross-Site Scripting (XSS).',
          filePath: file.filePath,
          lineNumber: lineNum,
          snippet: line.trim(),
          fixSuggestion: 'Use textContent, innerText, or safe DOM creation APIs like document.createElement().',
          cweId: 'CWE-79',
        });
      }

      if (PATTERNS.sqlConcatenation.test(line)) {
        findings.push({
          id: `f_owa_${Math.random().toString(36).substring(2, 9)}`,
          scanId,
          category: 'owasp',
          severity: 'CRITICAL',
          title: 'Potential SQL Injection',
          description: 'String concatenation or interpolation in SQL queries can lead to SQL Injection vulnerabilities.',
          filePath: file.filePath,
          lineNumber: lineNum,
          snippet: line.trim(),
          fixSuggestion: 'Use parameterized queries or prepared statements provided by your ORM/database client.',
          cweId: 'CWE-89',
        });
      }

      if (PATTERNS.debugTrue.test(line)) {
        findings.push({
          id: `f_owa_${Math.random().toString(36).substring(2, 9)}`,
          scanId,
          category: 'owasp',
          severity: 'HIGH',
          title: 'Active Debug Mode',
          description: 'Enabling debug mode in production can disclose detailed tracebacks and internal system metadata.',
          filePath: file.filePath,
          lineNumber: lineNum,
          snippet: line.trim(),
          fixSuggestion: 'Configure debug flags to load dynamically from environment variables, defaulting to false.',
          cweId: 'CWE-489',
        });
      }

      if (PATTERNS.verifyFalse.test(line)) {
        findings.push({
          id: `f_owa_${Math.random().toString(36).substring(2, 9)}`,
          scanId,
          category: 'owasp',
          severity: 'CRITICAL',
          title: 'Disabled SSL Verification',
          description: 'Disabling SSL/TLS certificate verification exposes the application to Man-In-The-Middle (MITM) attacks.',
          filePath: file.filePath,
          lineNumber: lineNum,
          snippet: line.trim(),
          fixSuggestion: 'Remove verification bypasses and use authentic certificates.',
          cweId: 'CWE-295',
        });
      }

      // 3. Security smells
      if (PATTERNS.documentWrite.test(line)) {
        findings.push({
          id: `f_sml_${Math.random().toString(36).substring(2, 9)}`,
          scanId,
          category: 'smell',
          severity: 'HIGH',
          title: 'document.write() Anti-Pattern',
          description: 'document.write() is a security smell and performance bottleneck.',
          filePath: file.filePath,
          lineNumber: lineNum,
          snippet: line.trim(),
          fixSuggestion: 'Use standard DOM manipulation methods or reactive UI states.',
          cweId: 'CWE-79',
        });
      }

      if (PATTERNS.hardcodedIp.test(line)) {
        findings.push({
          id: `f_sml_${Math.random().toString(36).substring(2, 9)}`,
          scanId,
          category: 'smell',
          severity: 'MEDIUM',
          title: 'Hardcoded IP Address',
          description: 'A hardcoded IP address was found. This limits flexibility and is vulnerable to routing hijacks.',
          filePath: file.filePath,
          lineNumber: lineNum,
          snippet: line.trim(),
          fixSuggestion: 'Use domain names or environment-configured connection strings.',
          cweId: 'CWE-434',
        });
      }

      if (PATTERNS.todoSecurity.test(line)) {
        findings.push({
          id: `f_sml_${Math.random().toString(36).substring(2, 9)}`,
          scanId,
          category: 'smell',
          severity: 'LOW',
          title: 'TODO / Security Debt',
          description: 'A TODO/FIXME comment referencing security or credentials was found.',
          filePath: file.filePath,
          lineNumber: lineNum,
          snippet: line.trim(),
          fixSuggestion: 'Resolve the outstanding security item or track it in a secure issues board.',
          cweId: 'CWE-563',
        });
      }
    });

    // Parse package.json for dependency checking
    if (file.filePath.toLowerCase().endsWith('package.json')) {
      try {
        const pkg = JSON.parse(file.content);
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        for (const [name, version] of Object.entries(deps)) {
          const vStr = String(version);
          if (vStr.startsWith('^0.') || vStr.startsWith('~0.') || vStr.startsWith('0.')) {
            findings.push({
              id: `f_dep_${Math.random().toString(36).substring(2, 9)}`,
              scanId,
              category: 'dependencies',
              severity: 'LOW',
              title: 'Outdated or Unstable Version',
              description: `Dependency "${name}" is locked to an unstable 0.x version (${vStr}).`,
              filePath: file.filePath,
              lineNumber: 1,
              snippet: `"${name}": "${vStr}"`,
              fixSuggestion: `Upgrade to a stable major version (1.x+) if available, or pin to a secure patch.`,
            });
          }
        }
      } catch (e) {
        // Ignored
      }
    }
  }

  return findings;
}

// Calculate scores (0-100) per category and overall
export function calculateScores(findings: Finding[]): {
  overallScore: number;
  grade: string;
  categories: ScanCategories;
  summary: ScanSummary;
} {
  const summary: ScanSummary = {
    totalFilesScanned: 0,
    totalLinesScanned: 0,
    criticalCount: 0,
    highCount: 0,
    mediumCount: 0,
    lowCount: 0,
  };

  // Group findings count and severities
  const categoryScores = {
    secrets: 100,
    dependencies: 100,
    owasp: 100,
    hallucinate: 100,
    smell: 100,
  };

  const counts = {
    secrets: 0,
    dependencies: 0,
    owasp: 0,
    hallucinate: 0,
    smell: 0,
  };

  const maxSeverity: Record<string, 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE'> = {
    secrets: 'NONE',
    dependencies: 'NONE',
    owasp: 'NONE',
    hallucinate: 'NONE',
    smell: 'NONE',
  };

  const sevWeights = {
    CRITICAL: 40,
    HIGH: 25,
    MEDIUM: 15,
    LOW: 5,
    INFO: 0,
  };

  const sevPriority = {
    CRITICAL: 5,
    HIGH: 4,
    MEDIUM: 3,
    LOW: 2,
    INFO: 1,
    NONE: 0,
  };

  for (const finding of findings) {
    const sev = finding.severity;
    
    // Update summary counts
    if (sev === 'CRITICAL') summary.criticalCount++;
    else if (sev === 'HIGH') summary.highCount++;
    else if (sev === 'MEDIUM') summary.mediumCount++;
    else if (sev === 'LOW' || sev === 'INFO') summary.lowCount++;

    const cat = finding.category;
    counts[cat]++;

    // Update max severity
    if (sevPriority[sev] > sevPriority[maxSeverity[cat]]) {
      maxSeverity[cat] = sev as any;
    }

    // Deduct points
    categoryScores[cat] = Math.max(0, categoryScores[cat] - sevWeights[sev]);
  }

  // Calculate overall score based on requested weights:
  // (Secrets x 0.25) + (Dependencies x 0.25) + (OWASP x 0.25) + (Hallucinate x 0.15) + (Smell x 0.10)
  const overallScore = Math.round(
    categoryScores.secrets * 0.25 +
    categoryScores.dependencies * 0.25 +
    categoryScores.owasp * 0.25 +
    categoryScores.hallucinate * 0.15 +
    categoryScores.smell * 0.10
  );

  // Grade assignment:
  // 90-100 A+, 80-89 A, 70-79 B, 60-69 C, 40-59 D, 0-39 F
  let grade = 'F';
  if (overallScore >= 90) grade = 'A+';
  else if (overallScore >= 80) grade = 'A';
  else if (overallScore >= 70) grade = 'B';
  else if (overallScore >= 60) grade = 'C';
  else if (overallScore >= 40) grade = 'D';

  const categories: ScanCategories = {
    secrets: { score: categoryScores.secrets, findingsCount: counts.secrets, severity: maxSeverity.secrets },
    dependencies: { score: categoryScores.dependencies, findingsCount: counts.dependencies, severity: maxSeverity.dependencies },
    owasp: { score: categoryScores.owasp, findingsCount: counts.owasp, severity: maxSeverity.owasp },
    hallucinate: { score: categoryScores.hallucinate, findingsCount: counts.hallucinate, severity: maxSeverity.hallucinate },
    smell: { score: categoryScores.smell, findingsCount: counts.smell, severity: maxSeverity.smell },
  };

  return { overallScore, grade, categories, summary };
}

// Orchestrator to download, extract, heuristic scan, and run AI audit
export async function performScan(
  repoUrl: string,
  scanId: string,
  zipBuffer?: Buffer
): Promise<{ scanData: Partial<Scan>; findings: Finding[] }> {
  let fileData: {
    files: Array<{ filePath: string; content: string }>;
    totalLines: number;
    totalFiles: number;
  };

  let owner = 'user';
  let name = 'project';

  if (zipBuffer) {
    fileData = await getFilesFromZip(zipBuffer);
  } else {
    // Resolve owner and repo name from GitHub URL
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      throw new Error('Invalid GitHub URL structure.');
    }
    owner = match[1];
    name = match[2].replace(/\.git$/, '');

    // Attempt direct ZIP download
    try {
      console.log(`Downloading zip for ${owner}/${name} from main branch`);
      const mainZipBuffer = await downloadUrl(`https://github.com/${owner}/${name}/archive/refs/heads/main.zip`);
      fileData = await getFilesFromZip(mainZipBuffer);
    } catch (e1) {
      try {
        console.log(`Downloading zip for ${owner}/${name} from master branch fallback`);
        const masterZipBuffer = await downloadUrl(`https://github.com/${owner}/${name}/archive/refs/heads/master.zip`);
        fileData = await getFilesFromZip(masterZipBuffer);
      } catch (e2) {
        throw new Error(`Failed to clone or access repository at ${repoUrl}. Verify that it is public and matches https://github.com/{owner}/{repo} format.`);
      }
    }
  }

  // Run local regex scanning
  const heuristicFindings = runHeuristicScan(fileData.files, scanId);

  // Run AI auditing with Gemini (if API key is present)
  let aiFindings: Finding[] = [];
  let isAIActive = false;
  if (process.env.GEMINI_API_KEY) {
    try {
      isAIActive = true;
      const aiResponse = await runAIAudit(fileData.files, name);
      if (aiResponse && aiResponse.findings) {
        aiFindings = aiResponse.findings.map((f, i) => ({
          ...f,
          id: `f_ai_${i}_${Math.random().toString(36).substring(2, 9)}`,
          scanId,
        })) as Finding[];
      }
    } catch (err) {
      console.error('Gemini audit error in scanner:', err);
    }
  }

  // Merge findings (preferring AI detail if they overlap, or keeping unique ones)
  const mergedFindings: Finding[] = [];
  const addedFiles = new Set<string>();

  // If AI ran, use AI findings as primary, but supplement with heuristic findings for any file AI didn't catch or cover fully
  if (isAIActive && aiFindings.length > 0) {
    mergedFindings.push(...aiFindings);
    // Keep heuristic findings that cover different things or are critical secrets
    for (const h of heuristicFindings) {
      // De-duplicate secrets (keep heuristic if they precisely pinpoint line, but if AI already has a secret in that file, only add if line is different)
      const isDuplicate = aiFindings.some(
        (a) => a.category === h.category && a.filePath === h.filePath && Math.abs((a.lineNumber ?? 0) - (h.lineNumber ?? 0)) <= 2
      );
      if (!isDuplicate) {
        mergedFindings.push(h);
      }
    }
  } else {
    mergedFindings.push(...heuristicFindings);
  }

  // Calculate final score
  const { overallScore, grade, categories, summary } = calculateScores(mergedFindings);

  // Fill in file system counts
  summary.totalFilesScanned = fileData.totalFiles;
  summary.totalLinesScanned = fileData.totalLines;

  const scanData: Partial<Scan> = {
    repoOwner: owner,
    repoName: name,
    overallScore,
    grade,
    categories,
    summary,
  };

  return { scanData, findings: mergedFindings };
}
