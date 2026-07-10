import fs from 'fs';
import path from 'path';
import { Scan, Finding, User, LeaderboardItem } from '../src/types.js';

const DB_DIR = path.join(process.cwd(), 'db_data');

const SCANS_FILE = path.join(DB_DIR, 'scans.json');
const FINDINGS_FILE = path.join(DB_DIR, 'findings.json');
const USERS_FILE = path.join(DB_DIR, 'users.json');

// Helper to ensure files exist and are valid JSON arrays
function ensureDirAndFile(filePath: string, defaultData: any) {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
  }
}

export function initDb() {
  ensureDirAndFile(SCANS_FILE, []);
  ensureDirAndFile(FINDINGS_FILE, []);
  ensureDirAndFile(USERS_FILE, []);
  console.log('Database initialized successfully in:', DB_DIR);
}

// Scans CRUD
export function getScans(): Scan[] {
  try {
    const data = fs.readFileSync(SCANS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

export function getScanById(id: string): Scan | undefined {
  return getScans().find((s) => s.id === id);
}

export function saveScan(scan: Scan) {
  const scans = getScans();
  const index = scans.findIndex((s) => s.id === scan.id);
  if (index >= 0) {
    scans[index] = scan;
  } else {
    scans.push(scan);
  }
  fs.writeFileSync(SCANS_FILE, JSON.stringify(scans, null, 2), 'utf-8');
}

// Findings CRUD
export function getFindings(): Finding[] {
  try {
    const data = fs.readFileSync(FINDINGS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

export function getFindingsByScanId(scanId: string): Finding[] {
  return getFindings().filter((f) => f.scanId === scanId);
}

export function saveFindings(scanId: string, scanFindings: Finding[]) {
  const allFindings = getFindings().filter((f) => f.scanId !== scanId);
  allFindings.push(...scanFindings);
  fs.writeFileSync(FINDINGS_FILE, JSON.stringify(allFindings, null, 2), 'utf-8');
}

// Users CRUD
export function getUsers(): User[] {
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

export function getOrCreateUser(email: string): User {
  const users = getUsers();
  let user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    user = {
      id: Math.random().toString(36).substring(2, 11),
      email: email.toLowerCase(),
      scanCount: 0,
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  }
  return user;
}

export function incrementUserScanCount(email: string) {
  const users = getUsers();
  const index = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
  if (index >= 0) {
    users[index].scanCount += 1;
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  }
}

// Leaderboard
export function getLeaderboard(): LeaderboardItem[] {
  const scans = getScans()
    .filter((s) => s.status === 'completed' && s.overallScore !== undefined)
    .sort((a, b) => (b.overallScore ?? 0) - (a.overallScore ?? 0));

  // Unique scans per repository url (the highest score for each repo)
  const uniqueRepos = new Map<string, Scan>();
  for (const scan of scans) {
    const key = `${scan.repoOwner}/${scan.repoName}`.toLowerCase();
    if (!uniqueRepos.has(key)) {
      uniqueRepos.set(key, scan);
    } else {
      const existing = uniqueRepos.get(key)!;
      if ((scan.overallScore ?? 0) > (existing.overallScore ?? 0)) {
        uniqueRepos.set(key, scan);
      }
    }
  }

  return Array.from(uniqueRepos.values())
    .map((scan, i) => ({
      rank: i + 1,
      projectName: scan.repoName,
      owner: scan.repoOwner,
      score: scan.overallScore ?? 0,
      grade: scan.grade ?? 'F',
      scanUrl: `/r/${scan.id}`,
    }))
    .slice(0, 10);
}
