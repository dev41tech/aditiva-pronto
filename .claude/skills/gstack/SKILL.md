---
name: gstack
description: Full AI engineering team framework by Garry Tan (YC). Provides 23 specialized roles: CEO strategy, designer, engineering manager, QA, security auditor, doc engineer, and more. Use as a meta-skill to coordinate comprehensive development reviews, design consultations, and quality gates.
license: MIT
metadata:
  author: Garry Tan
  version: "1.0.0"
  source: github.com/garrytan/gstack
---

# GStack — Full AI Engineering Team

GStack turns Claude Code into a full AI engineering team with 23 specialized slash-command skills organized by function.

## When to Apply

Use GStack skills when you need:
- Strategic product review (`/office-hours`, `/plan-ceo-review`)
- Design system work (`/design-consultation`, `/design-review`)
- Code quality gates (`/review`, `/qa`)
- Security audits (`/cso`)
- Deployment workflows (`/ship`, `/land-and-deploy`)
- Performance benchmarking (`/benchmark`)

## Available Skills by Category

### Planning & Strategy
| Command | Description |
|---------|-------------|
| `/office-hours` | Product interrogation with forcing questions |
| `/plan-ceo-review` | Strategic scope assessment (4 modes) |
| `/plan-eng-review` | Architecture and edge case review |
| `/plan-design-review` | Design quality audit |
| `/plan-devex-review` | Developer experience evaluation |

### Design
| Command | Description |
|---------|-------------|
| `/design-consultation` | Complete design system creation |
| `/design-shotgun` | Visual variant exploration |
| `/design-html` | Production-ready HTML generation |
| `/design-review` | Live design audit with fixes |

### Development & Testing
| Command | Description |
|---------|-------------|
| `/review` | Code quality and bug detection |
| `/qa` | Browser testing with auto-fixes |
| `/qa-only` | Bug reporting without code changes |
| `/investigate` | Root-cause debugging methodology |
| `/cso` | Security audits (OWASP + STRIDE) |

### Deployment & Monitoring
| Command | Description |
|---------|-------------|
| `/ship` | Test execution and PR creation |
| `/land-and-deploy` | Merge and production verification |
| `/canary` | Post-deploy error monitoring |
| `/benchmark` | Performance baseline tracking |
| `/document-release` | Automated documentation updates |

### Utilities & Coordination
| Command | Description |
|---------|-------------|
| `/browse` | Real browser automation |
| `/pair-agent` | Multi-AI agent coordination |
| `/codex` | Cross-model second opinions |
| `/retro` | Weekly engineering retrospectives |
| `/learn` | Session memory management |

## Priority Notes

GStack is an auxiliary skill — it does NOT override:
- Trail of Bits Security (security decisions)
- AccessLint (accessibility requirements)
- Vercel React Best Practices (React/Next.js patterns)

GStack's `/cso` security skill defers to Trail of Bits Security for in-depth audits.

## Installation

```bash
# Clone GStack setup
git clone https://github.com/garrytan/gstack ~/.gstack
cd ~/.gstack && ./install.sh

# Or via Claude Code plugin (if available)
/plugin marketplace add garrytan/gstack
```

## Requirements

- Claude Code
- Git
- Node.js (Windows)
- Bun v1.0+ (preferred runtime)
