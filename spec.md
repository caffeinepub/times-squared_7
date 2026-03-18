# Times Squared

## Current State
All features through Step B2 are deployed. Data maps (`articles`, `userProfiles`, `organizations`, etc.) and counters (`articleIdCounter`, `orgIdCounter`, `inviteIdCounter`) were declared as `let` (non-stable), meaning they were wiped on every canister upgrade. `formatDate` did not handle empty `publicationDate` strings, causing "Invalid Date" to display for older articles.

## Requested Changes (Diff)

### Add
- `createdAt` fallback parameter to `formatDate` so articles without a `publicationDate` display their creation date instead of nothing

### Modify
- All data maps and counters in `main.mo` changed from `let`/`var` to `stable var` to persist across upgrades
- `formatDate` in `navigate.ts` updated to accept optional `createdAtNs: bigint` fallback and handle empty/invalid date strings gracefully
- `ArticleCard` and `ArticlePage` updated to pass `article.createdAt` as the fallback to `formatDate`

### Remove
- Nothing removed

## Implementation Plan
1. Convert all maps and counters to `stable var` in `main.mo`
2. Update `formatDate` to handle empty strings and accept nanosecond bigint fallback
3. Update call sites to pass `article.createdAt`
4. Validate and deploy
