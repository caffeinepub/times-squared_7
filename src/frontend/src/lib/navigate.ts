export function navigate(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

/**
 * Format a publication date string for display.
 * Falls back to createdAt (nanosecond bigint) if publicationDate is empty or invalid.
 */
export function formatDate(dateStr: string, createdAtNs?: bigint): string {
  const opts: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  if (dateStr && dateStr.trim() !== "") {
    const d = new Date(`${dateStr.slice(0, 10)}T12:00:00Z`);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", opts);
    }
  }

  // Fallback: convert nanosecond timestamp to ms
  if (createdAtNs !== undefined) {
    const ms = Number(createdAtNs / 1_000_000n);
    const d = new Date(ms);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", opts);
    }
  }

  return "";
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}
