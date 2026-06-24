import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import Chatbot from "@/components/Chatbot";
import { SessionProvider } from "next-auth/react";
import PwaRegistration from "@/components/PwaRegistration";
import PageLoader from "@/components/PageLoader";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://smart-clinic-three-tau.vercel.app"),
  title: {
    default: "SmartClinic AI – Book Doctor Appointments in Rawalpindi",
    template: "%s | SmartClinic AI",
  },
  description:
    "SmartClinic AI makes it easy to book appointments with top doctors in Rawalpindi. AI-powered symptom checker, instant slot booking, and online confirmations.",
  keywords: [
    "clinic Rawalpindi",
    "doctor appointment Pakistan",
    "online booking clinic",
    "SmartClinic",
    "AI doctor",
  ],
  manifest: "/manifest.json",

  appleWebApp: {
    capable: true,
    title: "SmartClinic AI",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    type: "website",
    locale: "en_PK",
    url: "https://smart-clinic-three-tau.vercel.app",
    siteName: "SmartClinic AI",
    title: "SmartClinic AI – Book Doctor Appointments in Rawalpindi",
    description:
      "Book appointments with top doctors in Rawalpindi. AI symptom checker, instant slot blocking, email confirmations.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SmartClinic AI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SmartClinic AI",
    description: "Book doctor appointments in Rawalpindi with AI assistance.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  themeColor: "#2563EB",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <body
        className={`${plusJakartaSans.className} antialiased`}
        suppressHydrationWarning
      >
        <SessionProvider>
          <PageLoader />
          <PwaRegistration />
          {children}
          <Chatbot />
          <Toaster position="top-center" richColors />
        </SessionProvider>
      </body>
    </html>
  );
}
