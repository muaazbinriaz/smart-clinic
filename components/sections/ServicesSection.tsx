import { Heart, Stethoscope, Activity, Zap } from "lucide-react";

const services = [
  {
    icon: Heart,
    title: "Cardiology",
    desc: "ECG, Echo, Stress Tests",
    keywords: ["cardio", "heart", "ecg"],
  },
  {
    icon: Stethoscope,
    title: "General Medicine",
    desc: "Check-ups, Chronic Disease",
    keywords: ["general", "medicine", "checkup", "diabetes"],
  },
  {
    icon: Activity,
    title: "Physiotherapy",
    desc: "Pain Management, Rehab",
    keywords: ["physio", "pain", "rehab", "sports"],
  },
  {
    icon: Zap,
    title: "Dermatology",
    desc: "Skin, Hair, Laser",
    keywords: ["derma", "skin", "hair", "laser"],
  },
];

interface ServicesSectionProps {
  searchQuery?: string;
}

export default function ServicesSection({
  searchQuery = "",
}: ServicesSectionProps) {
  const q = searchQuery.toLowerCase();
  const filtered = q
    ? services.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.desc.toLowerCase().includes(q) ||
          s.keywords.some((k) => k.includes(q)),
      )
    : services;

  return (
    <section id="services" className="py-16 bg-white/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
          Our Services
        </h2>
        <p className="text-gray-600 text-center max-w-xl mx-auto mb-10">
          Comprehensive care under one roof
        </p>
        {filtered.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">
            No services match &quot;{searchQuery}&quot;.
          </p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {filtered.map((service) => (
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
        )}
      </div>
    </section>
  );
}
