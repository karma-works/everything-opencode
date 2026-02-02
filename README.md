**Language:** English | [简体中文](README.zh-CN.md) | [繁體中文](docs/zh-TW/README.md)

# Everything OpenCode

[![Stars](https://img.shields.io/github/stars/karma-works/everything-opencode?style=flat)](https://github.com/karma-works/everything-opencode/stargazers)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Shell](https://img.shields.io/badge/-Shell-4EAA25?logo=gnu-bash&logoColor=white)
![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?logo=typescript&logoColor=white)
![Go](https://img.shields.io/badge/-Go-00ADD8?logo=go&logoColor=white)
![Markdown](https://img.shields.io/badge/-Markdown-000000?logo=markdown&logoColor=white)

---

<div align="center">

**🌐 Language / 语言 / 語言**

[**English**](README.md) | [简体中文](README.zh-CN.md) | [繁體中文](docs/zh-TW/README.md)

</div>

---

**The complete collection of OpenCode configs from an Anthropic hackathon winner.**

Production-ready agents, skills, commands, rules, and MCP configurations evolved over 10+ months of intensive daily use building real products.

> **Migration Complete:** This project has been migrated from Claude Code to OpenCode! See [MIGRATION_PLAN.md](MIGRATION_PLAN.md) for details.

---

## The Guides

This repo is the raw code only. The guides explain everything.

<table>
<tr>
<td width="50%">
<a href="https://x.com/affaanmustafa/status/2012378465664745795">
<img src="https://github.com/user-attachments/assets/1a471488-59cc-425b-8345-5245c7efbcef" alt="The Shorthand Guide to Everything Claude Code" />
</a>
</td>
<td width="50%">
<a href="https://x.com/affaanmustafa/status/2014040193557471352">
<img src="https://github.com/user-attachments/assets/c9ca43bc-b149-427f-b551-af6840c368f0" alt="The Longform Guide to Everything Claude Code" />
</a>
</td>
</tr>
<tr>
<td align="center"><b>Shorthand Guide</b><br/>Setup, foundations, philosophy. <b>Read this first.</b></td>
<td align="center"><b>Longform Guide</b><br/>Token optimization, memory persistence, evals, parallelization.</td>
</tr>
</table>

| Topic | What You'll Learn |
|-------|-------------------|
| Token Optimization | Model selection, system prompt slimming, background processes |
| Memory Persistence | Hooks that save/load context across sessions automatically |
| Continuous Learning | Auto-extract patterns from sessions into reusable skills |
| Verification Loops | Checkpoint vs continuous evals, grader types, pass@k metrics |
| Parallelization | Git worktrees, cascade method, when to scale instances |
| Subagent Orchestration | The context problem, iterative retrieval pattern |

---

## 🚀 Quick Start

Get up and running in under 2 minutes:

### Step 1: Clone the Repository

```bash
git clone https://github.com/karma-works/everything-opencode.git
cd everything-claude-code
```

### Step 2: Install for OpenCode

**Option A: Global Installation (Recommended)**

```bash
# Create OpenCode config directory
mkdir -p ~/.config/opencode

# Copy configuration
cp opencode.json ~/.config/opencode/
cp -r .opencode/* ~/.config/opencode/
```

**Option B: Project-Level Installation**

```bash
# Copy to your project
cp -r .opencode /path/to/your/project/
cp opencode.json /path/to/your/project/
```

### Step 3: Start Using

```bash
# Try a command
/plan "Add user authentication"

# Invoke an agent
@code-reviewer

# Check available commands
ls .opencode/commands/
```

✨ **That's it!** You now have access to 13+ agents, 12+ skills, and 20+ commands.

---

## 🌐 Cross-Platform Support

This configuration supports **Windows, macOS, and Linux**. All scripts are written in Node.js for maximum compatibility.

### Package Manager Detection

Scripts automatically detect your preferred package manager (npm, pnpm, yarn, or bun) with the following priority:

1. **Environment variable**: `OPENCODE_PACKAGE_MANAGER`
2. **Project config**: `.opencode/package-manager.json`
3. **package.json**: `packageManager` field
4. **Lock file**: Detection from package-lock.json, yarn.lock, pnpm-lock.yaml, or bun.lockb
5. **Global config**: `~/.config/opencode/package-manager.json`
6. **Fallback**: First available package manager

To set your preferred package manager:

```bash
# Via environment variable
export OPENCODE_PACKAGE_MANAGER=pnpm

# Via global config
node scripts/setup-package-manager.js --global pnpm

# Via project config
node scripts/setup-package-manager.js --project bun

# Detect current setting
node scripts/setup-package-manager.js --detect
```

Or use the `/setup-pm` command.

---

## 📦 What's Inside

This repo provides **OpenCode configuration files** - copy them to your project or global config.

```
everything-claude-code/
|-- .opencode/              # OpenCode configuration directory
|   |-- agents/             # Specialized subagents for delegation
|   |   |-- planner.md           # Feature implementation planning
|   |   |-- architect.md         # System design decisions
|   |   |-- tdd-guide.md         # Test-driven development
|   |   |-- code-reviewer.md     # Quality and security review
|   |   |-- security-reviewer.md # Vulnerability analysis
|   |   |-- build-error-resolver.md
|   |   |-- e2e-runner.md        # Playwright E2E testing
|   |   |-- refactor-cleaner.md  # Dead code cleanup
|   |   |-- doc-updater.md       # Documentation sync
|   |   |-- go-reviewer.md       # Go code review
|   |   |-- go-build-resolver.md # Go build error resolution
|   |
|   |-- commands/           # Slash commands for quick execution
|   |   |-- tdd.md              # /tdd - Test-driven development
|   |   |-- plan.md             # /plan - Implementation planning
|   |   |-- e2e.md              # /e2e - E2E test generation
|   |   |-- code-review.md      # /code-review - Quality review
|   |   |-- build-fix.md        # /build-fix - Fix build errors
|   |   |-- refactor-clean.md   # /refactor-clean - Dead code removal
|   |   |-- setup-pm.md         # /setup-pm - Configure package manager
|   |   |-- go-review.md        # /go-review - Go code review
|   |   |-- go-test.md          # /go-test - Go TDD workflow
|   |   |-- go-build.md         # /go-build - Fix Go build errors
|   |
|   |-- skills/             # Workflow definitions and domain knowledge
|   |   |-- coding-standards/           # Language best practices
|   |   |-- backend-patterns/           # API, database, caching patterns
|   |   |-- security-review/            # Security checklist
|   |   |-- eval-harness/               # Verification loop evaluation
|   |   |-- python-testing/             # Python testing patterns
|   |   |-- python-patterns/            # Python best practices
|   |   |-- golang-testing/             # Go testing patterns
|   |   |-- strategic-compact/          # Context compaction
|   |
|   |-- rules/              # Always-follow guidelines
|   |   |-- security.md         # Mandatory security checks
|   |   |-- coding-style.md     # Immutability, file organization
|   |   |-- testing.md          # TDD, 80% coverage requirement
|   |   |-- git-workflow.md     # Commit format, PR process
|   |   |-- agents.md           # When to delegate to subagents
|   |   |-- performance.md      # Model selection, context management
|   |   |-- hooks.md            # Hook usage guidelines
|   |   |-- patterns.md         # Design patterns
|   |
|   |-- AGENTS.md           # Project-specific instructions
|
|-- opencode.json           # OpenCode configuration file
|-- AGENTS.md               # Root-level instructions
|
|-- agents/                 # Source: Agent definitions (copied to .opencode/)
|-- commands/               # Source: Command definitions (copied to .opencode/)
|-- skills/                 # Source: Skill definitions (copied to .opencode/)
|-- rules/                  # Source: Rule definitions (copied to .opencode/)
|-- scripts/                # Cross-platform Node.js scripts
|-- mcp-configs/            # MCP server configurations
```

---

## 🛠️ Ecosystem Tools

### Skill Creator

Two ways to generate Claude Code skills from your repository:

#### Option A: Local Analysis (Built-in)

Use the `/skill-create` command for local analysis without external services:

```bash
/skill-create                    # Analyze current repo
/skill-create --instincts        # Also generate instincts for continuous-learning
```

This analyzes your git history locally and generates SKILL.md files.

#### Option B: GitHub App (Advanced)

For advanced features (10k+ commits, auto-PRs, team sharing):

[Install GitHub App](https://github.com/apps/skill-creator) | [ecc.tools](https://ecc.tools)

```bash
# Comment on any issue:
/skill-creator analyze

# Or auto-triggers on push to default branch
```

Both options create:
- **SKILL.md files** - Ready-to-use skills for Claude Code
- **Instinct collections** - For continuous-learning-v2
- **Pattern extraction** - Learns from your commit history

### 🧠 Continuous Learning

**Note:** Continuous learning features (instincts, pattern extraction) are not available in OpenCode. These features were specific to Claude Code. See [MIGRATION_PLAN.md](MIGRATION_PLAN.md) for details on potential custom implementations.

---

## 📋 Requirements

### OpenCode CLI

This configuration requires [OpenCode](https://opencode.ai) CLI.

Check your version:
```bash
opencode --version
```

### Important Notes

- **Context Window Management**: Don't enable all MCPs at once. Your context window can shrink significantly with too many tools enabled.
- **Rule of thumb**: Keep under 10 MCPs enabled per project, under 80 tools active.
- **Skills**: Are automatically loaded from `.opencode/skills/` (backward compatible with `.claude/skills/`)

---

## 📥 Installation

### Option 1: Global Installation (Recommended)

Install for all projects:

```bash
# Clone the repo
git clone https://github.com/karma-works/everything-opencode.git
cd everything-claude-code

# Create OpenCode config directory
mkdir -p ~/.config/opencode

# Copy configuration files
cp opencode.json ~/.config/opencode/
cp -r .opencode/agents ~/.config/opencode/
cp -r .opencode/commands ~/.config/opencode/
cp -r .opencode/skills ~/.config/opencode/
cp -r .opencode/rules ~/.config/opencode/

# Optional: Copy AGENTS.md
cp AGENTS.md ~/.config/opencode/
```

---

### Option 2: Project-Level Installation

Install for a specific project:

```bash
# Clone the repo
git clone https://github.com/karma-works/everything-opencode.git
cd everything-claude-code

# Copy to your project
cp -r .opencode /path/to/your/project/
cp opencode.json /path/to/your/project/
cp AGENTS.md /path/to/your/project/
```

Or if you're already in your project directory:

```bash
# From your project root
cp -r /path/to/everything-claude-code/.opencode ./
cp /path/to/everything-claude-code/opencode.json ./
cp /path/to/everything-claude-code/AGENTS.md ./
```

---

### Option 3: Manual Component Installation

If you prefer manual control over what's installed:

```bash
# Clone the repo
git clone https://github.com/karma-works/everything-opencode.git

# Copy specific agents
cp everything-claude-code/.opencode/agents/code-reviewer.md ~/.config/opencode/agents/

# Copy specific commands
cp everything-claude-code/.opencode/commands/plan.md ~/.config/opencode/commands/

# Copy specific skills
cp -r everything-claude-code/.opencode/skills/python-testing ~/.config/opencode/skills/

# Copy specific rules
cp everything-claude-code/.opencode/rules/security.md ~/.config/opencode/rules/
```

#### Configure MCPs

Edit `~/.config/opencode/opencode.json` to enable desired MCP servers:

```json
{
  "mcp": {
    "github": {
      "type": "local",
      "command": ["npx", "-y", "@modelcontextprotocol/server-github"],
      "enabled": true
    }
  }
}
```

**Important:** Set required environment variables (e.g., `GITHUB_PERSONAL_ACCESS_TOKEN`) before using MCP servers.

---

## 🎯 Key Concepts

### Agents

Subagents handle delegated tasks with limited scope. Invoke with `@agent-name`. Example:

```markdown
---
description: Reviews code for quality, security, and maintainability
mode: subagent
model: anthropic/claude-sonnet-4-5
temperature: 0.1
tools:
  read: true
  grep: true
  glob: true
  bash: true
  edit: false
  write: false
permission:
  bash:
    "git *": allow
    "*": ask
---

You are a senior code reviewer...
```

### Skills

Skills are workflow definitions invoked by commands or agents:

```markdown
# TDD Workflow

1. Define interfaces first
2. Write failing tests (RED)
3. Implement minimal code (GREEN)
4. Refactor (IMPROVE)
5. Verify 80%+ coverage
```

### Hooks

**Note:** OpenCode uses a different hook system than Claude Code. Hooks are implemented as JavaScript/TypeScript plugins in `.opencode/plugins/`.

Example plugin structure:

```typescript
// .opencode/plugins/hooks.ts
import type { Plugin } from "@opencode-ai/plugin"

export const HooksPlugin: Plugin = async ({ $ }) => {
  return {
    "tool.execute.after": async (input, output) => {
      if (input.tool === "edit") {
        console.log(`Edited: ${output.args.filePath}`)
      }
    }
  }
}
```

See [MIGRATION_PLAN.md](MIGRATION_PLAN.md) for details on converting Claude Code hooks to OpenCode plugins.

### Rules

Rules are always-follow guidelines referenced in `opencode.json`:

```json
{
  "instructions": [
    "~/.config/opencode/rules/security.md",
    "~/.config/opencode/rules/coding-style.md",
    "~/.config/opencode/rules/testing.md"
  ]
}
```

Keep them modular in `~/.config/opencode/rules/` or `.opencode/rules/`.

---

## 🧪 Running Tests

The plugin includes a comprehensive test suite:

```bash
# Run all tests
node tests/run-all.js

# Run individual test files
node tests/lib/utils.test.js
node tests/lib/package-manager.test.js
node tests/hooks/hooks.test.js
```

---

## 🤝 Contributing

**Contributions are welcome and encouraged.**

This repo is meant to be a community resource. If you have:
- Useful agents or skills
- Clever hooks
- Better MCP configurations
- Improved rules

Please contribute! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Ideas for Contributions

- Language-specific skills (Python, Rust patterns) - Go now included!
- Framework-specific configs (Django, Rails, Laravel)
- DevOps agents (Kubernetes, Terraform, AWS)
- Testing strategies (different frameworks)
- Domain-specific knowledge (ML, data engineering, mobile)

---

## 📖 Background

I've been using AI coding assistants since the experimental rollout. Won the Anthropic x Forum Ventures hackathon in Sep 2025 building [zenith.chat](https://zenith.chat) with [@DRodriguezFX](https://x.com/DRodriguezFX) - entirely using AI-powered development.

These configs are battle-tested across multiple production applications and have been migrated from Claude Code to OpenCode.

---

## ⚠️ Important Notes

### Context Window Management

**Critical:** Don't enable all MCPs at once. Your context window can shrink significantly with too many tools enabled.

Rule of thumb:
- Have 20-30 MCPs configured in `opencode.json`
- Keep under 10 enabled per project
- Under 80 tools active

Use `"enabled": false` in the MCP config to disable unused servers:

```json
{
  "mcp": {
    "github": {
      "type": "local",
      "command": ["npx", "-y", "@modelcontextprotocol/server-github"],
      "enabled": false
    }
  }
}
```

### Customization

These configs work for my workflow. You should:
1. Start with what resonates
2. Modify for your stack
3. Remove what you don't use
4. Add your own patterns

---

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=karma-works/everything-opencode&type=Date)](https://star-history.com/#karma-works/everything-opencode&Date)

---

## 🔗 Links

- **Shorthand Guide (Start Here):** [The Shorthand Guide to Everything Claude Code](https://x.com/affaanmustafa/status/2012378465664745795)
- **Longform Guide (Advanced):** [The Longform Guide to Everything Claude Code](https://x.com/affaanmustafa/status/2014040193557471352)
- **Follow:** [@affaanmustafa](https://x.com/affaanmustafa)
- **zenith.chat:** [zenith.chat](https://zenith.chat)

---

## 📄 License

MIT - Use freely, modify as needed, contribute back if you can.

---

**Star this repo if it helps. Read both guides. Build something great.**
