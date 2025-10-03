// backend/src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const parseOrigins = () =>
  (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

export function middleware(req: NextRequest) {
  // ✅ ensure this code runs for every request and then self-limit to /api/*
  if (!req.nextUrl.pathname.startsWith("/api/")) return NextResponse.next();

  const origin = req.headers.get("origin");
  const allowList = parseOrigins();

  // temporary debug — remove after verifying in logs
  console.log("CORS origin:", origin, "allow:", allowList);

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
    res.headers.set("x-cors-mw", "1"); // debug header
    return res;
  }

  // Actual request
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

  return NextResponse.json(
    { error: "CORS: Origin not allowed", origin, allowList },
    { status: 403 }
  );
}

// 👇 run for ALL paths so we're sure middleware executes
export const config = { matcher: ["/:path*"] };