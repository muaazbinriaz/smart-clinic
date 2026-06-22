import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import Chatbot from "@/components/Chatbot";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SmartClinic AI - Advanced Healthcare",
  description: "AI-powered clinic with smart appointments and trusted doctors.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Chatbot />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
