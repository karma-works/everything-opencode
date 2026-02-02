import type { Plugin } from "@opencode-ai/plugin";
import * as fs from 'fs';
import { getGitModifiedFiles } from './lib/utils';

export const CodeQualityPlugin: Plugin = async ({ $ }) => {
  return {
    "tool.execute.after": async (input, output) => {
      if (input.tool === "edit" || input.tool === "write") {
        const filePath = (input.args as any)?.filePath;

        if (!filePath) return;

        // Auto-format JS/TS/JSON/MD files
        if (/\.(ts|tsx|js|jsx|json|md)$/.test(filePath)) {
          try {
            await $`npx prettier --write ${filePath}`;
            console.log(`[Hook] Formatted: ${filePath}`);
          } catch (error) {
            // Silent fail to avoid noise if prettier isn't available/configured
          }
        }

        // TypeScript check (optional/heavy)
        if (/\.(ts|tsx)$/.test(filePath)) {
          try {
            // We won't block on this, just run it.
            // await $`npx tsc --noEmit --pretty false`;
            // Commented out by default to prevent slow downs during migration, 
            // can be enabled by user or config.
          } catch (error) {
            // Ignore
          }
        }

        // Check for console.log
        if (/\.(ts|tsx|js|jsx)$/.test(filePath)) {
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            const matches = lines
              .map((line, idx) => ({ line: idx + 1, content: line }))
              .filter(({ content }) => /console\.log/.test(content));

            if (matches.length > 0) {
              console.warn(`[Hook] WARNING: console.log found in ${filePath}`);
              matches.slice(0, 5).forEach(m => console.warn(`  ${m.line}: ${m.content.trim()}`));
            }
          } catch (e) {
            // Ignore read errors
          }
        }
      }
    },

    "message.updated": async ({ event }) => {
      // Check for console.log in all modified files
      const modifiedFiles = getGitModifiedFiles(['\\.(ts|tsx|js|jsx)$']);

      for (const file of modifiedFiles) {
        try {
          if (fs.existsSync(file)) {
            const content = fs.readFileSync(file, 'utf8');
            if (/console\.log/.test(content)) {
              console.warn(`[Hook] REMINDER: console.log still present in ${file}`);
            }
          }
        } catch {
          // Ignore
        }
      }
    }
  }
}
