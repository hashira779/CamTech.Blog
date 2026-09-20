# Dependency & Software Supply-Chain Security

## 1. Supply-Chain Hardening
In compliance with OWASP Top 10:2025 (A06: Vulnerable and Outdated Components):
- **Lockfile Enforcement**: All builds require committed `package-lock.json` and pinned Python versions.
- **Automated Audits**: `npm audit` and `pip-audit` execute in CI pipelines. Commits introducing high or critical CVEs fail the build immediately.
- **Minimal Dependencies**: Third-party libraries are evaluated for maintenance health, license compatibility, and bundle size before adoption.

## 2. Pinned Engine Requirements
- **Node.js**: >= 20.x LTS
- **Python**: >= 3.12 (production target 3.14)
- **Container Base**: Minimal Alpine or Debian slim images with non-root runtime users.
