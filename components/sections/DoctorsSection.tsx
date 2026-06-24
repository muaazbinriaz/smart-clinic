"use client";
import Image from "next/image";
import {
  Star,
  Heart,
  Stethoscope,
  Activity,
  Zap,
  Eye,
  Baby,
  Smile,
  Brain,
  Thermometer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";

// ─── Specialty → color + icon mapping ────────────────────────────────
const SPECIALTY_CONFIG: {
  match: string[];
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ElementType;
}[] = [
  {
    match: ["cardio", "heart"],
    color: "text-rose-600",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200 group-hover:border-rose-400",
    icon: Heart,
  },
  {
    match: ["general", "physician", "medicine", "gp"],
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200 group-hover:border-blue-400",
    icon: Stethoscope,
  },
  {
    match: ["derma", "skin", "hair"],
    color: "text-pink-600",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200 group-hover:border-pink-400",
    icon: Zap,
  },
  {
    match: ["physio", "rehabilit", "sports"],
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200 group-hover:border-green-400",
    icon: Activity,
  },
  {
    match: ["neuro", "brain", "spine"],
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200 group-hover:border-purple-400",
    icon: Brain,
  },
  {
    match: ["ophthal", "eye", "vision"],
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
    borderColor: "border-cyan-200 group-hover:border-cyan-400",
    icon: Eye,
  },
  {
    match: ["pediatr", "child", "baby"],
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200 group-hover:border-yellow-400",
    icon: Baby,
  },
  {
    match: ["dent", "tooth", "oral"],
    color: "text-teal-600",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-200 group-hover:border-teal-400",
    icon: Smile,
  },
];

const DEFAULT_CONFIG = {
  color: "text-blue-600",
  bgColor: "bg-blue-50",
  borderColor: "border-blue-200 group-hover:border-blue-400",
  icon: Thermometer,
};

function getSpecialtyConfig(specialty: string) {
  const s = specialty.toLowerCase();
  return (
    SPECIALTY_CONFIG.find((c) => c.match.some((m) => s.includes(m))) ??
    DEFAULT_CONFIG
  );
}

// ─── Static doctor list (kept as fallback) ────────────────────────────
export const doctors = [
  {
    name: "Dr. Ahmed",
    specialty: "Cardiologist",
    img: "https://ui-avatars.com/api/?name=Dr+Ahmed&size=128&background=0D6EFD&color=fff&bold=true",
    exp: "15+ years",
    defaultRating: 4.9,
    slug: "dr-ahmed",
    bio: "Fellowship in Interventional Cardiology. Expert in angioplasty and heart failure management.",
    fee: 3000,
  },
  {
    name: "Dr. Husnain Ali",
    specialty: "General Physician",
    img: "https://ui-avatars.com/api/?name=Dr+Husnain+Ali&size=128&background=0D6EFD&color=fff&bold=true",
    exp: "10+ years",
    defaultRating: 4.8,
    slug: "dr-husnain-ali",
    bio: "Specialist in diabetes, hypertension, and preventive medicine.",
    fee: 2000,
  },
  {
    name: "Dr. Ali",
    specialty: "Dermatologist",
    img: "https://ui-avatars.com/api/?name=Dr+Ali&size=128&background=0D6EFD&color=fff&bold=true",
    exp: "12+ years",
    defaultRating: 4.7,
    slug: "dr-ali",
    bio: "Cosmetic dermatology, laser treatments, and skin surgery.",
    fee: 2500,
  },
  {
    name: "Dr. Fatima",
    specialty: "Physiotherapist",
    img: "https://ui-avatars.com/api/?name=Dr+Fatima&size=128&background=0D6EFD&color=fff&bold=true",
    exp: "8+ years",
    defaultRating: 4.9,
    slug: "dr-fatima",
    bio: "Rehabilitation specialist, manual therapy, and sports injuries.",
    fee: 1500,
  },
];

interface LiveRating {
  avg: number;
  count: number;
}

interface Doctor {
  _id?: string;
  name: string;
  specialty: string;
  img?: string;
  exp?: string;
  defaultRating?: number;
  rating?: number;
  slug: string;
  bio?: string;
  fee?: number;
}

interface DoctorsSectionProps {
  searchQuery: string;
  onBookClick: (doctorName: string) => void;
}

function getFallbackImage(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=128&background=0D6EFD&color=fff&bold=true`;
}

function DoctorImage({ doc, bgColor }: { doc: any; bgColor: string }) {
  const [src, setSrc] = useState(doc.img || getFallbackImage(doc.name));
  const [errored, setErrored] = useState(false);

  if (errored || !doc.img) {
    // Initials avatar with specialty color
    const initials = doc.name
      .replace(/^Dr\.?\s*/i, "")
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    return (
      <div
        className={`h-20 w-20 rounded-full ${bgColor} flex items-center justify-center mb-4 border-4 border-white shadow-sm group-hover:shadow-md transition-shadow`}
      >
        <span className="text-xl font-bold text-current opacity-70">
          {initials}
        </span>
      </div>
    );
  }

  return (
    <div className="relative w-20 h-20 rounded-full overflow-hidden">
      <Image
        src={src}
        alt={doc.name}
        fill
        className="object-cover object-top"
        onError={() => {
          setSrc(getFallbackImage(doc.name));
          setErrored(true);
        }}
        unoptimized
      />
    </div>
  );
}

export default function DoctorsSection({
  searchQuery,
  onBookClick,
}: DoctorsSectionProps) {
  const [apiDoctors, setApiDoctors] = useState<Doctor[]>(doctors);
  const [liveRatings, setLiveRatings] = useState<Record<string, LiveRating>>(
    {},
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/doctors")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setApiDoctors(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/doctors/ratings")
      .then((r) => r.json())
      .then((data) => setLiveRatings(data.ratings ?? {}))
      .catch(() => {});
  }, []);

  const q = searchQuery.trim().toLowerCase();
  const filtered = apiDoctors.filter((d: any) => {
    const name = (d.name || "").toLowerCase();
    const specialty = (d.specialty || "").toLowerCase();
    return name.includes(q) || specialty.includes(q);
  });

  if (loading) {
    return (
      <section id="doctors" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
            Meet Our Experts
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col items-center animate-pulse"
              >
                <div className="h-20 w-20 rounded-full bg-gray-100 mb-4" />
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/3 mb-4" />
                <div className="h-8 bg-gray-100 rounded-full w-full mt-auto" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="doctors" className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
          Meet Our Experts
        </h2>
        <p className="text-gray-600 text-center max-w-xl mx-auto mb-10">
          Tap on a doctor to book an appointment
        </p>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Stethoscope}
            title="No doctors found"
            description={
              searchQuery
                ? "Try a different name or specialty."
                : "No doctors are currently available. Please check again later."
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filtered.map((doc: any) => {
              const live = liveRatings[doc.name];
              const displayRating = live
                ? live.avg
                : (doc.rating ?? doc.defaultRating ?? 5.0);
              const reviewCount = live ? live.count : null;
              const config = getSpecialtyConfig(doc.specialty);
              const SpecialtyIcon = config.icon;

              return (
                <div
                  key={doc.name}
                  className={`group bg-white rounded-2xl shadow-sm border-2 ${config.borderColor} overflow-hidden hover:shadow-xl transition-all duration-300 p-4 sm:p-6 flex flex-col items-center text-center w-full max-w-sm mx-auto`}
                >
                  {/* Specialty color band at top */}
                  <div
                    className={`w-full h-1.5 ${config.bgColor} rounded-full mb-4 opacity-60`}
                  />

                  <DoctorImage doc={doc} bgColor={config.bgColor} />

                  {/* Specialty badge with icon */}
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${config.bgColor} mb-3`}
                  >
                    <SpecialtyIcon className={`h-3.5 w-3.5 ${config.color}`} />
                    <span className={`text-xs font-semibold ${config.color}`}>
                      {doc.specialty}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-gray-900">
                    {doc.name}
                  </h3>
                  <p className="text-gray-400 text-xs mt-0.5">{doc.exp}</p>

                  <div className="flex items-center gap-1 mt-2">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-semibold text-gray-700">
                      {typeof displayRating === "number"
                        ? displayRating.toFixed(1)
                        : displayRating}
                    </span>
                    {reviewCount !== null && (
                      <span className="text-xs text-gray-400">
                        ({reviewCount})
                      </span>
                    )}
                  </div>

                  {doc.fee && (
                    <p className={`text-xs font-medium mt-1.5 ${config.color}`}>
                      PKR {doc.fee.toLocaleString()}
                    </p>
                  )}

                  <p className="text-gray-400 text-xs mt-2 line-clamp-2 leading-relaxed">
                    {doc.bio}
                  </p>

                  <Button
                    size="sm"
                    className="mt-4 rounded-full w-full bg-blue-600 hover:bg-blue-700 text-white border-0"
                    onClick={() => onBookClick(doc.name)}
                  >
                    Book Appointment
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
