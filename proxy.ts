import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/", "/login", "/signup"];
const PROTECTED_ROUTES = ["/admin", "/patient"];

const PUBLIC_API_ROUTES = [
  "/api/appointments/slots",
  "/api/appointments", // POST only — GET is guarded in the route handler itself
  "/api/symptom-check",
  "/api/chat",
  "/api/doctors/ratings",
  "/api/doctors",
  "/api/auth/signup",
];

function isMatch(pathname: string, routes: string[]) {
  return routes.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Always allow public routes and public API routes
  if (
    isMatch(pathname, PUBLIC_ROUTES) ||
    isMatch(pathname, PUBLIC_API_ROUTES)
  ) {
    return NextResponse.next();
  }

  // For protected routes, only check: is there a session at all?
  // Role-based redirects are handled by server layouts (admin/layout.tsx, patient/layout.tsx)
  if (isMatch(pathname, PROTECTED_ROUTES) && !session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|images|api/auth).*)",
  ],
};
