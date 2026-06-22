import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/", "/login", "/signup"];
const ADMIN_ROUTES = ["/admin"];
const PATIENT_ROUTES = ["/patient"];

// API routes that are public (no auth required)
const PUBLIC_API_ROUTES = [
  "/api/appointments", // POST for guest booking, GET for admin
  "/api/appointments/slots", // public slot check
  "/api/symptom-check", // public AI feature
  "/api/chat", // public chatbot
  "/api/doctors/ratings", // ← added for live rating display
  "/api/doctors",
];

function isMatch(pathname: string, routes: string[]) {
  return routes.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

export default auth(
  (req: NextRequest & { auth: Awaited<ReturnType<typeof auth>> }) => {
    const { pathname } = req.nextUrl;
    const session = req.auth;

    // Always allow public pages
    if (isMatch(pathname, PUBLIC_ROUTES)) return NextResponse.next();

    // Always allow public API routes (guests need these)
    if (isMatch(pathname, PUBLIC_API_ROUTES)) return NextResponse.next();

    // Require auth for everything else
    if (!session) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const role = session.user?.role;

    if (isMatch(pathname, ADMIN_ROUTES) && role !== "admin") {
      return NextResponse.redirect(
        new URL(
          role === "doctor" ? "/doctor/dashboard" : "/patient/dashboard",
          req.url,
        ),
      );
    }

    if (isMatch(pathname, PATIENT_ROUTES) && role !== "patient") {
      return NextResponse.redirect(
        new URL(role === "admin" ? "/admin" : "/doctor/dashboard", req.url),
      );
    }

    return NextResponse.next();
  },
);

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|images|api/auth).*)",
  ],
};
