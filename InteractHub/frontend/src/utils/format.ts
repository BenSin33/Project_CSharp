/** Trả initials từ full name, tối đa 2 ký tự */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/** Format số lớn: 34500 → "34.5k", 1200000 → "1.2M" */
export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

/** Đảm bảo URL có http/https prefix */
export function ensureHttps(url: string): string {
  if (!url) return "";
  return url.startsWith("http") ? url : `https://${url}`;
}