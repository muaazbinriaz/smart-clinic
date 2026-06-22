"use client";
import { useEffect, useState } from "react";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Ayesha K.",
    text: "SmartClinic AI saved me hours. Booked in 30 seconds and the doctor was excellent.",
    rating: 5,
  },
  {
    name: "Mohammad R.",
    text: "The AI chatbot answered all my questions at 2 AM. Highly recommended.",
    rating: 5,
  },
  {
    name: "Fatima S.",
    text: "Best clinic in Rawalpindi. Modern, clean, and caring doctors.",
    rating: 4,
  },
];

export default function TestimonialsSection() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="testimonials" className="py-16 bg-blue-50/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">
          What Patients Say
        </h2>
        <div className="relative overflow-hidden">
          <div
            className="flex transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${current * 100}%)` }}
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

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                className={`h-2 rounded-full transition-all ${current === idx ? "bg-blue-600 w-6" : "bg-gray-300 w-2"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
