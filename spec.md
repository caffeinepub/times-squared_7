# Times Squared

## Current State

The frontend has most Step 4 polish already in place from prior builds:
- Article cards have staggered fade-in animations (motion.article with delay)
- Loading skeleton (ArticleCardSkeleton) is used in HomePage
- ICP domain URL overlay already exists on article card images (Guardian style)
- Typography in prose-editorial already has line-height 1.85

Missing: estimated read time on article cards.

## Requested Changes (Diff)

### Add
- Estimated read time display on article cards (word count / 200 wpm, rounded up, e.g. "3 min read") shown in the byline row alongside author and date

### Modify
- Article card byline: add read time after date, separated by a dot divider
- Admin drawer spacing: tighten padding from p-5/p-6 to p-4, reduce gaps slightly
- Button hover transitions: ensure all interactive buttons have `transition-all duration-200`
- Article body typography: verify line-height and paragraph spacing in prose-editorial class

### Remove
- Nothing

## Implementation Plan

1. Add `getReadTime(body: string): string` utility in `src/frontend/src/lib/readTime.ts` that strips HTML, counts words, divides by 200, rounds up, returns e.g. `"3 min read"`
2. Import and use in `ArticleCard.tsx` — add read time to byline row
3. Tighten admin drawer padding/spacing in any admin panel components
4. Verify hover transitions on key interactive elements
