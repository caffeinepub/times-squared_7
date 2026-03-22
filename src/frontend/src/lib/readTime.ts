export function getReadTime(bodyHtml: string): string {
  const tmp = document.createElement("div");
  tmp.innerHTML = bodyHtml;
  const text = tmp.textContent || tmp.innerText || "";
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}
