# Times Squared

## Current State
Full backend with flat admin model -- any admin can manage all articles, orgs, and users. Super admin concept does not exist. OrgSection has no owner tracking. Article has no org-owner scoping.

## Requested Changes (Diff)

### Add
- `superAdmin: ?Principal` stable variable -- set to the first principal that ever calls `claimSuperAdmin` or on first login; cannot be demoted by anyone
- `orgOwner: Principal` field on `OrgSection` -- records which admin created the org
- `getSuperAdmin()` query -- returns the current super admin principal (nullable)
- `claimSuperAdmin()` -- callable only once; sets the caller as super admin and also grants them admin role
- `getMyOrgs()` -- returns orgs owned by the caller
- `getOrgArticles(orgId)` -- admin-scoped query returning all (including unpublished) articles for an org the caller owns

### Modify
- `createOrg` -- records `caller` as `orgOwner` in the new org
- `updateOrg` -- requires caller to be super admin OR the org's owner
- `deleteOrg` -- requires caller to be super admin OR the org's owner
- `createArticle` -- requires caller to be super admin OR admin who owns the specified org (if organizationId is provided)
- `updateArticle` -- requires caller to be super admin OR admin who owns the article's org
- `deleteArticle` -- requires caller to be super admin OR admin who owns the article's org
- `publishArticle` -- requires caller to be super admin OR admin who owns the article's org
- `unpublishArticle` -- requires caller to be super admin OR admin who owns the article's org
- `featureArticle` / `unfeatureArticle` -- same scoping as publish
- `getAllArticles` -- super admin sees all; regular admin sees only articles in their orgs
- Role assignment (`setRole` / equivalent) -- super admin can assign any role; regular admin cannot promote to admin or demote a super admin
- On demotion of an admin, their orgs and articles remain live and visible (NSP compliant)

### Remove
- Nothing removed

## Implementation Plan
1. Add `superAdmin` stable variable (`var superAdmin : ?Principal = null`)
2. Add helper `isSuperAdmin(caller)` using the stable variable
3. Add `claimSuperAdmin()` -- sets super admin once, also calls into AccessControl to grant admin role
4. Add `orgOwner` field to `OrgSection` type
5. Update `createOrg` to capture `caller` as `orgOwner`
6. Add `isOrgOwner(caller, orgId)` helper
7. Add `isArticleOrgOwner(caller, articleId)` helper -- resolves article -> orgId -> org owner
8. Scope all org mutation functions with super admin OR org owner check
9. Scope all article mutation functions with super admin OR article-org owner check
10. Update `getAllArticles` to filter by owned orgs for non-super admins
11. Add `getMyOrgs()` query
12. Add `getOrgArticles(orgId)` query with ownership check
13. Update role assignment to prevent non-super-admins from granting admin role or demoting super admin
14. Update frontend admin drawer to show only owned orgs/articles for non-super admins; super admin sees everything
