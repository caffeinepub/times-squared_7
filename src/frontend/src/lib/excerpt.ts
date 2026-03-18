import type { Article } from "../backend.d";

/**
 * Strip HTML tags from a string and return plain text.
 * Used as a fallback when article.excerpt contains raw HTML or garbled content.
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Return a clean plain-text excerpt for an article.
 * Uses article.excerpt if it looks clean; otherwise extracts from bodyContent.
 * This handles articles saved before the backend excerpt fix was deployed.
 */
export function getExcerpt(article: Article, maxLen = 200): string {
  const ex = article.excerpt ?? "";

  // If excerpt looks garbled (starts with '[', contains '<', or is empty), rebuild from body
  const looksGarbled =
    ex === "" || ex.trimStart().startsWith("[") || ex.includes("<");

  const source = looksGarbled ? stripHtml(article.bodyContent ?? "") : ex;

  return source.length > maxLen ? `${source.slice(0, maxLen)}…` : source;
}
