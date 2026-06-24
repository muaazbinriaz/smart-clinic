"use client";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  Menu,
  X,
  LogOut,
  User,
  LayoutDashboard,
  ChevronDown,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface NavbarProps {
  onBookClick: () => void;
}

export default function Navbar({ onBookClick }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { data: session, status } = useSession();

  return (
    <>
      {/* ── Sticky Header ── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          {/* ── Logo ── */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-1.5 shadow-sm flex items-center justify-center">
              <Plus className="h-4 w-4 text-white" strokeWidth={3} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-base text-slate-900 tracking-tight">
                MediBook
              </span>
              <span className="text-[10px] text-blue-600 font-medium tracking-wide uppercase">
                Rawalpindi
              </span>
            </div>
          </Link>

          {/* ── Desktop nav links ── */}
          <div className="hidden md:flex items-center gap-7 text-sm font-medium text-gray-600">
            <a
              href="#services"
              className="hover:text-blue-600 transition-colors"
            >
              Services
            </a>
            <a
              href="#doctors"
              className="hover:text-blue-600 transition-colors"
            >
              Doctors
            </a>
            <a
              href="#testimonials"
              className="hover:text-blue-600 transition-colors"
            >
              Testimonials
            </a>
          </div>

          {/* ── Desktop right side ── */}
          <div className="hidden md:flex items-center gap-3">
            {status === "loading" ? (
              <div className="h-8 w-24 bg-gray-100 rounded-full animate-pulse" />
            ) : session ? (
              <div className="relative flex items-center gap-3">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-sm"
                >
                  <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                    {session.user.name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <span className="text-slate-700 font-medium">
                    {session.user.name?.split(" ")[0]}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-10 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50">
                    <Link
                      href={
                        session.user.role === "admin"
                          ? "/admin"
                          : "/patient/dashboard"
                      }
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      {session.user.role === "admin"
                        ? "Admin Panel"
                        : "My Dashboard"}
                    </Link>
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        signOut({ callbackUrl: "/" });
                      }}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-red-500 hover:bg-red-50 w-full text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                )}

                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-5 shadow-sm"
                  onClick={onBookClick}
                >
                  Book Now
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors font-medium px-3 py-1.5"
                >
                  Sign in
                </Link>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-5 shadow-sm"
                  onClick={onBookClick}
                >
                  Book Now
                </Button>
              </div>
            )}
          </div>

          {/* ── Mobile right side: user avatar + hamburger ── */}
          <div className="md:hidden flex items-center gap-2">
            {status !== "loading" && session && (
              <Link
                href={
                  session.user.role === "admin"
                    ? "/admin"
                    : "/patient/dashboard"
                }
                className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-sm"
                title={session.user.name ?? "Dashboard"}
              >
                {session.user.name?.[0]?.toUpperCase() ?? "U"}
              </Link>
            )}
            <button
              className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </nav>
      </header>

      {/* ── Mobile menu: slide‑in drawer from left ── */}
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
          mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Sliding sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-72 max-w-[80vw] bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!mobileMenuOpen}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <Link
              href="/"
              className="flex items-center gap-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-1 shadow-sm">
                <Plus className="h-4 w-4 text-white" strokeWidth={3} />
              </div>
              <span className="font-bold text-slate-900">MediBook</span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation links */}
          <div className="flex-1 overflow-y-auto py-2">
            <a
              href="#services"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-5 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              Services
            </a>
            <a
              href="#doctors"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-5 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              Doctors
            </a>
            <a
              href="#testimonials"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-5 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              Testimonials
            </a>

            <div className="border-t border-slate-200 my-2 mx-4" />

            {/* User section */}
            {status === "loading" ? (
              <div className="px-5 py-3">
                <div className="h-10 bg-gray-100 rounded-full animate-pulse" />
              </div>
            ) : session ? (
              <>
                <div className="flex items-center gap-3 px-5 py-3">
                  <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {session.user.name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {session.user.name}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {session.user.role}
                    </p>
                  </div>
                </div>
                <Link
                  href={
                    session.user.role === "admin"
                      ? "/admin"
                      : "/patient/dashboard"
                  }
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-5 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {session.user.role === "admin"
                    ? "Admin Panel"
                    : "My Dashboard"}
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="flex items-center gap-2.5 px-5 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 w-full transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 transition-colors"
              >
                <User className="h-4 w-4" />
                Sign in
              </Link>
            )}
          </div>

          {/* Book now button (always visible) */}
          <div className="p-4 border-t border-slate-200">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-sm"
              onClick={() => {
                onBookClick();
                setMobileMenuOpen(false);
              }}
            >
              Book Appointment
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
