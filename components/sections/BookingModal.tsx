"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import {
  XCircle,
  CheckCircle2,
  Loader2,
  CalendarPlus,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const TIME_SLOTS = [
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

// ─── Calendar helpers ────────────────────────────────────────────────
function timeTo24h(timeStr: string): number {
  const [time, modifier] = timeStr.split(" ");
  let [hours] = time.split(":").map(Number);
  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;
  return hours;
}

function formatGoogleDateTime(
  dateStr: string,
  timeStr: string,
  offsetMinutes = 0,
): string {
  const d = new Date(dateStr);
  let hours = timeTo24h(timeStr) + Math.floor(offsetMinutes / 60);
  const mins = offsetMinutes % 60;
  d.setHours(hours, mins, 0, 0);
  return d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

function getGoogleCalendarUrl(
  dateStr: string,
  timeStr: string,
  doctor: string,
): string {
  const start = formatGoogleDateTime(dateStr, timeStr);
  const end = formatGoogleDateTime(dateStr, timeStr, 30);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Appointment with ${doctor}`,
    dates: `${start}/${end}`,
    details: "Your appointment at SmartClinic AI, Rawalpindi.",
    location: "Committee Chowk, Rawalpindi",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function downloadIcsFile(dateStr: string, timeStr: string, doctor: string) {
  const start = formatGoogleDateTime(dateStr, timeStr);
  const end = formatGoogleDateTime(dateStr, timeStr, 30);
  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SmartClinic AI//EN",
    "BEGIN:VEVENT",
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:Appointment with ${doctor}`,
    "DESCRIPTION:Your appointment at SmartClinic AI, Rawalpindi.",
    "LOCATION:Committee Chowk, Rawalpindi",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  // Use a data URI – works on iOS Safari
  const dataUri =
    "data:text/calendar;charset=utf-8," + encodeURIComponent(icsContent);
  const link = document.createElement("a");
  link.href = dataUri;
  link.download = "smartclinic-appointment.ics";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ─── Doctor image with fallback ──────────────────────────────────────
function getFallbackImage(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=128&background=0D6EFD&color=fff&bold=true`;
}

function DoctorImage({ doc }: { doc: any }) {
  const [src, setSrc] = useState(doc.img || getFallbackImage(doc.name));

  return (
    <Image
      src={src}
      alt={doc.name}
      width={48}
      height={48}
      className="rounded-full"
      onError={() => setSrc(getFallbackImage(doc.name))}
      unoptimized
    />
  );
}

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  initialDoctor?: string;
}

export default function BookingModal({
  open,
  onClose,
  initialDoctor,
}: BookingModalProps) {
  const [step, setStep] = useState(1);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  // Fetch doctors from DB
  useEffect(() => {
    setLoadingDoctors(true);
    fetch("/api/doctors")
      .then((r) => r.json())
      .then((data) => setDoctorsList(Array.isArray(data) ? data : []))
      .catch(() => setDoctorsList([]))
      .finally(() => setLoadingDoctors(false));
  }, []);

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep(1);
      setSelectedDoctor("");
      setSelectedDate("");
      setSelectedTime("");
      setName("");
      setPhone("");
      setEmail("");
      setBookedSlots([]);
      setAvailableSlots([]);
      setLoadingSlots(false);
      setSubmitting(false);
      setDone(false);
      setReviewing(false);
      setErrors({});
      if (initialDoctor) {
        const match = doctorsList.find(
          (d) =>
            d.name.toLowerCase().includes(initialDoctor.toLowerCase()) ||
            initialDoctor.toLowerCase().includes(d.name.toLowerCase()),
        );
        if (match) {
          setSelectedDoctor(match.name);
          setStep(2);
        }
      }
    }
  }, [open, initialDoctor]);

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Fetch doctor's working hours when doctor is selected
  useEffect(() => {
    if (selectedDoctor) {
      fetch(`/api/doctors?name=${encodeURIComponent(selectedDoctor)}`)
        .then((r) => r.json())
        .then((data) => {
          const doc = Array.isArray(data)
            ? data.find((d: any) => d.name === selectedDoctor)
            : null;
          if (doc) {
            setAvailableSlots(
              Array.isArray(doc.workingHours) ? doc.workingHours : [],
            );
          } else {
            setAvailableSlots([]);
          }
        })
        .catch(() =>
          setAvailableSlots([
            "9:00 AM",
            "10:00 AM",
            "11:00 AM",
            "12:00 PM",
            "2:00 PM",
            "3:00 PM",
            "4:00 PM",
            "5:00 PM",
            "6:00 PM",
          ]),
        );
    }
  }, [selectedDoctor]);

  // Fetch slots when doctor & date selected
  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      setLoadingSlots(true);
      fetch(
        `/api/appointments/slots?doctor=${encodeURIComponent(selectedDoctor)}&date=${selectedDate}`,
      )
        .then((r) => r.json())
        .then((data) => setBookedSlots(data.bookedSlots ?? []))
        .catch(() => setBookedSlots([]))
        .finally(() => setLoadingSlots(false));
    }
  }, [selectedDoctor, selectedDate]);

  // Clear time if becomes booked
  useEffect(() => {
    if (bookedSlots.includes(selectedTime)) setSelectedTime("");
  }, [bookedSlots, selectedTime]);

  const handleSubmit = async () => {
    const newErrors: { name?: string; phone?: string } = {};
    if (!name.trim()) newErrors.name = "Full name is required.";
    if (!phone.trim()) newErrors.phone = "Phone number is required.";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);
    // Re-check slot availability
    try {
      const slotsRes = await fetch(
        `/api/appointments/slots?doctor=${encodeURIComponent(selectedDoctor)}&date=${selectedDate}`,
      );
      const slotsData = await slotsRes.json();
      const currentlyBooked = slotsData.bookedSlots ?? [];
      if (currentlyBooked.includes(selectedTime)) {
        toast.error("This slot was just booked. Choose another time.");
        setBookedSlots(currentlyBooked);
        setSubmitting(false);
        return;
      }
    } catch {}

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          doctor: selectedDoctor,
          date: selectedDate,
          time: selectedTime,
        }),
      });
      if (res.status === 409) {
        const data = await res.json();
        toast.error(data.error || "Slot already booked.");
        setSubmitting(false);
        return;
      }
      if (!res.ok) throw new Error("Booking failed");
      setDone(true);
      toast.success("Appointment booked successfully!");
    } catch {
      toast.error("Failed to book appointment.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const today = new Date().toISOString().split("T")[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <XCircle className="h-5 w-5" />
        </button>

        {done ? (
          <div className="text-center py-10 space-y-4">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">
              Appointment Booked!
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              {selectedDoctor} on {selectedDate} at {selectedTime}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() =>
                  window.open(
                    getGoogleCalendarUrl(
                      selectedDate,
                      selectedTime,
                      selectedDoctor,
                    ),
                    "_blank",
                  )
                }
              >
                <CalendarPlus className="h-4 w-4 mr-1" /> Add to Google Calendar
              </Button>
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() =>
                  downloadIcsFile(selectedDate, selectedTime, selectedDoctor)
                }
              >
                <Download className="h-4 w-4 mr-1" /> Download .ics
              </Button>
            </div>
            <Button onClick={onClose} className="rounded-xl mt-4">
              Close
            </Button>
          </div>
        ) : reviewing ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Confirm your appointment
            </h3>
            <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Doctor</span>
                <span className="font-medium">{selectedDoctor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date</span>
                <span className="font-medium">{selectedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Time</span>
                <span className="font-medium">{selectedTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Name</span>
                <span className="font-medium">{name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Phone</span>
                <span className="font-medium">{phone}</span>
              </div>
              {email && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Email</span>
                  <span className="font-medium">{email}</span>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setReviewing(false)}
                className="rounded-xl flex-1"
              >
                Edit details
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex-1"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Confirm Booking"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Step indicator */}
            <div className="flex items-center gap-1 mb-6 text-xs sm:text-sm font-medium">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${step >= s ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"}`}
                  >
                    {step > s ? "✓" : s}
                  </span>
                  <span
                    className={step >= s ? "text-blue-600" : "text-gray-400"}
                  >
                    {s === 1 ? "Doctor" : s === 2 ? "Date/Time" : "Details"}
                  </span>
                  {s < 3 && <div className="w-4 sm:w-8 h-px bg-gray-300" />}
                </div>
              ))}
            </div>

            {/* Step 1 */}
            {step === 1 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Choose your doctor
                </h3>
                <div className="space-y-3">
                  {loadingDoctors ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                      <span className="h-8 w-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
                      <p className="text-sm text-gray-400">
                        Loading doctors...
                      </p>
                    </div>
                  ) : doctorsList.length === 0 ? (
                    <p className="text-center text-gray-400 py-8 text-sm">
                      No doctors available.
                    </p>
                  ) : null}
                  {!loadingDoctors &&
                    doctorsList.map((doc) => (
                      <button
                        key={doc.name}
                        onClick={() => {
                          setSelectedDoctor(doc.name);
                          setStep(2);
                        }}
                        className={`w-full text-left p-3 rounded-xl border-2 transition-all ${selectedDoctor === doc.name ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-blue-300"}`}
                      >
                        <div className="flex items-center gap-3">
                          <DoctorImage doc={doc} />
                          <div>
                            <p className="font-semibold text-gray-900">
                              {doc.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {doc.specialty}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  {selectedDoctor} — Choose date & time
                </h3>
                <input
                  type="date"
                  min={today}
                  value={selectedDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val && val < today) {
                      toast.error("Please select today or a future date.");
                      setSelectedDate(today);
                      return;
                    }
                    setSelectedDate(val);
                  }}
                  className="w-full border rounded-xl px-4 py-3 text-sm mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                {selectedDate && (
                  <div className="relative">
                    {loadingSlots && (
                      <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-xl z-10">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-2">
                      {availableSlots.map((slot) => {
                        const booked = bookedSlots.includes(slot);
                        return (
                          <button
                            key={slot}
                            disabled={booked}
                            onClick={() => setSelectedTime(slot)}
                            className={`py-2 text-sm rounded-xl border transition-all ${selectedTime === slot ? "bg-blue-600 text-white border-blue-600" : booked ? "bg-gray-100 text-gray-400 line-through border-gray-200 cursor-not-allowed" : "border-gray-200 hover:border-blue-300"}`}
                          >
                            {slot}
                            {booked && (
                              <span className="block text-xs text-red-400">
                                Full
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {bookedSlots.length > 0 && (
                      <p className="text-xs text-gray-400 mt-2">
                        {bookedSlots.length} slot(s) already booked
                      </p>
                    )}
                  </div>
                )}
                <div className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="rounded-xl"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    disabled={!selectedDate || !selectedTime}
                    className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Your details</h3>
                <div className="mb-3">
                  <input
                    type="text"
                    placeholder="Full name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name)
                        setErrors({ ...errors, name: undefined });
                    }}
                    className={`w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 outline-none ${errors.name ? "border-red-300 focus:ring-red-500" : "border-slate-200 focus:ring-blue-500"}`}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                  )}
                </div>
                <div className="mb-3">
                  <input
                    type="tel"
                    placeholder="Phone (03XX-XXXXXXX)"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errors.phone)
                        setErrors({ ...errors, phone: undefined });
                    }}
                    className={`w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 outline-none ${errors.phone ? "border-red-300 focus:ring-red-500" : "border-slate-200 focus:ring-blue-500"}`}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                  )}
                </div>
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="rounded-xl"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => {
                      const newErrors: { name?: string; phone?: string } = {};
                      if (!name.trim()) newErrors.name = "Name required.";
                      if (!phone.trim()) newErrors.phone = "Phone required.";
                      setErrors(newErrors);
                      if (Object.keys(newErrors).length > 0) return;
                      setReviewing(true);
                    }}
                    className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex-1"
                  >
                    Review Booking
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
