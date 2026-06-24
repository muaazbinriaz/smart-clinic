"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Phone,
  Stethoscope,
  ShieldCheck,
  Search,
  Sparkles,
  ArrowRight,
} from "lucide-react";

function useCountUp(end: number, duration = 2000, start = true) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [end, duration, start]);
  return count;
}

interface HeroSectionProps {
  onBookClick: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export default function HeroSection({
  onBookClick,
  searchQuery,
  onSearchChange,
}: HeroSectionProps) {
  const [visibleCounters, setVisibleCounters] = useState(false);
  const counterRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisibleCounters(true);
      },
      { threshold: 0.3 },
    );
    if (counterRef.current) observer.observe(counterRef.current);
    return () => observer.disconnect();
  }, []);

  const patientsCount = useCountUp(10000, 2500, visibleCounters);
  const yearsCount = useCountUp(15, 1500, visibleCounters);
  const ratingCount = useCountUp(49, 1800, visibleCounters);

  return (
    <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-200 via-transparent to-transparent opacity-30" />
      <div className="relative z-10 grid md:grid-cols-2 gap-10 items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-md rounded-full px-4 py-1.5 text-sm font-medium text-blue-700 shadow-sm">
            <Sparkles className="h-4 w-4" /> AI-Powered Healthcare
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
            Your Health, <br />
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              Our Priority
            </span>
          </h1>
          <p className="text-lg text-gray-600 max-w-md">
            Smart appointments, trusted doctors, and AI-powered care – all from
            your phone.
          </p>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search doctors, services..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
            />
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-6 rounded-2xl shadow-xl shadow-blue-200"
              onClick={onBookClick}
            >
              Book Appointment <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <a
              href="tel:+923001234567"
              className="inline-flex items-center justify-center gap-2 text-lg px-8 py-2 rounded-2xl border-2 border-gray-200 bg-white hover:bg-gray-50 transition-colors font-medium text-gray-700"
            >
              <Phone className="h-5 w-5 text-green-600" /> Call Now
            </a>
          </div>

          {/* Counters */}
          <div
            ref={counterRef}
            className="flex flex-wrap gap-6 text-sm text-gray-500 pt-4"
          >
            <span className="font-semibold text-gray-800">
              ✅ {patientsCount.toLocaleString()}+ Happy Patients
            </span>
            <span className="font-semibold text-gray-800">
              ⭐ {(ratingCount / 10).toFixed(1)} Rating
            </span>
            <span className="flex items-center gap-1 font-semibold text-gray-800">
              <ShieldCheck className="h-4 w-4 text-blue-600" /> {yearsCount}+
              Years Exp
            </span>
          </div>
        </div>

        {/* Illustration */}
        <div className="relative hidden md:block">
          <div className="w-full h-96 bg-gradient-to-br from-blue-100 to-blue-200 rounded-[3rem] flex items-center justify-center border border-white/50 shadow-2xl shadow-blue-200/50">
            <Stethoscope className="h-48 w-48 text-blue-500/80" />
          </div>
        </div>
      </div>
    </section>
  );
}
