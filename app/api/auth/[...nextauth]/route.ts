import { handlers } from "@/lib/auth";

// Expose GET and POST for next-auth's built-in endpoints:
// GET  /api/auth/session
// GET  /api/auth/signin  (if using built-in UI)
// POST /api/auth/signin/credentials
// POST /api/auth/signout
// GET  /api/auth/csrf
// GET  /api/auth/providers
export const { GET, POST } = handlers;
