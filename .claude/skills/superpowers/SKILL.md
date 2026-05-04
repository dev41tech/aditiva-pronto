---
name: superpowers
description: Complete multi-agent software development methodology. Provides structured workflows for brainstorming, implementation planning, TDD, parallel agent coordination, code review, and branch management. Use as productivity and methodology backbone for complex development tasks.
license: MIT
metadata:
  author: Jesse Vincent (obra)
  version: "1.0.0"
  source: github.com/obra/superpowers
---

# Superpowers — Agentic Development Framework

A complete software development methodology for AI coding agents, built on composable skills that chain together across the full development lifecycle.

## When to Apply

Use Superpowers for:
- Complex features requiring structured planning
- TDD workflows (RED-GREEN-REFACTOR)
- Multi-step debugging sessions
- Parallel agent coordination
- Code review workflows
- Branch management via git worktrees

## Development Lifecycle

Superpowers structures work through these phases:

### 1. Brainstorm
- Define the problem space
- Explore solution approaches
- Identify risks and unknowns
- Document constraints and requirements

### 2. Design
- Produce a concrete implementation plan
- Define interfaces and data structures
- Identify affected files
- Validate design before coding

### 3. Implement (Parallel Agents)
- Use git worktrees for isolated parallel work
- Each agent handles one focused task
- Regular checkpoints prevent drift
- Evidence-based progress tracking

### 4. Test (TDD)
- RED: Write failing test first
- GREEN: Implement minimum code to pass
- REFACTOR: Clean up while keeping tests green
- Anti-patterns documented and avoided

### 5. Review
- Code review against quality checklist
- Performance implications
- Security review (delegates to Trail of Bits Security skill)
- Documentation completeness

### 6. Ship
- Merge via PR
- Clean branch management
- Post-merge verification

## Core Principles

1. **Complexity reduction** — Always prefer the simpler solution
2. **Evidence over claims** — Show working code, not promises
3. **Explicit over implicit** — Document decisions, not just code
4. **Fail fast** — Surface problems early, not at merge time

## TDD Workflow

```bash
# RED: Write failing test
# Write test that describes desired behavior
# Run: npm test -- --watch

# GREEN: Implement minimum code
# Make the test pass with minimal code

# REFACTOR: Clean up
# Improve structure without changing behavior
# All tests must remain green
```

## Git Worktree Pattern

```bash
# Create isolated worktree for parallel work
git worktree add ../feature-branch-name -b feature/my-feature

# Work in isolation
cd ../feature-branch-name

# Merge when complete
git worktree remove ../feature-branch-name
```

## Debugging Protocol (4-Phase)

1. **Observe** — Reproduce the issue consistently
2. **Hypothesize** — Form a specific, testable hypothesis
3. **Verify** — Test the hypothesis (don't assume)
4. **Fix** — Apply the minimal change that resolves the root cause

## Installation (Full Plugin)

For the complete Superpowers skill library:
```
/plugin install superpowers@claude-plugins-official
```

Or via Superpowers marketplace:
```
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```
