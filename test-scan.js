import 'dotenv/config';
import { runScan } from './server/scanner.js';

async function test() {
  console.log("Starting security scan on VibeScan codebase...");
  try {
    const report = await runScan('https://github.com/zeerocodez/vibescan');
    console.log("\nScan Completed Successfully!");
    console.log("Target:", report.repo);
    console.log("Score:", report.score);
    console.log("Grade:", report.grade);
    console.log("Findings Count:", report.findingsCount);
    
    console.log("\n=== Findings ===");
    report.findings.forEach((f, idx) => {
      console.log(`\n[${idx + 1}] [${f.severity}] ${f.title}`);
      console.log(`File: ${f.file} (Line ${f.lineNumber})`);
      console.log(`Description: ${f.message}`);
      console.log(`Snippet: ${f.snippet}`);
      console.log(`CWE: ${f.cweId}`);
    });
  } catch (err) {
    console.error("Scan failed:", err.message);
  }
}

test();
