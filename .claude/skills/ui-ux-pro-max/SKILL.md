---
name: ui-ux-pro-max
description: Professional UI/UX design intelligence for building production-quality interfaces across web and mobile. Provides 50+ design styles, 161 color palettes, 57 font pairings, and 99 UX guidelines prioritized by impact. Use when making any UI structure, visual design, or interaction pattern decisions.
license: MIT
metadata:
  author: nextlevelbuilder
  version: "1.0.0"
---

# UI/UX Pro Max — Design Intelligence

Professional design system covering React, Next.js, Vue, Svelte, React Native, Flutter, Tailwind, shadcn/ui, SwiftUI, iOS, and Android.

## When to Invoke

Use this skill for any task involving:
- UI structure or layout decisions
- Visual design choices (color, typography, spacing)
- Interaction patterns and UX flows
- Component design or refactoring for visual quality
- Accessibility review of visual elements
- Animation and transition design
- Navigation pattern selection
- Chart and data visualization

## Priority Rules (1 = Most Critical)

### Priority 1 — Accessibility (Critical)

- Minimum contrast ratio: **4.5:1** for body text, **3:1** for large text
- All interactive elements must be keyboard accessible
- Every image needs descriptive `alt` text
- Form inputs require visible `<label>` elements
- Focus rings must be visible at all times
- ARIA roles for custom interactive components

### Priority 2 — Touch & Interaction (Critical)

- Minimum touch target: **44×44px** (iOS HIG + Material)
- Provide haptic feedback for destructive actions
- Swipe gestures need visible affordances
- Long-press actions require progressive disclosure
- All tappable elements must show pressed state

### Priority 3 — Performance (High)

- Optimize images: WebP/AVIF, responsive sizes
- Lazy load below-fold images
- Minimize Cumulative Layout Shift (CLS < 0.1)
- Use `font-display: swap` for web fonts
- Target LCP < 2.5s

### Priority 4 — Style Selection (High)

- Maintain visual consistency across all screens
- Use SVG icons only — never emoji as UI icons
- Apply platform-native patterns (iOS vs Android vs Web)
- No mixed design system components (pick one)

### Priority 5 — Layout & Responsive (High)

- Mobile-first media queries
- **8dp spacing rhythm** (4, 8, 16, 24, 32, 48, 64px)
- `<meta name="viewport" content="width=device-width, initial-scale=1">`
- Respect safe areas (iOS notch, Android nav bar)
- Flexible containers, not fixed pixel widths

### Priority 6 — Typography & Color (Medium)

- Line height: 1.4–1.6 for body, 1.1–1.3 for headings
- Use semantic color tokens — no hardcoded hex values
- Dark mode must maintain same contrast ratios
- Maximum 2–3 font families per interface
- Font scale: modular ratio (1.25 or 1.333)

### Priority 7 — Animation (Medium)

- Duration: **150–300ms** for UI transitions
- Use `transform` and `opacity` only (GPU-accelerated)
- Ease-out for entering elements, ease-in for exiting
- Respect `prefers-reduced-motion` media query
- No decorative animations longer than 400ms

### Priority 8 — Forms & Feedback (Medium)

- All fields need visible labels (not just placeholders)
- Inline validation on blur, not just on submit
- Error messages must explain how to fix the issue
- Success states with clear confirmation
- Disabled states must still be legible

### Priority 9 — Navigation (High)

- Bottom navigation: max 5 items
- Deep linking support from launch
- Back navigation must always be available
- Active state clearly distinct from inactive
- Breadcrumbs for 3+ level hierarchies

### Priority 10 — Charts & Data (Low)

- Accessible color palettes (colorblind-safe)
- Tooltips on hover/tap for data points
- Responsive chart sizing
- Legends with color + pattern encoding
- Numerical formatting: locale-aware (pt-BR: `1.234,56`)

## Design System Generation

When asked to create a design system, provide:

1. **Color palette**: Primary, secondary, neutral, semantic (success/error/warning/info)
2. **Typography scale**: Display, heading, body, caption sizes with weights
3. **Spacing scale**: Based on 4px or 8px base unit
4. **Component tokens**: Border radius, shadow, transition defaults
5. **Motion tokens**: Duration and easing presets

## Pre-Delivery Checklist

Before completing any UI implementation:
- [ ] All text meets contrast ratio requirements
- [ ] All interactive elements have focus styles
- [ ] Images have alt text
- [ ] Touch targets ≥ 44px
- [ ] No hardcoded color values (use tokens)
- [ ] Spacing follows 8dp grid
- [ ] Tested at 320px, 768px, 1280px, 1440px widths
- [ ] Dark mode verified (if applicable)
- [ ] `prefers-reduced-motion` respected
