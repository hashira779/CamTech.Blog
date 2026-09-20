# Authentication Specifications

## 1. Password Storage & Hashing
- **Algorithm**: Native `bcrypt` using cryptographically secure random salts.
- **Cost Factor**: Configured to work efficiently while preventing brute-force attack viability.
- **Buffer Safety**: Explicit UTF-8 byte encoding prevents string truncation anomalies.

## 2. JWT Token Issuance & Lifecycle
- **Payload**: User UUID (`sub`), role, expiration timestamp (`exp`).
- **Signature Algorithm**: `HS256` signed using `JWT_SECRET` (loaded securely from environment).
- **Expiration**: Access tokens expire in 24 hours.
- **Revocation**: Password change or admin account ban invalidates active sessions.

## 3. Login Throttling & Protection
- Sliding-window rate limiter limits `/api/v1/auth/login` to **5 attempts per minute per IP**.
- Failed attempts are recorded in `SecurityEvent` with `AUTH_FAILURE` type.
- Account lockout engages after 10 consecutive failures.
