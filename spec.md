# Times Squared

## Current State

The app has the following public routes: `/`, `/article/:id`, `/privacy`, `/login`, `/author/:principal`, `/org/:slug`, `/section/:tag`. The hamburger menu (NavDrawer) includes Home and Privacy as navigation links. There are no Team or Whitepaper pages.

## Requested Changes (Diff)

### Add
- `/team` page: static page displaying founder/team information for ReverseGasModel
- `/whitepaper` page: static page covering Times² technical architecture, NSP compliance, on-chain data model, privacy guarantees
- Two new nav links in the hamburger menu: "Team" and "Whitepaper" alongside existing Home/Privacy links
- README.md in root: comprehensive GitHub README for web3privacy Explorer listing requirements

### Modify
- `App.tsx`: add routes for `/team` and `/whitepaper`
- `NavDrawer.tsx`: add Team and Whitepaper links to the navLinks array

### Remove
- Nothing removed

## Implementation Plan

1. Create `src/frontend/src/pages/TeamPage.tsx` with founder profile for ReverseGasModel
2. Create `src/frontend/src/pages/WhitepaperPage.tsx` with full technical write-up
3. Update `App.tsx` to handle `/team` and `/whitepaper` routes
4. Update `NavDrawer.tsx` navLinks to include Team and Whitepaper
5. Create `README.md` in workspace root with full documentation for GitHub

### Team Page Content
- Name: ReverseGasModel
- Role: Founder & Editor-in-Chief
- X: @ReverseGasModel
- ICP Principal: nvjwr-ru5jj-szayf-tdyeh-4aeph-cfp5n-upac4-7sx3f-osptw-jk3rq-yqe
- Bio: Pseudonymous solo founder. Built Times² no VC funding, no cloud infrastructure. Writer, architect, and operator of the only news publication that scores a perfect six on the Native Stack Privacy framework. Background: Crypto journalist and ICP ecosystem builder. Coverage focus: infrastructure failures, false on-chain claims, press freedom, privacy architecture, and ICP ecosystem.
- Publication X: @TimesSquared

### Whitepaper Page Content
- Architecture overview: ICP + Motoko + React + Internet Identity
- On-chain data model: all state in stable var maps
- NSP six-principle compliance breakdown
- Role hierarchy: super admin, admin, contributor, guest
- Contributor workflow: invite, submit, approve/reject
- Upgrade persistence guarantees
- Privacy guarantees: no tracking, no analytics, no external calls

### README Content
- Project title and mission
- Live app: https://times-squared-51a.caffeine.xyz/
- GitHub: https://github.com/reversegasmodel-oss/times-squared
- X: @TimesSquared
- Tech stack section
- Architecture summary
- NSP compliance
- Funding: self-funded, no VC, no cloud infrastructure
- Founder: ReverseGasModel with ICP principal
- Links to whitepaper page and privacy page
