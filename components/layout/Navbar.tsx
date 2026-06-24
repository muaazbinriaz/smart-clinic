"use client";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  LogOut,
  LayoutDashboard,
  ChevronDown,
  Plus,
  Phone,
  MapPin,
  Clock,
  X,
  Menu,
  User,
  ChevronRight,
  Stethoscope,
  CalendarDays,
  HeartPulse,
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

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { href: "#services", label: "Services", icon: HeartPulse },
    { href: "#doctors", label: "Our Doctors", icon: Stethoscope },
    { href: "#testimonials", label: "Testimonials", icon: CalendarDays },
  ];

  return (
    <>
      {/* ── Sticky Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          {/* ── Logo ── */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-1.5 shadow-sm flex items-center justify-center">
              <Plus className="h-4 w-4 text-white" strokeWidth={3} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-base text-slate-900 tracking-tight">
                SmartClinic
              </span>
              <span className="text-[10px] text-blue-600 font-semibold tracking-widest uppercase">
                Rawalpindi
              </span>
            </div>
          </Link>

          {/* ── Desktop nav links ── */}
          <div className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="hover:text-blue-600 transition-colors"
              >
                {link.label}
              </a>
            ))}
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
                  <span className="text-slate-700 font-semibold">
                    {session.user.name?.split(" ")[0]}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-10 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-slate-100 mb-1">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Account
                      </p>
                    </div>
                    <Link
                      href={
                        session.user.role === "admin"
                          ? "/admin"
                          : "/patient/dashboard"
                      }
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      {session.user.role === "admin"
                        ? "Admin Panel"
                        : "My Dashboard"}
                    </Link>
                    <hr className="my-1 border-slate-100" />
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        signOut({ callbackUrl: "/" });
                      }}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 w-full text-left transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                )}

                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-5 shadow-sm font-semibold"
                  onClick={onBookClick}
                >
                  Book Now
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-sm text-slate-600 hover:text-blue-600 transition-colors font-semibold px-3 py-1.5"
                >
                  Sign in
                </Link>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-5 shadow-sm font-semibold"
                  onClick={onBookClick}
                >
                  Book Now
                </Button>
              </div>
            )}
          </div>

          {/* ── Mobile right side: avatar + hamburger/close ── */}
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
              className="flex items-center justify-center w-9 h-9 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
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

      {/* ── Mobile drawer: slides in from RIGHT, full width ─────────── */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          mobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer — full width, slides from right */}
      <div
        className={`fixed top-0 right-0 h-full w-full z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!mobileMenuOpen}
      >
        <div className="h-full bg-white flex flex-col overflow-hidden">
          {/* ── Drawer top bar ── */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
            <Link
              href="/"
              className="flex items-center gap-2.5"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-1.5 shadow-sm">
                <Plus className="h-4 w-4 text-white" strokeWidth={3} />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-bold text-base text-slate-900">
                  SmartClinic
                </span>
                <span className="text-[10px] text-blue-600 font-semibold tracking-widest uppercase">
                  Rawalpindi
                </span>
              </div>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>

          {/* ── User section (if logged in) ── */}
          {status !== "loading" && session && (
            <div className="px-5 py-4 bg-blue-50 border-b border-blue-100 shrink-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm">
                  {session.user.name?.[0]?.toUpperCase() ?? "U"}
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm leading-tight">
                    {session.user.name}
                  </p>
                  <p className="text-xs text-blue-600 font-semibold capitalize mt-0.5">
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
                className="flex items-center justify-between w-full bg-white rounded-xl px-4 py-3 text-sm font-semibold text-blue-700 shadow-sm border border-blue-100"
              >
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  {session.user.role === "admin"
                    ? "Admin Panel"
                    : "My Dashboard"}
                </div>
                <ChevronRight className="h-4 w-4 text-blue-400" />
              </Link>
            </div>
          )}

          {/* ── Nav links ── */}
          <div className="flex-1 overflow-y-auto py-2">
            <div className="px-4 pt-3 pb-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 mb-2">
                Navigation
              </p>
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-4 py-3.5 rounded-2xl text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-all group mb-1"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                        <Icon className="h-4 w-4 text-slate-500 group-hover:text-blue-600" />
                      </div>
                      <span className="font-semibold text-sm">
                        {link.label}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-400 transition-colors" />
                  </a>
                );
              })}
            </div>

            {/* ── Clinic info ── */}
            <div className="px-4 pt-3 pb-1 mt-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 mb-2">
                Contact
              </p>
              <div className="bg-slate-50 rounded-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                    <Phone className="h-3.5 w-3.5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Phone
                    </p>
                    <p className="text-sm font-bold text-slate-800">
                      03XX-XXXXXXX
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                    <MapPin className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Location
                    </p>
                    <p className="text-sm font-bold text-slate-800">
                      Committee Chowk, Rawalpindi
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                    <Clock className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Hours
                    </p>
                    <p className="text-sm font-bold text-slate-800">
                      Mon–Sat · 9 AM – 6 PM
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Sign in / Sign out ── */}
            <div className="px-4 pt-3 pb-2">
              {status === "loading" ? null : session ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl text-red-500 hover:bg-red-50 transition-all"
                >
                  <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
                    <LogOut className="h-4 w-4 text-red-500" />
                  </div>
                  <span className="font-semibold text-sm">Sign out</span>
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-all"
                >
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-slate-500" />
                  </div>
                  <span className="font-semibold text-sm">Sign in</span>
                </Link>
              )}
            </div>
          </div>

          {/* ── Bottom CTA ── */}
          <div className="p-5 border-t border-slate-100 shrink-0 pb-safe">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-14 text-base font-bold shadow-lg shadow-blue-200"
              onClick={() => {
                onBookClick();
                setMobileMenuOpen(false);
              }}
            >
              <CalendarDays className="h-5 w-5 mr-2" />
              Book Appointment
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
