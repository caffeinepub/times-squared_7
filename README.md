# TIMES²

**A privacy-first, on-chain editorial news publication built on the Internet Computer.**

Live: https://times-squared-51a.caffeine.xyz/  
GitHub: https://github.com/reversegasmodel-oss/times-squared  
X: [@TimesSquared](https://x.com/TimesSquared)

---

## What is Times²?

Times² is a fully on-chain editorial publication. Every article, author profile, and organizational record is stored directly on the Internet Computer blockchain using Motoko smart contracts. There are no servers, no databases, no cloud infrastructure, and no external service dependencies of any kind.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Blockchain | Internet Computer Protocol (ICP) |
| Smart Contracts | Motoko |
| Frontend | React + TypeScript + Tailwind CSS |
| Authentication | Internet Identity |
| Hosting | ICP Canister (fully on-chain) |
| Fonts | Self-hosted |

---

## Architecture

All application state is stored in `stable var` hash maps in the Motoko backend, ensuring full persistence across canister upgrades:

- **Articles** — content, metadata, tags, featured/pinned state
- **Author Profiles** — bios, display names, avatars (keyed by ICP principal)
- **Organizations** — editorial sections with slugs and banners
- **Memberships & Invites** — contributor access control per org
- **Submissions** — draft review and approval workflow

Authentication is handled exclusively through **Internet Identity**. No email addresses, passwords, or third-party OAuth providers are used. Users authenticate with their device credentials and retain full control of their identity.

---

## Privacy

Times² achieves a perfect score on all six **Native Stack Privacy (NSP)** principles:

1. **No Tracking** — No analytics, pixels, or telemetry
2. **No External Dependencies** — All assets self-hosted, no third-party requests on page load
3. **On-Chain Storage** — All data stored in ICP stable memory
4. **Identity Sovereignty** — Internet Identity only; users own their credentials
5. **No Behavioral Data** — No session tracking, read history, or reader-side logging
6. **Censorship Resistance** — Fully on ICP, no centralized takedown vectors

Full privacy policy: https://times-squared-51a.caffeine.xyz/privacy  
Technical whitepaper: https://times-squared-51a.caffeine.xyz/whitepaper

---

## Editorial Model

- **Super Admin** — First authenticated user; global control; cannot be demoted
- **Admin** — Manages orgs they create; invites contributors; approves submissions
- **Contributor** — Submits drafts for editorial review; only original author can unpublish
- **Guest** — Read-only public access

---

## Funding

Self-funded. No venture capital, no institutional backing, no cloud provider dependencies.

---

## Founder

**ReverseGasModel** — Founder & Editor-in-Chief  
[@ReverseGasModel](https://x.com/ReverseGasModel) on X  
ICP Principal: `nvjwr-ru5jj-szayf-tdyeh-4aeph-cfp5n-upac4-7sx3f-osptw-jk3rq-yqe`

Pseudonymous solo founder. Crypto journalist and ICP ecosystem builder. Coverage focus: infrastructure failures, false on-chain claims, press freedom, privacy architecture, and ICP ecosystem.

---

## Source Code

This repository contains the full source code for the Times² canister and frontend. Contributions and audits welcome.

```
git clone https://github.com/reversegasmodel-oss/times-squared
```

---

© Times² · On-Chain
