import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

/**
 * Get the user's home directory
 */
export function getHomeDir(): string {
  return os.homedir();
}

/**
 * Get the OpenCode config directory
 */
export function getOpenCodeDir(): string {
  return path.join(getHomeDir(), '.config', 'opencode');
}

/**
 * Get the sessions directory
 */
export function getSessionsDir(): string {
  return path.join(getOpenCodeDir(), 'sessions');
}

/**
 * Get the learned skills directory
 */
export function getLearnedSkillsDir(): string {
  return path.join(getOpenCodeDir(), 'skills', 'learned');
}

/**
 * Ensure a directory exists
 */
export function ensureDir(dirPath: string): string {
  if (!dirPath || typeof dirPath !== 'string') {
    console.error(`ensureDir: dirPath must be a string, got ${typeof dirPath}:`, dirPath);
    return '';
  }
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  return dirPath;
}

/**
 * Get current date in YYYY-MM-DD format
 */
export function getDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get current time in HH:MM format
 */
export function getTimeString(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Get current datetime in YYYY-MM-DD HH:MM:SS format
 */
export function getDateTimeString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Find files matching a pattern in a directory
 */
export function findFiles(dir: string, pattern: string, options: { maxAge?: number, recursive?: boolean } = {}): Array<{ path: string, mtime: number }> {
  const { maxAge = null, recursive = false } = options;
  const results: Array<{ path: string, mtime: number }> = [];

  if (!fs.existsSync(dir)) {
    return results;
  }

  const regexPattern = pattern
    .replace(/\./g, '\\.')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  const regex = new RegExp(`^${regexPattern}$`);

  function searchDir(currentDir: string) {
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        if (entry.isFile() && regex.test(entry.name)) {
          const stats = fs.statSync(fullPath);
          if (maxAge !== null) {
            const ageInDays = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24);
            if (ageInDays <= maxAge) {
              results.push({ path: fullPath, mtime: stats.mtimeMs });
            }
          } else {
            results.push({ path: fullPath, mtime: stats.mtimeMs });
          }
        } else if (entry.isDirectory() && recursive) {
          searchDir(fullPath);
        }
      }
    } catch (_err) {
      // Ignore permission errors
    }
  }

  searchDir(dir);
  results.sort((a, b) => b.mtime - a.mtime);
  return results;
}

/**
 * Write a text file
 */
export function writeFile(filePath: string, content: string): void {
  if (!filePath || typeof filePath !== 'string') {
    console.error(`writeFile: filePath must be a string, got ${typeof filePath}:`, filePath);
    return;
  }
  if (typeof content !== 'string') {
    console.error(`writeFile: content must be a string, got ${typeof content}`);
    return;
  }
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
}

/**
 * Append to a text file
 */
export function appendFile(filePath: string, content: string): void {
  if (!filePath || typeof filePath !== 'string') {
    console.error(`appendFile: filePath must be a string, got ${typeof filePath}:`, filePath);
    return;
  }
  if (typeof content !== 'string') {
    console.error(`appendFile: content must be a string, got ${typeof content}`);
    return;
  }
  ensureDir(path.dirname(filePath));
  fs.appendFileSync(filePath, content, 'utf8');
}

/**
 * Replace text in a file
 */
export function replaceInFile(filePath: string, search: RegExp | string, replace: string): boolean {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const newContent = content.replace(search, replace);
    writeFile(filePath, newContent);
    return true;
  } catch {
    return false;
  }
}

/**
 * Run a command and return output
 */
export function runCommand(cmd: string): { success: boolean, output: string } {
  try {
    const result = execSync(cmd, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return { success: true, output: result.trim() };
  } catch (err: any) {
    return { success: false, output: err.stderr || err.message };
  }
}

/**
 * Get the git repository name
 */
export function getGitRepoName(): string | null {
  const result = runCommand('git rev-parse --show-toplevel');
  if (!result.success) return null;
  return path.basename(result.output);
}

/**
 * Get project name from git repo or current directory
 */
export function getProjectName(): string | null {
  const repoName = getGitRepoName();
  if (repoName) return repoName;
  return path.basename(process.cwd()) || null;
}

/**
 * Get short session ID
 */
export function getSessionIdShort(sessionId?: string, fallback: string = 'default'): string {
  if (sessionId && sessionId.length > 0) {
    return sessionId.slice(-8);
  }
  return getProjectName() || fallback;
}

/**
 * Check if current directory is a git repository
 */
export function isGitRepo(): boolean {
  return runCommand('git rev-parse --git-dir').success;
}

/**
 * Get git modified files
 */
export function getGitModifiedFiles(patterns: string[] = []): string[] {
  if (!isGitRepo()) return [];

  const result = runCommand('git diff --name-only HEAD');
  if (!result.success) return [];

  let files = result.output.split('\n').filter(Boolean);

  if (patterns.length > 0) {
    files = files.filter(file => {
      return patterns.some(pattern => {
        const regex = new RegExp(pattern);
        return regex.test(file);
      });
    });
  }

  return files;
}
