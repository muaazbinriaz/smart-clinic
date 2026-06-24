"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import {
  CheckCircle2,
  Loader2,
  CalendarPlus,
  Download,
  X,
  Calendar,
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

// ─── Calendar helpers ─────────────────────────────────────────────
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
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const hours = timeTo24h(timeStr) + Math.floor(offsetMinutes / 60);
  const mins = offsetMinutes % 60;
  date.setHours(hours, mins, 0, 0);
  return date
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
  const dataUri =
    "data:text/calendar;charset=utf-8," + encodeURIComponent(icsContent);
  const link = document.createElement("a");
  link.href = dataUri;
  link.download = "smartclinic-appointment.ics";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ─── Date helpers ─────────────────────────────────────────────────
function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isDateInPast(dateStr: string): boolean {
  return dateStr < getTodayString();
}

function isSunday(dateStr: string): boolean {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).getDay() === 0;
}

function isSlotInPast(timeStr: string): boolean {
  const now = new Date();
  const [time, modifier] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;
  const slotMinutes = hours * 60 + (minutes || 0);
  const nowMinutes = now.getHours() * 60 + now.getMinutes() + 15;
  return slotMinutes <= nowMinutes;
}

// Format date for display: "Mon, 24 Jun 2026"
function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-PK", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Doctor image with fallback ───────────────────────────────────
function getFallbackImage(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=128&background=0D6EFD&color=fff&bold=true`;
}

function DoctorImage({ doc }: { doc: any }) {
  const [src, setSrc] = useState(doc.img || getFallbackImage(doc.name));
  const [errored, setErrored] = useState(false);
  return (
    <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
      <Image
        src={src}
        alt={doc.name}
        fill
        className="object-cover object-top"
        onError={() => {
          if (!errored) {
            setSrc(getFallbackImage(doc.name));
            setErrored(true);
          }
        }}
        unoptimized
      />
    </div>
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
  const dateInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    setLoadingDoctors(true);
    fetch("/api/doctors")
      .then((r) => r.json())
      .then((data) => setDoctorsList(Array.isArray(data) ? data : []))
      .catch(() => setDoctorsList([]))
      .finally(() => setLoadingDoctors(false));
  }, []);

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
      // Prevent body scroll when modal open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (open && initialDoctor && doctorsList.length > 0) {
      const match = doctorsList.find(
        (d) =>
          d.name.toLowerCase().includes(initialDoctor.toLowerCase()) ||
          initialDoctor.toLowerCase().includes(d.name.toLowerCase()),
      );
      if (match) {
        setSelectedDoctor(match.name);
        setAvailableSlots(
          Array.isArray(match.workingHours) && match.workingHours.length > 0
            ? match.workingHours
            : TIME_SLOTS,
        );
        setStep(2);
      }
    }
  }, [open, initialDoctor, doctorsList]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const fetchBookedSlots = useCallback(
    async (doctorName: string, date: string) => {
      setLoadingSlots(true);
      setBookedSlots([]);
      try {
        const res = await fetch(
          `/api/appointments/slots?doctor=${encodeURIComponent(doctorName)}&date=${date}`,
        );
        const data = await res.json();
        setBookedSlots(data.bookedSlots ?? []);
      } catch {
        setBookedSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    },
    [],
  );

  const handleDoctorSelect = (doc: any) => {
    setSelectedDoctor(doc.name);
    setSelectedDate("");
    setSelectedTime("");
    setBookedSlots([]);
    setAvailableSlots(
      Array.isArray(doc.workingHours) && doc.workingHours.length > 0
        ? doc.workingHours
        : TIME_SLOTS,
    );
    setStep(2);
  };

  const handleDateChange = (val: string) => {
    if (!val) {
      setSelectedDate("");
      setSelectedTime("");
      setBookedSlots([]);
      return;
    }

    if (isDateInPast(val)) {
      toast.error("Please select today or a future date.");
      const today = getTodayString();
      setSelectedDate(today);
      setSelectedTime("");
      fetchBookedSlots(selectedDoctor, today);
      return;
    }

    if (isSunday(val)) {
      toast.error("We're closed on Sundays. Please choose another day.");
      setSelectedDate("");
      setSelectedTime("");
      setBookedSlots([]);
      return;
    }

    setSelectedTime("");
    setSelectedDate(val);
    fetchBookedSlots(selectedDoctor, val);
  };

  useEffect(() => {
    if (selectedTime && bookedSlots.includes(selectedTime)) {
      setSelectedTime("");
      toast.error("That slot was just taken. Please choose another time.");
    }
  }, [bookedSlots, selectedTime]);

  const handleSubmit = async () => {
    const newErrors: { name?: string; phone?: string } = {};
    if (!name.trim()) newErrors.name = "Full name is required.";
    if (!phone.trim()) newErrors.phone = "Phone number is required.";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);

    try {
      const slotsRes = await fetch(
        `/api/appointments/slots?doctor=${encodeURIComponent(selectedDoctor)}&date=${selectedDate}`,
      );
      const slotsData = await slotsRes.json();
      const currentlyBooked: string[] = slotsData.bookedSlots ?? [];
      if (currentlyBooked.includes(selectedTime)) {
        toast.error("This slot was just booked. Please choose another time.");
        setBookedSlots(currentlyBooked);
        setSelectedTime("");
        setSubmitting(false);
        setReviewing(false);
        setStep(2);
        return;
      }
    } catch {
      // Non-fatal
    }

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          doctor: selectedDoctor,
          date: selectedDate,
          time: selectedTime,
        }),
      });

      if (res.status === 409) {
        const data = await res.json();
        toast.error(
          data.error || "Slot already booked. Please choose another time.",
        );
        setReviewing(false);
        setStep(2);
        setSelectedTime("");
        fetchBookedSlots(selectedDoctor, selectedDate);
        setSubmitting(false);
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Booking failed");
      }

      setDone(true);
      toast.success("Appointment booked successfully!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to book appointment.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const today = getTodayString();
  const step2CanContinue = !!selectedDate && !!selectedTime && !loadingSlots;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal header bar ─── */}
        {!done && (
          <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between rounded-t-2xl">
            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-0.5">
                SmartClinic AI
              </p>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                {done
                  ? "Booking Confirmed"
                  : reviewing
                    ? "Review Booking"
                    : step === 1
                      ? "Choose Doctor"
                      : step === 2
                        ? "Select Date & Time"
                        : "Your Details"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-all"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        )}

        <div className="p-5">
          {/* ── Done ──────────────────────────────────────────────── */}
          {done ? (
            <div className="text-center py-8 space-y-4">
              {/* Close button for done state */}
              <div className="flex justify-end mb-2">
                <button
                  onClick={onClose}
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all"
                >
                  <X className="h-4 w-4" strokeWidth={2.5} />
                </button>
              </div>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-9 w-9 text-green-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">
                  You're all set!
                </h3>
                <p className="text-slate-500 text-sm">
                  Appointment booked with{" "}
                  <span className="font-semibold text-slate-700">
                    {selectedDoctor}
                  </span>
                </p>
                <div className="inline-flex items-center gap-2 mt-3 bg-blue-50 text-blue-700 text-sm font-medium px-4 py-2 rounded-full">
                  <Calendar className="h-4 w-4" />
                  {formatDisplayDate(selectedDate)} · {selectedTime}
                </div>
              </div>
              <div className="flex flex-col gap-2.5 pt-2">
                <Button
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white h-11"
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
                  <CalendarPlus className="h-4 w-4 mr-2" />
                  Add to Google Calendar
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl h-11"
                  onClick={() =>
                    downloadIcsFile(selectedDate, selectedTime, selectedDoctor)
                  }
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download .ics File
                </Button>
                <button
                  onClick={onClose}
                  className="text-sm text-slate-400 hover:text-slate-600 py-2 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : reviewing ? (
            /* ── Review ─────────────────────────────────────────── */
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                {[
                  ["Doctor", selectedDoctor],
                  ["Date", formatDisplayDate(selectedDate)],
                  ["Time", selectedTime],
                  ["Name", name],
                  ["Phone", phone],
                  ...(email ? [["Email", email]] : []),
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between items-center"
                  >
                    <span className="text-sm text-slate-400 font-medium">
                      {label}
                    </span>
                    <span className="text-sm font-semibold text-slate-800">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-1">
                <Button
                  variant="outline"
                  onClick={() => setReviewing(false)}
                  className="rounded-xl flex-1 h-11"
                  disabled={submitting}
                >
                  Edit
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex-1 h-11"
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
            /* ── Steps ──────────────────────────────────────────── */
            <>
              {/* Step indicator */}
              <div className="flex items-center mb-6">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center flex-1">
                    <div className="flex flex-col items-center gap-1">
                      <span
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          step > s
                            ? "bg-blue-600 text-white"
                            : step === s
                              ? "bg-blue-600 text-white ring-4 ring-blue-100"
                              : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {step > s ? "✓" : s}
                      </span>
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wide ${
                          step >= s ? "text-blue-600" : "text-slate-400"
                        }`}
                      >
                        {s === 1 ? "Doctor" : s === 2 ? "Date/Time" : "Details"}
                      </span>
                    </div>
                    {s < 3 && (
                      <div
                        className={`flex-1 h-0.5 mx-2 mb-5 rounded-full transition-all ${
                          step > s ? "bg-blue-600" : "bg-slate-200"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* ── Step 1: Choose doctor ────────────────────────── */}
              {step === 1 && (
                <div>
                  <div className="space-y-3">
                    {loadingDoctors ? (
                      <div className="flex flex-col items-center justify-center py-10 gap-3">
                        <span className="h-8 w-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
                        <p className="text-sm text-slate-400">
                          Loading doctors...
                        </p>
                      </div>
                    ) : doctorsList.length === 0 ? (
                      <p className="text-center text-slate-400 py-8 text-sm">
                        No doctors available.
                      </p>
                    ) : (
                      doctorsList.map((doc) => (
                        <button
                          key={doc.name}
                          onClick={() => handleDoctorSelect(doc)}
                          className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                            selectedDoctor === doc.name
                              ? "border-blue-600 bg-blue-50"
                              : "border-slate-100 hover:border-blue-200 bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <DoctorImage doc={doc} />
                            <div>
                              <p className="font-bold text-slate-900 text-sm">
                                {doc.name}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {doc.specialty}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* ── Step 2: Date & time ──────────────────────────── */}
              {step === 2 && (
                <div>
                  {/* Date input — mobile-friendly with visible calendar icon */}
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Select Date
                  </label>
                  <div className="relative mb-4">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-blue-500">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <input
                      type="date"
                      ref={dateInputRef}
                      min={today}
                      value={selectedDate}
                      onChange={(e) => handleDateChange(e.target.value)}
                      onKeyDown={(e) => e.preventDefault()}
                      className="w-full border-2 border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer bg-white text-slate-700 transition-all"
                      style={{ colorScheme: "light" }}
                    />
                  </div>

                  {selectedDate && (
                    <div className="flex items-center gap-2 mb-4 bg-blue-50 rounded-xl px-3 py-2">
                      <Calendar className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      <span className="text-sm font-semibold text-blue-700">
                        {formatDisplayDate(selectedDate)}
                      </span>
                      {isSunday(selectedDate) && (
                        <span className="text-xs text-red-500 ml-auto">
                          Closed Sundays
                        </span>
                      )}
                    </div>
                  )}

                  {selectedDate && !isSunday(selectedDate) && (
                    <div className="relative">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Select Time
                      </label>
                      {loadingSlots && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-xl z-10">
                          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                        </div>
                      )}
                      {availableSlots.length === 0 ? (
                        <p className="text-sm text-slate-400 py-4 text-center">
                          No time slots configured for this doctor.
                        </p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {availableSlots.map((slot) => {
                            const booked = bookedSlots.includes(slot);
                            const isPast =
                              selectedDate === getTodayString() &&
                              isSlotInPast(slot);
                            const disabled = booked || isPast || loadingSlots;
                            return (
                              <button
                                key={slot}
                                disabled={disabled}
                                onClick={() =>
                                  !disabled && setSelectedTime(slot)
                                }
                                className={`py-2.5 text-sm font-medium rounded-xl border-2 transition-all ${
                                  selectedTime === slot
                                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                    : booked
                                      ? "bg-slate-50 text-slate-300 line-through border-slate-100 cursor-not-allowed"
                                      : isPast
                                        ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                                        : "border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700"
                                }`}
                              >
                                {slot}
                                {booked && (
                                  <span className="block text-[10px] text-red-400 font-normal">
                                    Booked
                                  </span>
                                )}
                                {isPast && !booked && (
                                  <span className="block text-[10px] text-slate-300 font-normal">
                                    Passed
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {bookedSlots.length > 0 && (
                        <p className="text-xs text-slate-400 mt-2">
                          {bookedSlots.length} slot(s) already booked today
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-3 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="rounded-xl h-11"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={() => setStep(3)}
                      disabled={!step2CanContinue}
                      className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex-1 h-11"
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              )}

              {/* ── Step 3: Patient details ──────────────────────── */}
              {step === 3 && (
                <div>
                  <div className="mb-3">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ali Hassan"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (errors.name)
                          setErrors({ ...errors, name: undefined });
                      }}
                      className={`w-full border-2 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 outline-none transition-all ${
                        errors.name
                          ? "border-red-300 focus:ring-red-500"
                          : "border-slate-200 focus:ring-blue-500 focus:border-blue-500"
                      }`}
                    />
                    {errors.name && (
                      <p className="text-red-500 text-xs mt-1 font-medium">
                        {errors.name}
                      </p>
                    )}
                  </div>
                  <div className="mb-3">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="03XX-XXXXXXX"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (errors.phone)
                          setErrors({ ...errors, phone: undefined });
                      }}
                      className={`w-full border-2 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 outline-none transition-all ${
                        errors.phone
                          ? "border-red-300 focus:ring-red-500"
                          : "border-slate-200 focus:ring-blue-500 focus:border-blue-500"
                      }`}
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-xs mt-1 font-medium">
                        {errors.phone}
                      </p>
                    )}
                  </div>
                  <div className="mb-5">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Email{" "}
                      <span className="normal-case text-slate-400 font-normal">
                        (optional)
                      </span>
                    </label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setStep(2)}
                      className="rounded-xl h-11"
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
                      className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex-1 h-11"
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
    </div>
  );
}
