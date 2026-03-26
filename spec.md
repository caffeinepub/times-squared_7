# Times Squared

## Current State
Version 35 live. Bug sweep previously identified several issues.

## Requested Changes (Diff)

### Add
- Hard-set super admin principal `nvjwr-ru5jj-szayf-tdyeh-4aeph-cfp5n-upac4-7sx3f-osptw-jk3rq-yqe` at stable var initialization
- `claimSuperAdmin` now accepts the pre-set principal calling again to register their `accessControlState` role (needed on fresh canisters/drafts)

### Modify
- `stable var superAdmin` initialized with known principal instead of `null`
- All `.sort()` calls missing comparators now use `Article.compare`, `Comment.compare`, or `Puzzle.compare`
- `AccessControl.isAdmin` replaced with `isAdminOrSuperAdmin` in `createOrg`, `getMyOrgs`, `createArticle` (null org), `updateArticle`, `publishArticle`, `deleteArticle`, `getAllArticles` so super admin works without needing `accessControlState` role on fresh canisters
- `approveArticleSubmission` now removes the submission record after publishing (fixes contributors seeing their approved article still as pending)
- `HeroImage` in `HomePage.tsx` fixed: `useState(() => {})` replaced with `useEffect(() => {}, [blobId])`

### Remove
- Nothing removed

## Implementation Plan
1. Backend: principal hard-set, sort comparators, auth checks, submission status fix
2. Frontend: HeroImage useEffect fix
3. Validate and deploy
