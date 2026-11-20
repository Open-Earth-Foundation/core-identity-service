/** Minimal logger. Never pass emails or secrets into `fields`. */
export const logger = {
  info(fields: Record<string, unknown>, message: string) {
    console.info(JSON.stringify({ level: "info", message, ...fields }));
  },
  warn(fields: Record<string, unknown>, message: string) {
    console.warn(JSON.stringify({ level: "warn", message, ...fields }));
  },
  error(fields: Record<string, unknown>, message: string) {
    console.error(JSON.stringify({ level: "error", message, ...fields }));
  },
};
