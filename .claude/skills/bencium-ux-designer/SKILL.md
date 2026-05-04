---
name: bencium-innovative-ux-designer
description: Comprehensive UX design system based on Bencium's design philosophy. Provides innovative, production-grade UI/UX design with emphasis on distinctive visual identity, accessibility, and systematic design thinking. Use for design direction, component design, visual systems, and creative UI decisions.
license: MIT
metadata:
  author: bencium
  version: "1.0.0"
  source: github.com/bencium/bencium-claude-code-design-skill
---

# Bencium Innovative UX Designer

A comprehensive UX design guide emphasizing distinctive, production-grade interfaces that avoid generic aesthetics, built on systematic design thinking principles.

## When to Apply

Use for:
- Establishing visual identity and design direction
- Designing new components or pages with personality
- Making typography, color, and spacing decisions
- UI critiques and design audits
- Creative direction when the user wants something memorable

## Design Thinking Protocol

Before any design work, answer four essential questions:
1. **Purpose** — What problem does this solve? Who uses it?
2. **Tone** — What aesthetic direction? (See below)
3. **Constraints** — Technical requirements, brand guidelines, platforms
4. **Differentiation** — What will users remember about this?

## Aesthetic Directions (Pick One, Commit Fully)

Choose from these eleven directions and execute with precision:
- **Brutally Minimal** — Only what's essential. Every element earns its place.
- **Maximalist** — Controlled density, rich layering, confident excess
- **Retro-Futuristic** — Nostalgic tech meets forward-looking vision
- **Organic/Natural** — Biomorphic shapes, earth tones, breathing space
- **Luxury/Refined** — Restraint, precision, expensive materials as metaphor
- **Playful/Toy-like** — Rounded, colorful, delightful micro-interactions
- **Editorial/Magazine** — Typographic hierarchy, white space, visual rhythm
- **Brutalist/Raw** — Exposed structure, intentional roughness, pure function
- **Art Deco/Geometric** — Mathematical precision, decorative geometry
- **Soft/Pastel** — Gentle palettes, gentle shadows, approachable warmth
- **Industrial/Utilitarian** — Form follows function, monospaced, data-dense

## Visual Standards

### Typography
- Maximum 2–3 typefaces per interface
- Pair a distinctive display font with a refined body font
- **Avoid**: Inter, Roboto, Space Grotesk, Arial, system fonts
- Use mathematical scale relationships (1.25 or 1.333 ratio)
- Line height: body 1.5–1.6, headings 1.1–1.2

### Color
- Two required palettes: **neutral base** (4–5 colors) + **accent** (1–3 colors)
- **Avoid**: Generic SaaS blue (#3B82F6), purple gradients, teal/coral combos
- Unexpected pairings: terracotta + charcoal, sage + navy, cream + forest
- Use CSS custom properties for all color values
- Semantic tokens: `--color-primary`, `--color-surface`, `--color-on-surface`

### Spacing & Layout
- 4px base unit, multiples: 4, 8, 12, 16, 24, 32, 48, 64px
- Generous negative space creates perceived quality
- Mathematical spatial relationships — not arbitrary gaps
- Consider asymmetry and unexpected grid-breaking as intentional choices

### Implementation Stack
- shadcn/ui components as the base layer
- Tailwind CSS for utilities
- @phosphor-icons/react for icons (consistent, accessible)
- CSS custom properties for design tokens
- Motion/Framer Motion for animations where needed

## Interaction Principles

1. **Direct manipulation** — Elements respond immediately to input
2. **Immediate feedback** — Never leave users wondering if it worked
3. **Consistent behavior** — Same action always produces same result
4. **Forgiveness** — Undo/auto-save wherever possible
5. **Progressive disclosure** — Show complexity only when needed

## Anti-Patterns (Never Do)

- Glass morphism as primary design element (it's overdone)
- Apple design mimicry without purpose
- Purple gradients on white backgrounds
- Animations that don't serve a purpose
- Mixing design systems (Material + shadcn, etc.)
- Purely decorative elements that harm accessibility

## Accessibility Integration

Every design decision must pass:
- Contrast ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text
- Focus states visible and styled to match the aesthetic
- Touch targets ≥ 44×44px
- `prefers-reduced-motion` respected for all animations
- Semantic HTML structure (no `div` soup)
