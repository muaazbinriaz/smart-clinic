"use client";
import { useState } from "react";
import { signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2, Stethoscope } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Enter a valid email address.";
    }
    if (!password) {
      newErrors.password = "Password is required.";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      // FIX: sign out first to clear any stale session cookie from a
      // previously logged-in account. Without this, if the new credentials
      // fail (or email case mismatches), NextAuth keeps the old JWT and it
      // looks like the previous account is logging in.
      await signOut({ redirect: false });

      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(), // FIX: normalize before sending
        password,
        redirect: false,
      });

      if (res?.error) {
        toast.error("Invalid email or password.");
      } else {
        const { getSession } = await import("next-auth/react");
        const session = await getSession();
        if (session?.user?.role === "admin") {
          toast.success("Welcome back, Admin!");
          router.push("/admin");
        } else {
          toast.success("Welcome back! Redirecting to your dashboard.");
          router.push("/patient/dashboard");
        }
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="bg-blue-600 rounded-lg p-1.5">
            <Stethoscope className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            SmartClinic AI
          </span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h1 className="text-lg font-semibold text-gray-900 text-center mb-6">
            Sign in to your account
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                placeholder="you@example.com"
                className={`w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 outline-none ${
                  errors.email
                    ? "border-red-300 focus:ring-red-500"
                    : "border-slate-200 focus:ring-blue-500"
                }`}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password)
                    setErrors({ ...errors, password: undefined });
                }}
                placeholder="••••••••"
                className={`w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 outline-none ${
                  errors.password
                    ? "border-red-300 focus:ring-red-500"
                    : "border-slate-200 focus:ring-blue-500"
                }`}
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="text-blue-600 hover:underline font-medium"
            >
              Sign up
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Admin? Email: admin@smartclinic.com
        </p>
      </div>
    </div>
  );
}
