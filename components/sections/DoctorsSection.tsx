"use client";
import Image from "next/image";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

// ─── Static doctor list (used by BookingModal) ───────────────────────────────
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

// ─── Types ───────────────────────────────────────────────────────────────────
interface LiveRating {
  avg: number;
  count: number;
}

interface DoctorsSectionProps {
  searchQuery: string;
  onBookClick: (doctorName: string) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function DoctorsSection({
  searchQuery,
  onBookClick,
}: DoctorsSectionProps) {
  const [apiDoctors, setApiDoctors] = useState(doctors); // start with static fallback
  const [liveRatings, setLiveRatings] = useState<Record<string, LiveRating>>(
    {},
  );

  // Fetch doctors from API — if successful, use them; otherwise keep static list
  useEffect(() => {
    fetch("/api/doctors")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setApiDoctors(data);
        }
      })
      .catch(() => {}); // keep static list on error
  }, []);

  // Fetch live ratings
  useEffect(() => {
    fetch("/api/doctors/ratings")
      .then((r) => r.json())
      .then((data) => setLiveRatings(data.ratings ?? {}))
      .catch(() => {});
  }, []);

  const q = searchQuery.toLowerCase();
  const filtered = apiDoctors.filter(
    (d: any) =>
      d.name.toLowerCase().includes(q) || d.specialty.toLowerCase().includes(q),
  );

  return (
    <section id="doctors" className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
          Meet Our Experts
        </h2>
        <p className="text-gray-600 text-center max-w-xl mx-auto mb-10">
          Tap on a doctor to book an appointment
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((doc: any) => {
            const live = liveRatings[doc.name];
            const displayRating = live
              ? live.avg
              : (doc.rating ?? doc.defaultRating ?? 5.0);
            const reviewCount = live ? live.count : null;

            return (
              <div
                key={doc.name}
                className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all p-6 flex flex-col items-center text-center"
              >
                <Image
                  src={
                    doc.img ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.name)}&size=128&background=0D6EFD&color=fff&bold=true`
                  }
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
                  <span className="text-sm font-medium">{displayRating}</span>
                  {reviewCount !== null && (
                    <span className="text-xs text-gray-400">
                      ({reviewCount})
                    </span>
                  )}
                </div>
                <p className="text-gray-400 text-xs mt-2 line-clamp-2">
                  {doc.bio}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 rounded-full w-full"
                  onClick={() => onBookClick(doc.name)}
                >
                  Book Now
                </Button>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="col-span-4 text-center text-gray-400 py-8">
              No doctors match your search.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
