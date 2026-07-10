import { initAgentGuard } from './packages/agentguard/index.js';
import cp from 'child_process';

// Initialize the sandbox in block mode
initAgentGuard({ mode: 'block' });

console.log("Simulating an AI Agent workflow...");
console.log("Agent decides to run a safe command:");

cp.exec('echo Hello World', (error, stdout, stderr) => {
  if (error) {
    console.error(`exec error: ${error}`);
    return;
  }
  console.log(`[Safe Output]:\n${stdout}`);
  
  console.log("\nAgent gets confused/hijacked and decides to delete the root directory:");
  
  try {
    // This should trigger AgentGuard to block and report the threat!
    cp.exec('rm -rf /', (err, stdout) => {
      console.log(stdout);
    });
  } catch (error) {
    console.log("\n[SUCCESS] The rogue command was successfully caught by AgentGuard!");
    console.error(error.message);
  }
});
