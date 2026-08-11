import axios from 'axios';
import AdmZip from 'adm-zip';
import fs from 'fs';

function parseGitHubUrl(url) {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parsed.hostname === 'github.com' && parts.length >= 2) {
      return { owner: parts[0], repo: parts[1].replace(/\.git$/i, '') };
    }
  } catch (e) {
    return null;
  }
  return null;
}

async function downloadRepoZip(owner, repo) {
  const token = process.env.GITHUB_TOKEN;
  const headers = { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'VibeScan-Engine/2.0' };
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  // Try main first, fallback to master
  const branches = ['main', 'master'];
  for (const branch of branches) {
    const url = `https://api.github.com/repos/${owner}/${repo}/zipball/${branch}`;
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        headers,
        timeout: 20000
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        continue;
      }
      throw new Error(`Failed to connect to GitHub API: ${error.message}`);
    }
  }
  throw new Error(`Repository '${owner}/${repo}' not found, is private, or has no main/master branch.`);
}

async function checkCVEs(dependencies) {
  const findings = [];
  if (!dependencies || typeof dependencies !== 'object') return findings;
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

    const response = await axios.post('https://api.osv.dev/v1/querybatch', { queries: validQueries }, { timeout: 12000 });
    
    if (response.data?.results) {
      response.data.results.forEach((res, index) => {
        if (res.vulns && res.vulns.length > 0) {
          const vuln = res.vulns[0];
          const pkgName = validQueries[index].package.name;
          const pkgVer = validQueries[index].version;
          findings.push({
            ruleId: 'VIBE-DEP-CVE',
            category: 'dependencies',
            severity: 'HIGH',
            title: `Known Vulnerability in ${pkgName} (${vuln.id})`,
            file: 'package.json',
            message: `The package ${pkgName}@${pkgVer} contains a published CVE vulnerability (${vuln.id}). Upgrade immediately to prevent exploits.`,
            description: vuln.details || `Known vulnerability in ${pkgName}@${pkgVer} indexed in the OSV database.`,
            lineNumber: 1,
            snippet: `"${pkgName}": "${dependencies[pkgName]}"`,
            fixSuggestion: `Run npm install ${pkgName}@latest to upgrade to the patched version.`,
            fixSnippet: `npm install ${pkgName}@latest`,
            diffPatch: `--- a/package.json\n+++ b/package.json\n-    "${pkgName}": "${dependencies[pkgName]}"\n+    "${pkgName}": "^latest"`,
            cweId: 'CWE-1395',
            cveId: vuln.id,
            owaspId: 'LLM03'
          });
        }
      });
    }
  } catch (e) {
    console.error('OSV CVE API check failed:', e.message);
  }
  return findings;
}

async function checkHallucinatedPackages(dependencies) {
  const findings = [];
  if (!dependencies || typeof dependencies !== 'object') return findings;
  const pkgs = Object.keys(dependencies);
  
  for (const pkg of pkgs) {
    // Skip local workspace packages or common built-in protocols
    if (pkg.startsWith('@types/') || pkg.startsWith('file:') || pkg.startsWith('workspace:')) continue;
    try {
      await axios.head(`https://registry.npmjs.org/${encodeURIComponent(pkg)}`, { timeout: 3500 });
    } catch (e) {
      if (e.response?.status === 404) {
        findings.push({
          ruleId: 'VIBE-DEP-SLOP',
          category: 'dependencies',
          severity: 'CRITICAL',
          title: `AI Hallucinated / Unregistered Package: ${pkg}`,
          file: 'package.json',
          message: `The dependency '${pkg}' was likely hallucinated by an AI coding assistant and does not exist in the official npm registry. Malicious actors monitor for such hallucinations to register malware under fake names (Slopsquatting).`,
          description: `AI-generated code frequently invents package names. Attackers register these names to deliver supply-chain payloads.`,
          lineNumber: 1,
          snippet: `"${pkg}": "${dependencies[pkg]}"`,
          fixSuggestion: `Verify the package name. If hallucinated by an LLM, remove it immediately or replace with an established alternative.`,
          fixSnippet: `npm uninstall ${pkg}`,
          diffPatch: `--- a/package.json\n+++ b/package.json\n-    "${pkg}": "${dependencies[pkg]}"`,
          cweId: 'CWE-1357',
          cveId: null,
          owaspId: 'LLM03'
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
  const MAX_SIZE = 25 * 1024 * 1024; // 25MB limit (elevated for full-stack apps)
  const MAX_FILES = 200;              // 200 files limit

  const IGNORED_PATTERNS = [
    'node_modules/', '.git/', 'dist/', 'build/', '.next/', '.nuxt/',
    'coverage/', '.turbo/', '.cache/', '.vscode/', '.idea/',
    'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb',
    '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.webp', '.mp4',
    '.woff', '.woff2', '.ttf', '.eot', '.zip', '.tar', '.gz', '.pdf'
  ];

  for (const entry of entries) {
    if (entry.isDirectory) continue;
    
    const entryNameLower = entry.entryName.toLowerCase();
    const isIgnored = IGNORED_PATTERNS.some(pat => entryNameLower.includes(pat));
    if (isIgnored) continue;
    
    try {
      const data = entry.getData();
      totalSize += data.length;
      fileCount++;

      if (totalSize > MAX_SIZE) {
        throw new Error('Repository exceeds safety scan limits (Max size: 25MB).');
      }
      if (fileCount > MAX_FILES) {
        break; // Scan first 200 essential code files safely
      }

      const content = data.toString('utf8');
      if (content.includes('\u0000')) continue; // Skip binary files
      
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
  // Redact OpenAI / Anthropic keys
  redacted = redacted.replace(/sk-[a-zA-Z0-9]{32,}/g, (m) => `sk-...[REDACTED_DLP_${m.slice(-4)}]`);
  redacted = redacted.replace(/sk-ant-[a-zA-Z0-9]{32,}/g, (m) => `sk-ant-...[REDACTED_DLP_${m.slice(-4)}]`);
  // Redact Paystack / Flutterwave keys
  redacted = redacted.replace(/sk_(live|test)_[0-9a-zA-Z]{20,}/g, (m) => `sk_...[REDACTED_DLP_${m.slice(-4)}]`);
  redacted = redacted.replace(/FLWSECK(_TEST)?-[0-9a-zA-Z]{20,}/g, '[REDACTED_FLUTTERWAVE_SECRET]');
  // Redact AWS credentials
  redacted = redacted.replace(/AKIA[0-9A-Z]{16}/g, (m) => `AKIA...[REDACTED_DLP_${m.slice(-4)}]`);
  // Redact Stripe keys
  redacted = redacted.replace(/(sk_live|sk_test|rk_live)_[0-9a-zA-Z]{24,}/g, (m) => `sk_...[REDACTED_DLP_${m.slice(-4)}]`);
  // Redact Slack webhooks
  redacted = redacted.replace(/https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9_]{8}\/B[A-Z0-9_]{8}\/[A-Za-z0-9_]{24}/g, '[REDACTED_SLACK_WEBHOOK]');
  // Redact JWT secrets
  redacted = redacted.replace(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, '[REDACTED_JWT_TOKEN]');
  // Redact DB URLs
  redacted = redacted.replace(/postgres(ql)?:\/\/[^:]+:[^@]+@/g, 'postgres://[REDACTED_DB_CREDENTIALS]@');
  return redacted;
}

async function runGeminiAudit(files, repoName) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const fileSummary = files
    .map(
      (f) => `
=== File: ${f.filePath} ===
${applyLocalDlp(f.content).substring(0, 7000)}
`
    )
    .join('\n');

  const prompt = `
You are VibeScan, an elite AI Security Audit engine specializing in finding vulnerabilities in AI-generated ('vibe-coded') applications.
Analyze the following source files from "${repoName}" for security and architectural flaws.

Identify items across these categories:
1. "hardcodedSecrets": Exposed OpenAI/Anthropic/Google keys, Paystack/Flutterwave secret keys, Stripe keys, Supabase Service Role keys on client, DB URLs, Private Keys.
2. "webhookSecurity": Webhook handlers missing constant-time cryptographic HMAC verification (crypto.timingSafeEqual).
3. "databaseSecurity": Unauthenticated Supabase/Firebase queries, missing RLS, or exposed database credentials.
4. "promptSecurity": Unsanitized user inputs interpolated into system prompts (Prompt Injection / OWASP LLM01).
5. "owasp": Direct eval(), command execution, raw SQL query concatenation, unescaped innerHTML on LLM outputs.
6. "accessGaps": Wildcard CORS, unauthenticated Next.js Server Actions, insecure routing.

For each finding, return:
- "ruleId": "VIBE-001" through "VIBE-010" or "OWASP-xxx"
- "category": 'hardcodedSecrets' | 'webhookSecurity' | 'databaseSecurity' | 'promptSecurity' | 'owasp' | 'accessGaps' | 'dependencies'
- "severity": 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
- "title": Short descriptive title
- "description": Why this is dangerous
- "filePath": Relative path
- "lineNumber": Approximate line number
- "snippet": Redacted offending line of code
- "fixSuggestion": Concrete explanation of how to fix
- "fixSnippet": Secure replacement code
- "diffPatch": Unified diff format (--- a/file +++ b/file - old + new)
- "cweId": CWE identifier (e.g. CWE-798, CWE-94, CWE-321)
- "owaspId": OWASP LLM identifier (e.g. LLM01, LLM02, LLM05)

Source Files:
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
                  ruleId: { type: "STRING" },
                  category: { type: "STRING" },
                  severity: { type: "STRING" },
                  title: { type: "STRING" },
                  description: { type: "STRING" },
                  filePath: { type: "STRING" },
                  lineNumber: { type: "INTEGER" },
                  snippet: { type: "STRING" },
                  fixSuggestion: { type: "STRING" },
                  fixSnippet: { type: "STRING" },
                  diffPatch: { type: "STRING" },
                  cweId: { type: "STRING" },
                  owaspId: { type: "STRING" }
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
    console.error('Gemini AI audit failed, relying on deterministic static engine:', error.message);
  }
  return null;
}

// -----------------------------------------------------------------------------
// DETERMINISTIC 10 CORE VIBE-CODE SECURITY RULES (SAST ENGINE)
// -----------------------------------------------------------------------------
const staticRules = {
  hardcodedSecrets: [
    {
      ruleId: 'VIBE-001',
      regex: /sk-[a-zA-Z0-9]{32,}|sk-ant-[a-zA-Z0-9]{32,}|AIzaSy[a-zA-Z0-9_-]{33}/g,
      title: 'Exposed AI API Key (OpenAI / Anthropic / Gemini)',
      severity: 'CRITICAL',
      owaspId: 'LLM02',
      description: 'A hardcoded AI model secret key was detected in your codebase. If committed or exposed in client bundles, attackers can drain API credit balances and access model fine-tunes.',
      fixSuggestion: 'Move key to server-side .env configuration (e.g. `process.env.OPENAI_API_KEY`). Never expose in `VITE_` or `NEXT_PUBLIC_` variables.',
      fixSnippet: 'const apiKey = process.env.OPENAI_API_KEY;',
      diffPatch: '- const apiKey = "[EXPOSED_OPENAI_KEY]";\n+ const apiKey = process.env.OPENAI_API_KEY;',
      cweId: 'CWE-798'
    },
    {
      ruleId: 'VIBE-002',
      regex: /sk_(live|test)_[0-9a-zA-Z]{20,}|FLWSECK(_TEST)?-[0-9a-zA-Z]{20,}/g,
      title: 'Exposed Paystack / Flutterwave Secret Key',
      severity: 'CRITICAL',
      owaspId: 'LLM02',
      description: 'An exposed African payment gateway secret key was detected. Attackers can initiate fraudulent refunds, spoof transactions, and compromise merchant balances.',
      fixSuggestion: 'Store your secret key strictly on backend environment variables and verify webhook events server-side.',
      fixSnippet: 'const paystackSecret = process.env.PAYSTACK_SECRET_KEY;',
      diffPatch: '- const secret = "[EXPOSED_PAYSTACK_KEY]";\n+ const secret = process.env.PAYSTACK_SECRET_KEY;',
      cweId: 'CWE-798'
    },
    {
      ruleId: 'VIBE-003',
      regex: /(sk_live|rk_live)_[0-9a-zA-Z]{24,}|whsec_[0-9a-zA-Z]{24,}/g,
      title: 'Exposed Stripe Secret or Webhook Key',
      severity: 'CRITICAL',
      owaspId: 'LLM02',
      description: 'An exposed Stripe secret key or webhook signing secret was detected. Attackers can execute charges, issue unauthorized refunds, or download customer records.',
      fixSuggestion: 'Move secret key to secure backend environment variables.',
      fixSnippet: 'const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);',
      diffPatch: '- const stripe = new Stripe("[EXPOSED_STRIPE_KEY]");\n+ const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);',
      cweId: 'CWE-798'
    },
    {
      ruleId: 'VIBE-004',
      regex: /(SUPABASE_SERVICE_ROLE_KEY|service_role_key|supabaseServiceKey)\s*[:=]\s*['"][a-zA-Z0-9._-]+['"]/gi,
      title: 'Supabase Service Role Key Exposed on Client',
      severity: 'CRITICAL',
      owaspId: 'LLM02',
      description: 'The Supabase Service Role key bypasses all PostgreSQL Row Level Security (RLS) policies. Using it in frontend code allows any user to read or drop entire database tables.',
      fixSuggestion: 'Only use NEXT_PUBLIC_SUPABASE_ANON_KEY on the client. Keep the Service Role key exclusively in secure backend server actions or edge functions.',
      fixSnippet: 'const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);',
      diffPatch: '- const supabase = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY);\n+ const supabase = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);',
      cweId: 'CWE-798'
    },
    {
      ruleId: 'VIBE-006',
      regex: /postgres(ql)?:\/\/[a-zA-Z0-9._-]+:[^@\s]+@[a-zA-Z0-9.-]+:[0-9]+\/[a-zA-Z0-9._-]+/g,
      title: 'Database Plaintext Password Leak in Connection String',
      severity: 'CRITICAL',
      owaspId: 'LLM02',
      description: 'A database connection URI with embedded plaintext username and password was found. Direct datastore access can be obtained by unauthorized parties.',
      fixSuggestion: 'Inject database connection strings dynamically via system-level environment variables (DATABASE_URL).',
      fixSnippet: 'const client = new Client({ connectionString: process.env.DATABASE_URL });',
      diffPatch: '- const uri = "postgres://user:password@db.example.com/main";\n+ const uri = process.env.DATABASE_URL;',
      cweId: 'CWE-798'
    },
    {
      ruleId: 'VIBE-SEC-KEY',
      regex: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/g,
      title: 'Hardcoded Cryptographic Private Key',
      severity: 'CRITICAL',
      owaspId: 'LLM02',
      description: 'An exposed RSA/EC Private Key was detected in code. This allows complete server impersonation and TLS/decryption compromise.',
      fixSuggestion: 'Load cryptographic keys dynamically from secure filesystem key vaults or KMS.',
      fixSnippet: "const cert = fs.readFileSync(process.env.PRIVATE_KEY_PATH);",
      diffPatch: '- const key = "-----BEGIN PRIVATE KEY-----...";\n+ const key = fs.readFileSync(process.env.PRIVATE_KEY_PATH);',
      cweId: 'CWE-321'
    }
  ],
  webhookSecurity: [
    {
      ruleId: 'VIBE-005',
      regex: /(req\.headers\['x-paystack-signature'\]|req\.headers\['stripe-signature'\]|req\.headers\['verif-hash'\])/i,
      title: 'Webhook Signature Missing Constant-Time Verification',
      severity: 'HIGH',
      owaspId: 'LLM05',
      description: 'Webhook verification using standard equality (===) is vulnerable to timing side-channel attacks. A webhook signature must be verified using crypto.timingSafeEqual.',
      fixSuggestion: 'Use crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computedHash)) to protect webhook authentication.',
      fixSnippet: 'const isValid = crypto.timingSafeEqual(Buffer.from(signature, "utf8"), Buffer.from(computedHash, "utf8"));',
      diffPatch: '- if (signature === computedHash) {\n+ if (crypto.timingSafeEqual(Buffer.from(signature, "utf8"), Buffer.from(computedHash, "utf8"))) {',
      cweId: 'CWE-208'
    }
  ],
  promptSecurity: [
    {
      ruleId: 'VIBE-007',
      regex: /(prompt|system_message|systemPrompt|systemMessage)\s*(\+?=|\:)\s*(`[^`]*\$\{(req\.body|req\.query|userInput|input|query)\.[^}]+\}[^`]*`|.*\b(req\.body|req\.query|userInput)\b)/i,
      title: 'Prompt Injection Risk (Direct Input Interpolation)',
      severity: 'HIGH',
      owaspId: 'LLM01',
      description: 'Direct string concatenation of untrusted user input into system prompts allows jailbreaking and prompt injection attacks.',
      fixSuggestion: 'Isolate system instructions from user messages using separate role messages with strict input sanitization.',
      fixSnippet: 'const messages = [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: sanitizeInput(userInput) }];',
      diffPatch: '- const prompt = `You are a bot. Answer this: ${req.body.text}`;\n+ const messages = [{ role: "system", content: "You are a bot." }, { role: "user", content: sanitize(req.body.text) }];',
      cweId: 'CWE-1156'
    },
    {
      ruleId: 'VIBE-010',
      regex: /openai\.(chat\.)?completions\.create\(\s*\{(?![^}]*max_tokens)/i,
      title: 'Unbounded LLM Consumption Risk (Denial of Wallet)',
      severity: 'MEDIUM',
      owaspId: 'LLM10',
      description: 'Calling LLM completions without an explicit max_tokens cap can result in high token usage fees or service exhaustion.',
      fixSuggestion: 'Always define an explicit max_tokens limit on completion calls.',
      fixSnippet: "openai.chat.completions.create({ model: 'gpt-4o', messages, max_tokens: 500 });",
      diffPatch: '- openai.chat.completions.create({ model: "gpt-4o", messages });\n+ openai.chat.completions.create({ model: "gpt-4o", messages, max_tokens: 500 });',
      cweId: 'CWE-400'
    }
  ],
  owasp: [
    {
      ruleId: 'VIBE-008',
      regex: /eval\s*\(/g,
      title: 'Unsafe eval() Dynamic Code Execution',
      severity: 'CRITICAL',
      owaspId: 'LLM05',
      description: 'Executing eval() on dynamic or AI-generated strings enables Remote Code Execution (RCE).',
      fixSuggestion: 'Replace eval() with structured JSON.parse() or a sandboxed execution context.',
      fixSnippet: 'const data = JSON.parse(input);',
      diffPatch: '- const result = eval(userInput);\n+ const result = JSON.parse(userInput);',
      cweId: 'CWE-94'
    },
    {
      ruleId: 'VIBE-008-EXEC',
      regex: /exec\s*\(\s*`.*?\$\{.*?\}.*?`\s*\)/g,
      title: 'Command Injection via Unsanitized exec()',
      severity: 'CRITICAL',
      owaspId: 'LLM05',
      description: 'Passing user input directly into shell execution enables OS Command Injection.',
      fixSuggestion: 'Use child_process.execFile() or spawn() with argument arrays instead of raw shell execution.',
      fixSnippet: "child_process.execFile('/usr/bin/git', ['clone', sanitizedUrl]);",
      diffPatch: '- exec(`git clone ${url}`);\n+ execFile("/usr/bin/git", ["clone", url]);',
      cweId: 'CWE-78'
    },
    {
      ruleId: 'VIBE-008-SQL',
      regex: /\.(query|execute|\$queryRawUnsafe)\s*\(\s*`.*?\$\{.*?\}.*?`\s*\)/g,
      title: 'Raw SQL String Concatenation (SQL Injection)',
      severity: 'HIGH',
      owaspId: 'LLM05',
      description: 'Raw database query execution using string interpolation allows SQL injection attacks.',
      fixSuggestion: 'Refactor to parameterized queries or Prisma $queryRaw with template tags.',
      fixSnippet: "db.query('SELECT * FROM users WHERE id = $1', [userId]);",
      diffPatch: '- db.query(`SELECT * FROM users WHERE id = ${userId}`);\n+ db.query("SELECT * FROM users WHERE id = $1", [userId]);',
      cweId: 'CWE-89'
    },
    {
      ruleId: 'VIBE-008-XSS',
      regex: /(\.innerHTML\s*=|dangerouslySetInnerHTML\s*=\s*\{\s*__html\s*:)/g,
      title: 'Potential XSS via Raw HTML Injection',
      severity: 'HIGH',
      owaspId: 'LLM05',
      description: 'Injecting raw HTML without DOMPurify sanitization allows Cross-Site Scripting (XSS).',
      fixSuggestion: 'Sanitize strings using DOMPurify before assigning to innerHTML or dangerouslySetInnerHTML.',
      fixSnippet: 'element.innerHTML = DOMPurify.sanitize(userInput);',
      diffPatch: '- element.innerHTML = userInput;\n+ element.innerHTML = DOMPurify.sanitize(userInput);',
      cweId: 'CWE-79'
    }
  ],
  accessGaps: [
    {
      ruleId: 'VIBE-009',
      regex: /cors\(\s*\{\s*origin:\s*['"]\*['"]\s*,\s*credentials:\s*true\s*\}\s*\)/gi,
      title: 'Permissive CORS with Credentials Enabled',
      severity: 'HIGH',
      owaspId: 'LLM02',
      description: 'Configuring wildcard CORS (*) while allowing credentials (cookies/auth headers) creates a severe Cross-Origin vulnerability.',
      fixSuggestion: 'Specify explicit trusted origins in CORS configuration instead of wildcards.',
      fixSnippet: "cors({ origin: ['https://app.yourdomain.com'], credentials: true });",
      diffPatch: '- cors({ origin: "*", credentials: true });\n+ cors({ origin: [process.env.ALLOWED_ORIGIN], credentials: true });',
      cweId: 'CWE-942'
    },
    {
      ruleId: 'VIBE-SSL-VERIF',
      regex: /rejectUnauthorized\s*:\s*false/g,
      title: 'Insecure SSL Certificate Verification Disabled',
      severity: 'HIGH',
      owaspId: 'LLM02',
      description: 'Disabling rejectUnauthorized removes TLS certificate validation, exposing all database or API traffic to Man-in-the-Middle (MitM) eavesdropping.',
      fixSuggestion: 'Always verify SSL certificates in production environments.',
      fixSnippet: 'rejectUnauthorized: true,',
      diffPatch: '- rejectUnauthorized: false,\n+ rejectUnauthorized: true,',
      cweId: 'CWE-295'
    }
  ]
};

// -----------------------------------------------------------------------------
// DAST ACTIVE LIVE WEB SCANNER (ENDPOINT & HEADERS PROBER)
// -----------------------------------------------------------------------------
async function runWebScan(url) {
  let domain = 'unknown';
  let origin = url;
  try {
    const parsed = new URL(url);
    domain = parsed.hostname;
    origin = parsed.origin;
  } catch (e) {
    throw new Error('Invalid Web Application URL');
  }

  const findings = [];
  let scorePoints = 100;

  // 1. DAST Sensitive File & Git Leak Probing
  const sensitivePaths = [
    { path: '/.env', title: 'Publicly Accessible .env File', severity: 'CRITICAL', cweId: 'CWE-552' },
    { path: '/.git/config', title: 'Publicly Accessible Git Configuration (/.git/config)', severity: 'CRITICAL', cweId: 'CWE-552' },
    { path: '/.env.local', title: 'Publicly Accessible Local Environment File', severity: 'CRITICAL', cweId: 'CWE-552' },
    { path: '/api/debug', title: 'Public Debug Endpoint Exposed (/api/debug)', severity: 'HIGH', cweId: 'CWE-489' }
  ];

  for (const item of sensitivePaths) {
    try {
      const probeRes = await axios.get(`${origin}${item.path}`, { 
        timeout: 4000, 
        headers: { 'User-Agent': 'VibeScan-DAST/2.0' },
        validateStatus: () => true 
      });

      if (probeRes.status === 200 && typeof probeRes.data === 'string' && (probeRes.data.includes('KEY') || probeRes.data.includes('repositoryformatversion') || probeRes.data.includes('DATABASE') || probeRes.data.includes('SECRET'))) {
        scorePoints -= 35;
        findings.push({
          ruleId: 'DAST-FILE-LEAK',
          category: 'hardcodedSecrets',
          severity: item.severity,
          title: item.title,
          file: item.path,
          message: `Your live deployment exposes sensitive configuration data at ${origin}${item.path}. Attackers can download environment credentials or full source history.`,
          description: `Direct HTTP access to configuration files allows complete credential compromise.`,
          lineNumber: 1,
          snippet: `GET ${item.path} -> HTTP 200 OK`,
          fixSuggestion: 'Configure your web server / CDN (Vercel, Nginx, Cloudflare) to block access to dotfiles and sensitive paths.',
          fixSnippet: 'location ~ /\\.(?!well-known) { deny all; }',
          cweId: item.cweId,
          owaspId: 'LLM02'
        });
      }
    } catch (e) {
      // Path safely blocked or timed out
    }
  }

  // 2. DAST Security Headers Audit
  try {
    const response = await axios.get(url, { 
      timeout: 8000, 
      headers: { 'User-Agent': 'VibeScan-DAST/2.0' },
      validateStatus: () => true
    });
    const headers = response.headers;

    if (!headers['strict-transport-security']) {
      scorePoints -= 15;
      findings.push({
        ruleId: 'DAST-HSTS',
        category: 'accessGaps',
        severity: 'HIGH',
        title: 'Missing HTTP Strict Transport Security (HSTS)',
        file: 'HTTP Headers',
        message: 'Your website does not enforce HTTPS via HSTS headers. Attackers on public WiFi can downgrade and intercept traffic.',
        description: 'Missing Strict-Transport-Security allows SSL-stripping attacks.',
        lineNumber: 1,
        snippet: 'GET / HTTP/1.1',
        fixSuggestion: 'Enable HSTS with max-age and includeSubDomains in your server configuration.',
        fixSnippet: "res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');",
        cweId: 'CWE-523',
        owaspId: 'LLM02'
      });
    }

    if (!headers['content-security-policy']) {
      scorePoints -= 20;
      findings.push({
        ruleId: 'DAST-CSP',
        category: 'accessGaps',
        severity: 'HIGH',
        title: 'Missing Content Security Policy (CSP)',
        file: 'HTTP Headers',
        message: 'Your site does not define a CSP header. Attackers can execute injected scripts and exfiltrate credentials.',
        description: 'Missing CSP header fails to restrict scripts and frame sources.',
        lineNumber: 1,
        snippet: 'GET / HTTP/1.1',
        fixSuggestion: 'Implement a strict Content Security Policy (CSP) header.',
        fixSnippet: "res.setHeader('Content-Security-Policy', \"default-src 'self'; script-src 'self';\");",
        cweId: 'CWE-1021',
        owaspId: 'LLM05'
      });
    }

    if (!headers['x-frame-options']) {
      scorePoints -= 10;
      findings.push({
        ruleId: 'DAST-FRAME',
        category: 'accessGaps',
        severity: 'MEDIUM',
        title: 'Missing X-Frame-Options (Clickjacking Risk)',
        file: 'HTTP Headers',
        message: 'Your pages do not block framing. Attackers can iframe your application to trick users into invisible clicks.',
        description: 'Missing X-Frame-Options allows clickjacking attacks.',
        lineNumber: 1,
        snippet: 'GET / HTTP/1.1',
        fixSuggestion: 'Set X-Frame-Options to DENY or SAMEORIGIN.',
        fixSnippet: "res.setHeader('X-Frame-Options', 'DENY');",
        cweId: 'CWE-1021',
        owaspId: 'LLM05'
      });
    }

    if (!headers['x-content-type-options']) {
      scorePoints -= 10;
      findings.push({
        ruleId: 'DAST-MIME',
        category: 'accessGaps',
        severity: 'LOW',
        title: 'Missing X-Content-Type-Options: nosniff',
        file: 'HTTP Headers',
        message: 'Browsers may attempt MIME-sniffing and execute text files as active scripts.',
        description: 'Missing nosniff flag permits MIME confusion attacks.',
        lineNumber: 1,
        snippet: 'GET / HTTP/1.1',
        fixSuggestion: 'Set X-Content-Type-Options to nosniff.',
        fixSnippet: "res.setHeader('X-Content-Type-Options', 'nosniff');",
        cweId: 'CWE-79',
        owaspId: 'LLM05'
      });
    }
  } catch (e) {
    scorePoints = Math.max(40, scorePoints - 30);
    findings.push({
      ruleId: 'DAST-CONNECT-ERR',
      category: 'accessGaps',
      severity: 'HIGH',
      title: 'Target Endpoint Reachability Warning',
      file: 'Network',
      message: `Failed to complete dynamic probing for ${url}. Ensure the server is online and accessible.`,
      description: e.message,
      lineNumber: 1,
      snippet: url,
      fixSuggestion: 'Verify domain DNS and server uptime.',
      fixSnippet: 'ping ' + domain,
      cweId: 'CWE-1021',
      owaspId: 'LLM02'
    });
  }

  scorePoints = Math.max(0, scorePoints);
  let grade = 'A';
  if (scorePoints < 50) grade = 'F';
  else if (scorePoints < 65) grade = 'D';
  else if (scorePoints < 80) grade = 'C';
  else if (scorePoints < 90) grade = 'B';
  else if (scorePoints >= 95) grade = 'A+';

  return {
    repo: domain,
    grade,
    score: scorePoints,
    findingsCount: findings.length,
    findings,
    scanType: 'DAST_DYNAMIC_PROBE'
  };
}

// -----------------------------------------------------------------------------
// HYBRID SCANNER ENGINE ORCHESTRATOR
// -----------------------------------------------------------------------------
export async function runScan(repoUrl, localFilePath = null) {
  let owner = 'local', repo = 'upload';
  let zipBuffer;

  if (repoUrl) {
    const repoInfo = parseGitHubUrl(repoUrl);
    if (!repoInfo) {
      // Run active DAST Web Scan if not a GitHub URL
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
    
    // 1. Run Deterministic Static Analysis Engine (Fast & Zero Hallucination)
    console.log(`[VibeScan Engine] Running Deterministic VIBE Security Rules on ${files.length} files (${owner}/${repo})`);
    
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
                  if (match.startsWith('FLWSECK')) return `FLWSECK...${match.slice(-4)}`;
                  return '[REDACTED_SECRET]';
                }).trim();
              }
              
              findings.push({
                ruleId: rule.ruleId || 'VIBE-GEN',
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
                diffPatch: rule.diffPatch || null,
                cweId: rule.cweId,
                owaspId: rule.owaspId || 'LLM02',
                cveId: null
              });
            }
          });
        }
      }

      // Check package.json for known CVEs and hallucinated packages
      if (file.filePath.endsWith('package.json')) {
        try {
          const pkg = JSON.parse(file.content);
          const dependencies = { ...pkg.dependencies, ...pkg.devDependencies };
          
          const cveFindings = await checkCVEs(dependencies);
          findings.push(...cveFindings);
          
          const hallucinatedFindings = await checkHallucinatedPackages(dependencies);
          findings.push(...hallucinatedFindings);
        } catch (e) {
          console.error('package.json parse error:', e.message);
        }
      }
    }

    // 2. Optional Gemini AI Contextual Audit Enhancement (If API Key Present)
    if (process.env.GEMINI_API_KEY) {
      console.log(`[VibeScan Engine] Running Gemini AI Architectural Audit for ${owner}/${repo}`);
      const geminiReport = await runGeminiAudit(files, `${owner}/${repo}`);
      if (geminiReport && Array.isArray(geminiReport.findings)) {
        geminiReport.findings.forEach(f => {
          findings.push({
            ruleId: f.ruleId || 'VIBE-AI-AUDIT',
            category: f.category || 'owasp',
            severity: f.severity || 'HIGH',
            title: f.title || 'AI Detected Security Risk',
            file: f.filePath,
            message: f.description || 'AI detected static vulnerability.',
            description: f.description,
            lineNumber: f.lineNumber || null,
            snippet: f.snippet || null,
            fixSuggestion: f.fixSuggestion || null,
            fixSnippet: f.fixSnippet || null,
            diffPatch: f.diffPatch || null,
            cweId: f.cweId || 'CWE-1156',
            owaspId: f.owaspId || 'LLM01',
            cveId: f.cveId || null
          });
        });
      }
    }

    // 3. Deduplicate Findings
    const uniqueFindings = [];
    const seen = new Set();
    findings.forEach(f => {
      const key = `${f.title}-${f.file}-${f.lineNumber}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueFindings.push(f);
      }
    });

    // 4. Calculate Risk Score & Grade
    uniqueFindings.forEach(f => {
      if (f.severity === 'CRITICAL') scorePoints -= 35;
      else if (f.severity === 'HIGH') scorePoints -= 20;
      else if (f.severity === 'MEDIUM') scorePoints -= 10;
      else if (f.severity === 'LOW') scorePoints -= 5;
    });

    scorePoints = Math.max(0, scorePoints);
    let grade = 'A';
    if (scorePoints < 40) grade = 'F';
    else if (scorePoints < 60) grade = 'D';
    else if (scorePoints < 75) grade = 'C';
    else if (scorePoints < 90) grade = 'B';
    else if (scorePoints >= 95 && uniqueFindings.length === 0) grade = 'A+';

    if (localFilePath && fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return {
      repo: `${owner}/${repo}`,
      grade,
      score: scorePoints,
      findingsCount: uniqueFindings.length,
      findings: uniqueFindings,
      scanType: 'HYBRID_SAST_ENGINE'
    };

  } catch (error) {
    if (localFilePath && fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    console.error('Fatal scan error:', error.message);
    throw new Error('Failed to process repository: ' + error.message);
  }
}
