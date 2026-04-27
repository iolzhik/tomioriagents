/**
 * GitHub Storage — persists JSON files in the repo via GitHub Contents API.
 * Used as a write-through store on Vercel where the filesystem is read-only.
 *
 * Requires env var: GITHUB_TOKEN (Personal Access Token with repo/contents:write)
 */

const GITHUB_OWNER = 'iolzhik';
const GITHUB_REPO  = 'tomioriagents';
const GITHUB_BRANCH = 'main';
const API_BASE = 'https://api.github.com';

function getToken(): string | null {
  return process.env.GITHUB_TOKEN || null;
}

/** Fetch current file content + SHA from GitHub */
export async function githubReadFile(filePath: string): Promise<{ content: string; sha: string } | null> {
  const token = getToken();
  if (!token) return null;

  const url = `${API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}?ref=${GITHUB_BRANCH}`;
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    // content is base64-encoded
    const content = Buffer.from(data.content, 'base64').toString('utf8');
    return { content, sha: data.sha };
  } catch {
    return null;
  }
}

/** Write (create or update) a file on GitHub */
export async function githubWriteFile(
  filePath: string,
  content: string,
  message: string,
): Promise<boolean> {
  const token = getToken();
  if (!token) return false;

  // Get current SHA (needed for updates)
  const existing = await githubReadFile(filePath);
  const sha = existing?.sha;

  const url = `${API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`;
  const body: Record<string, any> = {
    message,
    content: Buffer.from(content, 'utf8').toString('base64'),
    branch: GITHUB_BRANCH,
  };
  if (sha) body.sha = sha;

  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Read a JSON file from GitHub, returns parsed object or null */
export async function githubReadJson<T = any>(filePath: string): Promise<T | null> {
  const result = await githubReadFile(filePath);
  if (!result) return null;
  try {
    return JSON.parse(result.content) as T;
  } catch {
    return null;
  }
}

/** Write a JSON file to GitHub */
export async function githubWriteJson(
  filePath: string,
  data: any,
  message: string,
): Promise<boolean> {
  return githubWriteFile(filePath, JSON.stringify(data, null, 2), message);
}
