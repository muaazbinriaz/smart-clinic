"use client";
import { useState } from "react";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-white pb-20 md:pb-0">
      <Navbar onBookClick={() => openBooking()} />
      <HeroSection
        onBookClick={() => openBooking()}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <ServicesSection searchQuery={searchQuery} />
      <DoctorsSection
        searchQuery={searchQuery}
        onBookClick={(name) => openBooking(name)}
      />
      <SymptomCheckerSection onBookClick={(name) => openBooking(name)} />
      <TestimonialsSection />
      <Footer />

      <MobileNav onBookClick={() => openBooking()} bookingOpen={bookingOpen} />

      <div className="md:hidden fixed bottom-20 right-4 z-30">
        <a
          href="tel:+923001234567"
          className="bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg h-12 w-12 flex items-center justify-center transition-colors"
          aria-label="Call clinic"
        >
          <Phone className="h-5 w-5" />
        </a>
      </div>

      <BookingModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        initialDoctor={initialDoctor}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "MedicalClinic",
            name: "MediBook Rawalpindi",
            url: "https://smart-clinic-three-tau.vercel.app",
            logo: "https://smart-clinic-three-tau.vercel.app/logo.png",
            description:
              "AI-powered clinic in Rawalpindi offering cardiology, general medicine, physiotherapy, and dermatology.",
            address: {
              "@type": "PostalAddress",
              streetAddress: "Committee Chowk, Main Road",
              addressLocality: "Rawalpindi",
              addressRegion: "Punjab",
              postalCode: "46000",
              addressCountry: "PK",
            },
            telephone: "+92-300-1234567",
            openingHours: "Mo-Sa 09:00-18:00",
            priceRange: "PKR 1500–3000",
            medicalSpecialty: [
              "Cardiology",
              "General Practice",
              "Dermatology",
              "Physical Therapy",
            ],
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "4.9",
              reviewCount: "200",
            },
          }),
        }}
      />
    </div>
  );
}
