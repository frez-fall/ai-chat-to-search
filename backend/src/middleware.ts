// backend/src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const parseOrigins = () =>
  (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export function middleware(req: NextRequest) {
  // Run for all routes but only handle /api/*
  if (!req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // :mag_right: Debug: see the incoming Origin and the allow-list the server sees
  console.log("CORS origin:", req.headers.get("origin"), "allow:", parseOrigins());

  const origin = req.headers.get("origin");
  const allowList = parseOrigins();

  // Allow if: no Origin (server-to-server), or allow-list empty, or exact match
  const isAllowed = !origin || allowList.length === 0 || allowList.includes(origin);

  // --- Preflight (OPTIONS) ---
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

    // :test_tube: Debug header to prove middleware executed
    res.headers.set("x-cors-mw", "1");
    return res;
  }

  // --- Actual request (GET/POST/...) ---
  if (isAllowed) {
    const res = NextResponse.next();
    if (origin) {
      res.headers.set("Access-Control-Allow-Origin", origin);
      res.headers.set("Access-Control-Allow-Credentials", "true");
      res.headers.set("Vary", "Origin");
    }

    // :test_tube: Debug header to prove middleware executed
    res.headers.set("x-cors-mw", "1");
    return res;
  }

  // Disallowed origin
  return NextResponse.json(
    { error: "CORS: Origin not allowed", origin, allowList },
    { status: 403 }
  );
}

// :gear: Force middleware to run for all paths; we self-filter to /api/* above
export const config = { matcher: ["/:path*"] };

