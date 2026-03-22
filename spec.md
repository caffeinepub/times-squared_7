# Times Squared

## Current State
ArticleCard.tsx renders a domain overlay (`times-squared-51a.caffeine.xyz`) bottom-left on article card images inside the app. This was intended to mimic the Guardian link preview style but was incorrectly applied to in-app cards. index.html has no Open Graph or Twitter Card meta tags, causing shared article links on X to show "404 NOT FOUND" instead of a rich preview card.

## Requested Changes (Diff)

### Add
- Open Graph meta tags in `index.html`: `og:type`, `og:site_name`, `og:title`, `og:description`, `og:url`, `og:image`, `twitter:card`, `twitter:site`, `twitter:title`, `twitter:description`, `twitter:image`. Use the live app domain `https://times-squared-51a.caffeine.xyz` and publication branding.
- A static OG image: use a plain black card with the Times² wordmark text (can reference a generated asset or leave as absolute URL to a hosted image; use the live domain URL pattern).
- Populate the `<title>` tag with `Times²`.

### Modify
- `ArticleCard.tsx`: remove the ICP domain overlay div (the `{/* ICP domain overlay — Guardian style */}` block and its contents) entirely. No other changes to the card.

### Remove
- Domain overlay UI from in-app article cards.

## Implementation Plan
1. Edit `src/frontend/index.html`: add `<title>Times²</title>` and all OG/Twitter meta tags with static publication-level values.
2. Edit `src/frontend/src/components/ArticleCard.tsx`: delete the domain overlay absolute-positioned div from inside the image block.
