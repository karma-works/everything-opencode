# Open Issues and Research Findings

## Status Overview

Based on comprehensive research of OpenCode documentation, this document tracks open questions, confirmed features, and identified gaps in the migration from Claude Code to OpenCode.

---

## ✅ Confirmed Features (Fully Supported)

### 1. Skills System ✅
**Status:** Direct migration path available with backward compatibility

**Key Findings:**
- OpenCode supports skills in `.opencode/skills/<name>/SKILL.md`
- **Backward Compatibility:** OpenCode automatically reads `.claude/skills/<name>/SKILL.md` as fallback
- Skills are discovered via the native `skill` tool
- Frontmatter supports: `name`, `description`, `license`, `compatibility`, `metadata`
- Skills can be loaded at: project level (`.opencode/skills/`) or global (`~/.config/opencode/skills/`)
- Skills can be permission-controlled via `permission.skill` in config

**Migration Notes:**
- Rename `.claude/skills/` to `.opencode/skills/` (optional - backward compatible)
- Ensure SKILL.md files have proper frontmatter with `name` and `description`
- Skill names must be lowercase alphanumeric with hyphens only
- Maximum name length: 64 characters

**Example Skill Format (Compatible with Both):**
```markdown
---
name: python-testing
description: Python testing patterns, TDD, and pytest best practices
---

## When to Use
Reference this skill when writing or reviewing Python tests...
```

### 2. Commands System ✅
**Status:** Full support with enhanced features

**Key Findings:**
- Commands stored as markdown files in `.opencode/commands/*.md`
- Supports YAML frontmatter with: `description`, `agent`, `model`, `subtask`
- **Argument Substitution:**
  - `$ARGUMENTS` - All arguments as single string
  - `$1`, `$2`, `$3`... - Positional arguments
- **Shell Execution:** Use ``!`command` `` to inject bash output
- **File References:** Use `@filepath` to include file contents
- Commands can specify which agent to use via `agent:` field
- Can trigger subagent invocation with `subtask: true`

**Migration Notes:**
- Commands are nearly identical to Claude Code format
- Enhanced features available: positional args, shell injection, file references
- Command name comes from filename (e.g., `test.md` → `/test`)

**Example Command (OpenCode Enhanced):**
```markdown
---
description: Run tests with coverage
agent: build
---

Run tests:!`npm test -- --coverage`

Focus on failures in $ARGUMENTS
```

### 3. Agents System ✅
**Status:** Full support via markdown files

**Key Findings:**
- Agents defined in `.opencode/agents/*.md` with YAML frontmatter
- Supports: `description`, `mode` (primary/subagent), `model`, `prompt`, `tools`, `permission`, `temperature`, `steps`, `color`, `top_p`
- Built-in agents: `build` (default), `plan`, `general` (subagent), `explore` (subagent)
- Agents can be invoked via `@agent-name` in messages
- Primary agents switched with Tab key
- Subagents can be hidden from autocomplete with `hidden: true`
- Task permissions control which subagents can invoke others

**Migration Notes:**
- Convert agent frontmatter from Claude format to OpenCode format
- Add `mode: subagent` for specialized agents
- Use `tools` to restrict tool access (e.g., `write: false` for read-only)
- Use `permission` for fine-grained access control

### 4. Rules via AGENTS.md ✅
**Status:** Full support with backward compatibility

**Key Findings:**
- OpenCode uses `AGENTS.md` for project rules (similar to Cursor)
- **Claude Code Compatibility:** Falls back to `CLAUDE.md` if no `AGENTS.md` exists
- Also supports `~/.claude/CLAUDE.md` as global rules fallback
- Can disable compatibility with `OPENCODE_DISABLE_CLAUDE_CODE=1`
- Supports `instructions` array in `opencode.json` to reference multiple rule files
- Supports glob patterns in instructions: `packages/*/AGENTS.md`
- Supports remote URLs in instructions

**Migration Notes:**
- Rename `CLAUDE.md` to `AGENTS.md` (optional - backward compatible)
- Use `instructions` field to reference existing rule files
- Can reference `.cursor/rules/*.md` for Cursor compatibility

### 5. MCP Servers ✅
**Status:** Supported with format differences

**Key Findings:**
- Configured in `opencode.json` under `mcp` section
- Supports `type: local` or `type: remote`
- Local MCPs use `command` array instead of command/args split
- Remote MCPs use `url` and optional `headers`

**Format Example:**
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

---

## ⚠️ Partially Supported / Needs Adaptation

### 6. Hooks System ⚠️
**Status:** Supported via JavaScript/TypeScript plugins (major rewrite required)

**Key Findings:**
- Hooks implemented as plugins in `.opencode/plugins/*.ts` or `*.js`
- Plugin format: export async function returning hooks object
- Available events:
  - `tool.execute.before` / `tool.execute.after`
  - `session.created` / `session.updated` / `session.compacted`
  - `file.edited` / `file.watcher.updated`
  - `message.updated` / `message.removed`
  - `command.executed`
  - `permission.asked` / `permission.replied`
  - `experimental.session.compacting` (custom compaction logic)
- Plugins receive context: `{ project, client, $, directory, worktree }`
- TypeScript support via `@opencode-ai/plugin` package

**Migration Challenge:**
- Claude Code hooks are JSON-based declarative
- OpenCode hooks are imperative JavaScript/TypeScript
- All hooks need complete rewrite
- Different event names and payloads

**Claude → OpenCode Event Mapping:**
| Claude Code | OpenCode | Notes |
|-------------|----------|-------|
| `PreToolUse` | `tool.execute.before` | Before tool execution |
| `PostToolUse` | `tool.execute.after` | After tool execution |
| `PreCompact` | `experimental.session.compacting` | Before compaction |
| `SessionStart` | `session.created` | New session started |
| `SessionEnd` | N/A | No direct equivalent |
| `Stop` | `message.updated` | After response |

### 7. Continuous Learning / Instinct System ❓
**Status:** Unknown / Likely not supported

**Key Findings:**
- No documentation found for session persistence across restarts
- No built-in continuous learning or pattern extraction
- The `instinct-export`, `instinct-import`, `evolve` commands rely on:
  - Session evaluation hooks
  - Pattern extraction from git history
  - Persistent storage of learned patterns

**Open Questions:**
1. Can plugins persist data to disk for learned patterns?
2. Is there a session storage mechanism accessible to plugins?
3. Can `session.compacted` event be used to extract patterns?

**Recommended Approach:**
- Implement as custom plugin with file-based storage
- Use `experimental.session.compacting` hook to capture session data
- Store instincts in `.opencode/instincts/` directory
- Create custom skill for accessing learned patterns

---

## ❌ Not Supported / Removed

### 8. Plugin Marketplace System ❌
**Status:** Not available, no plans to add

**Key Findings:**
- OpenCode explicitly has no marketplace
- No `/plugin marketplace add` or `/plugin install` commands
- Plugins distributed via:
  - Local files in `.opencode/plugins/`
  - NPM packages specified in `opencode.json`
  - Manual installation scripts

**Migration Impact:**
- Remove all `.claude-plugin/` directory contents
- Remove `marketplace.json`
- Create manual installation script instead
- Consider publishing as npm package for easier distribution

### 9. Package Manager Auto-Detection ❓
**Status:** Unknown / Not documented

**Current Claude Implementation:**
- `.claude/package-manager.json` stores preference
- `CLAUDE_PACKAGE_MANAGER` environment variable
- Automatic detection from lock files
- Scripts for setup and detection

**Open Questions:**
1. Does OpenCode have equivalent functionality?
2. Can plugins detect package manager?
3. Should we keep the Node.js scripts as utilities?

**Recommended:** Keep scripts as utility functions, document manual configuration

---

## 🔍 Open Research Questions

### High Priority

1. **Session Persistence**
   - Does OpenCode persist session data across restarts?
   - Can plugins access session history?
   - Is there a built-in mechanism for continuous learning?

2. **Plugin Storage**
   - Can plugins write to the filesystem for data persistence?
   - What is the recommended location for plugin data?
   - Are there any sandboxing restrictions?

3. **Environment Variables**
   - Equivalent of `CLAUDE_PLUGIN_ROOT` in OpenCode?
   - How to reference plugin directory in code?
   - Best practice for plugin-relative paths?

4. **Hook Context Access**
   - Full list of available context properties in plugins
   - Can plugins access git information?
   - Can plugins access session history?

### Medium Priority

5. **Command Chaining**
   - Can commands invoke other commands?
   - Is there a programmatic way to trigger commands?

6. **Cross-Platform Support**
   - Are plugins portable across macOS/Linux/Windows?
   - Any platform-specific considerations?

7. **Error Handling**
   - How do plugin errors affect the session?
   - Can plugins show user-facing errors?

8. **Performance**
   - Any performance implications of many plugins?
   - Best practices for plugin efficiency?

---

## 🎯 Identified Gaps

### Gap 1: Continuous Learning System
**Claude Feature:** Automatic pattern extraction from sessions, instinct learning, skill evolution
**OpenCode Status:** No built-in equivalent
**Impact:** High - Core feature of everything-claude-code
**Solution:** Implement as custom plugin with file storage

### Gap 2: Session Export/Import
**Claude Feature:** Export/import learned instincts and patterns
**OpenCode Status:** Unknown
**Impact:** Medium - Important for sharing knowledge
**Solution:** Implement custom export/import commands

### Gap 3: Package Manager Integration
**Claude Feature:** Auto-detection and preference storage
**OpenCode Status:** Unknown
**Impact:** Low - Convenience feature
**Solution:** Keep as utility scripts

---

## 📝 Migration Recommendations

### Phase 1: Quick Win (Fully Compatible Features)
1. **Skills** - Direct copy, minimal changes (backward compatible)
2. **Commands** - Direct copy, can enhance with new features
3. **Agents** - Convert frontmatter, keep content
4. **Rules** - Reference via instructions or use AGENTS.md

### Phase 2: Rewrite Required
5. **Hooks** - Complete rewrite as TypeScript plugins
6. **Continuous Learning** - Custom implementation needed

### Phase 3: Distribution
7. **Remove marketplace files**
8. **Create install script**
9. **Test on multiple platforms**

---

## 🔗 Reference Links

- [OpenCode Plugins](https://opencode.ai/docs/plugins/)
- [OpenCode Agents](https://opencode.ai/docs/agents/)
- [OpenCode Commands](https://opencode.ai/docs/commands/)
- [OpenCode Skills](https://opencode.ai/docs/skills/)
- [OpenCode Rules](https://opencode.ai/docs/rules/)
- [OpenCode Config](https://opencode.ai/docs/config/)
- [OpenCode SDK](https://opencode.ai/docs/sdk/)
- [GitHub Issue #299 - Custom Slash Commands](https://github.com/anomalyco/opencode/issues/299)
- [DEV Article - Hooks in OpenCode](https://dev.to/einarcesar/does-opencode-support-hooks-a-complete-guide-to-extensibility-k3p)

---

## Next Actions

1. **Test Session Persistence**: Install OpenCode and verify if sessions persist across restarts
2. **Test Plugin Storage**: Create test plugin that writes to filesystem
3. **Migrate One Feature**: Start with code-reviewer agent as proof of concept
4. **Document Gaps**: Create clear documentation for unsupported features
5. **Community Feedback**: Open discussion about continuous learning implementation

---

*Document Version: 1.0*
*Last Updated: 2026-02-02*
*Research Status: Comprehensive documentation review complete*
