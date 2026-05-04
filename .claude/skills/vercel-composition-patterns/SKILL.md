---
name: vercel-composition-patterns
description: React composition patterns for building flexible, maintainable components that scale. Use when refactoring components with boolean prop proliferation, building reusable component libraries, or designing component APIs. Avoids prop drilling through compound components, render props, and context providers.
license: MIT
metadata:
  author: vercel
  version: "1.0.0"
---

# Vercel React Composition Patterns

Guidance on scaling React components through composition rather than prop proliferation, from Vercel Engineering.

## When to Apply

Use this skill when:
- A component has 3+ boolean props controlling variations
- Building reusable component libraries
- Designing flexible component APIs
- Refactoring tightly coupled components
- Creating compound components (like Radix UI patterns)

## Rule Categories

### 1. Component Architecture (HIGH)

**Avoid boolean prop proliferation:**
```tsx
// ❌ Avoid
<Button primary large withIcon disabled loading />

// ✅ Use composition
<Button variant="primary" size="lg">
  <Button.Icon><SpinnerIcon /></Button.Icon>
  Submit
</Button>
```

**Compound component structure:**
- Use `Component.SubComponent` pattern for related UI
- Expose context internally, not via props
- Let consumers compose the pieces they need

**Children-based composition over render props:**
```tsx
// ✅ Prefer
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
</Card>
```

### 2. State Management (MEDIUM)

**Provider-based state encapsulation:**
- Lift shared state into context providers
- Expose minimal API surface via context
- Use context for dependency injection, not global state

**Decoupling implementation:**
- Components should not know about siblings
- Parent orchestrates, children consume
- Use callbacks for upward communication

### 3. Implementation Patterns (MEDIUM)

**Explicit variant components over boolean modes:**
```tsx
// ❌ Avoid
<Alert type="error" /> / <Alert type="warning" />

// ✅ Prefer
<Alert.Error /> / <Alert.Warning />
```

**Slot pattern for flexible content areas:**
```tsx
<Layout
  header={<PageHeader />}
  sidebar={<Navigation />}
>
  <MainContent />
</Layout>
```

**Polymorphic components with `as` prop:**
```tsx
<Text as="h1" variant="display">Title</Text>
<Text as="p" variant="body">Paragraph</Text>
```

### 4. React 19 APIs (MEDIUM)

- Use `ref` directly as a prop (no more `forwardRef`)
- Use `use()` hook for context and promises
- Prefer Server Components for static composition
- Use `useOptimistic` for optimistic UI updates

## Anti-Patterns to Avoid

- Components longer than 200 lines (split them)
- Props passed 3+ levels deep (use context)
- Boolean flags that create mutually exclusive states
- Duplicated logic across sibling components
- `any` type on component props
