import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SmartClinic AI - Your Health, Our Priority",
  description: "Smart appointments, trusted doctors, AI-powered care.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-50">
        <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/90 backdrop-blur-sm dark:border-gray-800 dark:bg-black/90">
          <nav className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link href="/" className="text-xl font-bold text-blue-600">
              SmartClinic AI
            </Link>
            <div className="flex items-center space-x-6">
              <Link href="/" className="hover:text-blue-600 transition-colors">
                Home
              </Link>
              <Link href="#services" className="hover:text-blue-600 transition-colors">
                Services
              </Link>
              <Link href="#doctors" className="hover:text-blue-600 transition-colors">
                Doctors
              </Link>
              <Link href="#contact" className="hover:text-blue-600 transition-colors">
                Contact
              </Link>
            </div>
          </nav>
        </header>
        {children}
        <footer className="w-full bg-blue-600 py-8 text-white text-center mt-auto">
          <div className="container mx-auto px-4">
            <p>&copy; {new Date().getFullYear()} SmartClinic AI. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
