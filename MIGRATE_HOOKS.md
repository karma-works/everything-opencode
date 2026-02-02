# Hooks Migration Plan: Claude Code → OpenCode

## Executive Summary

This document outlines the migration plan for converting Claude Code hooks (JSON-based, defined in `hooks/hooks.json`) to OpenCode plugins (TypeScript/JavaScript-based, in `.opencode/plugins/`).

**Complexity**: 🔴 High - Requires complete rewrite of hook system
**Estimated Effort**: 16-24 hours
**Priority**: Medium-High (hooks provide significant workflow automation)

---

## Current State Analysis

### Existing Hooks (Claude Code)

The project currently has **15 hooks** defined in `hooks/hooks.json`, implemented in `scripts/hooks/`:

#### 1. Session Lifecycle Hooks (3)
- **SessionStart**: Load previous context, detect package manager
- **SessionEnd**: Persist session state, timestamps
- **PreCompact**: Save state before context compaction

#### 2. Tool Execution Hooks (8)
- **PreToolUse - Block dev servers**: Forces tmux usage for dev servers
- **PreToolUse - tmux reminder**: Suggests tmux for long-running commands
- **PreToolUse - git push reminder**: Warns before git push
- **PreToolUse - Block random .md files**: Prevents doc fragmentation
- **PreToolUse - Strategic compact**: Suggests compaction at logical intervals
- **PostToolUse - PR logging**: Logs PR URL after creation
- **PostToolUse - Build notification**: Async build completion notification
- **PostToolUse - Auto-format**: Prettier formatting after edits
- **PostToolUse - TypeScript check**: Type checking after TS edits
- **PostToolUse - console.log warning**: Warns about console.log after edits

#### 3. Response Hooks (1)
- **Stop**: Check for console.log in modified files

#### 4. Session Evaluation Hooks (1)
- **SessionEnd - Evaluate session**: Extract patterns for continuous learning

### Hook Event Mapping

| Claude Code Event | OpenCode Event | Status |
|-------------------|----------------|--------|
| `SessionStart` | `session.created` | ✅ Available |
| `SessionEnd` | `session.closed` / `session.idle` | ✅ Available |
| `PreCompact` | `experimental.session.compacting` | ✅ Available |
| `PreToolUse` | `tool.execute.before` | ✅ Available |
| `PostToolUse` | `tool.execute.after` | ✅ Available |
| `Stop` | `message.updated` | ✅ Available |
| `UserPromptSubmit` | N/A | ❌ No direct equivalent |

### Dependencies Analysis

All hooks depend on:
- `scripts/lib/utils.js` - File operations, session management
- `scripts/lib/package-manager.js` - Package manager detection
- Environment variables: `CLAUDE_SESSION_ID`, `CLAUDE_TRANSCRIPT_PATH`, `CLAUDE_PLUGIN_ROOT`
- File system: `~/.claude/sessions/`, `~/.claude/skills/learned/`

---

## Target State (OpenCode)

### Plugin Architecture

OpenCode hooks are implemented as TypeScript/JavaScript plugins:

```typescript
// .opencode/plugins/hooks.ts
import type { Plugin } from "@opencode-ai/plugin"

export const HooksPlugin: Plugin = async ({ project, client, $ }) => {
  return {
    // Hook implementations here
    "tool.execute.before": async (input, output) => { ... },
    "tool.execute.after": async (input, output) => { ... },
    "session.created": async ({ event }) => { ... },
  }
}
```

### Available OpenCode Hook Events

1. **Tool Execution**
   - `tool.execute.before` - Before tool runs
   - `tool.execute.after` - After tool completes

2. **Session Lifecycle**
   - `session.created` - New session started
   - `session.updated` - Session state changed
   - `session.compacted` - Context was compacted
   - `session.closed` - Session ended
   - `session.idle` - Session became idle

3. **File Operations**
   - `file.edited` - File was modified
   - `file.watcher.updated` - Watched file changed

4. **Messages**
   - `message.updated` - Message added/updated
   - `message.removed` - Message removed

5. **Permissions**
   - `permission.asked` - Permission requested
   - `permission.replied` - Permission responded

6. **Custom/Experimental**
   - `experimental.session.compacting` - Before compaction (custom logic)

---

## Migration Strategy

### Phase 1: Core Session Hooks (Priority: High)

**Hooks**: SessionStart, SessionEnd, PreCompact

**Rationale**: These are foundational for the memory persistence system described in the Longform Guide.

**Implementation Approach**:
- Create `plugins/session-manager.ts`
- Migrate session file logic from `utils.js`
- Use `session.created`, `session.closed`, `experimental.session.compacting`

**Code Pattern**:
```typescript
export const SessionManagerPlugin: Plugin = async ({ $ }) => {
  const sessionsDir = path.join(os.homedir(), '.config/opencode/sessions')
  
  return {
    "session.created": async ({ event }) => {
      // Load previous context
      const recentSessions = await findRecentSessions(sessionsDir)
      if (recentSessions.length > 0) {
        console.log(`[Session] Found ${recentSessions.length} recent session(s)`)
      }
    },
    
    "session.closed": async ({ event }) => {
      // Persist session state
      const sessionFile = path.join(sessionsDir, `${getDateString()}-session.md`)
      await persistSession(sessionFile, event.properties.sessionId)
    },
    
    "experimental.session.compacting": async (input, output) => {
      // Save state before compaction
      await appendCompactionLog(sessionsDir, input.sessionId)
    }
  }
}
```

**Open Questions**:
1. How does OpenCode expose session ID in events? Is it `event.properties.sessionId`?
2. What's the OpenCode equivalent of `CLAUDE_TRANSCRIPT_PATH`?
3. Can plugins access the full conversation context in `session.closed`?

### Phase 2: Tool Execution Hooks (Priority: High)

**Hooks**: Dev server blocker, tmux reminder, git push reminder, .md file blocker

**Rationale**: These provide critical workflow guardrails.

**Implementation Approach**:
- Create `plugins/tool-guardrails.ts`
- Use `tool.execute.before` to block/validate commands
- Use `tool.execute.after` for notifications

**Code Pattern**:
```typescript
export const ToolGuardrailsPlugin: Plugin = async ({ $ }) => {
  return {
    "tool.execute.before": async (input, output) => {
      if (input.tool === "bash") {
        const command = input.args.command
        
        // Block dev servers outside tmux
        if (/npm run dev|pnpm dev|yarn dev/.test(command)) {
          if (!process.env.TMUX) {
            throw new Error(
              '[Hook] Dev server must run in tmux for log access\n' +
              '[Hook] Use: tmux new-session -d -s dev "npm run dev"'
            )
          }
        }
        
        // Reminder for long-running commands
        if (/npm install|docker|pytest/.test(command) && !process.env.TMUX) {
          console.warn('[Hook] Consider running in tmux for session persistence')
        }
        
        // Pre-push reminder
        if (command === 'git push') {
          console.warn('[Hook] Review changes before push...')
        }
      }
      
      if (input.tool === "write") {
        const filePath = input.args.filePath
        
        // Block random .md files
        if (/\.(md|txt)$/.test(filePath) && !/(README|CLAUDE|AGENTS|CONTRIBUTING)\.md$/.test(filePath)) {
          throw new Error(
            '[Hook] Unnecessary documentation file creation blocked. ' +
            'Use README.md for documentation instead.'
          )
        }
      }
    },
    
    "tool.execute.after": async (input, output) => {
      if (input.tool === "bash") {
        const command = input.args.command
        
        // Log PR creation
        if (/gh pr create/.test(command)) {
          const match = output.output?.match(/https:\/\/github.com\/[^/]+\/[^/]+\/pull\/\d+/)
          if (match) {
            console.log(`[Hook] PR created: ${match[0]}`)
          }
        }
      }
    }
  }
}
```

**Open Questions**:
1. Can we access `output.output` in `tool.execute.after` or is it a different property?
2. Does throwing an error in `tool.execute.before` actually block execution?
3. How do we distinguish between user-initiated and agent-initiated tool calls?

### Phase 3: Code Quality Hooks (Priority: Medium)

**Hooks**: Auto-format, TypeScript check, console.log warnings

**Rationale**: Automated code quality enforcement.

**Implementation Approach**:
- Create `plugins/code-quality.ts`
- Use `tool.execute.after` for formatting
- Integrate with linting tools

**Code Pattern**:
```typescript
export const CodeQualityPlugin: Plugin = async ({ $ }) => {
  return {
    "tool.execute.after": async (input, output) => {
      if (input.tool === "edit" || input.tool === "write") {
        const filePath = output.args.filePath
        
        // Auto-format JS/TS files
        if (/\.(ts|tsx|js|jsx)$/.test(filePath)) {
          try {
            await $`npx prettier --write ${filePath}`
            console.log(`[Hook] Formatted: ${filePath}`)
          } catch (error) {
            console.warn(`[Hook] Failed to format: ${filePath}`)
          }
        }
        
        // TypeScript check
        if (/\.(ts|tsx)$/.test(filePath)) {
          try {
            const result = await $`npx tsc --noEmit --pretty false`
            // Parse and display relevant errors
          } catch (error) {
            // TypeScript errors are expected in failed builds
          }
        }
        
        // Check for console.log
        if (/\.(ts|tsx|js|jsx)$/.test(filePath)) {
          const content = await fs.readFile(filePath, 'utf8')
          const lines = content.split('\n')
          const matches = lines
            .map((line, idx) => ({ line: idx + 1, content: line }))
            .filter(({ content }) => /console\.log/.test(content))
          
          if (matches.length > 0) {
            console.warn(`[Hook] WARNING: console.log found in ${filePath}`)
            matches.slice(0, 5).forEach(m => console.warn(`  ${m.line}: ${m.content.trim()}`))
          }
        }
      }
    }
  }
}
```

**Open Questions**:
1. Can plugins access the file content after edit, or do we need to re-read from disk?
2. What's the performance impact of running prettier on every edit?
3. Should we debounce TypeScript checks to avoid running on every keystroke?

### Phase 4: Strategic Compaction (Priority: Medium)

**Hooks**: Tool call counter, compaction suggestions

**Rationale**: Manual compaction at logical intervals preserves context quality.

**Implementation Approach**:
- Create `plugins/strategic-compact.ts`
- Use stateful plugin pattern to track tool calls
- Persist counter in temp file

**Code Pattern**:
```typescript
export const StrategicCompactPlugin: Plugin = async ({ $ }) => {
  const counterFile = path.join(os.tmpdir(), `opencode-tool-count-${process.pid}`)
  const THRESHOLD = 50
  
  // Read existing count
  let count = 1
  try {
    const existing = await fs.readFile(counterFile, 'utf8')
    count = parseInt(existing.trim(), 10) + 1
  } catch {
    // File doesn't exist, start at 1
  }
  
  // Save updated count
  await fs.writeFile(counterFile, String(count))
  
  return {
    "tool.execute.after": async (input, output) => {
      // Suggest compact after threshold
      if (count === THRESHOLD) {
        console.warn(
          `[StrategicCompact] ${THRESHOLD} tool calls reached - ` +
          `consider /compact if transitioning phases`
        )
      }
      
      // Suggest at regular intervals
      if (count > THRESHOLD && count % 25 === 0) {
        console.warn(
          `[StrategicCompact] ${count} tool calls - ` +
          `good checkpoint for /compact if context is stale`
        )
      }
    }
  }
}
```

**Open Questions**:
1. Do plugins persist across the entire session or are they reloaded?
2. What's the best way to maintain state within a plugin?
3. Can plugins access a persistent key-value store?

### Phase 5: Continuous Learning (Priority: Low)

**Hooks**: Session evaluator, pattern extraction

**Rationale**: This is the most complex hook and has no OpenCode equivalent.

**Implementation Approach**:
- Create `plugins/continuous-learning.ts`
- Use `session.closed` to trigger evaluation
- File-based storage for learned patterns

**Challenges**:
- Requires access to full conversation transcript (may not be available)
- Complex pattern extraction logic
- No built-in instinct system in OpenCode

**Recommendation**: Consider deprecating or implementing as a simplified version that only captures high-level session metadata.

---

## Information Needed

### Critical Information (Blocking)

1. **OpenCode Plugin API Documentation**
   - Exact TypeScript types for `Plugin` interface
   - Event payload structures (input/output schemas)
   - Available context/properties in each event
   - Error handling semantics (does throwing block execution?)

2. **Session/Context Access**
   - How to access session ID in plugins
   - How to access conversation history/transcript
   - How to access project configuration
   - Lifecycle of plugins (per-session vs persistent)

3. **File System Access**
   - Can plugins read files directly or only through tools?
   - What's the working directory for plugins?
   - How to access project root vs home directory?

4. **Package Manager**
   - Does OpenCode have a built-in `$` helper like `$` in Claude Code?
   - How to execute shell commands from plugins?
   - How to handle async operations properly?

### Important Information (High Priority)

1. **State Management**
   - Can plugins maintain in-memory state across events?
   - Is there a built-in key-value store for plugins?
   - How to handle plugin configuration/options?

2. **Performance**
   - Are plugins run synchronously or asynchronously?
   - What's the performance impact of file I/O in plugins?
   - Are there timeouts for plugin execution?

3. **Error Handling**
   - How are plugin errors handled?
   - Can plugins gracefully degrade if dependencies are missing?
   - How to log from plugins (console.log vs console.error)?

4. **Testing**
   - How to unit test OpenCode plugins?
   - Is there a plugin testing framework?
   - How to mock OpenCode APIs in tests?

### Nice to Have (Medium Priority)

1. **UI Integration**
   - Can plugins show custom UI elements?
   - How to show progress indicators?
   - Can plugins add custom commands?

2. **Cross-Platform**
   - Are plugins expected to be cross-platform?
   - How does OpenCode handle Windows vs Unix paths?

3. **Dependencies**
   - Can plugins use npm dependencies?
   - How to manage plugin dependencies?
   - Is there a plugin build process?

---

## Examples Needed

### 1. Basic Plugin Structure

A minimal working plugin that demonstrates:
- Plugin export pattern
- Event registration
- Accessing input/output data
- Error handling

### 2. Tool Execution Hooks

Example showing:
- `tool.execute.before` for validation
- `tool.execute.after` for post-processing
- Blocking vs non-blocking behavior

### 3. Session Lifecycle Hooks

Example showing:
- `session.created` initialization
- `session.closed` cleanup
- State persistence across session

### 4. File System Operations

Example showing:
- Reading files after edits
- Writing to project directory
- Writing to home directory
- Cross-platform path handling

### 5. Shell Command Execution

Example showing:
- Using `$` helper or equivalent
- Handling command output
- Async operations
- Error handling for failed commands

### 6. Stateful Plugin

Example showing:
- Maintaining counter/state
- Reading/writing state to disk
- Handling plugin reloads

### 7. Real-World Plugin

A complete, production-ready plugin that:
- Combines multiple events
- Has proper error handling
- Includes configuration
- Is well-tested

---

## Project Risks

### High Risk

1. **Missing Critical Events**
   - Risk: Some Claude Code events may not have OpenCode equivalents
   - Impact: Loss of functionality
   - Mitigation: Thoroughly document missing features, implement workarounds

2. **Different Execution Model**
   - Risk: OpenCode plugins may run in a different context (sandboxed?)
   - Impact: Hooks can't access filesystem or run commands
   - Mitigation: Test early with simple file operations

3. **No Transcript Access**
   - Risk: Continuous learning hooks require conversation transcript
   - Impact: Can't implement pattern extraction
   - Mitigation: Implement simplified version or deprecate feature

4. **Performance Degradation**
   - Risk: Running hooks on every tool use may impact performance
   - Impact: Slower development workflow
   - Mitigation: Profile hooks, add caching, use async operations

### Medium Risk

1. **Configuration Migration**
   - Risk: Users have existing hook configurations
   - Impact: Breaking changes for users
   - Mitigation: Document migration path, provide migration script

2. **File Path Changes**
   - Risk: Hooks use hardcoded paths (`.claude/` → `.opencode/`)
   - Impact: Session data not found
   - Mitigation: Update all path references, create migration for existing data

3. **Dependency on Environment Variables**
   - Risk: Hooks rely on `CLAUDE_*` environment variables
   - Impact: Features break
   - Mitigation: Update to use OpenCode equivalents or find alternatives

4. **Package Manager Integration**
   - Risk: Package manager detection may work differently
   - Impact: Wrong package manager used
   - Mitigation: Test detection logic, provide manual override

### Low Risk

1. **Backward Compatibility**
   - Risk: Users still using Claude Code
   - Impact: Confusion about which hooks to use
   - Mitigation: Keep both systems during transition period

2. **Documentation**
   - Risk: Incomplete documentation for new system
   - Impact: Users can't configure hooks
   - Mitigation: Write comprehensive docs, update README

---

## Testing Strategy

### Unit Testing

**Goal**: Test individual hook logic in isolation

**Approach**:
```typescript
// plugins/__tests__/tool-guardrails.test.ts
import { ToolGuardrailsPlugin } from '../tool-guardrails'

describe('ToolGuardrailsPlugin', () => {
  it('should block dev servers outside tmux', async () => {
    const plugin = await ToolGuardrailsPlugin(mockContext)
    const input = {
      tool: 'bash',
      args: { command: 'npm run dev' }
    }
    
    delete process.env.TMUX
    
    await expect(
      plugin['tool.execute.before'](input, {})
    ).rejects.toThrow('Dev server must run in tmux')
  })
  
  it('should allow dev servers in tmux', async () => {
    process.env.TMUX = '/tmp/tmux-1000'
    
    const plugin = await ToolGuardrailsPlugin(mockContext)
    const input = {
      tool: 'bash',
      args: { command: 'npm run dev' }
    }
    
    await expect(
      plugin['tool.execute.before'](input, {})
    ).resolves.not.toThrow()
  })
})
```

**Open Questions**:
1. How to mock OpenCode's `$` helper?
2. How to mock file system operations?
3. What's the testing framework for OpenCode plugins?

### Integration Testing

**Goal**: Test hooks in a real OpenCode environment

**Approach**:
1. Create test OpenCode project
2. Install plugin
3. Run various commands
4. Verify hook behavior

**Test Cases**:
- Start new session → Check session file created
- Run `npm run dev` outside tmux → Verify blocked
- Edit TypeScript file → Verify formatting and type checking
- Create random .md file → Verify blocked
- Push to git → Verify reminder shown

### Regression Testing

**Goal**: Ensure no functionality is lost

**Checklist**:
- [ ] Session files created in correct location
- [ ] Recent sessions detected on start
- [ ] Dev servers blocked outside tmux
- [ ] Tmux reminder shown for long commands
- [ ] Git push shows reminder
- [ ] Random .md files blocked
- [ ] JS/TS files auto-formatted
- [ ] TypeScript errors shown after edits
- [ ] console.log warnings displayed
- [ ] Strategic compact suggestions shown
- [ ] Session state persisted on end

### Performance Testing

**Goal**: Ensure hooks don't slow down workflow

**Metrics**:
- Hook execution time < 100ms per event
- No noticeable lag in tool execution
- File I/O operations are batched

---

## Implementation Timeline

### Week 1: Foundation
- [ ] Set up plugin development environment
- [ ] Create plugin scaffolding
- [ ] Implement SessionStart/SessionEnd hooks
- [ ] Write tests for session hooks

### Week 2: Tool Guardrails
- [ ] Implement dev server blocker
- [ ] Implement tmux reminder
- [ ] Implement git push reminder
- [ ] Implement .md file blocker
- [ ] Write tests for tool guardrails

### Week 3: Code Quality
- [ ] Implement auto-format hook
- [ ] Implement TypeScript check hook
- [ ] Implement console.log warning hook
- [ ] Write tests for code quality hooks

### Week 4: Polish & Testing
- [ ] Implement strategic compaction
- [ ] Evaluate continuous learning feasibility
- [ ] Comprehensive integration testing
- [ ] Documentation and examples
- [ ] Migration guide for users

---

## Open Questions Summary

### Blocking Questions (Must answer before implementation)

1. **What are the exact TypeScript types for OpenCode plugins?**
   - Need: `Plugin` interface definition
   - Source: OpenCode documentation or SDK

2. **How do we access session ID and conversation context?**
   - Need: Event payload schemas
   - Source: OpenCode documentation

3. **Does throwing an error in `tool.execute.before` block the tool execution?**
   - Need: Confirmation of error handling semantics
   - Source: Testing or documentation

4. **What's the equivalent of Claude Code's `$` helper in OpenCode?**
   - Need: Shell execution API
   - Source: OpenCode documentation

5. **Can plugins read files directly or only through tools?**
   - Need: File system access patterns
   - Source: OpenCode documentation or examples

### Important Questions (Should answer for quality implementation)

6. **How do plugins handle state persistence?**
   - Need: State management patterns
   - Source: OpenCode examples

7. **Are plugins reloaded between events or persist in memory?**
   - Need: Plugin lifecycle documentation
   - Source: OpenCode documentation

8. **What's the performance impact of file I/O in plugins?**
   - Need: Performance best practices
   - Source: OpenCode documentation

9. **How do we unit test OpenCode plugins?**
   - Need: Testing framework/API
   - Source: OpenCode documentation or examples

10. **Can plugins be conditionally enabled (e.g., per-project)?**
    - Need: Configuration patterns
    - Source: OpenCode documentation

---

## Next Steps

1. **Gather Information**
   - Review OpenCode documentation thoroughly
   - Look for example plugins in the wild
   - Test basic plugin structure

2. **Create Proof of Concept**
   - Implement one simple hook (e.g., console.log warning)
   - Test in real OpenCode environment
   - Validate assumptions about APIs

3. **Answer Blocking Questions**
   - Document findings
   - Adjust plan based on capabilities

4. **Begin Implementation**
   - Start with Phase 1 (Session hooks)
   - Follow iterative approach with testing

5. **Document Everything**
   - Write migration guide for users
   - Document new plugin architecture
   - Provide troubleshooting guide

---

## Appendix A: Hook Event Reference

### Claude Code → OpenCode Mapping

| Hook File | Claude Event | OpenCode Event | Status |
|-----------|--------------|----------------|--------|
| session-start.js | SessionStart | session.created | ✅ Ready |
| session-end.js | SessionEnd | session.closed | ✅ Ready |
| pre-compact.js | PreCompact | experimental.session.compacting | ✅ Ready |
| suggest-compact.js | PreToolUse | tool.execute.before/after | ✅ Ready |
| check-console-log.js | Stop | message.updated | ⚠️ Different timing |
| evaluate-session.js | SessionEnd | session.closed | ⚠️ Needs transcript access |

### Hook Priority Order

1. **Must Have** (Critical for workflow):
   - Session persistence
   - Dev server blocker
   - Tmux reminder

2. **Should Have** (Quality of life):
   - Auto-format
   - console.log warnings
   - Strategic compaction

3. **Nice to Have** (Advanced features):
   - TypeScript check
   - Pattern extraction

---

## Appendix B: File Locations

### Current (Claude Code)
```
~/.claude/
├── sessions/
│   └── YYYY-MM-DD-session.tmp
├── skills/
│   └── learned/
│       └── *.md
└── package-manager.json
```

### Target (OpenCode)
```
~/.config/opencode/
├── sessions/
│   └── YYYY-MM-DD-session.md
├── skills/
│   └── learned/
│       └── *.md
└── package-manager.json
```

### Plugin Location
```
.opencode/plugins/
├── session-manager.ts
├── tool-guardrails.ts
├── code-quality.ts
├── strategic-compact.ts
└── index.ts (exports all plugins)
```

---

*Document Status: Draft*  
*Last Updated: 2026-02-02*  
*Next Review: After answering blocking questions*
