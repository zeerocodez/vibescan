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
