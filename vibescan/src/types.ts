export type ScanStatus = 'queued' | 'cloning' | 'scanning' | 'processing' | 'completed' | 'failed';

export interface CategoryScore {
  score: number;
  findingsCount: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
}

export interface ScanCategories {
  secrets: CategoryScore;
  dependencies: CategoryScore;
  owasp: CategoryScore;
  hallucinate: CategoryScore;
  smell: CategoryScore;
}

export interface ScanSummary {
  totalFilesScanned: number;
  totalLinesScanned: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
}

export interface Scan {
  id: string;
  userEmail?: string;
  repoUrl: string;
  repoName: string;
  repoOwner: string;
  status: ScanStatus;
  errorMessage?: string;
  overallScore?: number;
  grade?: string;
  categories?: ScanCategories;
  summary?: ScanSummary;
  shareToken?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  expiresAt: string;
}

export interface Finding {
  id: string;
  scanId: string;
  category: 'secrets' | 'dependencies' | 'owasp' | 'hallucinate' | 'smell';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  title: string;
  description: string;
  filePath: string;
  lineNumber?: number;
  columnNumber?: number;
  snippet?: string;
  fixSuggestion?: string;
  fixSnippet?: string;
  cweId?: string;
  cveId?: string;
  references?: string[];
}

export interface LeaderboardItem {
  rank: number;
  projectName: string;
  owner: string;
  score: number;
  grade: string;
  scanUrl: string;
}

export interface User {
  id: string;
  email: string;
  scanCount: number;
  createdAt: string;
}
