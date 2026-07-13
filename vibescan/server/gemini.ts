import { GoogleGenAI, Type } from '@google/genai';
import { Finding } from '../src/types.js';

let aiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY is not defined. Please configure it in Settings > Secrets.');
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface GeminiAuditResponse {
  findings: Omit<Finding, 'id' | 'scanId'>[];
}

export async function runAIAudit(
  files: Array<{ filePath: string; content: string }>,
  repoName: string
): Promise<GeminiAuditResponse> {
  const ai = getGeminiClient();

  // Keep payload size reasonable by packing the most critical file snippets and structures
  const fileSummary = files
    .map(
      (f) => `
=== File: ${f.filePath} ===
${f.content.substring(0, 5000)} // Truncated if too long
`
    )
    .join('\n');

  const prompt = `
You are VibeScan, a elite AI Security Audit engine specializing in "vibe-coded" applications.
Analyze the following files from the project "${repoName}" for security concerns.

Identify items in these 5 categories:
1. "secrets": Hardcoded API keys (OpenAI 'sk-', AWS, Stripe, Slack webhooks, JWT tokens, Private Keys, DB URLs with passwords, committed .env files). CRITICAL/HIGH severity.
2. "dependencies": Vulnerable or insecure package.json dependencies (flag versions with '^0.x' or '~0.x', unmaintained, or clearly vulnerable packages).
3. "owasp": OWASP risks (evaluation functions, SQL string concatenations, debug mode checks, verify=False, innerHTML usage without sanitization).
4. "hallucinate": Hallucinated packages in package.json or requirements.txt (packages that don't exist, typos of popular packages, suspicious packages).
5. "smell": Code quality and security smells (document.write, hardcoded IPs/domains, TODO comments about security / auth / passwords).

For each finding, provide:
- "category": 'secrets' | 'dependencies' | 'owasp' | 'hallucinate' | 'smell'
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
- "references": Array of resource URLs (e.g., OWASP Top 10 or CWE link)

Project Source Files:
${fileSummary}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: `You are an expert security static analyzer and code auditor. You must output valid JSON matching the requested responseSchema. Always ensure that any secret keys (like real API keys) are masked/redacted in the response "snippet" and "fixSnippet" to ensure safety.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['findings'],
          properties: {
            findings: {
              type: Type.ARRAY,
              description: 'List of discovered security findings',
              items: {
                type: Type.OBJECT,
                required: ['category', 'severity', 'title', 'description', 'filePath'],
                properties: {
                  category: {
                    type: Type.STRING,
                    description: "Category of the finding: 'secrets', 'dependencies', 'owasp', 'hallucinate', 'smell'",
                  },
                  severity: {
                    type: Type.STRING,
                    description: "Severity level: 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'",
                  },
                  title: { type: Type.STRING, description: 'Short description of the finding' },
                  description: { type: Type.STRING, description: 'Detailed description of the vulnerability' },
                  filePath: { type: Type.STRING, description: 'File path of the finding' },
                  lineNumber: { type: Type.INTEGER, description: 'Line number (1-indexed)' },
                  columnNumber: { type: Type.INTEGER, description: 'Column number (optional)' },
                  snippet: { type: Type.STRING, description: 'Code snippet showing the issue, with secrets REDACTED' },
                  fixSuggestion: { type: Type.STRING, description: 'Instructions on how to resolve the issue' },
                  fixSnippet: { type: Type.STRING, description: 'Remediated code snippet' },
                  cweId: { type: Type.STRING, description: 'CWE ID (e.g., CWE-798)' },
                  cveId: { type: Type.STRING, description: 'CVE ID (optional)' },
                  references: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'References to security standards or vulnerabilities',
                  },
                },
              },
            },
          },
        },
      },
    });

    const text = response.text.trim();
    return JSON.parse(text) as GeminiAuditResponse;
  } catch (error) {
    console.error('Gemini AI audit failed, falling back:', error);
    return { findings: [] };
  }
}
