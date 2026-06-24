"use client";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Stethoscope, Heart, Calendar, User } from "lucide-react";

interface MobileNavProps {
  onBookClick: () => void;
  bookingOpen?: boolean;
}

export default function MobileNav({
  onBookClick,
  bookingOpen = false,
}: MobileNavProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [activeSection, setActiveSection] = useState<string>("");

  useEffect(() => {
    if (!isHome) {
      setActiveSection("");
      return;
    }

    const sectionIds = ["services", "doctors"];
    const visibleRatios = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visibleRatios.set(
            entry.target.id,
            entry.isIntersecting ? entry.intersectionRatio : 0,
          );
        });

        // Find the section with the highest visible ratio right now.
        let best = "";
        let bestRatio = 0;
        visibleRatios.forEach((ratio, id) => {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            best = id;
          }
        });

        // If nothing meaningfully visible (e.g. scrolled back to hero), clear it.
        setActiveSection(bestRatio > 0.15 ? best : "");
      },
      { threshold: [0, 0.15, 0.3, 0.4, 0.6, 0.8, 1] },
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [isHome]);

  const itemClass = (active: boolean) =>
    `flex flex-col items-center text-xs gap-0.5 min-h-[44px] min-w-[44px] justify-center transition-colors duration-150 px-2 ${
      active ? "text-blue-600 font-medium" : "text-gray-400 hover:text-gray-600"
    }`;

  const isServicesActive = !bookingOpen && activeSection === "services";
  const isDoctorsActive = !bookingOpen && activeSection === "doctors";
  const isHomeActive =
    isHome &&
    !bookingOpen &&
    activeSection !== "services" &&
    activeSection !== "doctors";

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-100 z-40 flex justify-around items-center py-1 safe-area-inset-bottom">
      <Link href="/" className={itemClass(isHomeActive)}>
        <Stethoscope className="h-5 w-5" />
        <span>Home</span>
      </Link>

      <a href="/#services" className={itemClass(isServicesActive)}>
        <Heart className="h-5 w-5" />
        <span>Services</span>
      </a>

      <button onClick={onBookClick} className={itemClass(bookingOpen)}>
        <Calendar className="h-5 w-5" />
        <span>Book</span>
      </button>

      <a href="/#doctors" className={itemClass(isDoctorsActive)}>
        <User className="h-5 w-5" />
        <span>Doctors</span>
      </a>
    </nav>
  );
}
