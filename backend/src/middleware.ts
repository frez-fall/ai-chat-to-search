// backend/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const parseOrigins = () =>
  (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map(s => s.trim())
<<<<<<< HEAD:backend/src/_middleware.disable.ts
    .map(s => s.trim())
    .filter(Boolean);

export function middleware(req: NextRequest) {
  // Only CORS-protect API routes
=======
    .filter(Boolean);

export function middleware(req: NextRequest) {
  // ✅ ensure this code runs for every request and then self-limit to /api/*
>>>>>>> parent of 1193e8c (update middleware for cors):backend/src/middleware.ts
  if (!req.nextUrl.pathname.startsWith("/api/")) return NextResponse.next();

  const origin = req.headers.get("origin");
  const allowList = parseOrigins();

<<<<<<< HEAD:backend/src/_middleware.disable.ts
  // Allow if server-to-server (no Origin), or allowList empty (dev), or exact match
  const isAllowed =
    !origin || allowList.length === 0 || allowList.includes(origin);

  // Preflight
=======
  // temporary debug — remove after verifying in logs
  console.log("CORS origin:", origin, "allow:", allowList);

  const isAllowed =
    !origin || allowList.length === 0 || allowList.includes(origin);

>>>>>>> parent of 1193e8c (update middleware for cors):backend/src/middleware.ts
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
<<<<<<< HEAD:backend/src/_middleware.disable.ts
=======
    res.headers.set("x-cors-mw", "1"); // debug header
>>>>>>> parent of 1193e8c (update middleware for cors):backend/src/middleware.ts
    return res;
  }

  // Actual request
<<<<<<< HEAD:backend/src/_middleware.disable.ts
  // Actual request
=======
>>>>>>> parent of 1193e8c (update middleware for cors):backend/src/middleware.ts
  if (isAllowed) {
    const res = NextResponse.next();
    if (origin) {
      res.headers.set("Access-Control-Allow-Origin", origin);
      res.headers.set("Access-Control-Allow-Credentials", "true");
      res.headers.set("Vary", "Origin");
      res.headers.set("x-cors-mw", "1"); // debug header
    }
    return res;
  }

<<<<<<< HEAD:backend/src/_middleware.disable.ts
  // Block disallowed origins with a clear body
=======
>>>>>>> parent of 1193e8c (update middleware for cors):backend/src/middleware.ts
  return NextResponse.json(
    { error: "CORS: Origin not allowed", origin, allowList },
    { status: 403 }
  );
}

<<<<<<< HEAD:backend/src/_middleware.disable.ts
export const config = { matcher: ["/api/:path*"] };
=======
// 👇 run for ALL paths so we're sure middleware executes
export const config = { matcher: ["/:path*"] };
>>>>>>> parent of 1193e8c (update middleware for cors):backend/src/middleware.ts
