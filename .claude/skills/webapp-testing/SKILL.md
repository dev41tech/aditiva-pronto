---
name: webapp-testing
description: Web application testing toolkit using Playwright for automating browser interactions and verifying frontend functionality. Use when writing tests, debugging UI behavior, verifying component states, testing user flows, or checking accessibility in a running application.
license: MIT
metadata:
  author: anthropics
  version: "1.0.0"
  source: github.com/anthropics/skills
---

# Webapp Testing

Automated browser testing for local web applications using Playwright. Tests user flows, component behavior, accessibility, and regressions.

## When to Apply

Use this skill for:
- Writing end-to-end tests for critical user flows
- Debugging visual regressions
- Verifying accessibility in a running app
- Checking responsive behavior across viewports
- Smoke testing after deployments

## Core Approach: Reconnaissance First

**Always follow this sequence:**
1. Navigate to the app and wait for network idle
2. Capture the rendered state (screenshot or DOM inspection)
3. Identify stable selectors
4. Execute automation logic

```python
# ✅ Always wait for network idle before inspecting
page.goto("http://localhost:3000")
page.wait_for_load_state('networkidle')
```

## Test Categories

### 1. Critical Path Testing (Always)

Test the golden path for every major feature:
- User registration and login
- Primary user action (purchase, form submission, etc.)
- Navigation between main sections
- Logout and session handling

### 2. Component State Testing

Verify all interactive states:
- Default / empty state
- Loading state
- Error state (network failure, validation)
- Success state
- Disabled state
- Hover and focus states

### 3. Accessibility Testing

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto("http://localhost:3000")
    
    # Check for accessibility violations
    violations = page.evaluate("""() => {
        // Run axe-core if available
        if (window.axe) {
            return axe.run().then(results => results.violations);
        }
        return [];
    }""")
```

### 4. Responsive Testing

Test at standard breakpoints:
```python
viewports = [
    {"width": 375, "height": 812, "name": "mobile"},   # iPhone SE
    {"width": 768, "height": 1024, "name": "tablet"},   # iPad
    {"width": 1280, "height": 720, "name": "desktop"},  # Laptop
    {"width": 1920, "height": 1080, "name": "wide"},    # Wide monitor
]

for viewport in viewports:
    page.set_viewport_size({"width": viewport["width"], "height": viewport["height"]})
    page.screenshot(path=f"screenshots/{viewport['name']}.png")
```

### 5. Regression Testing

Take screenshots before and after changes:
```python
# Capture baseline
page.screenshot(path="baseline/homepage.png")

# After changes, compare
page.screenshot(path="current/homepage.png")
# Use pixel diff tool to compare
```

## Selector Strategy (Priority Order)

1. **Role-based** (most resilient): `page.get_by_role("button", name="Submit")`
2. **Label-based**: `page.get_by_label("Email address")`
3. **Test ID**: `page.get_by_test_id("submit-button")` + `data-testid` attribute
4. **Text content**: `page.get_by_text("Sign in")`
5. **CSS/XPath** (last resort): `page.locator(".submit-btn")`

## Common Patterns

### Form Testing
```python
page.fill('[aria-label="Email"]', 'test@example.com')
page.fill('[aria-label="Password"]', 'securepassword')
page.click('[type="submit"]')
page.wait_for_url("**/dashboard")
assert page.title() == "Dashboard"
```

### API Mocking
```python
page.route("**/api/users", lambda route: route.fulfill(
    status=200,
    content_type="application/json",
    body='[{"id": 1, "name": "Test User"}]'
))
```

### Screenshot on Failure
```python
try:
    page.click("#submit")
    page.wait_for_selector(".success-message")
except Exception as e:
    page.screenshot(path="failure-screenshot.png")
    raise e
```

## Running Tests

```bash
# Install Playwright
npm install -D @playwright/test
npx playwright install

# Run tests
npx playwright test

# Run with UI (visual debugger)
npx playwright test --ui

# Run specific test
npx playwright test tests/auth.spec.ts

# Generate test from recording
npx playwright codegen http://localhost:3000
```

## Test File Structure

```
tests/
  auth/
    login.spec.ts
    register.spec.ts
  flows/
    checkout.spec.ts
    onboarding.spec.ts
  components/
    button.spec.ts
    modal.spec.ts
  accessibility/
    wcag.spec.ts
  visual/
    homepage.spec.ts
```
