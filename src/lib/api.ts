import { NextResponse } from "next/server";
import createHttpError from "http-errors";
import { ZodError } from "zod";
import { logger } from "@/lib/logger";
import { db } from "@/models";

type Handler = (req: Request) => Promise<Response>;

/**
 * Thin wrapper: initializes the DB, maps known errors to HTTP responses.
 * Does not authenticate; routes that need a session call SessionService themselves.
 */
export function apiHandler(handler: Handler) {
  return async (req: Request): Promise<Response> => {
    const started = Date.now();
    try {
      if (!db.initialized) await db.initialize();
      const res = await handler(req);
      logger.info(
        { method: req.method, path: new URL(req.url).pathname, status: res.status, duration: Date.now() - started },
        "request",
      );
      return res;
    } catch (err: unknown) {
      if (err instanceof ZodError) {
        return NextResponse.json(
          { error: { message: "Validation error", issues: err.issues } },
          { status: 422 },
        );
      }
      if (createHttpError.isHttpError(err)) {
        logger.warn(
          { status: err.statusCode, message: err.message },
          "request error",
        );
        return NextResponse.json(
          { error: { message: err.message } },
          { status: err.statusCode },
        );
      }
      logger.error({ err: String(err) }, "Unhandled error");
      return NextResponse.json(
        { error: { message: "Internal server error" } },
        { status: 500 },
      );
    }
  };
}
