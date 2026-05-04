---
name: skill-creator
description: Create, modify, test, and package new Claude Code skills. Use when defining new skills from scratch, improving existing SKILL.md files, running evals to test skill quality, or benchmarking skill performance. This is the meta-skill for skill development.
license: MIT
metadata:
  author: Anthropic
  version: "1.0.0"
  source: built-in (anthropic-skills:skill-creator)
---

# Skill Creator

The meta-skill for creating and improving Claude Code skills. Use to define new skills, improve existing ones, or evaluate skill quality.

## When to Apply

Use when:
- Creating a brand new skill from scratch
- Improving or refactoring an existing SKILL.md
- Testing whether a skill activates correctly
- Benchmarking skill quality and consistency
- Packaging skills for sharing

## Skill File Structure

Every skill requires a `SKILL.md` with YAML frontmatter:

```markdown
---
name: my-skill-name
description: One-sentence description. This IS what Claude uses to decide when to apply the skill. Be precise.
license: MIT
metadata:
  author: your-name
  version: "1.0.0"
---

# Skill Title

[Full instructions here...]
```

## Installation Location

Skills are loaded from:
```
.claude/skills/<skill-name>/SKILL.md  ← project-level (this project)
~/.claude/skills/<skill-name>/SKILL.md ← global (all projects)
```

## Description Field — Critical

The `description` field determines when Claude activates the skill. It must be:
- **Specific** about when to trigger (not vague)
- **Action-oriented** (starts with verb)
- **Scoped** (says when NOT to use it, if important)

```yaml
# ❌ Too vague
description: Helps with UI

# ✅ Specific and scoped
description: Reviews React components for WCAG 2.1 AA compliance. Trigger when asked to check accessibility, audit UI, or review components before shipping. Does not apply to backend or CLI code.
```

## Creating a New Skill — Template

```markdown
---
name: skill-slug-kebab-case
description: Precise trigger description. Active verb + scope + when NOT to use.
license: MIT
metadata:
  author: your-name
  version: "1.0.0"
---

# Skill Display Name

One paragraph summary of what this skill does and why.

## When to Apply

Precise conditions for activation (bullet list).

## [Main Content]

Core instructions, rules, patterns, and examples.

## Anti-Patterns

What NOT to do.

## Examples

Concrete code examples showing correct usage.
```

## Evaluating a Skill

Test a skill by prompting Claude with varied user messages and checking:

1. **Precision** — Does it activate when it should? Not activate when it shouldn't?
2. **Completeness** — Does it cover all relevant cases?
3. **Clarity** — Are the instructions unambiguous?
4. **Conciseness** — Is it as short as possible while remaining complete?

## Common Skill Mistakes

- **Over-broad descriptions** → activates when unwanted
- **No negative scope** → conflicts with other skills
- **Too long** → key rules get lost in noise
- **No examples** → instructions too abstract
- **Missing anti-patterns** → Claude falls back to defaults

## Built-in Skill Creator

Claude Code also ships a built-in `anthropic-skills:skill-creator` skill. To invoke it:

```
/skill-creator
```

This launches a guided workflow for creating, testing, and packaging skills.
