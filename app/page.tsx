"use client";
import { useState } from "react";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import MobileNav from "@/components/layout/MobileNav";
import HeroSection from "@/components/sections/HeroSection";
import ServicesSection from "@/components/sections/ServicesSection";
import DoctorsSection from "@/components/sections/DoctorsSection";
import SymptomCheckerSection from "@/components/sections/SymptomCheckerSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import BookingModal from "@/components/sections/BookingModal";

export default function Home() {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [initialDoctor, setInitialDoctor] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const openBooking = (doctorName = "") => {
    setInitialDoctor(doctorName);
    setBookingOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-white">
      <Navbar onBookClick={() => openBooking()} />
      <HeroSection
        onBookClick={() => openBooking()}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <ServicesSection />
      <DoctorsSection
        searchQuery={searchQuery}
        onBookClick={(name) => openBooking(name)}
      />
      <SymptomCheckerSection onBookClick={(name) => openBooking(name)} />
      <TestimonialsSection />
      <Footer />
      <MobileNav onBookClick={() => openBooking()} />
      <div className="md:hidden fixed bottom-20 right-4 z-30">
        <Button
          size="icon"
          className="bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg h-12 w-12"
          onClick={() => toast.info("Calling 03XX-XXXXXXX...")}
        >
          <Phone className="h-5 w-5" />
        </Button>
      </div>
      <BookingModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        initialDoctor={initialDoctor}
      />

      {/* ───── JSON‑LD STRUCTURED DATA (LocalBusiness / MedicalClinic) ─────
           Google uses this to display rich clinic information in search results.
           Replace the dummy data marked with "← REPLACE" with your real clinic info.
           This element is invisible to users. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "MedicalClinic",
            name: "SmartClinic AI",
            url: "https://smart-clinic-three-tau.vercel.app", // ← REPLACE with your actual domain if different
            logo: "https://smart-clinic-three-tau.vercel.app/logo.png", // ← Add a logo image in /public/logo.png
            description:
              "AI-powered clinic in Rawalpindi offering cardiology, general medicine, physiotherapy, and dermatology.",
            address: {
              "@type": "PostalAddress",
              streetAddress: "Committee Chowk, Main Road", // ← REPLACE with your real street address
              addressLocality: "Rawalpindi",
              addressRegion: "Punjab",
              postalCode: "46000", // ← REPLACE if necessary
              addressCountry: "PK",
            },
            telephone: "+92-300-1234567", // ← REPLACE with your real clinic phone
            openingHours: "Mo-Sa 09:00-18:00", // ← Adjust if your timings differ
            priceRange: "PKR 1500–3000",
            medicalSpecialty: [
              "Cardiology",
              "General Practice",
              "Dermatology",
              "Physical Therapy",
            ],
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "4.9", // ← Update later if you collect real ratings
              reviewCount: "200", // ← Update later with actual review count
            },
          }),
        }}
      />
    </div>
  );
}
