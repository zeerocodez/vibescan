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
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'VibeGuard-Scanner' }
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      try {
        const mainUrl = `https://api.github.com/repos/${owner}/${repo}/zipball/main`;
        const mainResponse = await axios.get(mainUrl, {
          responseType: 'arraybuffer',
          headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'VibeGuard-Scanner' }
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
    // OSV API batch query
    const queries = pkgs.map(pkg => {
      const rawVer = dependencies[pkg] || '';
      // Strip ^, ~ or other prefixes to get a concrete version. If it's a weird format or *, default to latest or omit.
      const versionMatch = rawVer.match(/\d+\.\d+\.\d+/);
      const version = versionMatch ? versionMatch[0] : null;
      
      const query = { package: { name: pkg, ecosystem: 'npm' } };
      if (version) query.version = version;
      return query;
    });
    
    // We only want to alert if a specific version is vulnerable
    // However, if we omitted version, OSV returns ALL vulns. Let's filter queries that have a valid version.
    const validQueries = queries.filter(q => q.version);
    if (validQueries.length === 0) return findings;

    const response = await axios.post('https://api.osv.dev/v1/querybatch', { queries: validQueries }, { timeout: 10000 });
    
    if (response.data?.results) {
      response.data.results.forEach((res, index) => {
        if (res.vulns && res.vulns.length > 0) {
          const vuln = res.vulns[0]; // Take the first known vulnerability
          findings.push({
            category: 'dependencies',
            title: `Known Vulnerability in ${validQueries[index].package.name}`,
            file: 'package.json',
            message: `CRITICAL: The package ${validQueries[index].package.name} at version ${validQueries[index].version} has a known CVE (${vuln.id}). Upgrade immediately to prevent a known exploit.`
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
          category: 'supply_chain',
          title: `AI Hallucinated Package: ${pkg}`,
          file: 'package.json',
          message: `CRITICAL: The AI generated a dependency '${pkg}' that does not exist on npm. Attackers monitor these hallucinations to register malware under the fake name. Remove immediately.`
        });
      }
    }
  }
  return findings;
}

export async function runScan(repoUrl, localFilePath = null) {
  let owner = 'local', repo = 'upload';
  let zipBuffer;

  if (repoUrl) {
    const repoInfo = parseGitHubUrl(repoUrl);
    if (!repoInfo) throw new Error('Invalid GitHub URL');
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
    const zip = new AdmZip(Buffer.from(zipBuffer));
    const zipEntries = zip.getEntries();
    
    const patterns = {
      hardcodedSecrets: [
        { regex: /sk-[a-zA-Z0-9]{32,}/g, name: 'OpenAI API Key' },
        { regex: /AKIA[0-9A-Z]{16}/g, name: 'AWS Access Key ID' },
        { regex: /(sk_live|sk_test)_[0-9a-zA-Z]{24}/g, name: 'Stripe Secret Key' },
      ],
      injectionRisks: [
        { regex: /eval\s*\(/g, name: 'eval() function usage' },
        { regex: /exec\s*\(/g, name: 'exec() command execution' },
        { regex: /\.innerHTML\s*=/g, name: 'Unescaped HTML injection' },
        { regex: /\.(query|execute)\s*\(\s*`.*?\$\{.*?\}.*?`\s*\)/g, name: 'SQL Query Concatenation' }
      ],
      accessGaps: [
        { regex: /cors\(\s*\{\s*origin:\s*['"]\*['"]\s*\}\s*\)/g, name: 'Wildcard CORS Policy' },
      ],
      insecureDefaults: [
        { regex: /DEBUG\s*=\s*(True|true)/g, name: 'Debug Mode Enabled' },
      ],
      aiRisks: [
        { regex: /(prompt|system_message|context)\s*(\+?=)\s*.*\b(req\.body|req\.query|userInput)\b/i, name: 'Prompt Injection Risk' },
        { regex: /role:\s*['"](system|user)['"],\s*content:\s*.*\b(req\.|input|body)\b/i, name: 'Unsanitized LLM Context' },
        { regex: /(eval|exec|innerHTML)\s*=?\s*.*\b(response|completion|answer|reply|output)\b/i, name: 'Insecure LLM Output Handling' }
      ]
    };

    for (const entry of zipEntries) {
      if (entry.isDirectory) continue;
      const fileName = entry.entryName;
      if (fileName.includes('node_modules/') || fileName.includes('.git/')) continue;
      
      const content = entry.getData().toString('utf8');
      
      for (const [category, ruleList] of Object.entries(patterns)) {
        for (const rule of ruleList) {
          if (rule.regex.test(content)) {
            if (category === 'hardcodedSecrets') scorePoints -= 40;
            else if (category === 'injectionRisks') scorePoints -= 30;
            else if (category === 'aiRisks') scorePoints -= 35;
            else if (category === 'accessGaps') scorePoints -= 20;
            else if (category === 'insecureDefaults') scorePoints -= 15;

            findings.push({
              category,
              title: rule.name,
              file: fileName.split('/').slice(1).join('/'),
              message: translateToVibeLanguage(category, rule.name)
            });
          }
        }
      }

      if (fileName.endsWith('package.json') && !fileName.includes('node_modules')) {
        try {
          const pkg = JSON.parse(content);
          const dependencies = { ...pkg.dependencies };
          
          // Check for CVEs via OSV API
          const cveFindings = await checkCVEs(dependencies);
          if (cveFindings.length > 0) {
            scorePoints -= (cveFindings.length * 20);
            findings.push(...cveFindings);
          }
          
          // Check for AI Hallucinated Packages
          const hallucinatedFindings = await checkHallucinatedPackages(dependencies);
          if (hallucinatedFindings.length > 0) {
            scorePoints -= (hallucinatedFindings.length * 50); // Massive penalty for supply chain risks
            findings.push(...hallucinatedFindings);
          }
        } catch (e) {}
      }
    }

    // Cleanup temp zip if local
    if (localFilePath) fs.unlinkSync(localFilePath);

    let grade = 'A';
    if (scorePoints < 40) grade = 'F';
    else if (scorePoints < 60) grade = 'D';
    else if (scorePoints < 80) grade = 'C';
    else if (scorePoints < 90) grade = 'B';

    return {
      repo: `${owner}/${repo}`,
      grade,
      score: Math.max(0, scorePoints),
      findingsCount: findings.length,
      findings
    };

  } catch (error) {
    if (localFilePath && fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
    throw new Error('Failed to process repository.');
  }
}

function translateToVibeLanguage(category, specificType) {
  const translations = {
    hardcodedSecrets: "Your API key is showing in the code. Anyone who sees this code can use your account, run up your bill, and cause immense personal liability.",
    injectionRisks: `A user could type malicious code into your form and your app would run it (${specificType}). You must sanitize user inputs immediately.`,
    accessGaps: "This page has no lock on the door (Wildcard CORS). Anyone can call your APIs directly from their own sketchy websites.",
    insecureDefaults: `Your app is still in test mode (${specificType}). It is telling visitors far more about your internal system than it should.`,
    aiRisks: `AI Cybersecurity Risk detected (${specificType}). Passing raw user inputs to LLMs can lead to Prompt Injection, and trusting LLM outputs can lead to Remote Code Execution.`
  };
  return translations[category] || "Security risk detected.";
}
