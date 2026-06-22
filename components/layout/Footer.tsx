import { Stethoscope, Phone, MapPin, Clock } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12 pb-24 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top row: Map + Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Google Maps embed (static, no API key needed) */}
          <div className="md:col-span-1 rounded-2xl overflow-hidden border border-gray-700 h-48 md:h-auto">
            <iframe
              src="https://www.google.com/maps?q=Committee+Chowk,+Rawalpindi&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: "200px" }}
              allowFullScreen
              loading="lazy"
              title="SmartClinic AI location"
            ></iframe>
          </div>

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-blue-600 rounded-lg p-1.5">
                <Stethoscope className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg">SmartClinic AI</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              AI-powered healthcare with trusted doctors and smart appointments.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-sm mb-3 text-gray-300">
              Contact
            </h3>
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-blue-400 shrink-0" />
                <span>03XX-XXXXXXX</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-400 shrink-0" />
                <span>Committee Chowk, Rawalpindi</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-400 shrink-0" />
                <span>Mon–Sat, 9 AM – 8 PM</span>
              </div>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-sm mb-3 text-gray-300">
              Quick links
            </h3>
            <div className="space-y-2 text-sm text-gray-400">
              <a
                href="#services"
                className="block hover:text-white transition-colors"
              >
                Services
              </a>
              <a
                href="#doctors"
                className="block hover:text-white transition-colors"
              >
                Our Doctors
              </a>
              <a
                href="#testimonials"
                className="block hover:text-white transition-colors"
              >
                Testimonials
              </a>
              <a
                href="/login"
                className="block hover:text-white transition-colors"
              >
                Patient Login
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} SmartClinic AI. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
