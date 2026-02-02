# Migration Plan: Everything Claude Code → Everything OpenCode

## Executive Summary

OpenCode supports the same core extensibility features as Claude Code, with **significant backward compatibility** for easy migration. This plan outlines how to migrate agents, skills, commands, hooks, and configuration from Claude Code's plugin marketplace system to OpenCode's file-based architecture.

**Key Differences:**
- **No Marketplace**: OpenCode has no `/plugin marketplace add` or `/plugin install` commands (use manual installation or npm)
- **File-Based Installation**: Components are distributed as files in `.opencode/` directory
- **NPM Plugin Support**: Plugins can be published to npm and loaded via `opencode.json`
- **Layered Configuration**: Multiple config files merge based on precedence
- **Backward Compatibility**: OpenCode reads `.claude/skills/`, `CLAUDE.md`, and `.claude/` directories automatically

**Migration Complexity:**
- 🟢 **Easy**: Skills, Commands, Agents, Rules (direct copy or minor updates)
- 🟡 **Medium**: MCP configuration (format changes), Hooks (rewrite as TypeScript)
- 🔴 **Hard**: Continuous Learning/Instinct system (no built-in equivalent, custom implementation needed)

---

## OpenCode Architecture Overview

### Supported Features

| Feature | Claude Code | OpenCode | Implementation |
|---------|-------------|----------|----------------|
| **Agents** | `@agent-name` invocation | Markdown files in `.opencode/agents/` | ✅ Supported |
| **Skills** | plugin.json definition | AGENTS.md or `.opencode/skills/` | ✅ Supported |
| **Commands** | `/command` slash commands | Markdown files in `.opencode/commands/` | ✅ Supported |
| **Hooks** | JSON-based in `hooks.json` | JavaScript/TypeScript plugins | ✅ Supported |
| **Rules** | `~/.claude/rules/` | `instructions` array in config | ✅ Supported |
| **MCP** | `~/.claude.json` | `mcp` section in `opencode.json` | ✅ Supported |
| **Plugins** | Marketplace-based | Local files or npm packages | ✅ Supported |
| **Contexts** | Dynamic injection | Via plugins or config | ✅ Supported |

### Configuration Precedence

OpenCode merges configurations from multiple sources (later overrides earlier):

1. **Remote** (`.well-known/opencode`) - organizational defaults
2. **Global** (`~/.config/opencode/opencode.json`) - user preferences
3. **Custom** (`OPENCODE_CONFIG` env var) - custom path
4. **Project** (`opencode.json` in project root) - project-specific
5. **Directory** (`.opencode/`, `~/.config/opencode/`) - agents, commands, plugins
6. **Inline** (`OPENCODE_CONFIG_CONTENT` env var) - runtime overrides

---

## Directory Structure Migration

### From Claude Code to OpenCode

```
# Configuration directories
~/.claude/                      → ~/.config/opencode/
~/.claude/rules/                → ~/.config/opencode/rules/ (via instructions)
~/.claude/agents/               → ~/.config/opencode/agents/
~/.claude/commands/             → ~/.config/opencode/commands/
~/.claude/skills/               → ~/.config/opencode/skills/
~/.claude.json                  → ~/.config/opencode/opencode.json (mcp section)

# Project-level
.claude/                        → .opencode/
.claude/rules/                  → .opencode/rules/
.claude/CLAUDE.md               → AGENTS.md or .opencode/AGENTS.md

# Plugin directories
.claude-plugin/                 → REMOVE (not needed)
plugins/                        → .opencode/plugins/ or npm packages
```

### New OpenCode Structure

```
everything-opencode/
├── .opencode/                  # Project-level OpenCode config
│   ├── agents/                 # Agent definitions (*.md)
│   ├── commands/               # Custom slash commands (*.md)
│   ├── plugins/                # JavaScript/TypeScript plugins
│   ├── skills/                 # Skill definitions
│   └── AGENTS.md               # Project-specific instructions
│
├── opencode.json               # Project configuration
├── README.md                   # Updated documentation
│
├── agents/                     # Source: 13 agent files
├── commands/                   # Source: 20+ command files
├── skills/                     # Source: 30+ skill directories
├── rules/                      # Source: 8 rule files
├── hooks/                      # Source: Convert to plugins
├── scripts/                    # Source: Node.js utilities
├── contexts/                   # Source: Dynamic contexts
├── mcp-configs/                # Source: MCP configurations
└── install.sh                  # NEW: Installation script
```

---

## Feature-by-Feature Migration

### 1. Agents Migration ✅

**Claude Code Format:**
```markdown
---
name: code-reviewer
description: Reviews code for quality
tools: ["Read", "Grep", "Glob", "Bash"]
model: opus
---

You are a senior code reviewer...
```

**OpenCode Format:**
- Same markdown format with YAML frontmatter
- Place in `.opencode/agents/` or `~/.config/opencode/agents/`
- Reference in `opencode.json`:

```json
{
  "agent": {
    "code-reviewer": {
      "description": "Reviews code for quality",
      "model": "anthropic/claude-sonnet-4-5",
      "prompt": "You are a senior code reviewer...",
      "tools": {
        "write": false,
        "edit": false
      }
    }
  }
}
```

**Migration:** Direct copy with optional JSON configuration

### 2. Commands Migration ✅

**Claude Code Format:**
```markdown
---
description: Restate requirements and create plan
---

# Plan Command

This command invokes the planner agent...
```

**OpenCode Format:**
- Markdown files in `.opencode/commands/` or `~/.config/opencode/commands/`
- Enhanced with arguments and bash execution:

```markdown
---
description: Run tests with coverage
---
Run the full test suite with coverage:
`!npm test -- --coverage`

Analyze results and suggest improvements.
```

**With Arguments:**
```markdown
---
description: Create a new component
---
Create React component named $ARGUMENTS:
`!mkdir -p src/components/$ARGUMENTS`

Generate TypeScript component file...
```

**Migration:** Copy files, enhance with `!` for bash and `$ARGUMENTS` for parameters

### 3. Skills Migration ✅

**Options:**
1. **AGENTS.md** - Central project instructions file
2. **`.opencode/skills/`** - Individual skill files
3. **`instructions` array** in `opencode.json`

**OpenCode Configuration:**
```json
{
  "instructions": [
    "CONTRIBUTING.md",
    "docs/guidelines.md",
    ".opencode/skills/backend-patterns.md",
    ".opencode/skills/security-review.md"
  ]
}
```

**Migration:** Convert SKILL.md files to AGENTS.md sections or keep as separate files referenced in instructions

### 4. Hooks Migration ⚠️ (Major Change)

**Claude Code Format:**
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

**OpenCode Format:** JavaScript/TypeScript plugins

```typescript
// .opencode/plugins/hooks.ts
import type { Plugin } from "@opencode-ai/plugin"

export const HooksPlugin: Plugin = async ({ project, client, $ }) => {
  return {
    // Tool execution hooks
    "tool.execute.before": async (input, output) => {
      if (input.tool === "read" && output.args.filePath.includes(".env")) {
        throw new Error("Cannot read .env files")
      }
    },
    
    "tool.execute.after": async (input, output) => {
      if (input.tool === "edit") {
        await $`prettier --write ${output.args.filePath}`
      }
    },
    
    // Session hooks
    "session.created": async ({ event }) => {
      console.log("Session started:", event.properties.sessionId)
    },
    
    "session.compacted": async ({ event }) => {
      // Handle context compaction
    },
    
    // File hooks
    "file.edited": async ({ event }) => {
      // Handle file edits
    }
  }
}
```

**Available Hook Events:**
- `tool.execute.before` / `tool.execute.after`
- `session.created` / `session.updated` / `session.compacted`
- `file.edited` / `file.watcher.updated`
- `message.updated` / `message.removed`
- `command.executed`
- `permission.asked` / `permission.replied`
- `experimental.session.compacting` (custom compaction logic)

**Migration:** Rewrite hooks.json as TypeScript/JavaScript plugins

### 5. Rules Migration ✅

**Claude Code:** Rules as markdown files in `~/.claude/rules/`

**OpenCode:** Reference in `instructions` array

```json
{
  "instructions": [
    "rules/security.md",
    "rules/coding-style.md",
    "rules/testing.md",
    "rules/git-workflow.md"
  ]
}
```

**Migration:** Keep markdown files, reference via instructions config

### 6. MCP Configuration Migration ✅

**Claude Code:** `~/.claude.json`
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

**OpenCode:** `opencode.json`
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

**Migration:** Transform to OpenCode format with `type: local` or `type: remote`

---

## Installation Instructions

### Option 1: Automated Installation (Recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/YOUR-REPO/everything-opencode/main/install.sh | bash
```

**What the install script does:**
1. Detects OS and OpenCode installation
2. Creates `~/.config/opencode/` directory structure
3. Copies agents, commands, skills, rules
4. Installs hooks as plugins
5. Configures MCP servers
6. Sets up opencode.json with proper paths

### Option 2: Manual Installation

```bash
# Clone repository
git clone https://github.com/YOUR-REPO/everything-opencode.git
cd everything-opencode

# Create OpenCode directories
mkdir -p ~/.config/opencode/{agents,commands,skills,plugins}

# Install components
cp -r agents/* ~/.config/opencode/agents/
cp -r commands/* ~/.config/opencode/commands/
cp -r skills/* ~/.config/opencode/skills/
cp -r rules/* ~/.opencode/rules/  # Keep as separate directory

# Convert and install hooks as plugins
cp -r hooks/plugins/* ~/.config/opencode/plugins/

# Copy MCP configuration
cp mcp-configs/opencode.json ~/.config/opencode/opencode.json

# Create AGENTS.md
cp AGENTS.md ~/.config/opencode/AGENTS.md

# Edit MCP configs to add your API keys
nano ~/.config/opencode/opencode.json
```

### Option 3: NPM Plugin Installation

Publish as npm package for easier distribution:

```bash
npm install -g everything-opencode
```

Then in `opencode.json`:
```json
{
  "plugin": ["everything-opencode"]
}
```

### Option 4: Project-Level Installation

For team/organization sharing:

```bash
# In your project root
mkdir -p .opencode/{agents,commands,plugins}
cp -r /path/to/everything-opencode/agents/* .opencode/agents/
cp -r /path/to/everything-opencode/commands/* .opencode/commands/

# Commit to repository
git add .opencode/
git commit -m "Add OpenCode configuration"
```

---

## Configuration File Templates

### Global Config (`~/.config/opencode/opencode.json`)

```json
{
  "$schema": "https://opencode.ai/config.json",
  
  "model": "anthropic/claude-sonnet-4-5",
  "small_model": "anthropic/claude-haiku-4-5",
  
  "instructions": [
    "~/.config/opencode/rules/security.md",
    "~/.config/opencode/rules/coding-style.md",
    "~/.config/opencode/rules/testing.md",
    "~/.config/opencode/rules/git-workflow.md"
  ],
  
  "agent": {
    "code-reviewer": {
      "description": "Reviews code for quality and security",
      "model": "anthropic/claude-sonnet-4-5",
      "prompt": "You are a senior code reviewer...",
      "tools": { "write": false, "edit": false }
    },
    "architect": {
      "description": "System design and architecture decisions",
      "model": "anthropic/claude-sonnet-4-5",
      "prompt": "You are a system architect..."
    }
  },
  
  "command": {
    "plan": {
      "template": "Create implementation plan for: $ARGUMENTS",
      "description": "Create implementation plan",
      "agent": "architect"
    },
    "review": {
      "template": "Review code for quality and security issues",
      "description": "Code review",
      "agent": "code-reviewer"
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

---

## Migration Checklist

### Repository Changes

- [ ] Rename repository to `everything-opencode`
- [ ] Update all references from "Claude Code" to "OpenCode"
- [ ] Update `.claude/` to `.opencode/` paths
- [ ] Update `~/.claude/` to `~/.config/opencode/` paths
- [ ] Remove `.claude-plugin/` directory
- [ ] Remove marketplace-related files
- [ ] Create new `opencode.json` config files

### Components Migration

- [ ] **Agents**: Copy 13 agent files to `.opencode/agents/`
- [ ] **Commands**: Copy 20+ command files, add bash execution (`!`)
- [ ] **Skills**: Convert to AGENTS.md or `.opencode/skills/`
- [ ] **Rules**: Move to `instructions` array in config
- [ ] **Hooks**: Rewrite as JavaScript/TypeScript plugins
- [ ] **MCP**: Transform configs to OpenCode format
- [ ] **Scripts**: Update paths, test compatibility

### Documentation

- [ ] Rewrite README.md with OpenCode instructions
- [ ] Create install.sh script
- [ ] Update all guides (shorthand, longform)
- [ ] Add configuration examples
- [ ] Document hook event mapping
- [ ] Create migration guide for users

### Testing

- [ ] Test on macOS
- [ ] Test on Linux
- [ ] Test on Windows (WSL)
- [ ] Verify all agents load
- [ ] Verify all commands work
- [ ] Test plugin hooks
- [ ] Test MCP integration

---

## Hook Event Mapping

### Claude Code → OpenCode

| Claude Code Event | OpenCode Event | Notes |
|-------------------|----------------|-------|
| `PreToolUse` | `tool.execute.before` | Before tool execution |
| `PostToolUse` | `tool.execute.after` | After tool execution |
| `PreCompact` | `experimental.session.compacting` | Before context compaction |
| `SessionStart` | `session.created` | New session started |
| `SessionEnd` | `session.closed` / `session.idle` | Session ended |
| `Stop` | `message.updated` | After response |
| `Notification` | `tui.toast.show` | Toast notifications |

---

## Best Practices

### For Organizations

1. **Remote Config**: Host organizational defaults at `.well-known/opencode`
2. **Team Sharing**: Commit `.opencode/` directory to repositories
3. **NPM Distribution**: Publish shared plugins to private npm registry
4. **Layered Overrides**: Use global config for defaults, project config for specifics

### For Users

1. **Global Setup**: Install commonly used agents/commands globally
2. **Project Overrides**: Use project `opencode.json` for repo-specific settings
3. **Plugin Development**: Convert complex hooks to TypeScript plugins
4. **Version Control**: Track `.opencode/` in Git for team consistency

### Security

1. **API Keys**: Use `{env:VARIABLE}` or `{file:path}` in config, never hardcode
2. **Sensitive Files**: Use plugin hooks to block `.env` file access
3. **Permissions**: Set `"bash": "ask"` and `"edit": "ask"` for sensitive projects
4. **MCP Servers**: Disable unused servers, use `enabled: false` by default

---

## Example Plugin: Converting Hooks

### Original Claude Code Hook

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "tool == 'Edit' && tool_input.file_path matches '\\.(ts|tsx)$'",
      "hooks": [{
        "type": "command",
        "command": "npx prettier --write $file_path"
      }]
    }]
  }
}
```

### OpenCode Plugin Equivalent

```typescript
// .opencode/plugins/auto-format.ts
import type { Plugin } from "@opencode-ai/plugin"

export const AutoFormatPlugin: Plugin = async ({ $ }) => {
  return {
    "tool.execute.after": async (input, output) => {
      if (input.tool === "edit") {
        const filePath = output.args.filePath
        
        if (/\.(ts|tsx)$/.test(filePath)) {
          try {
            await $`npx prettier --write ${filePath}`
            console.log(`✨ Formatted: ${filePath}`)
          } catch (error) {
            console.warn(`Failed to format: ${filePath}`)
          }
        }
      }
    }
  }
}
```

---

## References

- **OpenCode Docs**: https://opencode.ai/docs/
- **Plugins**: https://opencode.ai/docs/plugins/
- **Config**: https://opencode.ai/docs/config/
- **Commands**: https://opencode.ai/docs/commands/
- **Agents**: https://opencode.ai/docs/agents/
- **GitHub**: https://github.com/anomalyco/opencode

---

*Document Version: 2.0*
*Last Updated: 2026-02-02*
*Status: Ready for Implementation*
