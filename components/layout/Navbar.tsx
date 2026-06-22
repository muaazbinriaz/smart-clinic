"use client";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Stethoscope, Menu, X, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface NavbarProps {
  onBookClick: () => void;
}

export default function Navbar({ onBookClick }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-blue-100/50 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-blue-600 rounded-lg p-1.5">
            <Stethoscope className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            SmartClinic AI
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <a href="#services" className="hover:text-blue-600 transition-colors">
            Services
          </a>
          <a href="#doctors" className="hover:text-blue-600 transition-colors">
            Doctors
          </a>
          <a
            href="#testimonials"
            className="hover:text-blue-600 transition-colors"
          >
            Testimonials
          </a>

          {session ? (
            <div className="flex items-center gap-3">
              <Link
                href={
                  session.user.role === "admin"
                    ? "/admin"
                    : "/patient/dashboard"
                }
                className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium"
              >
                <User className="h-4 w-4" />
                {session.user.name?.split(" ")[0]}
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-1 text-gray-400 hover:text-red-500 transition-colors text-xs"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                Sign in
              </Link>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6"
                onClick={onBookClick}
              >
                Book Appointment
              </Button>
            </div>
          )}

          {session && (
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6"
              onClick={onBookClick}
            >
              Book Appointment
            </Button>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-gray-700"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/90 backdrop-blur-xl border-t px-4 py-4 space-y-3">
          <a
            href="#services"
            className="block text-sm font-medium text-gray-700"
          >
            Services
          </a>
          <a
            href="#doctors"
            className="block text-sm font-medium text-gray-700"
          >
            Doctors
          </a>
          <a
            href="#testimonials"
            className="block text-sm font-medium text-gray-700"
          >
            Testimonials
          </a>
          {session ? (
            <>
              <Link
                href={
                  session.user.role === "admin"
                    ? "/admin"
                    : "/patient/dashboard"
                }
                className="block text-sm font-medium text-blue-600"
              >
                My Dashboard
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="block text-sm text-red-500"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="block text-sm font-medium text-gray-700"
            >
              Sign in
            </Link>
          )}
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => {
              onBookClick();
              setMobileMenuOpen(false);
            }}
          >
            Book Appointment
          </Button>
        </div>
      )}
    </header>
  );
}
