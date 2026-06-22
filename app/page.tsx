"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Phone,
  Stethoscope,
  Heart,
  Activity,
  Star,
  Menu,
  X,
  ChevronRight,
  Clock,
  ShieldCheck,
  Search,
  XCircle,
  MessageCircle,
  Send,
  User,
  Calendar,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from "lucide-react";

// ─── DATA ────────────────────────────────────
const doctors = [
  {
    name: "Dr. Ahmed",
    specialty: "Cardiologist",
    img: "https://ui-avatars.com/api/?name=Dr+Ahmed&size=128&background=0D6EFD&color=fff&bold=true",
    exp: "15+ years",
    rating: 4.9,
    bio: "Fellowship in Interventional Cardiology. Expert in angioplasty and heart failure management.",
  },
  {
    name: "Dr. Husnain Ali",
    specialty: "General Physician",
    img: "https://ui-avatars.com/api/?name=Dr+Husnain+Ali&size=128&background=0D6EFD&color=fff&bold=true",
    exp: "10+ years",
    rating: 4.8,
    bio: "Specialist in diabetes, hypertension, and preventive medicine.",
  },
  {
    name: "Dr. Ali",
    specialty: "Dermatologist",
    img: "https://ui-avatars.com/api/?name=Dr+Ali&size=128&background=0D6EFD&color=fff&bold=true",
    exp: "12+ years",
    rating: 4.7,
    bio: "Cosmetic dermatology, laser treatments, and skin surgery.",
  },
  {
    name: "Dr. Fatima",
    specialty: "Physiotherapist",
    img: "https://ui-avatars.com/api/?name=Dr+Fatima&size=128&background=0D6EFD&color=fff&bold=true",
    exp: "8+ years",
    rating: 4.9,
    bio: "Rehabilitation specialist, manual therapy, and sports injuries.",
  },
];

const services = [
  { icon: Heart, title: "Cardiology", desc: "ECG, Echo, Stress Tests" },
  {
    icon: Stethoscope,
    title: "General Medicine",
    desc: "Check‑ups, Chronic Disease",
  },
  { icon: Activity, title: "Physiotherapy", desc: "Pain Management, Rehab" },
  { icon: Heart, title: "Dermatology", desc: "Skin, Hair, Laser" },
];

const testimonials = [
  {
    name: "Ayesha K.",
    text: "SmartClinic AI saved me hours. Booked in 30 seconds and the doctor was excellent.",
    rating: 5,
    video: null,
  },
  {
    name: "Mohammad R.",
    text: "The AI chatbot answered all my questions at 2 AM. Highly recommended.",
    rating: 5,
    video: null,
  },
  {
    name: "Fatima S.",
    text: "Best clinic in Rawalpindi. Modern, clean, and caring doctors.",
    rating: 4,
    video: null,
  },
];

const timeSlots = [
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
];

// ─── ANIMATED COUNTER (VISIBLE ONLY) ─────────
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

// ─── MAIN COMPONENT ─────────────────────────
export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredDoctors, setFilteredDoctors] = useState(doctors);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [visibleCounters, setVisibleCounters] = useState(false);
  const counterRef = useRef(null);

  // Intersection Observer for counters
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
  const ratingCount = useCountUp(4.9, 1800, visibleCounters);

  // Search filter
  useEffect(() => {
    const q = searchQuery.toLowerCase();
    setFilteredDoctors(
      doctors.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.specialty.toLowerCase().includes(q),
      ),
    );
  }, [searchQuery]);

  // Testimonial autoplay
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Booking submit
  const handleBookingSubmit = async () => {
    const name = (document.getElementById("booking-name") as HTMLInputElement)
      ?.value;
    const phone = (document.getElementById("booking-phone") as HTMLInputElement)
      ?.value;
    if (!name || !phone || !selectedDoctor || !selectedDate || !selectedTime) {
      toast.error("Please fill all required fields.");
      return;
    }
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          doctor: selectedDoctor,
          date: selectedDate,
          time: selectedTime,
        }),
      });
      if (res.ok) {
        toast.success("Appointment confirmed! We'll call you shortly.");
        setBookingOpen(false);
        setStep(1);
      } else {
        toast.error("Failed. Please call us at 03XX-XXXXXXX.");
      }
    } catch {
      toast.error("Network error.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-white">
      {/* ─── HEADER / NAV ───────────────────── */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-blue-100/50 shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 rounded-lg p-1.5">
              <Stethoscope className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              SmartClinic AI
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#" className="hover:text-blue-600 transition-colors">
              Home
            </a>
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
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6"
              onClick={() => setBookingOpen(true)}
            >
              Book Appointment
            </Button>
          </div>
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
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/90 backdrop-blur-xl border-t px-4 py-4 space-y-3">
            <a href="#" className="block text-sm font-medium">
              Home
            </a>
            <a href="#services" className="block text-sm font-medium">
              Services
            </a>
            <a href="#doctors" className="block text-sm font-medium">
              Doctors
            </a>
            <a href="#testimonials" className="block text-sm font-medium">
              Testimonials
            </a>
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setBookingOpen(true)}
            >
              Book Appointment
            </Button>
          </div>
        )}
      </header>

      {/* ─── HERO (GLASSMORPHISM + SEARCH) ──── */}
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
              Smart appointments, trusted doctors, and AI‑powered care – all
              from your phone.
            </p>

            {/* Search Bar */}
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search doctors, services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-6 rounded-2xl shadow-xl shadow-blue-200"
                onClick={() => setBookingOpen(true)}
              >
                Book Appointment <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 rounded-2xl border-2"
              >
                <Phone className="mr-2 h-5 w-5" /> Call Now
              </Button>
            </div>

            {/* Trust Counters */}
            <div
              ref={counterRef}
              className="flex flex-wrap gap-6 text-sm text-gray-500 pt-4"
            >
              <span className="flex items-center gap-1 font-semibold text-gray-800">
                ✅ {patientsCount.toLocaleString()}+ Happy Patients
              </span>
              <span className="flex items-center gap-1 font-semibold text-gray-800">
                ⭐ {ratingCount} Rating
              </span>
              <span className="flex items-center gap-1 font-semibold text-gray-800">
                <ShieldCheck className="h-4 w-4 text-blue-600" /> {yearsCount}+
                Years Exp
              </span>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative hidden md:block">
            <div className="w-full h-96 bg-gradient-to-br from-blue-100 to-blue-200 rounded-[3rem] flex items-center justify-center backdrop-blur-sm border border-white/50 shadow-2xl shadow-blue-200/50">
              <Stethoscope className="h-48 w-48 text-blue-500/80" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── SERVICES ──────────────────────── */}
      <section id="services" className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
            Our Services
          </h2>
          <p className="text-gray-600 text-center max-w-xl mx-auto mb-10">
            Comprehensive care under one roof
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {services.map((service) => (
              <div
                key={service.title}
                className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl border border-gray-100 transition-all hover:-translate-y-1"
              >
                <service.icon className="h-10 w-10 text-blue-600 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {service.title}
                </h3>
                <p className="text-gray-600 text-sm">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DOCTORS (FILTERED) ────────────── */}
      <section id="doctors" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
            Meet Our Experts
          </h2>
          <p className="text-gray-600 text-center max-w-xl mx-auto mb-10">
            Tap on a doctor to learn more
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredDoctors.map((doc) => (
              <div
                key={doc.name}
                className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all p-6 flex flex-col items-center text-center"
              >
                <Image
                  src={doc.img}
                  alt={doc.name}
                  width={96}
                  height={96}
                  className="rounded-full mb-4 border-4 border-blue-100 group-hover:border-blue-300 transition-colors"
                />
                <h3 className="text-lg font-semibold text-gray-900">
                  {doc.name}
                </h3>
                <p className="text-blue-600 font-medium text-sm">
                  {doc.specialty}
                </p>
                <p className="text-gray-500 text-sm mt-1">{doc.exp}</p>
                <div className="flex items-center gap-1 mt-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{doc.rating}</span>
                </div>
                <p className="text-gray-400 text-xs mt-2 line-clamp-2">
                  {doc.bio}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 rounded-full w-full"
                  onClick={() => {
                    setSelectedDoctor(doc.name);
                    setBookingOpen(true);
                  }}
                >
                  Book Now
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS (CAROUSEL) ────────── */}
      <section id="testimonials" className="py-16 bg-blue-50/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
            What Patients Say
          </h2>
          <div className="relative overflow-hidden">
            <div
              className="flex transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${currentTestimonial * 100}%)` }}
            >
              {testimonials.map((t, idx) => (
                <div key={idx} className="w-full flex-shrink-0 px-4">
                  <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
                    <div className="flex justify-center gap-1 mb-3">
                      {[...Array(t.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-5 w-5 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>
                    <p className="text-gray-700 italic text-lg">"{t.text}"</p>
                    <p className="text-gray-900 font-semibold mt-4">{t.name}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentTestimonial(idx)}
                  className={`h-2 w-2 rounded-full transition-all ${
                    currentTestimonial === idx
                      ? "bg-blue-600 w-6"
                      : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── MOBILE BOTTOM NAV ──────────────── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-200 z-40 flex justify-around items-center py-2 safe-area-inset-bottom">
        <a
          href="#"
          className="flex flex-col items-center text-blue-600 text-xs font-medium"
        >
          <Stethoscope className="h-5 w-5" /> Home
        </a>
        <a
          href="#services"
          className="flex flex-col items-center text-gray-500 text-xs"
        >
          <Heart className="h-5 w-5" /> Services
        </a>
        <button
          onClick={() => setBookingOpen(true)}
          className="flex flex-col items-center text-gray-500 text-xs"
        >
          <Calendar className="h-5 w-5" /> Book
        </button>
        <a
          href="#doctors"
          className="flex flex-col items-center text-gray-500 text-xs"
        >
          <User className="h-5 w-5" /> Doctors
        </a>
      </div>

      {/* ─── FLOATING ACTION BUTTON (MOBILE) ── */}
      <div className="md:hidden fixed bottom-20 right-4 z-30 flex flex-col gap-2">
        <Button
          size="icon"
          className="bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg h-12 w-12"
          onClick={() => toast.info("Calling 03XX-XXXXXXX...")}
        >
          <Phone className="h-5 w-5" />
        </Button>
      </div>

      {/* ─── MULTI‑STEP BOOKING MODAL ────────── */}
      {bookingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                Book Appointment
              </h2>
              <button
                onClick={() => {
                  setBookingOpen(false);
                  setStep(1);
                }}
              >
                <XCircle className="h-6 w-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            {/* Steps indicator */}
            <div className="flex justify-center gap-2 p-4 border-b">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-2 w-8 rounded-full ${step >= s ? "bg-blue-600" : "bg-gray-200"}`}
                />
              ))}
            </div>

            {step === 1 && (
              <div className="p-6 space-y-4">
                <h3 className="font-semibold text-gray-800">Select Doctor</h3>
                {doctors.map((doc) => (
                  <button
                    key={doc.name}
                    onClick={() => {
                      setSelectedDoctor(doc.name);
                      setStep(2);
                    }}
                    className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all flex items-center gap-3"
                  >
                    <Image
                      src={doc.img}
                      alt={doc.name}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-gray-500">
                        {doc.specialty} · {doc.exp}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="p-6 space-y-4">
                <h3 className="font-semibold text-gray-800">
                  Choose Date & Time
                </h3>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedTime(t)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium border ${
                        selectedTime === t
                          ? "bg-blue-600 text-white border-blue-600"
                          : "border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => setStep(3)}
                  disabled={!selectedDate || !selectedTime}
                >
                  Continue
                </Button>
              </div>
            )}

            {step === 3 && (
              <div className="p-6 space-y-4">
                <h3 className="font-semibold text-gray-800">
                  Your Information
                </h3>
                <input
                  id="booking-name"
                  type="text"
                  placeholder="Full Name"
                  className="w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <input
                  id="booking-phone"
                  type="tel"
                  placeholder="Phone Number"
                  className="w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <div className="bg-blue-50 rounded-xl p-3 text-sm text-gray-600">
                  <p className="font-medium">Summary:</p>
                  <p>
                    {selectedDoctor} • {selectedDate} at {selectedTime}
                  </p>
                </div>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleBookingSubmit}
                >
                  Confirm Booking <CheckCircle2 className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── FOOTER ────────────────────────── */}
      <footer className="bg-gray-900 text-white py-8 pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          <div className="flex justify-center items-center gap-2 mb-2">
            <Stethoscope className="h-5 w-5" />
            <span className="font-semibold">SmartClinic AI</span>
          </div>
          <p>© 2026 SmartClinic AI. All rights reserved.</p>
          <p className="text-gray-400 mt-1">Committee Chowk, Rawalpindi</p>
        </div>
      </footer>
    </div>
  );
}
