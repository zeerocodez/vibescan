import cp from 'child_process';
import fs from 'fs';

const VIBEGUARD_URL = process.env.VIBEGUARD_URL || 'http://localhost:3001';

const dangerousCommands = [
  /rm\s+-rf/,
  /wget\s+http/,
  /curl\s+http/,
  /chmod\s+777/,
  /cat\s+\/etc\/shadow/,
  /env\s*>/
];

function isDangerous(command) {
  return dangerousCommands.some(regex => regex.test(command));
}

async function reportThreat(command) {
  try {
    await fetch(`${VIBEGUARD_URL}/api/agent/alert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: process.env.VIBEGUARD_PROJECT_ID || 'local-dev',
        command
      })
    });
  } catch (error) {
    console.error('[AgentGuard] Failed to report threat to VibeGuard backend.', error.message);
  }
}

export function initAgentGuard(options = {}) {
  const mode = options.mode || 'block'; // 'block' or 'audit'
  
  console.log(`[AgentGuard] Initialized in ${mode.toUpperCase()} mode.`);

  // Hook child_process.exec
  const originalExec = cp.exec;
  cp.exec = function(command, ...args) {
    if (isDangerous(command)) {
      console.error(`\x1b[31m[AgentGuard] THREAT DETECTED: Execution of dangerous command "${command}"\x1b[0m`);
      reportThreat(command);
      
      if (mode === 'block') {
        throw new Error(`[AgentGuard] Security Violation: Command "${command}" is blocked.`);
      }
    }
    return originalExec.apply(this, [command, ...args]);
  };

  // Hook child_process.execSync
  const originalExecSync = cp.execSync;
  cp.execSync = function(command, ...args) {
    if (isDangerous(command)) {
      console.error(`\x1b[31m[AgentGuard] THREAT DETECTED: Execution of dangerous command "${command}"\x1b[0m`);
      reportThreat(command);
      
      if (mode === 'block') {
        throw new Error(`[AgentGuard] Security Violation: Command "${command}" is blocked.`);
      }
    }
    return originalExecSync.apply(this, [command, ...args]);
  };

  // Prevent overriding the hooks (basic hardening)
  Object.freeze(cp);
}

// --- LLM OWASP Protections ---

const injectionSignatures = [
  /ignore previous instructions/i,
  /you are now acting as/i,
  /DAN/i,
  /system prompt/i,
  /bypass/i
];

export function promptFirewall(input, options = { mode: 'block' }) {
  if (typeof input !== 'string') return input;
  
  const isMalicious = injectionSignatures.some(regex => regex.test(input));
  if (isMalicious) {
    console.error(`\x1b[31m[AgentGuard] PROMPT INJECTION DETECTED\x1b[0m`);
    reportThreat(`[PROMPT INJECTION] ${input}`);
    if (options.mode === 'block') {
      throw new Error('[AgentGuard] Security Violation: Prompt injection attempt blocked.');
    }
  }
  return input;
}

const piiRegexes = [
  /sk-[a-zA-Z0-9]{32,}/, // OpenAI Key
  /(?:\d{3}-\d{2}-\d{4})/, // SSN (basic)
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/ // Email
];

export function outputFilter(output, options = { redact: true }) {
  if (typeof output !== 'string') return output;
  
  let cleanOutput = output;
  for (const regex of piiRegexes) {
    if (regex.test(cleanOutput)) {
      console.warn(`\x1b[33m[AgentGuard] SENSITIVE INFO DISCLOSURE BLOCKED\x1b[0m`);
      reportThreat(`[DLP VIOLATION] Detected sensitive data matching signature ${regex}`);
      if (options.redact) {
        cleanOutput = cleanOutput.replace(new RegExp(regex, 'g'), '[REDACTED BY AGENTGUARD]');
      } else {
        throw new Error('[AgentGuard] Security Violation: LLM attempted to leak sensitive information.');
      }
    }
  }
  return cleanOutput;
}

const rateLimitStore = new Map();

export function rateLimitLLM(config = { maxRequests: 50, windowMs: 60000 }) {
  return function wrapper(fn) {
    return async function(...args) {
      const now = Date.now();
      const ip = 'global'; // In a real app, track by IP or userId
      
      const record = rateLimitStore.get(ip) || { count: 0, startTime: now };
      if (now - record.startTime > config.windowMs) {
        record.count = 0;
        record.startTime = now;
      }
      
      record.count++;
      rateLimitStore.set(ip, record);
      
      if (record.count > config.maxRequests) {
        console.error(`\x1b[31m[AgentGuard] UNBOUNDED CONSUMPTION BLOCKED\x1b[0m`);
        reportThreat(`[RATE LIMIT EXCEEDED] >${config.maxRequests} requests per minute`);
        throw new Error('[AgentGuard] Rate limit exceeded to prevent DoS/Financial ruin.');
      }
      
      return await fn(...args);
    };
  };
}
