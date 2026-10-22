/** Arma un query string ignorando valores vacios. */
export function qs(
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "" || value === false) continue;
    search.set(key, String(value));
  }

  const result = search.toString();
  return result ? `?${result}` : "";
}
