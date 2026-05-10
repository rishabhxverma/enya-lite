import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function jsonError(message: string, status = 500, extra?: unknown) {
  return NextResponse.json({ error: message, extra }, { status });
}

export async function parseBody<T>(req: Request, schema: ZodSchema<T>) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    raw = {};
  }
  try {
    return schema.parse(raw);
  } catch (err) {
    if (err instanceof ZodError) {
      throw new Response(
        JSON.stringify({
          error: "Invalid request body",
          issues: err.issues,
        }),
        { status: 400 }
      );
    }
    throw err;
  }
}

export function safeParse<T>(schema: ZodSchema<T>, raw: unknown): T | null {
  const r = schema.safeParse(raw);
  if (!r.success) {
    console.warn("[safeParse] schema mismatch", r.error.issues);
    return null;
  }
  return r.data;
}
