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

  const origin = req.headers.get("origin");
  const allowList = parseOrigins();

  // allow if no origin (e.g., server-to-server) OR allow-list empty (dev) OR origin is listed
  const isAllowed = !origin || allowList.length === 0 || allowList.includes(origin);

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
  const res = NextResponse.next();
  if (origin && isAllowed) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Access-Control-Allow-Credentials", "true");
    res.headers.set("Vary", "Origin");
    return res;
  }

  // Block disallowed origins with a clear error
  return NextResponse.json(
    { error: "CORS: Origin not allowed", origin, allowList },
    { status: 403 }
  );
}

export const config = { matcher: ["/api/:path*"] };
