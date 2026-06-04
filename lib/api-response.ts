import { NextResponse } from "next/server";

/** Consistent API response envelope used across every route. */
export type ApiSuccess<T> = { success: true; data: T };
export type ApiError = { success: false; error: string };

export function ok<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function fail(error: string, status = 400): NextResponse<ApiError> {
  return NextResponse.json({ success: false, error }, { status });
}

/**
 * Typed application error. Routes throw these; `handleRoute` maps them to a clean
 * JSON error with the right status code so we never leak stack traces.
 */
export class AppError extends Error {
  constructor(
    message: string,
    public status: number = 400,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const Errors = {
  unauthorized: () => new AppError("You must be logged in to do that.", 401),
  forbidden: () => new AppError("You do not have permission to perform this action.", 403),
  notFound: (what = "Resource") => new AppError(`${what} not found.`, 404),
  badRequest: (msg: string) => new AppError(msg, 400),
};

/**
 * Wraps a route handler in a try/catch that produces the standard error envelope.
 * Zod errors become 400s; AppErrors use their status; everything else is a 500.
 */
export async function handleRoute<T>(fn: () => Promise<NextResponse<T>>): Promise<NextResponse> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof AppError) {
      return fail(err.message, err.status);
    }
    // ZodError has an `issues` array — surface the first message.
    if (err && typeof err === "object" && "issues" in err && Array.isArray((err as { issues: unknown[] }).issues)) {
      const issues = (err as { issues: { message: string }[] }).issues;
      return fail(issues[0]?.message ?? "Invalid request data.", 400);
    }
    console.error("[API] Unhandled error:", err);
    return fail("Something went wrong. Please try again.", 500);
  }
}
