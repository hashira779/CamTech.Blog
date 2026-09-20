# Google AdSense Readiness & Monetization Architecture

Section 62 Guidelines: The entire platform is architected to comply with Google Publisher Policies and monetization readiness requirements.

---

## 1. Compliance Checklist Verified

- [x] **Original Content**: Every news article contains original editorial summaries, key points, and why-it-matters context rather than copied text.
- [x] **Clear Navigation**: Top bar, breadcrumbs, search, and comprehensive categorized footer.
- [x] **Required Policy Pages**:
  - `/about`: Who operates the site and its purpose.
  - `/editorial-policy`: Sourcing, AI rules, verification standards.
  - `/corrections-policy`: Transparent error reporting mechanism.
  - `/privacy`: Data handling and user consent.
  - `/terms`: Terms of service.
  - `/cookie-policy`: Cookie disclosures.
  - `/advertising`: Monetization transparency.
  - `/contact`: Dedicated press and newsroom contact channels.
- [x] **Author Bylines**: Clear author profiles on every story.
- [x] **Working Tools**: Calculators and utilities work 100% client-side with zero deceptive buttons or fake download traps.
- [x] **Dormant AdSlot Abstraction**: Ad slots are managed via `AdSlot` with `AdProvider`. Ads are initially disabled until formal account approval is completed.

---

## 2. Activating AdSense in Production

1. Set `ADSENSE_ENABLED=true` in `apps/api/.env` and `apps/web/.env.local`.
2. Insert your approved Google Publisher ID into `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID="ca-pub-XXXXXXXXXXXXXXXX"`.
3. AdSlots (`HOME_TOP`, `ARTICLE_MID`, `DISCOVERY_MID`, etc.) will render Google Ads tags with zero layout shift.
