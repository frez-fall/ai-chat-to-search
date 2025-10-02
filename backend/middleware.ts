// backend/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const parseOrigins = () =>
  (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

export function middleware(req: NextRequest) {
  // only affect API routes
  if (!req.nextUrl.pathname.startsWith("/api/")) return NextResponse.next();

  const origin = req.headers.get("origin") || "";
  const allow = parseOrigins();
  const allowAny = allow.length === 0;           // if empty, allow all (useful while testing)
  const isAllowed = allowAny || allow.includes(origin);

  // Preflight
  if (req.method === "OPTIONS") {
    const res = new NextResponse(null, { status: 204 });
    if (isAllowed) res.headers.set("Access-Control-Allow-Origin", allowAny ? "*" : origin);
    res.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.headers.set(
      "Access-Control-Allow-Headers",
      req.headers.get("Access-Control-Request-Headers") || "Content-Type, Authorization, Accept"
    );
    res.headers.set("Access-Control-Allow-Credentials", "true");
    res.headers.set("Vary", "Origin"); // caching safety
    return res;
  }

  // Actual request
  const res = NextResponse.next();
  if (isAllowed) {
    res.headers.set("Access-Control-Allow-Origin", allowAny ? "*" : origin);
    res.headers.set("Access-Control-Allow-Credentials", "true");
    res.headers.set("Vary", "Origin");
  }
  return res;
}

export const config = { matcher: ["/api/:path*"] };
