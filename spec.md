# Times Squared

## Current State

The app is a privacy-first on-chain editorial news platform on ICP. Steps 1, 2, A, and B1 are all live:
- Public reading experience (articles, orgs, author profiles, search, read aloud)
- Admin drawer with article editor, org management, user role assignment
- Scoped admin permissions: super admin (first login, global), regular admins own their orgs
- Step B1: Admins can invite users to orgs by principal ID; invited users see an accept/decline banner

Article type currently has: id, title, author, authorPrincipal, organizationId, publicationDate, heroImageBlobId, heroImageBlobId2, bodyContent, excerpt, isPublished, isFeatured, tags, createdAt.

There is no draft/submission workflow for org members. Only org owners and super admin can create/manage articles.

## Requested Changes (Diff)

### Add
- `SubmissionStatus` variant type: `#draft | #pending_review | #rejected`
- `ArticleSubmission` record type: `{ articleId: Nat; submissionStatus: SubmissionStatus; rejectionNote: ?Text; submittedAt: ?Int }`
- Stable Map `articleSubmissions: Map<Nat, ArticleSubmission>` (separate from articles Map to preserve upgrade compatibility)
- `submitArticleForReview(articleId)`: caller must be authorPrincipal; sets status to #pending_review
- `approveArticleSubmission(articleId)`: caller must be org owner or super admin; publishes the article
- `rejectArticleSubmission(articleId, note: ?Text)`: caller must be org owner or super admin; sets status to #rejected with optional note
- `getMySubmissions()`: returns articles where authorPrincipal == caller that have a submission entry
- `getPendingSubmissions(orgId)`: org owner sees articles in their org with #pending_review status
- Contributor path in `createArticle`: if caller is org member (not admin/org owner), allow creation and auto-create submission entry with #draft status; article starts unpublished
- `updateArticle`: allow original author (authorPrincipal == caller) to edit their own article; if article was rejected, reset submission status to #draft on update
- Frontend: "My Drafts" section in NavDrawer for users who are org members
- Frontend: Draft list view showing article title, submission status, rejection note (if any), and actions (edit, submit for review, revise after rejection)
- Frontend: Admin panel "Submissions" tab showing pending articles for their org, with approve/reject actions; reject opens a dialog to enter optional note
- Frontend: Article form accessible to contributors (creates a draft in their org)

### Modify
- `unpublishArticle`: only the original author (authorPrincipal == caller) OR super admin can unpublish; regular org admins cannot unpublish articles they didn't write
- `getAllArticles` (admin view): now also returns contributor-submitted articles in their orgs (pending review, rejected, published) -- this is already the case since they're in the articles Map
- `getOrgArticles`: show all statuses including pending submissions for org owners

### Remove
- Nothing removed

## Implementation Plan

1. Backend: Add `SubmissionStatus`, `ArticleSubmission` types and `articleSubmissions` stable Map
2. Backend: Add `submitArticleForReview`, `approveArticleSubmission`, `rejectArticleSubmission`, `getMySubmissions`, `getPendingSubmissions`
3. Backend: Update `createArticle` to allow org members; update `updateArticle` for author self-edit + reset rejected status; update `unpublishArticle` for author-only
4. Frontend: Add `getMySubmissions` and submission management functions to backend bindings
5. Frontend: Add `MySubmissionsPanel` component -- contributor's draft/submission list with status badges, edit, submit, and revise actions
6. Frontend: Add `SubmissionsPanel` component for admins -- pending submissions list with approve/reject actions
7. Frontend: Update `ArticleListPanel` to include a Submissions tab for admins
8. Frontend: Update `NavDrawer` to show "My Drafts" entry for org members
9. Frontend: Update `ArticleFormPanel` to allow contributors to create/edit their own drafts (scoped to their org)
