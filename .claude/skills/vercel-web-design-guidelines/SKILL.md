---
name: vercel-web-design-guidelines
description: Reviews UI code for compliance with Vercel's Web Interface Guidelines — 100+ rules covering accessibility, performance, and UX best practices. Trigger when asked to "review my UI", "check accessibility", "audit design", "review UX", or "check my site against best practices".
license: MIT
metadata:
  author: vercel
  version: "1.0.0"
---

# Vercel Web Design Guidelines

A review tool that audits UI code against Vercel's Web Interface Guidelines, covering 100+ rules across accessibility, performance, responsive design, and UX patterns.

## When to Apply

Trigger this skill when the user asks to:
- "review my UI" / "audit my design"
- "check accessibility" / "review UX"
- "check my site against best practices"
- Review components, pages, or layouts for quality

## How to Use

1. Fetch the latest guidelines from the canonical source:
   `https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md`

2. Analyze the specified files or patterns against those rules.

3. Report findings in concise `file:line` format.

4. If no files are specified, ask the user which files or patterns to review before proceeding.

## Rule Areas Covered

The Web Interface Guidelines cover:

### Accessibility
- WCAG 2.1 AA compliance
- Color contrast ratios (4.5:1 minimum for text)
- Keyboard navigation completeness
- ARIA labels and semantic HTML
- Focus management and visible focus rings
- Alt text for all meaningful images

### Performance
- Core Web Vitals (LCP, CLS, FID/INP)
- Image optimization and lazy loading
- Font loading strategies (font-display: swap)
- CSS critical path optimization
- JavaScript bundle size limits
- Third-party script deferral

### Responsive Design
- Mobile-first approach
- Breakpoint consistency
- Touch target sizes (minimum 44×44px)
- Viewport meta tag configuration
- Safe area insets (iOS notch support)

### UX Patterns
- Loading and skeleton states
- Error state messaging
- Empty state design
- Form validation feedback
- Navigation consistency
- Interaction affordances

### Visual Consistency
- Design token usage (no hardcoded values)
- Spacing scale adherence (8dp grid)
- Typography scale consistency
- Icon consistency (SVG, not emojis)
- Color system compliance

## Output Format

Report findings as:
```
path/to/file.tsx:42 — [RULE] Description of the issue and suggested fix
```

Prioritize findings by severity: Critical → High → Medium → Low.
