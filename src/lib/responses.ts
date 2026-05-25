import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonError(error: unknown, status = 400) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: error.issues[0]?.message ?? "הנתונים שהוזנו לא תקינים",
        issues: error.issues,
      },
      { status },
    );
  }

  if (error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json({ error: "משהו השתבש. נסו שוב בעוד רגע" }, { status });
}

export function assertAdmin(request: Request) {
  const apiKey = process.env.ADMIN_API_KEY;

  if (!apiKey) {
    return;
  }

  if (request.headers.get("x-admin-api-key") !== apiKey) {
    throw new Error("אין הרשאה לבצע את הפעולה הזו");
  }
}
