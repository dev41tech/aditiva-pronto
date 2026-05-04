---
name: trail-of-bits-security
description: Security audit and vulnerability detection for web applications. Covers OWASP Top 10, supply chain risks, static analysis, authentication flaws, and code review with security focus. HIGHEST PRIORITY — always applies over other skills when security conflicts arise. Trigger for any security review, auth implementation, dependency audit, or sensitive data handling.
license: Apache-2.0
metadata:
  author: Trail of Bits
  version: "1.0.0"
  source: github.com/trailofbits/skills
---

# Trail of Bits Security

Production security audit toolkit for web applications. This skill has the HIGHEST priority — security requirements override all other design and implementation preferences.

## Priority Override Rule

When this skill conflicts with any other skill:
1. **Security > Everything else**
2. An insecure-but-beautiful UI must be made secure first
3. An insecure-but-fast implementation must be made secure first
4. Performance optimizations that introduce security holes are rejected

## When to Apply

Always apply when:
- Implementing authentication or authorization
- Handling user input (forms, URL params, file uploads)
- Making API calls or handling responses
- Storing sensitive data (passwords, tokens, PII)
- Reviewing code with third-party dependencies
- Implementing payment or financial flows
- Any "security review" request

## OWASP Top 10 Checklist

### A01 — Broken Access Control
- Verify authorization on every server action and API route
- Never trust client-provided user IDs
- Implement least-privilege (users get minimum needed access)
- Server-side session validation on every protected route
- No IDOR (insecure direct object references) — always validate ownership

### A02 — Cryptographic Failures
- HTTPS everywhere (no mixed content, HSTS header)
- Never store passwords in plaintext — use bcrypt/Argon2 (min cost 12)
- JWT secrets ≥ 256-bit random strings, stored in env vars
- Sensitive data encrypted at rest (PII, financial data)
- No MD5 or SHA1 for security purposes

### A03 — Injection
- **SQL**: Always use parameterized queries or ORM — never string interpolation
- **XSS**: Sanitize all user input, use DOMPurify for HTML, encode output
- **Command injection**: Never pass user input to shell commands
- **Path traversal**: Validate and sanitize file paths
- React's JSX auto-escapes — but `dangerouslySetInnerHTML` must sanitize with DOMPurify

### A04 — Insecure Design
- Threat model before implementing sensitive features
- Fail securely (deny by default, not allow by default)
- Separation of concerns: don't mix auth logic with business logic
- Rate limiting on all auth endpoints (login, password reset, OTP)

### A05 — Security Misconfiguration
- Remove debug endpoints before production
- No secrets in source code (use `.env`, not hardcoded)
- Security headers: `CSP`, `X-Frame-Options`, `X-Content-Type-Options`, `HSTS`
- CORS configured explicitly, not `*` in production
- Error messages must not expose stack traces to users

### A06 — Vulnerable and Outdated Components
- Run `npm audit` / `pnpm audit` regularly
- No packages with known CVEs in production
- Lock file committed and reviewed on dependency updates
- Minimal dependency surface — prefer built-ins when possible

### A07 — Identity and Authentication Failures
- MFA available for sensitive operations
- Secure session invalidation on logout
- Account lockout after N failed attempts
- Password reset tokens: single-use, time-limited (15 min max), random
- OAuth flows: validate `state` parameter, use PKCE

### A08 — Software and Data Integrity Failures
- Verify integrity of downloaded dependencies (lockfile, checksums)
- Validate webhook signatures before processing
- Subresource Integrity (SRI) for external CDN assets
- No eval() or Function() with user input

### A09 — Security Logging and Monitoring
- Log authentication events (success + failure)
- Log authorization failures
- Log admin actions
- No sensitive data in logs (passwords, tokens, PII)
- Structured logging format for SIEM compatibility

### A10 — Server-Side Request Forgery (SSRF)
- Validate and allowlist URLs before server-side fetching
- Block requests to private IP ranges (10.x, 172.16.x, 192.168.x, 127.x)
- Disable redirects in server-side HTTP clients by default

## Next.js / React Specific

```typescript
// ✅ Server Action with auth check
"use server"
async function updateUser(formData: FormData) {
  const session = await getSession();
  if (!session?.userId) throw new Error("Unauthorized");
  // validate ownership
  const userId = formData.get("userId");
  if (userId !== session.userId) throw new Error("Forbidden");
  // proceed...
}

// ✅ Input sanitization
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(userHtml);

// ❌ Never
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

## Environment Variables

```bash
# ✅ Required security env vars
NEXTAUTH_SECRET=<256-bit-random-string>
DATABASE_URL=<connection-string>
# Never commit .env — only .env.example with placeholders
```

## Supply Chain Risk Audit

For any new dependency, verify:
1. Package age and download count (npm stats)
2. Maintainer reputation and activity
3. No typosquatting (check spelling carefully)
4. License compatibility
5. No postinstall scripts that run arbitrary code

## Installation Note

For full advanced security scanning (static analysis, SARIF output, variant analysis):
```
/plugin marketplace add trailofbits/skills
/plugin install static-analysis@trailofbits-skills
/plugin install differential-review@trailofbits-skills
/plugin install supply-chain-risk-auditor@trailofbits-skills
```
