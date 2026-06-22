"use client";
import { Stethoscope, Heart, Calendar, User } from "lucide-react";

interface MobileNavProps {
  onBookClick: () => void;
}

export default function MobileNav({ onBookClick }: MobileNavProps) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-200 z-40 flex justify-around items-center py-2 safe-area-inset-bottom">
      <a
        href="#"
        className="flex flex-col items-center text-blue-600 text-xs font-medium gap-0.5"
      >
        <Stethoscope className="h-5 w-5" />
        Home
      </a>
      <a
        href="#services"
        className="flex flex-col items-center text-gray-500 text-xs gap-0.5"
      >
        <Heart className="h-5 w-5" />
        Services
      </a>
      <button
        onClick={onBookClick}
        className="flex flex-col items-center text-gray-500 text-xs gap-0.5"
      >
        <Calendar className="h-5 w-5" />
        Book
      </button>
      <a
        href="#doctors"
        className="flex flex-col items-center text-gray-500 text-xs gap-0.5"
      >
        <User className="h-5 w-5" />
        Doctors
      </a>
    </div>
  );
}
