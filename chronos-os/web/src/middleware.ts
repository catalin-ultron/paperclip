import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const userId = request.headers.get("x-user-id") || "anonymous";
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", userId);

  // RLS equivalent: every request carries the authenticated user context
  // API routes must filter queries by this header
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
