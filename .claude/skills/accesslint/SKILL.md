---
name: accesslint-audit
description: WCAG 2.2 accessibility toolkit. Audits HTML, React/Vue/Svelte components, forms, navigation, and live pages for accessibility violations. Two modes: Report (no edits, produces prioritized findings) and Fix (audit + apply mechanical fixes + leave TODOs for visual issues). Always run before shipping any UI.
license: MIT
metadata:
  author: accesslint
  version: "1.0.0"
  source: github.com/accesslint/claude-marketplace
---

# AccessLint — Accessibility Audit Skill

WCAG 2.2 AA compliance toolkit for Claude Code. Audits and fixes accessibility issues in components, pages, forms, and navigation flows.

## When to Apply

**Always run this skill before:**
- Shipping any UI component or page
- Completing a design handoff
- Merging PRs that touch UI/UX code

**Trigger phrases:**
- "audit accessibility" / "check a11y"
- "is this accessible?"
- "review for WCAG compliance"
- "fix accessibility issues"

## Two Modes

### Mode 1: Report (Audit Only — No Code Changes)
Sweeps the specified scope, detects patterns across components, produces a prioritized written report. **No edits made.**

Use when: reviewing a PR, auditing before handoff, getting a full picture before fixing.

Output format:
```
[SEVERITY] path/to/file.tsx:42
  Rule: wcag-X.X.X
  Issue: Description of the violation
  Fix: Suggested remediation
```

### Mode 2: Fix (Audit + Apply + TODO)
Runs full audit → applies mechanical fixes verbatim → leaves `// TODO(a11y):` comments for visual/contextual issues that require human judgment.

Use when: ready to fix issues, not just report them.

## Three Execution Flows

The skill selects the appropriate flow based on context:

1. **`audit_html`** — Static HTML files, server-rendered markup
2. **`audit_live`** — React/Vue/Svelte component code analysis
3. **`audit-live-page`** — Live running page via URL (uses browser tools)

## Rules Checked

### Perceivable
- All `<img>` have meaningful `alt` text (not "image" or filename)
- Color is not the only means of conveying information
- Text contrast ratio ≥ 4.5:1 (normal), ≥ 3:1 (large)
- Videos have captions; audio has transcripts
- No auto-playing audio or video

### Operable
- All functionality accessible via keyboard
- No keyboard traps
- Focus order follows visual/logical order
- Skip navigation link present on pages with navigation
- Touch targets ≥ 44×44px
- No content with flash > 3 times/second

### Understandable
- Page language specified (`<html lang="pt-BR">`)
- Form inputs have visible labels (not just placeholder)
- Error messages explain how to fix the issue
- Consistent navigation across pages

### Robust
- Valid, semantic HTML structure
- ARIA roles match their native element behavior
- No duplicate IDs
- Interactive elements are focusable and have accessible names
- Custom components use appropriate ARIA patterns

## Severity Levels

| Level | Description |
|-------|-------------|
| CRITICAL | Blocks users with disabilities entirely |
| HIGH | Significantly impairs access |
| MEDIUM | Creates friction or confusion |
| LOW | Violates best practice, minor impact |

## Common Fixes Applied Automatically

- Missing `alt` attributes → adds `alt=""` for decorative, prompts for meaningful
- Missing `<label>` → wraps input in label or adds `aria-label`
- Missing `lang` attribute → adds `lang="pt-BR"` (or detected language)
- Missing `role` on custom interactive elements
- `tabIndex > 0` → removes or normalizes to `0`
- Missing button `type` attribute → adds `type="button"`

## Installation Note

For full plugin capabilities (live page auditing, browser integration), install the AccessLint plugin:
```
/plugin marketplace add accesslint/claude-marketplace
/plugin install accesslint:audit@accesslint-marketplace
```
