import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col flex-1">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-800 py-24 text-white text-center overflow-hidden min-h-[60vh] sm:min-h-[70vh]">
          <div className="absolute inset-0 bg-pattern opacity-10"></div> {/* Subtle background pattern */}
          <div className="relative z-10 container mx-auto px-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-4 animate-fade-in-up">
              Your Health, Our Priority
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl mb-8 font-light max-w-2xl mx-auto animate-fade-in-up delay-200">
              Smart appointments, trusted doctors, AI-powered care.
            </p>
            <Button
              asChild
              className="bg-white text-blue-600 hover:bg-gray-100 hover:text-blue-700 px-8 py-6 text-xl rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 animate-bounce-in"
              size="lg"
            >
              <Link href="#contact">Book Appointment</Link>
            </Button>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="py-20 bg-zinc-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-12 text-blue-600">Our Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
                <p className="text-6xl mb-4">❤️</p>
                <h3 className="text-2xl font-semibold mb-4 text-zinc-800 dark:text-zinc-50">Cardiology</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Comprehensive heart care, from diagnostics to treatment, ensuring your cardiovascular health.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
                <p className="text-6xl mb-4">🧴</p>
                <h3 className="text-2xl font-semibold mb-4 text-zinc-800 dark:text-zinc-50">Dermatology</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Expert care for all skin conditions, promoting healthy and radiant skin.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
                <p className="text-6xl mb-4">💪</p>
                <h3 className="text-2xl font-semibold mb-4 text-zinc-800 dark:text-zinc-50">Physiotherapy</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Rehabilitative services to restore mobility, reduce pain, and improve physical function.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Doctors Section */}
        <section id="doctors" className="py-20 bg-white dark:bg-black">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-12 text-blue-600">Meet Our Expert Doctors</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="flex flex-col items-center bg-zinc-50 dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <Image
                  src="https://ui-avatars.com/api/?name=Dr+Ahmed&size=128&background=random&color=fff"
                  alt="Dr. Ahmed"
                  width={128}
                  height={128}
                  className="rounded-full mb-4 border-4 border-blue-200"
                />
                <h3 className="text-xl font-semibold text-zinc-800 dark:text-zinc-50">Dr. Ahmed</h3>
                <p className="text-blue-600">Cardiologist</p>
              </div>
              <div className="flex flex-col items-center bg-zinc-50 dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <Image
                  src="https://ui-avatars.com/api/?name=Dr+Husnain+Ali&size=128&background=random&color=fff"
                  alt="Dr. Husnain Ali"
                  width={128}
                  height={128}
                  className="rounded-full mb-4 border-4 border-blue-200"
                />
                <h3 className="text-xl font-semibold text-zinc-800 dark:text-zinc-50">Dr. Husnain Ali</h3>
                <p className="text-blue-600">General Physician</p>
              </div>
              <div className="flex flex-col items-center bg-zinc-50 dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <Image
                  src="https://ui-avatars.com/api/?name=Dr+Ali&size=128&background=random&color=fff"
                  alt="Dr. Ali"
                  width={128}
                  height={128}
                  className="rounded-full mb-4 border-4 border-blue-200"
                />
                <h3 className="text-xl font-semibold text-zinc-800 dark:text-zinc-50">Dr. Ali</h3>
                <p className="text-blue-600">Dermatologist</p>
              </div>
              <div className="flex flex-col items-center bg-zinc-50 dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <Image
                  src="https://ui-avatars.com/api/?name=Dr+Fatima&size=128&background=random&color=fff"
                  alt="Dr. Fatima"
                  width={128}
                  height={128}
                  className="rounded-full mb-4 border-4 border-blue-200"
                />
                <h3 className="text-xl font-semibold text-zinc-800 dark:text-zinc-50">Dr. Fatima</h3>
                <p className="text-blue-600">Physiotherapist</p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-20 bg-zinc-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-12 text-blue-600">What Our Patients Say</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
                <p className="text-lg italic mb-4 text-zinc-700 dark:text-zinc-300">
                  &quot;SmartClinic AI has transformed how I manage my health. The doctors are incredibly knowledgeable and caring.&quot;
                </p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-50">- Sarah J.</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
                <p className="text-lg italic mb-4 text-zinc-700 dark:text-zinc-300">
                  &quot;The online appointment system is seamless, and I always feel heard and understood by my physician.&quot;
                </p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-50">- Mark T.</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
                <p className="text-lg italic mb-4 text-zinc-700 dark:text-zinc-300">
                  &quot;From cardiology to physiotherapy, SmartClinic AI provides top-notch care under one roof. Highly recommend!&quot;
                </p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-50">- Emily R.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Form Section */}
        <section id="contact" className="py-20 bg-white dark:bg-black">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-12 text-blue-600">Contact Us</h2>
            <div className="max-w-md mx-auto bg-zinc-50 dark:bg-gray-800 p-8 rounded-lg shadow-md">
              <form className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-left text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Your Name"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-left text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Your Phone Number"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-left text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="How can we help you?"
                    required
                  ></textarea>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-blue-600 text-white hover:bg-blue-700 py-3 text-lg rounded-md transition-colors"
                >
                  Submit
                </Button>
              </form>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
