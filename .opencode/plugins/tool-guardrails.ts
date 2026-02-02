import type { Plugin } from "@opencode-ai/plugin";

export const ToolGuardrailsPlugin: Plugin = async ({ $ }) => {
  return {
    "tool.execute.before": async (input, output) => {
      // Input verification
      if (!input || !input.tool) return;

      if (input.tool === "bash") {
        const command = (input.args as any)?.command;
        if (!command) return;
        
        // Block dev servers outside tmux
        if (/npm run dev|pnpm dev|yarn dev|bun dev/.test(command)) {
          if (!process.env.TMUX) {
            throw new Error(
              '[Hook] Dev server must run in tmux for log access\n' +
              '[Hook] Use: tmux new-session -d -s dev "npm run dev"'
            );
          }
        }
        
        // Reminder for long-running commands
        if (/npm install|docker|pytest|cargo build/.test(command) && !process.env.TMUX) {
          console.warn('[Hook] Consider running in tmux for session persistence');
        }
        
        // Pre-push reminder
        if (command.trim().startsWith('git push')) {
          console.warn('[Hook] Review changes before push...');
        }
      }
      
      if (input.tool === "write") {
        const filePath = (input.args as any)?.filePath;
        
        // Block random .md files
        if (filePath && /\.(md|txt)$/.test(filePath)) {
            const fileName = filePath.split(/[/\\]/).pop();
            const allowed = [
                'README.md', 'CONTRIBUTING.md', 'CHANGELOG.md', 
                'AGENTS.md', 'MIGRATE_HOOKS.md', 'TODO.md'
            ];
            
            // Allow files in .opencode/, docs/
            const isAllowedDir = filePath.includes('/.opencode/') || filePath.includes('/docs/');
            
            if (!allowed.includes(fileName) && !isAllowedDir && !fileName.startsWith('CLAUDE')) {
                 throw new Error(
                    '[Hook] Unnecessary documentation file creation blocked. ' +
                    'Use README.md or docs/ directory for documentation.'
                  );
            }
        }
      }
    },
    
    "tool.execute.after": async (input, output) => {
      if (input.tool === "bash") {
        const command = (input.args as any)?.command;
        
        // Log PR creation
        if (command && /gh pr create/.test(command)) {
          const cmdOutput = (output as any)?.output || "";
          const match = cmdOutput.match(/https:\/\/github.com\/[^/]+\/[^/]+\/pull\/\d+/);
          if (match) {
            console.log(`[Hook] PR created: ${match[0]}`);
          }
        }
      }
    }
  }
}
