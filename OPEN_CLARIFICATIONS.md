Open Questions & Research Needs
High Priority Questions
1. Hook System Compatibility
   - Can OpenCode plugins access the same context as Claude Code hooks?
   - How to handle CLAUDE_PLUGIN_ROOT → equivalent in OpenCode?
   - Is the client object in plugins similar to Claude Code's context?
2. AGENTS.md Format
   - Does OpenCode support the exact same agent frontmatter format?
   - Can we use the tools array restriction like Claude Code?
   - How does model specification work (e.g., opus vs anthropic/claude-sonnet-4-5)?
3. Command Execution
   - Are $ARGUMENTS handled identically?
   - Can commands invoke other commands?
   - Is there a way to chain commands like Claude Code?
4. Continuous Learning System
   - The instinct/export/evaluate-session hooks - how to migrate these?
   - Does OpenCode have session persistence across restarts?
   - Can plugins write to disk for the learning system?
Medium Priority Questions
5. Distribution Strategy
   - Should we create an npm package or stick with install scripts?
   - Can we auto-detect OpenCode installation and configure accordingly?
6. Testing Framework
   - How to validate the migration works?
   - Do we need to maintain both Claude Code and OpenCode versions?
7. Cross-Platform Support
   - Do all hooks work identically on macOS, Linux, Windows?
---
Identified Risks
🔴 Critical Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Hook Rewrite Complexity | All hooks need conversion from JSON to TypeScript | Start with simple hooks, create template |
| No Session Persistence | Continuous learning may not work | Research OpenCode's session storage |
| Environment Variables | CLAUDE_PLUGIN_ROOT not available | Use relative paths or config |
| Plugin Dependencies | External npm packages in plugins | Test with package.json in .opencode/ |
🟡 Medium Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Different Hook Events | Some Claude events may not have OpenCode equivalents | Map and document gaps |
| Command Arguments | Different syntax for arguments | Test all command variations |
| Agent Invocation | Different from @agent syntax | Use agent field in config |
| Rules vs Instructions | May behave differently | Test rule enforcement |
🟢 Low Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Path Differences | Users may have both installed | Clear documentation |
| Naming Conflicts | Similar commands in both | Use distinct names |
| User Confusion | Two different systems | Migration guide and examples |
---
Research Actions Needed
Immediate (Before Implementation)
1. Install OpenCode and test basic functionality
2. Create test plugin to verify hook events work as expected
3. Test AGENTS.md format with actual agent files
4. Test command execution with $ARGUMENTS and !bash
5. Verify MCP config transformation works
Before Release
6. Migrate one complete feature (e.g., code-review agent + command + hooks)
7. Test on multiple OS (macOS, Linux)
8. Create and test install.sh script
9. Validate all 13 agents load correctly
10. Test continuous learning hooks (session persistence)
---
Recommendations
Next Steps
1. Proof of Concept: Migrate just the code-reviewer agent and /code-review command first
2. Validate Hooks: Convert one simple hook (e.g., console.log warning) to plugin
3. Test Installation: Create minimal install.sh and test on clean system
4. Decision Point: After POC, decide on npm vs manual distribution
Architecture Decision
Option A: NPM Package (Recommended)
- Easier updates for users
- Version management
- Can include TypeScript compilation
- Requires publishing to npm
Option B: Install Script
- No build process needed
- Direct file copying
- Harder to update
- More control over installation