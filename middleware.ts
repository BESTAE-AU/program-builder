import { NextResponse, type NextRequest } from "next/server";

// A simple password for the hosted app, so the AI routes (and the API key behind them)
// can't be used by anyone who finds the address. Set APP_PASSWORD in the host's
// environment variables; with no APP_PASSWORD set (local use) the app is open.
export function middleware(req: NextRequest) {
  const password = process.env.APP_PASSWORD;
  if (!password) return NextResponse.next();
  const header = req.headers.get("authorization") ?? "";
  if (header.startsWith("Basic ")) {
    const [, given] = atob(header.slice(6)).split(":");
    if (given === password) return NextResponse.next();
  }
  return new NextResponse("Password required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Unit Builder", charset="UTF-8"' },
  });
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
