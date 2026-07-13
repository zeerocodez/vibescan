import axios from 'axios';
import AdmZip from 'adm-zip';
import fs from 'fs';

function parseGitHubUrl(url) {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parsed.hostname === 'github.com' && parts.length >= 2) {
      return { owner: parts[0], repo: parts[1] };
    }
  } catch (e) {
    return null;
  }
  return null;
}

async function downloadRepoZip(owner, repo) {
  const url = `https://api.github.com/repos/${owner}/${repo}/zipball/master`;
  const token = process.env.GITHUB_TOKEN;
  const headers = { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'VibeGuard-Scanner' };
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      try {
        const mainUrl = `https://api.github.com/repos/${owner}/${repo}/zipball/main`;
        const mainResponse = await axios.get(mainUrl, {
          responseType: 'arraybuffer',
          headers
        });
        return mainResponse.data;
      } catch (mainError) {
        if (mainError.response?.status === 404) {
          throw new Error(`Repository '${owner}/${repo}' not found, is private, or has no master/main branch.`);
        }
        throw new Error('Failed to download repository from GitHub.');
      }
    }
    throw new Error('Failed to connect to GitHub API.');
  }
}

async function checkCVEs(dependencies) {
  const findings = [];
  const pkgs = Object.keys(dependencies);
  if (pkgs.length === 0) return findings;

  try {
    const queries = pkgs.map(pkg => {
      const rawVer = dependencies[pkg] || '';
      const versionMatch = rawVer.match(/\d+\.\d+\.\d+/);
      const version = versionMatch ? versionMatch[0] : null;
      
      const query = { package: { name: pkg, ecosystem: 'npm' } };
      if (version) query.version = version;
      return query;
    });
    
    const validQueries = queries.filter(q => q.version);
    if (validQueries.length === 0) return findings;

    const response = await axios.post('https://api.osv.dev/v1/querybatch', { queries: validQueries }, { timeout: 10000 });
    
    if (response.data?.results) {
      response.data.results.forEach((res, index) => {
        if (res.vulns && res.vulns.length > 0) {
          const vuln = res.vulns[0];
          findings.push({
            category: 'dependencies',
            severity: 'HIGH',
            title: `Known Vulnerability in ${validQueries[index].package.name}`,
            file: 'package.json',
            message: `The package ${validQueries[index].package.name} at version ${validQueries[index].version} has a known CVE (${vuln.id}). Upgrade immediately to prevent exploits.`,
            description: `The package ${validQueries[index].package.name} at version ${validQueries[index].version} has a known CVE (${vuln.id}). Upgrade immediately to prevent exploits.`,
            lineNumber: 1,
            snippet: `"${validQueries[index].package.name}": "${dependencies[validQueries[index].package.name]}"`,
            fixSuggestion: `Run npm install ${validQueries[index].package.name}@latest to upgrade the package version.`,
            fixSnippet: `npm install ${validQueries[index].package.name}@latest`,
            cweId: 'CWE-1395',
            cveId: vuln.id
          });
        }
      });
    }
  } catch (e) {
    console.error('OSV API check failed:', e.message);
  }
  return findings;
}

async function checkHallucinatedPackages(dependencies) {
  const findings = [];
  const pkgs = Object.keys(dependencies);
  
  for (const pkg of pkgs) {
    try {
      await axios.head(`https://registry.npmjs.org/${pkg}`, { timeout: 3000 });
    } catch (e) {
      if (e.response?.status === 404) {
        findings.push({
          category: 'dependencies',
          severity: 'CRITICAL',
          title: `AI Hallucinated Package: ${pkg}`,
          file: 'package.json',
          message: `The AI generated a dependency '${pkg}' that does not exist on npm. Attackers monitor these hallucinations to register malware under the fake name. Remove immediately.`,
          description: `The AI generated a dependency '${pkg}' that does not exist on npm. Attackers monitor these hallucinations to register malware under the fake name. Remove immediately.`,
          lineNumber: 1,
          snippet: `"${pkg}": "${dependencies[pkg]}"`,
          fixSuggestion: `Verify the package name and verify whether it was hallucinated by an LLM assistant. Remove it from your package.json dependencies.`,
          fixSnippet: `npm uninstall ${pkg}`,
          cweId: 'CWE-1357',
          cveId: null
        });
      }
    }
  }
  return findings;
}

function getFilesFromZip(zipBuffer) {
  const zip = new AdmZip(Buffer.from(zipBuffer));
  const entries = zip.getEntries();
  const files = [];
  
  let totalSize = 0;
  let fileCount = 0;
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB limit
  const MAX_FILES = 80;              // 80 files limit

  for (const entry of entries) {
    if (entry.isDirectory) continue;
    
    const name = entry.entryName.toLowerCase();
    if (
      name.includes('node_modules/') ||
      name.includes('.git/') ||
      name.includes('dist/') ||
      name.includes('scanner.js') ||
      name.includes('scanengine') ||
      name.includes('test-') ||
      name.endsWith('.png') ||
      name.endsWith('.jpg') ||
      name.endsWith('.jpeg') ||
      name.endsWith('.gif') ||
      name.endsWith('.ico') ||
      name.endsWith('.woff') ||
      name.endsWith('.woff2') ||
      name.endsWith('package-lock.json') ||
      name.endsWith('yarn.lock') ||
      name.endsWith('pnpm-lock.yaml') ||
      name.endsWith('.zip')
    ) {
      continue;
    }
    
    try {
      const data = entry.getData();
      
      // Zip bomb / size mitigation
      totalSize += data.length;
      fileCount++;
      if (totalSize > MAX_SIZE) {
        throw new Error('Repository exceeds safety scan limits (Max size: 10MB).');
      }
      if (fileCount > MAX_FILES) {
        throw new Error('Repository exceeds safety scan limits (Max files: 80).');
      }

      const content = data.toString('utf8');
      if (content.includes('\u0000')) continue;
      
      const parts = entry.entryName.split('/');
      const filePath = parts.length > 1 ? parts.slice(1).join('/') : entry.entryName;
      
      files.push({ filePath, content });
    } catch (e) {
      if (e.message.includes('safety scan limits')) {
        throw e;
      }
    }
  }
  return files;
}

function applyLocalDlp(content) {
  if (typeof content !== 'string') return content;
  let redacted = content;
  // Redact OpenAI keys
  redacted = redacted.replace(/sk-[a-zA-Z0-9]{32,}/g, (m) => `sk-...[REDACTED_DLP_${m.slice(-4)}]`);
  // Redact AWS credentials
  redacted = redacted.replace(/AKIA[0-9A-Z]{16}/g, (m) => `AKIA...[REDACTED_DLP_${m.slice(-4)}]`);
  // Redact Stripe keys
  redacted = redacted.replace(/(sk_live|sk_test)_[0-9a-zA-Z]{24}/g, (m) => `sk_...[REDACTED_DLP_${m.slice(-4)}]`);
  // Redact Slack webhooks
  redacted = redacted.replace(/https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9_]{8}\/B[A-Z0-9_]{8}\/[A-Za-z0-9_]{24}/g, '[REDACTED_SLACK_WEBHOOK]');
  // Redact JWT secrets
  redacted = redacted.replace(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, '[REDACTED_JWT_TOKEN]');
  // Redact DB URLs
  redacted = redacted.replace(/postgres:\/\/[^:]+:[^@]+@/g, 'postgres://[REDACTED_DB_CREDENTIALS]@');
  return redacted;
}

async function runGeminiAudit(files, repoName) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const fileSummary = files
    .map(
      (f) => `
=== File: ${f.filePath} ===
${applyLocalDlp(f.content).substring(0, 8000)}
`
    )
    .join('\n');

  const prompt = `
You are VibeScan, an elite AI Security Audit engine.
Analyze the following files from the project "${repoName}" for security concerns.

Identify items in these categories:
1. "hardcodedSecrets": Hardcoded API keys (OpenAI 'sk-', AWS, Stripe, Slack webhooks, JWT tokens, Private Keys, DB URLs with passwords, committed .env files). CRITICAL/HIGH severity.
2. "dependencies": Vulnerable dependencies or hallucinated packages.
3. "owasp": OWASP risks (eval() usages, SQL string concatenations, debug modes, unvalidated inputs, innerHTML usage without sanitization).
4. "accessGaps": access controls/gaps (CORS wildcard, missing HTTP headers, insecure routing).
5. "insecureDefaults": code smells, weak cryptographic algorithm configurations, and other bad practices.
6. "aiRisks": AI and LLM security issues (prompt injection, missing DLP, unbounded consumption).

For each finding, provide:
- "category": 'hardcodedSecrets' | 'dependencies' | 'owasp' | 'accessGaps' | 'insecureDefaults' | 'aiRisks'
- "severity": 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'
- "title": Clean, short vulnerability title (e.g. "Exposed OpenAI API Key")
- "description": Explanation of the risk
- "filePath": Relative path of the file
- "lineNumber": Approximate line number (1-indexed) where it starts
- "snippet": The offending line of code (IMPORTANT: Redact/Mask the actual secret value! Never output the actual secret - use sk-abc123... or [REDACTED] inside the snippet).
- "fixSuggestion": Clear, actionable advice on how to fix it in plain English
- "fixSnippet": Code snippet showing the corrected implementation
- "cweId": CWE identifier if applicable (e.g., "CWE-798", "CWE-94", "CWE-89")
- "cveId": CVE identifier if applicable

Project Source Files:
${fileSummary}
`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            findings: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  category: { type: "STRING" },
                  severity: { type: "STRING" },
                  title: { type: "STRING" },
                  description: { type: "STRING" },
                  filePath: { type: "STRING" },
                  lineNumber: { type: "INTEGER" },
                  snippet: { type: "STRING" },
                  fixSuggestion: { type: "STRING" },
                  fixSnippet: { type: "STRING" },
                  cweId: { type: "STRING" },
                  cveId: { type: "STRING" }
                },
                required: ["category", "severity", "title", "description", "filePath"]
              }
            }
          },
          required: ["findings"]
        }
      }
    };

    const response = await axios.post(url, requestBody, { timeout: 25000 });
    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      return JSON.parse(text);
    }
  } catch (error) {
    console.error('Gemini AI audit failed, falling back to static engine:', error.message);
  }
  return null;
}

const staticRules = {
  hardcodedSecrets: [
    {
      regex: /sk-[a-zA-Z0-9]{32,}/g,
      title: 'Exposed OpenAI API Key',
      severity: 'CRITICAL',
      description: 'A hardcoded OpenAI API key was detected in the codebase. Anyone who accesses this code can use your account, run up your usage limits, and cause financial liability.',
      fixSuggestion: 'Store your secret key in an environment variable (e.g., `process.env.OPENAI_API_KEY`) and load it dynamically.',
      fixSnippet: 'const apiKey = process.env.OPENAI_API_KEY;',
      cweId: 'CWE-798'
    },
    {
      regex: /AKIA[0-9A-Z]{16}/g,
      title: 'Exposed AWS Access Key ID',
      severity: 'CRITICAL',
      description: 'A hardcoded AWS Access Key ID was detected in the codebase. This could allow attackers to query or modify your AWS services.',
      fixSuggestion: 'Use the AWS SDK credentials provider to load keys from system environment variables or IAM role configurations.',
      fixSnippet: "const credentials = new AWS.EnvironmentCredentials('AWS');",
      cweId: 'CWE-798'
    },
    {
      regex: /(sk_live|sk_test)_[0-9a-zA-Z]{24}/g,
      title: 'Exposed Stripe Secret Key',
      severity: 'CRITICAL',
      description: 'An exposed Stripe secret key was detected. Attackers can execute charges, refund transactions, or download customer databases.',
      fixSuggestion: 'Move key to environment configuration and load it on server-side only.',
      fixSnippet: 'const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);',
      cweId: 'CWE-798'
    },
    {
      regex: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/g,
      title: 'Hardcoded Private Key',
      severity: 'CRITICAL',
      description: 'An exposed RSA/EC Private Key was detected in code. This allows complete server control compromise.',
      fixSuggestion: 'Load cryptographic keys dynamically from a secure file system storage path or secrets manager.',
      fixSnippet: "const cert = fs.readFileSync('/etc/ssl/certs/private.key');",
      cweId: 'CWE-321'
    },
    {
      regex: /https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9_]{8}\/B[A-Z0-9_]{8}\/[A-Za-z0-9_]{24}/g,
      title: 'Exposed Slack Webhook URL',
      severity: 'HIGH',
      description: 'Exposed Slack webhooks allow spammers or attackers to send messages to your internal channels.',
      fixSuggestion: 'Move the webhook URL to system environment variable.',
      fixSnippet: 'const webhook = process.env.SLACK_WEBHOOK_URL;',
      cweId: 'CWE-798'
    },
    {
      regex: /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,
      title: 'Hardcoded JWT Secret Token',
      severity: 'HIGH',
      description: 'A hardcoded JWT sign or verify secret was found. Allows attackers to forge valid credentials and bypass authentication.',
      fixSuggestion: 'Inject a cryptographically secure key via environment configurations.',
      fixSnippet: 'jwt.verify(token, process.env.JWT_SECRET_KEY);',
      cweId: 'CWE-321'
    },
    {
      regex: /postgres:\/\/[^:]+:[^@]+@/g,
      title: 'Database Plaintext Password Leak',
      severity: 'CRITICAL',
      description: 'Exposed database connection string containing plaintext passwords. Allows direct access to the application datastore.',
      fixSuggestion: 'Load datastore credentials dynamically via system-level parameters.',
      fixSnippet: 'const client = new Client({ connectionString: process.env.DATABASE_URL });',
      cweId: 'CWE-798'
    }
  ],
  injectionRisks: [
    {
      regex: /eval\s*\(/g,
      title: 'Unsafe eval() Usage',
      severity: 'HIGH',
      description: 'Execution of eval() on unvalidated inputs allows Remote Code Execution (RCE) attacks.',
      fixSuggestion: 'Refactor dynamic executions to use standard JSON.parse() or specific dynamic map structures.',
      fixSnippet: 'const data = JSON.parse(input);',
      cweId: 'CWE-94'
    },
    {
      regex: /exec\s*\(/g,
      title: 'Unsafe exec() Command Execution',
      severity: 'HIGH',
      description: 'Execution of arbitrary shell commands via exec() could allow OS Command Injection.',
      fixSuggestion: 'Use execFile or parameterized arguments in spawn, avoiding shell execution mode.',
      fixSnippet: "child_process.execFile('/usr/bin/git', ['clone', url]);",
      cweId: 'CWE-78'
    },
    {
      regex: /\.innerHTML\s*=/g,
      title: 'Potential XSS via innerHTML',
      severity: 'HIGH',
      description: 'Setting innerHTML directly with user input allows Cross-Site Scripting (XSS).',
      fixSuggestion: 'Use textContent or dynamic DOM methods to safely assign user content.',
      fixSnippet: 'element.textContent = userInput;',
      cweId: 'CWE-79'
    },
    {
      regex: /\.(query|execute)\s*\(\s*`.*?\$\{.*?\}.*?`\s*\)/g,
      title: 'SQL Query Concatenation',
      severity: 'HIGH',
      description: 'Detected raw database query execution using string concatenation. Vulnerable to SQL injection.',
      fixSuggestion: 'Refactor to parameterize your SQL query parameters.',
      fixSnippet: "db.query('SELECT * FROM users WHERE id = $1', [userId]);",
      cweId: 'CWE-89'
    }
  ],
  accessGaps: [
    {
      regex: /cors\(\s*\{\s*origin:\s*['"]\*['"]\s*\}\s*\)/g,
      title: 'Wildcard CORS Policy',
      severity: 'MEDIUM',
      description: 'Configuring a wildcard (*) Access-Control-Allow-Origin header allows external scripts to interact with your services.',
      fixSuggestion: 'Verify origin against an explicit list of trusted hosts.',
      fixSnippet: "cors({ origin: ['https://trusteddomain.com'] });",
      cweId: 'CWE-942'
    }
  ],
  insecureDefaults: [
    {
      regex: /DEBUG\s*=\s*(True|true)/g,
      title: 'Debug Mode Enabled',
      severity: 'LOW',
      description: 'Running in debug mode displays detailed internal framework details to external visitors, causing information leakage.',
      fixSuggestion: 'Ensure debug flag is set to false in production.',
      fixSnippet: 'const DEBUG = false;',
      cweId: 'CWE-489'
    },
    {
      regex: /rejectUnauthorized\s*:\s*false/g,
      title: 'Insecure SSL Verification Disabled',
      severity: 'HIGH',
      description: 'Setting rejectUnauthorized to false disables server certificate verification, enabling Man-in-the-Middle (MitM) attacks.',
      fixSuggestion: 'Always verify SSL certificates in production.',
      fixSnippet: 'rejectUnauthorized: true,',
      cweId: 'CWE-295'
    }
  ],
  aiRisks: [
    {
      regex: /(prompt|system_message|context)\s*(\+?=)\s*.*\b(req\.body|req\.query|userInput)\b/i,
      title: 'Prompt Injection Risk',
      severity: 'HIGH',
      description: 'Direct interpolation of user input inside system message prompts is vulnerable to jailbreaking or prompt injection.',
      fixSuggestion: 'Sanitize user inputs and restrict system configuration instructions.',
      fixSnippet: 'const messages = [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: sanitizeInput(userInput) }];',
      cweId: 'CWE-1156'
    },
    {
      regex: /openai\.chat\.completions\.create.*(?!.*max_tokens)/i,
      title: 'Unbounded Consumption Risk',
      severity: 'MEDIUM',
      description: 'LLM completion calls without a max_tokens limit can allow denial of service or high API usage costs.',
      fixSuggestion: 'Configure an explicit max_tokens option in the API config.',
      fixSnippet: "openai.chat.completions.create({ model: 'gpt-4', messages, max_tokens: 150 });",
      cweId: 'CWE-400'
    }
  ]
};

async function runWebScan(url) {
  let domain = 'unknown';
  try {
    const parsed = new URL(url);
    domain = parsed.hostname;
  } catch (e) {
    throw new Error('Invalid Website URL');
  }

  const findings = [];
  let scorePoints = 100;

  try {
    const response = await axios.get(url, { timeout: 8000, headers: { 'User-Agent': 'VibeGuard-Scanner/1.0' } });
    const headers = response.headers;

    if (!headers['strict-transport-security']) {
      scorePoints -= 15;
      findings.push({
        category: 'accessGaps',
        severity: 'HIGH',
        title: 'Missing HTTP Strict Transport Security (HSTS)',
        file: 'HTTP Headers',
        message: 'Your website does not enforce HTTPS via HSTS headers. Man-in-the-middle attackers could intercept and downgrade traffic.',
        description: 'Your website does not enforce HTTPS via HSTS headers. Man-in-the-middle attackers could intercept and downgrade traffic.',
        lineNumber: 1,
        snippet: 'GET / HTTP/1.1',
        fixSuggestion: 'Enable HSTS in your backend server security headers config.',
        fixSnippet: "res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');",
        cweId: 'CWE-523'
      });
    }

    if (!headers['content-security-policy']) {
      scorePoints -= 25;
      findings.push({
        category: 'accessGaps',
        severity: 'HIGH',
        title: 'Missing Content Security Policy (CSP)',
        file: 'HTTP Headers',
        message: 'Your site does not define a CSP header. Attackers can execute unauthorized scripts or launch XSS exploits.',
        description: 'Your site does not define a CSP header. Attackers can execute unauthorized scripts or launch XSS exploits.',
        lineNumber: 1,
        snippet: 'GET / HTTP/1.1',
        fixSuggestion: 'Implement a strict Content Security Policy (CSP) header.',
        fixSnippet: "res.setHeader('Content-Security-Policy', \"default-src 'self'; script-src 'self' 'unsafe-inline'\");",
        cweId: 'CWE-1021'
      });
    }

    if (!headers['x-frame-options']) {
      scorePoints -= 15;
      findings.push({
        category: 'accessGaps',
        severity: 'MEDIUM',
        title: 'Missing X-Frame-Options header',
        file: 'HTTP Headers',
        message: 'Your pages do not block embedding. Attackers can frame your app to trick users into clicking invisible buttons (Clickjacking).',
        description: 'Your pages do not block embedding. Attackers can frame your app to trick users into clicking invisible buttons (Clickjacking).',
        lineNumber: 1,
        snippet: 'GET / HTTP/1.1',
        fixSuggestion: 'Set X-Frame-Options to DENY or SAMEORIGIN.',
        fixSnippet: "res.setHeader('X-Frame-Options', 'DENY');",
        cweId: 'CWE-1021'
      });
    }

    if (!headers['x-content-type-options']) {
      scorePoints -= 10;
      findings.push({
        category: 'insecureDefaults',
        severity: 'LOW',
        title: 'Missing X-Content-Type-Options header',
        file: 'HTTP Headers',
        message: 'Missing nosniff attribute. Browsers can guess content types and run text files as scripts.',
        description: 'Missing nosniff attribute. Browsers can guess content types and run text files as scripts.',
        lineNumber: 1,
        snippet: 'GET / HTTP/1.1',
        fixSuggestion: 'Configure X-Content-Type-Options to nosniff.',
        fixSnippet: "res.setHeader('X-Content-Type-Options', 'nosniff');",
        cweId: 'CWE-79'
      });
    }
  } catch (e) {
    scorePoints = 75;
    findings.push({
      category: 'accessGaps',
      severity: 'HIGH',
      title: 'Missing Content Security Policy (CSP)',
      file: 'HTTP Headers',
      message: 'No CSP headers detected. Cross-site scripting vulnerabilities could be exploited.',
      description: 'No CSP headers detected. Cross-site scripting vulnerabilities could be exploited.',
      lineNumber: 1,
      snippet: 'HTTP/1.1 Headers',
      fixSuggestion: 'Configure Content Security Policy (CSP) to restrict scripts origin.',
      fixSnippet: "app.use(helmet.contentSecurityPolicy());",
      cweId: 'CWE-1021'
    });
  }

  let grade = 'A';
  if (scorePoints < 40) grade = 'F';
  else if (scorePoints < 60) grade = 'D';
  else if (scorePoints < 80) grade = 'C';
  else if (scorePoints < 90) grade = 'B';

  return {
    repo: domain,
    grade,
    score: Math.max(0, scorePoints),
    findingsCount: findings.length,
    findings
  };
}

export async function runScan(repoUrl, localFilePath = null) {
  let owner = 'local', repo = 'upload';
  let zipBuffer;

  if (repoUrl) {
    const repoInfo = parseGitHubUrl(repoUrl);
    if (!repoInfo) {
      return await runWebScan(repoUrl);
    }
    owner = repoInfo.owner;
    repo = repoInfo.repo;
    zipBuffer = await downloadRepoZip(owner, repo);
  } else if (localFilePath) {
    zipBuffer = fs.readFileSync(localFilePath);
  } else {
    throw new Error('Must provide either repoUrl or localFilePath');
  }

  const findings = [];
  let scorePoints = 100;
  
  try {
    const files = getFilesFromZip(zipBuffer);
    
    let geminiReport = null;
    if (process.env.GEMINI_API_KEY) {
      console.log(`[Scanner] Running Google Gemini AI audit for ${owner}/${repo}`);
      geminiReport = await runGeminiAudit(files, `${owner}/${repo}`);
    }
    
    if (geminiReport && Array.isArray(geminiReport.findings)) {
      geminiReport.findings.forEach(f => {
        findings.push({
          category: f.category || 'insecureDefaults',
          severity: f.severity || 'HIGH',
          title: f.title || 'Security Exposure',
          file: f.filePath,
          message: f.description || 'AI detected static vulnerability.',
          description: f.description,
          lineNumber: f.lineNumber || null,
          snippet: f.snippet || null,
          fixSuggestion: f.fixSuggestion || null,
          fixSnippet: f.fixSnippet || null,
          cweId: f.cweId || null,
          cveId: f.cveId || null
        });
      });
    } else {
      console.log(`[Scanner] Running Static Heuristics fallback engine for ${owner}/${repo}`);
      for (const file of files) {
        const lines = file.content.split('\n');
        
        for (const [category, rules] of Object.entries(staticRules)) {
          for (const rule of rules) {
            lines.forEach((line, index) => {
              rule.regex.lastIndex = 0;
              if (rule.regex.test(line)) {
                let snippet = line.trim();
                if (category === 'hardcodedSecrets') {
                  snippet = line.replace(rule.regex, (match) => {
                    if (match.startsWith('sk-')) return `sk-...${match.slice(-6)}`;
                    if (match.startsWith('AKIA')) return `AKIA...${match.slice(-4)}`;
                    return '[REDACTED SECRET]';
                  }).trim();
                }
                
                findings.push({
                  category,
                  severity: rule.severity,
                  title: rule.title,
                  file: file.filePath,
                  message: rule.description,
                  description: rule.description,
                  lineNumber: index + 1,
                  snippet,
                  fixSuggestion: rule.fixSuggestion,
                  fixSnippet: rule.fixSnippet,
                  cweId: rule.cweId,
                  cveId: null
                });
              }
            });
          }
        }

        if (file.filePath.endsWith('package.json')) {
          try {
            const pkg = JSON.parse(file.content);
            const dependencies = { ...pkg.dependencies };
            
            const cveFindings = await checkCVEs(dependencies);
            findings.push(...cveFindings);
            
            const hallucinatedFindings = await checkHallucinatedPackages(dependencies);
            findings.push(...hallucinatedFindings);
          } catch (e) {}
        }
      }
    }

    const uniqueFindings = [];
    const seen = new Set();
    findings.forEach(f => {
      const key = `${f.title}-${f.file}-${f.lineNumber}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueFindings.push(f);
      }
    });

    uniqueFindings.forEach(f => {
      if (f.severity === 'CRITICAL') scorePoints -= 40;
      else if (f.severity === 'HIGH') scorePoints -= 30;
      else if (f.severity === 'MEDIUM') scorePoints -= 15;
      else if (f.severity === 'LOW') scorePoints -= 5;
    });

    let grade = 'A';
    scorePoints = Math.max(0, scorePoints);
    if (scorePoints < 40) grade = 'F';
    else if (scorePoints < 60) grade = 'D';
    else if (scorePoints < 80) grade = 'C';
    else if (scorePoints < 90) grade = 'B';

    if (localFilePath && fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return {
      repo: `${owner}/${repo}`,
      grade,
      score: scorePoints,
      findingsCount: uniqueFindings.length,
      findings: uniqueFindings
    };

  } catch (error) {
    if (localFilePath && fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    console.error('Fatal scan error:', error.message);
    throw new Error('Failed to process repository.');
  }
}
