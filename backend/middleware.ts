// backend/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const parseOrigins = () =>
  (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

export function middleware(req: NextRequest) {
  // Only CORS-protect API routes
  if (!req.nextUrl.pathname.startsWith("/api/")) return NextResponse.next();

  const origin = req.headers.get("origin");
  const allowList = parseOrigins();

  // Allow if server-to-server (no Origin), or allowList empty (dev), or exact match
  const isAllowed =
    !origin || allowList.length === 0 || allowList.includes(origin);

  // Preflight
  if (req.method === "OPTIONS") {
    const res = new NextResponse(null, { status: isAllowed ? 204 : 403 });
    if (origin && isAllowed) res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.headers.set(
      "Access-Control-Allow-Headers",
      req.headers.get("Access-Control-Request-Headers") || "Content-Type, Authorization, Accept"
    );
    if (isAllowed) res.headers.set("Access-Control-Allow-Credentials", "true");
    res.headers.set("Vary", "Origin");
    return res;
  }

  // Actual request
  if (isAllowed) {
    const res = NextResponse.next();
    if (origin) {
      res.headers.set("Access-Control-Allow-Origin", origin);
      res.headers.set("Access-Control-Allow-Credentials", "true");
      res.headers.set("Vary", "Origin");
    }
    return res;
  }

  // Block disallowed origins with a clear body
  return NextResponse.json(
    { error: "CORS: Origin not allowed", origin, allowList },
    { status: 403 }
  );
}

export const config = { matcher: ["/api/:path*"] };
