// proxy.ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/", "/login", "/signup"];
const ADMIN_ROUTES = ["/admin"];
const PATIENT_ROUTES = ["/patient"];

const PUBLIC_API_ROUTES = [
  "/api/appointments",
  "/api/appointments/slots",
  "/api/symptom-check",
  "/api/chat",
  "/api/doctors/ratings",
  "/api/doctors", // ← required for landing‑page doctor list
];

function isMatch(pathname: string, routes: string[]) {
  return routes.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

// ✅ No explicit type annotation on `req` – NextAuth infers it correctly
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // 1) Public routes – always allow
  if (
    isMatch(pathname, PUBLIC_ROUTES) ||
    isMatch(pathname, PUBLIC_API_ROUTES)
  ) {
    return NextResponse.next();
  }

  // 2) No session → redirect to login
  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = session.user?.role;

  // 3) Admin routes
  if (isMatch(pathname, ADMIN_ROUTES)) {
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/patient/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // 4) Patient routes
  if (isMatch(pathname, PATIENT_ROUTES)) {
    if (role !== "patient") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.next();
  }

  // 5) All other routes are allowed (but you can add more restrictions later)
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|images|api/auth).*)",
  ],
};
