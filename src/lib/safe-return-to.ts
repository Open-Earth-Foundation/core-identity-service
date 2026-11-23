/**
 * Accept only same-origin path redirects (blocks open redirects).
 */
export function safeReturnTo(
  value: string | null | undefined,
  fallback = "/account/security/",
): string {
  if (
    value &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.startsWith("/\\")
  ) {
    return value;
  }
  return fallback;
}
