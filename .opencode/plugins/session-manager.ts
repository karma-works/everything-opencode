import type { Plugin } from "@opencode-ai/plugin";
import * as path from 'path';
import * as fs from 'fs';
import {
  getSessionsDir,
  findFiles,
  getDateString,
  getTimeString,
  getDateTimeString,
  getSessionIdShort,
  ensureDir,
  writeFile,
  replaceInFile,
  appendFile
} from './lib/utils';

export const SessionManagerPlugin: Plugin = async ({ project, client, $ }) => {
  const sessionsDir = getSessionsDir();

  return {
    "session.created": async ({ event }) => {
      // Load previous context logic
      ensureDir(sessionsDir);

      const recentSessions = findFiles(sessionsDir, '*-session.md', { maxAge: 7 });

      if (recentSessions.length > 0) {
        console.log(`[SessionStart] Found ${recentSessions.length} recent session(s)`);
        console.log(`[SessionStart] Latest: ${recentSessions[0].path}`);
      }
    },

    "session.closed": async ({ event }) => {
      // Persist session state logic
      ensureDir(sessionsDir);
      const today = getDateString();

      const sessionId = event?.properties?.sessionId;
      const shortId = getSessionIdShort(sessionId);

      const sessionFile = path.join(sessionsDir, `${today}-${shortId}-session.md`);
      const currentTime = getTimeString();

      if (fs.existsSync(sessionFile)) {
        const success = replaceInFile(
          sessionFile,
          /\*\*Last Updated:\*\*.*/,
          `**Last Updated:** ${currentTime}`
        );
        if (success) {
          console.log(`[SessionEnd] Updated session file: ${sessionFile}`);
        }
      } else {
        const template = `# Session: ${today}
**Date:** ${today}
**Started:** ${currentTime}
**Last Updated:** ${currentTime}

---

## Current State

[Session context goes here]

### Completed
- [ ]

### In Progress
- [ ]

### Notes for Next Session
-

### Context to Load
\`\`\`
[relevant files]
\`\`\`
`;
        writeFile(sessionFile, template);
        console.log(`[SessionEnd] Created session file: ${sessionFile}`);
      }
    },

    "experimental.session.compacting": async (input, output) => {
      // Save state before compaction
      ensureDir(sessionsDir);
      const compactionLog = path.join(sessionsDir, 'compaction-log.txt');
      const timestamp = getDateTimeString();

      appendFile(compactionLog, `[${timestamp}] Context compaction triggered\n`);

      const sessionId = (input as any)?.sessionId;
      if (sessionId) {
        const today = getDateString();
        const shortId = getSessionIdShort(sessionId);
        const sessionFile = path.join(sessionsDir, `${today}-${shortId}-session.md`);

        if (fs.existsSync(sessionFile)) {
          const timeStr = getTimeString();
          appendFile(sessionFile, `\n---\n**[Compaction occurred at ${timeStr}]** - Context was summarized\n`);
        }
      } else {
        // Fallback to finding recent modified
        const sessions = findFiles(sessionsDir, '*-session.md', { maxAge: 1 });
        if (sessions.length > 0) {
          const activeSession = sessions[0].path;
          const timeStr = getTimeString();
          appendFile(activeSession, `\n---\n**[Compaction occurred at ${timeStr}]** - Context was summarized\n`);
        }
      }
      console.log('[PreCompact] State saved before compaction');
    }
  }
}
