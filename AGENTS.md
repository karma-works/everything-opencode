# Everything OpenCode - Project Instructions

This file contains project-specific instructions and guidelines for OpenCode.

## Project Overview

This is a comprehensive collection of OpenCode configurations including agents, skills, commands, and rules. It provides production-ready tools for AI-assisted software development.

## Quick Reference

### Available Agents

Invoke agents using `@agent-name`:

- `@code-reviewer` - Code quality and security review
- `@planner` - Implementation planning for complex features
- `@architect` - System design and architecture decisions
- `@security-reviewer` - Security vulnerability detection
- `@tdd-guide` - Test-driven development guidance
- `@python-reviewer` - Python code review (PEP 8, idioms)
- `@refactor-cleaner` - Dead code cleanup
- `@go-reviewer` - Go code review (idiomatic Go)
- `@go-build-resolver` - Fix Go build errors
- `@e2e-runner` - End-to-end testing with Playwright
- `@database-reviewer` - PostgreSQL optimization and design
- `@doc-updater` - Documentation and codemap maintenance
- `@build-error-resolver` - TypeScript/build error resolution

### Available Commands

Use `/command-name` syntax:

- `/plan` - Create implementation plan
- `/code-review` - Run code review
- `/tdd` - Start TDD workflow
- `/build-fix` - Fix build errors
- `/refactor-clean` - Clean dead code
- `/e2e` - Run E2E tests
- `/python-review` - Review Python code
- `/go-review` - Review Go code
- `/go-build` - Fix Go build errors
- `/go-test` - Run Go tests
- `/verify` - Run verification loop
- `/eval` - Evaluate session
- `/test-coverage` - Check test coverage
- `/update-codemaps` - Update codemaps
- `/update-docs` - Update documentation
- `/setup-pm` - Configure package manager
- `/orchestrate` - Orchestrate subagents

### Available Skills

Skills are automatically loaded from `.opencode/skills/`:

- `python-testing` - Pytest patterns and TDD
- `python-patterns` - Python best practices
- `golang-testing` - Go testing patterns
- `backend-patterns` - API and database patterns
- `security-review` - Security checklist
- `coding-standards` - Language best practices
- `springboot-security` - Spring Boot security
- `springboot-tdd` - Spring Boot TDD
- `django-patterns` - Django patterns
- `clickhouse-io` - ClickHouse analytics
- `eval-harness` - Verification loops
- `strategic-compact` - Context compaction

## Core Principles

1. **Security First**: Never hardcode secrets, always validate input
2. **Test-Driven Development**: Write tests before code (Red-Green-Refactor)
3. **Code Quality**: 80%+ coverage, immutability, small functions
4. **Many Small Files**: 200-400 lines per file, high cohesion
5. **Continuous Review**: Use @code-reviewer for all changes

## MCP Servers

Configure MCP servers in `opencode.json`. Key servers available:

- GitHub operations
- Memory persistence
- Sequential thinking
- Filesystem access

**Warning**: Enable only 5-10 MCPs at a time to preserve context window.

## Migration Notes

This project was migrated from Claude Code to OpenCode. Key changes:

- Agents now use OpenCode frontmatter format with `mode: subagent`
- Tools specified as objects instead of arrays
- Model names use provider/model format
- MCP configuration uses `type: local` format
- Skills remain backward compatible

## Customization

Add project-specific rules by:

1. Creating `.opencode/rules/custom.md`
2. Adding to `instructions` array in `opencode.json`
3. Updating agent prompts for project-specific checks

## Support

- **OpenCode Docs**: https://opencode.ai/docs/
- **Repository**: https://github.com/karma-works/everything-opencode
- **Issues**: Report on GitHub

---

*Last Updated: 2026-02-02*
