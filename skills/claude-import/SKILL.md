---
name: claude-import
description: Comprehensive guide for migrating Claude Code components (skills, prompts, rules, hooks, agents, commands, MCP configs) to OpenCode format.
---

# Claude Import - Migration Guide

Complete guide for migrating Claude Code configurations to OpenCode.

## When to Use

- Migrating from Claude Code to OpenCode
- Converting agents, commands, skills, and hooks
- Setting up OpenCode with existing Claude Code configs
- Understanding backward compatibility options

## Migration Overview

| Component | Difficulty | Backward Compatible |
|-----------|-----------|---------------------|
| **Skills** | Easy | Yes - Auto-detected |
| **Commands** | Easy | Yes - Auto-detected |
| **Agents** | Easy | Minor frontmatter updates |
| **Rules** | Easy | Reference in instructions |
| **MCP Config** | Medium | Format change required |
| **Hooks** | Hard | Complete rewrite to TypeScript plugins |

## Directory Structure Changes

```
# Claude Code locations → OpenCode locations
~/.claude/                      → ~/.config/opencode/
~/.claude/rules/                → ~/.config/opencode/rules/
~/.claude/agents/               → ~/.config/opencode/agents/
~/.claude/commands/             → ~/.config/opencode/commands/
~/.claude/skills/               → ~/.config/opencode/skills/
~/.claude.json                  → ~/.config/opencode/opencode.json
.claude/                        → .opencode/
CLAUDE.md                       → AGENTS.md
```

## Backward Compatibility

OpenCode automatically supports Claude Code conventions - no immediate migration required:

| Feature | Claude Location | OpenCode Support |
|---------|----------------|------------------|
| Project Rules | `CLAUDE.md` | Auto-detected if no `AGENTS.md` |
| Global Rules | `~/.claude/CLAUDE.md` | Fallback if no `~/.config/opencode/AGENTS.md` |
| Skills | `.claude/skills/` | Auto-detected alongside `.opencode/skills/` |
| Global Skills | `~/.claude/skills/` | Auto-detected |

### Disable Backward Compatibility

```bash
export OPENCODE_DISABLE_CLAUDE_CODE=1              # Disable all .claude support
export OPENCODE_DISABLE_CLAUDE_CODE_PROMPT=1       # Disable only ~/.claude/CLAUDE.md
export OPENCODE_DISABLE_CLAUDE_CODE_SKILLS=1       # Disable only .claude/skills
```

## Skills Migration

### Migration Options

**Option 1: Keep in `.claude/skills/` (Easiest)**
- Works automatically with backward compatibility
- No changes needed

**Option 2: Copy to `.opencode/skills/` (Recommended)**
```bash
mkdir -p .opencode/skills/
cp -r .claude/skills/* .opencode/skills/
```

**Option 3: Reference in AGENTS.md**
```markdown
---
name: my-project
description: Project-specific guidelines
instructions:
  - skills/python-testing
  - skills/django-patterns
---
```

### SKILL.md Format

Both formats are compatible:

```markdown
---
name: python-testing
description: Python testing patterns and TDD
license: MIT
compatibility: opencode
---

## When to Use

Reference this skill when writing Python tests...

## Best Practices

1. Use pytest fixtures
2. Mock external dependencies
3. Aim for 80%+ coverage
```

### Skill Naming Rules

- Must be 1-64 characters
- Lowercase alphanumeric with single hyphens
- Cannot start/end with hyphen
- Cannot contain consecutive hyphens
- Regex: `^[a-z0-9]+(-[a-z0-9]+)*$`

## Agents Migration

### Claude Code Format

```markdown
---
name: code-reviewer
description: Reviews code for quality
tools: ["Read", "Grep", "Glob", "Bash"]
model: opus
---

You are a senior code reviewer...
```

### OpenCode Format

```markdown
---
description: Reviews code for quality and best practices
mode: subagent
model: anthropic/claude-sonnet-4-5
temperature: 0.1
tools:
  write: false
  edit: false
  bash: false
permission:
  bash:
    "git *": allow
    "grep *": allow
    "*": ask
---

You are a senior code reviewer...
```

### Key Differences

| Feature | Claude Code | OpenCode |
|---------|-------------|----------|
| Frontmatter | `name`, `description`, `tools`, `model` | `description`, `mode`, `model`, `tools`, `permission`, `temperature`, `steps`, `color` |
| Invocation | `@agent-name` | `@agent-name` (same) |
| Model | `opus`, `sonnet`, `haiku` | `anthropic/claude-sonnet-4-5` format |
| Tool Access | Array: `["Read", "Edit"]` | Object: `{"read": true, "edit": false}` |
| Modes | Implicit | Explicit: `primary`, `subagent`, `all` |

### Migration Steps

1. Copy agent files to `.opencode/agents/`
2. Update model identifiers to `provider/model` format
3. Convert tool arrays to tool objects
4. Add `mode: subagent` for specialized agents
5. Add `permission` for fine-grained access control

## Commands Migration

### Basic Migration (Backward Compatible)

```markdown
---
description: Create implementation plan
---

This command invokes the planner agent...
```

Direct copy works - no changes needed.

### Enhanced OpenCode Features

**Positional Arguments:**
```markdown
---
description: Create a new component
---
Create React component named $ARGUMENTS:
`!mkdir -p src/components/$ARGUMENTS`
```

**Shell Command Execution:**
```markdown
---
description: Analyze test coverage
---
Current test status:
!`npm test`

Review failures and suggest improvements.
```

**Agent Assignment:**
```markdown
---
description: Code review
agent: code-reviewer
subtask: true
---
Review the recent changes for quality and security.
```

## Rules Migration

### Claude Code

Rules as markdown files in `~/.claude/rules/` or project `.claude/rules/`.

### OpenCode

Reference in `instructions` array in `opencode.json`:

```json
{
  "instructions": [
    "rules/security.md",
    "rules/coding-style.md",
    "rules/testing.md"
  ]
}
```

Or use `AGENTS.md`:

```markdown
---
name: project-guidelines
instructions:
  - rules/security.md
  - rules/coding-style.md
---
```

## MCP Configuration Migration

### Claude Code Format

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-server-github"]
    }
  }
}
```

### OpenCode Format

```json
{
  "mcp": {
    "github": {
      "type": "local",
      "command": ["npx", "-y", "@anthropic/mcp-server-github"],
      "enabled": true
    }
  }
}
```

### Key Changes

- `mcpServers` → `mcp`
- Add `"type": "local"` (or `"type": "remote"`)
- Array format for command: `["npx", "-y", "..."]`
- Add `enabled: true/false`

## Hooks Migration (Major Change)

Hooks require complete rewrite from JSON-based to TypeScript/JavaScript plugins.

### Claude Code Format

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "tool == 'Bash'",
      "hooks": [{
        "type": "command",
        "command": "echo 'Hook triggered'"
      }]
    }]
  }
}
```

### OpenCode Plugin Format

```typescript
// .opencode/plugins/hooks.ts
import type { Plugin } from "@opencode-ai/plugin"

export const HooksPlugin: Plugin = async ({ project, client, $ }) => {
  return {
    // Tool execution hooks
    "tool.execute.before": async (input, output) => {
      if (input.tool === "bash") {
        // Validation logic
      }
    },
    
    "tool.execute.after": async (input, output) => {
      if (input.tool === "edit") {
        // Post-processing logic
        await $`prettier --write ${output.args.filePath}`
      }
    },
    
    // Session hooks
    "session.created": async ({ event }) => {
      console.log("Session started:", event.properties.sessionId)
    }
  }
}
```

### Hook Event Mapping

| Claude Code Event | OpenCode Event | Notes |
|-------------------|----------------|-------|
| `PreToolUse` | `tool.execute.before` | Before tool execution |
| `PostToolUse` | `tool.execute.after` | After tool execution |
| `PreCompact` | `experimental.session.compacting` | Before context compaction |
| `SessionStart` | `session.created` | New session started |
| `SessionEnd` | `session.closed` / `session.idle` | Session ended |
| `Stop` | `message.updated` | After response |

### Available OpenCode Hook Events

**Tool Execution:**
- `tool.execute.before` - Before tool runs
- `tool.execute.after` - After tool completes

**Session Lifecycle:**
- `session.created` - New session started
- `session.updated` - Session state changed
- `session.compacted` - Context was compacted
- `session.closed` - Session ended
- `session.idle` - Session became idle

**File Operations:**
- `file.edited` - File was modified
- `file.watcher.updated` - Watched file changed

**Messages:**
- `message.updated` - Message added/updated
- `message.removed` - Message removed

**Permissions:**
- `permission.asked` - Permission requested
- `permission.replied` - Permission responded

### Example: Tool Guardrails Plugin

```typescript
// .opencode/plugins/tool-guardrails.ts
import type { Plugin } from "@opencode-ai/plugin"

export const ToolGuardrailsPlugin: Plugin = async ({ $ }) => {
  return {
    "tool.execute.before": async (input, output) => {
      if (input.tool === "bash") {
        const command = input.args.command
        
        // Block dev servers outside tmux
        if (/npm run dev|pnpm dev|yarn dev/.test(command)) {
          if (!process.env.TMUX) {
            throw new Error(
              '[Hook] Dev server must run in tmux\n' +
              '[Hook] Use: tmux new-session -d -s dev "npm run dev"'
            )
          }
        }
        
        // Reminder for long-running commands
        if (/npm install|docker|pytest/.test(command) && !process.env.TMUX) {
          console.warn('[Hook] Consider running in tmux')
        }
        
        // Pre-push reminder
        if (command === 'git push') {
          console.warn('[Hook] Review changes before push...')
        }
      }
      
      if (input.tool === "write") {
        const filePath = input.args.filePath
        
        // Block random .md files
        if (/\.(md|txt)$/.test(filePath) && !/(README|CLAUDE|AGENTS)/.test(filePath)) {
          throw new Error('[Hook] Blocked: Use README.md for docs')
        }
      }
    }
  }
}
```

### Example: Code Quality Plugin

```typescript
// .opencode/plugins/code-quality.ts
import type { Plugin } from "@opencode-ai/plugin"
import { readFile } from "fs/promises"

export const CodeQualityPlugin: Plugin = async ({ $ }) => {
  return {
    "tool.execute.after": async (input, output) => {
      if (input.tool === "edit" || input.tool === "write") {
        const filePath = output.args.filePath
        
        // Auto-format JS/TS files
        if (/\.(ts|tsx|js|jsx)$/.test(filePath)) {
          try {
            await $`npx prettier --write ${filePath}`
          } catch (error) {
            console.warn(`[Hook] Failed to format: ${filePath}`)
          }
        }
        
        // Check for console.log
        if (/\.(ts|tsx|js|jsx)$/.test(filePath)) {
          const content = await readFile(filePath, 'utf8')
          if (/console\.log/.test(content)) {
            console.warn(`[Hook] WARNING: console.log found in ${filePath}`)
          }
        }
      }
    }
  }
}
```

## Configuration Templates

### Global Config (`~/.config/opencode/opencode.json`)

```json
{
  "$schema": "https://opencode.ai/config.json",
  
  "model": "anthropic/claude-sonnet-4-5",
  "small_model": "anthropic/claude-haiku-4-5",
  
  "instructions": [
    "~/.config/opencode/rules/security.md",
    "~/.config/opencode/rules/coding-style.md"
  ],
  
  "agent": {
    "code-reviewer": {
      "description": "Reviews code for quality",
      "model": "anthropic/claude-sonnet-4-5",
      "prompt": "You are a senior code reviewer...",
      "tools": { "write": false, "edit": false }
    }
  },
  
  "command": {
    "plan": {
      "template": "Create plan for: $ARGUMENTS",
      "description": "Create implementation plan",
      "agent": "architect"
    }
  },
  
  "mcp": {
    "github": {
      "type": "local",
      "command": ["npx", "-y", "@anthropic/mcp-server-github"],
      "enabled": true
    }
  },
  
  "permission": {
    "bash": "ask",
    "edit": "ask"
  },
  
  "plugin": [
    "~/.config/opencode/plugins/tool-guardrails.ts",
    "~/.config/opencode/plugins/code-quality.ts"
  ],
  
  "autoupdate": true
}
```

### Project Config (`opencode.json`)

```json
{
  "$schema": "https://opencode.ai/config.json",
  
  "instructions": [
    "AGENTS.md",
    ".opencode/skills/project-specific.md"
  ],
  
  "mcp": {
    "project-server": {
      "type": "local",
      "command": ["node", "./mcp-server.js"],
      "enabled": true
    }
  },
  
  "plugin": ["./.opencode/plugins/custom-hooks.ts"]
}
```

## Migration Checklist

### Phase 1: Easy Components (Week 1)

- [ ] Copy skills to `.opencode/skills/` (or keep in `.claude/skills/`)
- [ ] Copy commands to `.opencode/commands/`
- [ ] Copy agents to `.opencode/agents/`
- [ ] Update agent frontmatter (model format, tools object, mode)
- [ ] Reference rules in `instructions` array

### Phase 2: Configuration (Week 2)

- [ ] Transform MCP config to OpenCode format
- [ ] Create `~/.config/opencode/opencode.json`
- [ ] Create project `opencode.json`
- [ ] Test backward compatibility

### Phase 3: Hooks (Week 3-4)

- [ ] Identify critical hooks from `hooks.json`
- [ ] Rewrite as TypeScript plugins
- [ ] Create `.opencode/plugins/` directory
- [ ] Test plugin functionality
- [ ] Handle continuous learning (custom implementation or deprecate)

### Phase 4: Cleanup

- [ ] Remove `.claude-plugin/` directory
- [ ] Remove marketplace-related files
- [ ] Update documentation
- [ ] Test all components

## Troubleshooting

### Common Issues

**Issue: Skills not loading**
- Check skill directory name matches skill name in SKILL.md
- Verify naming convention: lowercase, hyphens only
- Check OpenCode logs for skill loading errors

**Issue: Agents not responding**
- Verify frontmatter format (YAML syntax)
- Check model identifier format: `provider/model`
- Ensure `mode: subagent` for specialized agents

**Issue: Hooks not triggering**
- Verify plugin is registered in `opencode.json`
- Check TypeScript compilation errors
- Ensure plugin exports the correct function signature

**Issue: MCP servers not connecting**
- Verify `type: local` or `type: remote` is specified
- Check command format (array vs string)
- Ensure `enabled: true` is set

## Quick Reference

### Model Mapping

| Claude Code | OpenCode |
|-------------|----------|
| `opus` | `anthropic/claude-opus-4-5` |
| `sonnet` | `anthropic/claude-sonnet-4-5` |
| `haiku` | `anthropic/claude-haiku-4-5` |

### Tool Mapping

| Claude Code | OpenCode |
|-------------|----------|
| `"Read"` | `read: true` |
| `"Edit"` | `edit: true` |
| `"Write"` | `write: true` |
| `"Bash"` | `bash: true` |
| `"Glob"` | `glob: true` |
| `"Grep"` | `grep: true` |

### Path Mapping

| Claude Code | OpenCode |
|-------------|----------|
| `~/.claude/` | `~/.config/opencode/` |
| `.claude/` | `.opencode/` |
| `CLAUDE.md` | `AGENTS.md` |
| `~/.claude.json` | `~/.config/opencode/opencode.json` |

## Resources

- **OpenCode Docs**: https://opencode.ai/docs/
- **Plugins**: https://opencode.ai/docs/plugins/
- **Config**: https://opencode.ai/docs/config/
- **SDK**: https://opencode.ai/docs/sdk/

---

Remember: Start with backward-compatible features (skills, commands, agents) and gradually migrate hooks to plugins. Most migrations require minimal changes thanks to OpenCode's built-in backward compatibility.
