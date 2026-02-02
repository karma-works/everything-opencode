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

### Backward Compatibility

**OpenCode automatically supports Claude Code conventions:**

| Feature | Claude Location | OpenCode Support | Action Required |
|---------|----------------|------------------|-----------------|
| **Project Rules** | `CLAUDE.md` | ✅ Auto-detected if no `AGENTS.md` | Optional rename |
| **Global Rules** | `~/.claude/CLAUDE.md` | ✅ Fallback if no `~/.config/opencode/AGENTS.md` | Optional migration |
| **Skills** | `.claude/skills/` | ✅ Auto-detected alongside `.opencode/skills/` | No action needed |
| **Global Skills** | `~/.claude/skills/` | ✅ Auto-detected | No action needed |

**To disable backward compatibility:**
```bash
export OPENCODE_DISABLE_CLAUDE_CODE=1              # Disable all .claude support
export OPENCODE_DISABLE_CLAUDE_CODE_PROMPT=1       # Disable only ~/.claude/CLAUDE.md
export OPENCODE_DISABLE_CLAUDE_CODE_SKILLS=1       # Disable only .claude/skills
```

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

**Agent Format Differences:**

| Feature | Claude Code | OpenCode |
|---------|-------------|----------|
| **Frontmatter** | `name`, `description`, `tools`, `model` | `description`, `mode`, `model`, `tools`, `permission`, `temperature`, `steps`, `color` |
| **Invocation** | `@agent-name` | `@agent-name` (same) |
| **Model** | `opus`, `sonnet`, `haiku` | `anthropic/claude-sonnet-4-5` format |
| **Tool Access** | Array: `["Read", "Edit"]` | Object: `{"read": true, "edit": false}` |
| **Modes** | Implicit | Explicit: `primary`, `subagent`, `all` |

**OpenCode Agent Example:**
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

You are a senior code reviewer. Focus on:
- Code quality and best practices
- Security vulnerabilities
- Performance implications

Provide constructive feedback without making direct changes.
```

**Migration:**
- Convert tool arrays to tool objects
- Add `mode: subagent` for specialized agents
- Update model identifiers to provider/model format
- Use `permission` for fine-grained access control
- Optional: Add `temperature`, `steps`, `color` for customization

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

**Enhanced Features (OpenCode Additions):**

1. **Positional Arguments:**
```markdown
---
description: Create a file with content
---
Create file $1 in directory $2 with content:
$3
```
Usage: `/create-file config.json src '{ "key": "value" }'`

2. **Shell Command Execution:**
```markdown
---
description: Analyze test coverage
---
Current test status:
!`npm test`

Review failures and suggest improvements.
```

3. **File References:**
```markdown
---
description: Review component
---
Review the implementation in @src/components/Button.tsx
Compare with @src/components/Button.test.tsx
```

4. **Agent Assignment:**
```markdown
---
description: Code review
agent: code-reviewer
subtask: true
---
Review the recent changes for quality and security.
```

**Migration:** 
- Direct copy works (commands are nearly identical)
- Optional: Enhance with new features (positional args, shell execution, file references)
- Update agent references from Claude format to OpenCode format

### 3. Skills Migration ✅ (Backward Compatible)

**Key Finding:** OpenCode has **built-in backward compatibility** for Claude Code skills!

**Skill Discovery:**
OpenCode searches for skills in this order:
- Project: `.opencode/skills/<name>/SKILL.md`
- Project: `.claude/skills/<name>/SKILL.md` (backward compatible)
- Global: `~/.config/opencode/skills/<name>/SKILL.md`
- Global: `~/.claude/skills/<name>/SKILL.md` (backward compatible)

**SKILL.md Format (Compatible with Both):**
```markdown
---
name: python-testing
description: Python testing patterns, TDD, and pytest best practices
license: MIT
compatibility: opencode
metadata:
  audience: developers
  level: intermediate
---

## When to Use

Reference this skill when writing or reviewing Python tests...

## Best Practices

1. Use pytest fixtures for setup/teardown
2. Mock external dependencies
3. Aim for 80%+ coverage
```

**Skill Naming Requirements:**
- Must be 1-64 characters
- Lowercase alphanumeric with single hyphens
- Cannot start/end with hyphen
- Cannot contain consecutive hyphens
- Must match directory name
- Regex: `^[a-z0-9]+(-[a-z0-9]+)*$`

**Skill Permissions:**
```json
{
  "permission": {
    "skill": {
      "*": "allow",
      "internal-*": "deny",
      "experimental-*": "ask"
    }
  }
}
```

**Migration:** 
- ✅ **Option 1**: Keep skills in `.claude/skills/` (works automatically)
- ✅ **Option 2**: Copy to `.opencode/skills/` (recommended for clarity)
- ✅ **Option 3**: Reference in AGENTS.md or `instructions` array

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

### 5. Continuous Learning / Instinct System ❌ (Not Supported)

**Claude Code Features:**
- `/instinct-status` - View learned instincts with confidence scores
- `/instinct-export` - Export instincts for sharing
- `/instinct-import` - Import instincts from others
- `/evolve` - Cluster instincts into skills
- `/learn` - Extract patterns mid-session
- `/checkpoint` - Save verification state
- Session evaluation hooks for automatic pattern extraction

**OpenCode Status:** No built-in equivalent

**Gap Analysis:**
The continuous learning system relies on:
1. Session persistence across restarts
2. Pattern extraction from git history
3. Persistent storage for learned patterns
4. Session evaluation hooks

**Recommended Implementation:**

Create a custom plugin with file-based storage:

```typescript
// .opencode/plugins/continuous-learning.ts
import type { Plugin } from "@opencode-ai/plugin"
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs"
import { join } from "path"
import { homedir } from "os"

const INSTINCTS_DIR = join(homedir(), ".config/opencode/instincts")

export const ContinuousLearningPlugin: Plugin = async ({ client }) => {
  // Ensure instincts directory exists
  if (!existsSync(INSTINCTS_DIR)) {
    mkdirSync(INSTINCTS_DIR, { recursive: true })
  }
  
  return {
    // Capture patterns on session compaction
    "experimental.session.compacting": async (input, output) => {
      const sessionId = input.sessionId
      const context = output.context
      
      // Extract patterns from context
      const patterns = extractPatterns(context)
      
      // Save to disk
      const instinctFile = join(INSTINCTS_DIR, `${sessionId}.json`)
      writeFileSync(instinctFile, JSON.stringify({
        timestamp: new Date().toISOString(),
        patterns,
        confidence: calculateConfidence(patterns)
      }, null, 2))
      
      // Inject summary into compaction
      output.context.push(`## Learned Patterns\n${summarizePatterns(patterns)}`)
    },
    
    // Log session completion
    "session.idle": async ({ event }) => {
      await client.app.log({
        service: "continuous-learning",
        level: "info",
        message: "Session completed - patterns extracted",
        extra: { sessionId: event.properties.sessionId }
      })
    }
  }
}

function extractPatterns(context: string[]): any[] {
  // Implement pattern extraction logic
  return []
}

function calculateConfidence(patterns: any[]): number {
  // Implement confidence scoring
  return 0.8
}

function summarizePatterns(patterns: any[]): string {
  // Implement pattern summarization
  return ""
}
```

**Custom Commands for Learning:**
```markdown
---
description: View learned instincts
---
Read and display all instinct files from ~/.config/opencode/instincts/

Show:
1. Top patterns by confidence score
2. Recently learned patterns
3. Suggested skills based on clusters
```

**Migration Decision:**
- 🔴 **High effort required** - No direct equivalent
- Options:
  1. Implement custom plugin (recommended for feature parity)
  2. Remove continuous learning features from migration
  3. Document as Claude Code-only feature

### 6. Rules Migration ✅

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

### 7. MCP Configuration Migration ✅

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

## Files to Remove vs Keep

### ❌ Remove (Not Supported in OpenCode)

| File/Directory | Reason |
|----------------|--------|
| `.claude-plugin/` | No plugin marketplace in OpenCode |
| `.claude-plugin/plugin.json` | Different plugin system |
| `.claude-plugin/marketplace.json` | No marketplace support |
| `marketplace.json` | No marketplace support |
| `schemas/plugin.schema.json` | Not needed |
| `schemas/hooks.schema.json` | Different hook system |
| `schemas/package-manager.schema.json` | Not needed |
| `hooks/hooks.json` | Rewrite as TypeScript plugins |
| `plugins/README.md` | Update for OpenCode |

### ✅ Keep (With Modifications)

| File/Directory | Modification |
|----------------|--------------|
| `agents/*.md` | Update frontmatter format, add `mode: subagent` |
| `commands/*.md` | Direct copy (backward compatible), optional enhancements |
| `skills/*/` | Direct copy (backward compatible), can stay in `.claude/skills/` |
| `rules/*.md` | Reference via `instructions` array in opencode.json |
| `contexts/*.md` | Copy to `.opencode/contexts/` |
| `mcp-configs/*` | Transform to OpenCode format |
| `scripts/*` | Update paths, test compatibility |
| `tests/*` | Update for OpenCode paths |

### 🔧 Environment Variables

| Claude Code | OpenCode | Status |
|-------------|----------|--------|
| `CLAUDE_PLUGIN_ROOT` | No direct equivalent | ⚠️ Use relative paths or config |
| `CLAUDE_PACKAGE_MANAGER` | Not documented | ⚠️ Keep as utility, manual config |
| `OPENCODE_CONFIG` | ✅ Supported | Use for custom config path |
| `OPENCODE_CONFIG_DIR` | ✅ Supported | Custom config directory |
| `OPENCODE_CONFIG_CONTENT` | ✅ Supported | Inline config |
| `OPENCODE_DISABLE_CLAUDE_CODE` | ✅ Supported | Disable .claude compatibility |

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

# Install Plugin Dependencies (CRITICAL)
cd ~/.config/opencode/plugins
# Initialize package.json if it doesn't exist
if [ ! -f package.json ]; then
  npm init -y
fi
# Install required packages for plugins (e.g., prettier)
npm install --save-dev typescript @types/node prettier
# Verify compilation
npx tsc --noEmit

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
- [ ] **Skills**: Convert to AGENTS.md or `.opencode/skills/` (backward compatible)
- [ ] **Rules**: Move to `instructions` array in config
- [ ] **Hooks**: Rewrite as JavaScript/TypeScript plugins
- [ ] **MCP**: Transform configs to OpenCode format
- [ ] **Scripts**: Update paths, test compatibility
- [ ] **Continuous Learning**: Decide on custom implementation or removal
- [ ] **Remove**: Delete `.claude-plugin/`, marketplace files, hooks.json

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

## Risk Assessment & Recommendations

### Risk Matrix

| Component | Migration Risk | Effort | Recommendation |
|-----------|---------------|---------|----------------|
| **Skills** | 🟢 Low | 1 hour | Direct copy, backward compatible |
| **Commands** | 🟢 Low | 2 hours | Direct copy, can enhance later |
| **Agents** | 🟢 Low | 3 hours | Update frontmatter format |
| **Rules** | 🟢 Low | 1 hour | Reference via instructions |
| **MCP Config** | 🟡 Medium | 2 hours | Transform format |
| **Hooks** | 🔴 High | 8 hours | Complete rewrite required |
| **Continuous Learning** | 🔴 High | 16+ hours | Custom implementation needed |

### Quick Start Recommendation

**For Fast Migration (80% of features):**

1. **Phase 1 (Week 1)**: Migrate Skills, Commands, Agents, Rules
   - ✅ Keep skills in `.claude/skills/` (backward compatible)
   - ✅ Copy commands to `.opencode/commands/`
   - ✅ Copy agents to `.opencode/agents/`
   - ✅ Reference rules in `instructions` array

2. **Phase 2 (Week 2)**: Hooks and MCP
   - ⚠️ Rewrite critical hooks as TypeScript plugins
   - ✅ Transform MCP config format
   - ✅ Create install script

3. **Phase 3 (Optional)**: Advanced Features
   - 🔴 Implement continuous learning plugin (if needed)
   - 🔴 Add enhanced command features
   - 🔴 Create npm package distribution

### Fallback Strategy

If full migration is not feasible:

1. **Keep both versions**:
   - Maintain `everything-opencode` for existing users
   - Create `everything-opencode` for new users
   - Cross-reference in documentation

2. **Hybrid approach**:
   - Use OpenCode for daily work (skills, commands, agents work in both)
   - Use Claude Code for continuous learning features
   - Document the hybrid workflow

3. **Gradual migration**:
   - Start with backward-compatible features
   - Add OpenCode-specific enhancements incrementally
   - Gather community feedback

---

## References

### OpenCode Documentation
- **OpenCode Docs**: https://opencode.ai/docs/
- **Plugins**: https://opencode.ai/docs/plugins/
- **Config**: https://opencode.ai/docs/config/
- **Commands**: https://opencode.ai/docs/commands/
- **Agents**: https://opencode.ai/docs/agents/
- **Skills**: https://opencode.ai/docs/skills/
- **Rules**: https://opencode.ai/docs/rules/
- **SDK**: https://opencode.ai/docs/sdk/

### GitHub Resources
- **OpenCode Repository**: https://github.com/anomalyco/opencode
- **Issue #299 - Custom Slash Commands**: https://github.com/anomalyco/opencode/issues/299
- **Community Plugins**: https://opencode.ai/docs/ecosystem

### External Resources
- **DEV Article - Hooks Guide**: https://dev.to/einarcesar/does-opencode-support-hooks-a-complete-guide-to-extensibility-k3p

### Related Files in This Repository
- **OPEN_ISSUES.md** - Detailed research findings and open questions
- **INSTALL.md** - Installation instructions (to be created)
- **COMPATIBILITY.md** - Feature compatibility matrix (to be created)

---

*Document Version: 3.0*
*Last Updated: 2026-02-02*
*Status: Ready for Implementation - Comprehensive Research Complete*
