import * as core from '@actions/core';
import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';
import { runScan } from '../server/scanner.js';

async function run() {
  try {
    const workspace = process.env.GITHUB_WORKSPACE || process.cwd();
    const failOnGrade = core.getInput('fail-on') || 'D';
    
    core.info(`Zipping workspace: ${workspace}`);
    const zip = new AdmZip();
    zip.addLocalFolder(workspace, '', /^(?!.*(node_modules|\.git)).*$/); // Exclude node_modules and .git
    
    const tempZipPath = path.join(process.cwd(), 'vibe-workspace.zip');
    zip.writeZip(tempZipPath);
    
    core.info(`Running VibeAudit Scanner on ${tempZipPath}...`);
    const results = await runScan(null, tempZipPath);
    
    core.info(`\n--- VibeAudit Results ---`);
    core.info(`Score: ${results.score} / 100`);
    core.info(`Grade: ${results.grade}`);
    core.info(`Total Findings: ${results.findingsCount}\n`);
    
    results.findings.forEach(finding => {
      core.warning(`[${finding.category}] ${finding.title} in ${finding.file}: ${finding.message}`);
    });

    const gradeOrder = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'F': 1 };
    const failThreshold = gradeOrder[failOnGrade.toUpperCase()] || 2; // Default to D (2)
    const actualGrade = gradeOrder[results.grade] || 1;

    if (actualGrade <= failThreshold) {
      core.setFailed(`VibeAudit security check failed with a grade of ${results.grade}. Minimum acceptable grade is above ${failOnGrade}.`);
    } else {
      core.info(`✅ Codebase passes VibeAudit security checks!`);
    }

  } catch (error) {
    core.setFailed(`Action failed with error: ${error.message}`);
  }
}

run();
