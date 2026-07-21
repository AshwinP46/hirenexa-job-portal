/**
 * Application error reporting utility.
 * Logs errors to the console and can be extended to integrate with
 * any third-party error monitoring service (e.g. Sentry).
 */
export function reportError(
  error: unknown,
  context: Record<string, unknown> = {},
) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("[HireNexa Error]", message, { ...context, error });
}
