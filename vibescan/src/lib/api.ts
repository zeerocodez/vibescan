import { Scan, LeaderboardItem } from '../types.js';

export async function startScan(repoUrl: string, email?: string): Promise<{ scan_id: string; result_url: string }> {
  const res = await fetch('/api/v1/scan/github', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repo_url: repoUrl, email }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to start scan.');
  }
  return res.json();
}

export async function uploadZip(file: File, email?: string): Promise<{ scan_id: string; result_url: string }> {
  const formData = new FormData();
  formData.append('file', file);
  if (email) formData.append('email', email);

  const res = await fetch('/api/v1/scan/upload', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to upload and scan ZIP.');
  }
  return res.json();
}

export async function getScan(scanId: string): Promise<Scan & { findings?: any[]; progress?: number; stage?: string }> {
  const res = await fetch(`/api/v1/scan/${scanId}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to fetch scan results.');
  }
  return res.json();
}

export async function submitEmail(email: string, scanId: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/v1/email-capture', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, scanId }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to submit email.');
  }
  return res.json();
}

export async function getLeaderboard(): Promise<{ projects: LeaderboardItem[] }> {
  const res = await fetch('/api/v1/leaderboard');
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to fetch leaderboard.');
  }
  return res.json();
}
