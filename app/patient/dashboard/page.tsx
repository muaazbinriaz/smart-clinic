"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";

import {
  Stethoscope,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  LogOut,
  User as UserIcon,
  RefreshCw,
  CalendarPlus,
  Lock,
  Loader2,
  CalendarClock,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────────
interface Appointment {
  _id: string;
  name: string;
  phone: string;
  doctor: string;
  date: string;
  time: string;
  message?: string;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "no-show";
  rating?: number | null;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────
function parseAppointmentDate(dateStr: string, timeStr: string): Date | null {
  try {
    const t = timeStr.toLowerCase();
    const [hhmm, ampm] = t.split(" ");
    let [h, m] = hhmm.split(":").map(Number);
    if (ampm === "pm" && h !== 12) h += 12;
    if (ampm === "am" && h === 12) h = 0;
    const iso = `${dateStr}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
    return new Date(iso);
  } catch {
    return null;
  }
}

function isPast(appt: Appointment): boolean {
  const d = parseAppointmentDate(appt.date, appt.time || "00:00");
  return d ? d < new Date() : false;
}

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

// ─── Status Badge ────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Appointment["status"] }) {
  const styles: Record<Appointment["status"], string> = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    completed: "bg-blue-100 text-blue-700",
    "no-show": "bg-orange-100 text-orange-700",
  };
  return (
    <span
      className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-medium ${styles[status]}`}
    >
      {status === "no-show"
        ? "No‑Show"
        : status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ─── Star Rating ──────────────────────────────────────────────────────
function StarRating({
  appointmentId,
  existingRating,
  onRated,
}: {
  appointmentId: string;
  existingRating: number | null;
  onRated: (id: string, rating: number) => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(!!existingRating);
  const display = existingRating ?? 0;

  if (done) {
    return (
      <div className="flex items-center gap-1 mt-2">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`h-4 w-4 ${s <= display ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`}
          />
        ))}
        <span className="text-xs text-gray-400 ml-1">Your rating</span>
      </div>
    );
  }

  const handleRate = async (rating: number) => {
    setSubmitting(true);
    try {
      await fetch(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });
      setDone(true);
      onRated(appointmentId, rating);
      toast.success("Thanks for your rating!");
    } catch {
      toast.error("Failed to submit rating.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center gap-1 mt-2">
      <span className="text-xs text-gray-400 mr-1">Rate:</span>
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          disabled={submitting}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => handleRate(s)}
          className="disabled:opacity-50"
        >
          <Star
            className={`h-5 w-5 transition-colors ${s <= (hovered ?? 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Reschedule Panel (unchanged) ────────────────────────────────────
function ReschedulePanel({
  appointment,
  onDone,
  onCancel,
}: {
  appointment: Appointment;
  onDone: (id: string, date: string, time: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [date, setDate] = useState(appointment.date);
  const [time, setTime] = useState(appointment.time);
  const [saving, setSaving] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (appointment.doctor && date) {
      setLoadingSlots(true);
      fetch(
        `/api/appointments/slots?doctor=${encodeURIComponent(appointment.doctor)}&date=${date}`,
      )
        .then((r) => r.json())
        .then((data) => setBookedSlots(data.bookedSlots ?? []))
        .catch(() => setBookedSlots([]))
        .finally(() => setLoadingSlots(false));
    }
  }, [appointment.doctor, date]);

  useEffect(() => {
    if (bookedSlots.includes(time)) setTime("");
  }, [bookedSlots, time]);

  const handleSave = async () => {
    if (!date || !time) {
      toast.error("Select date and time.");
      return;
    }
    if (bookedSlots.includes(time)) {
      toast.error("Slot unavailable.");
      return;
    }
    if (date === appointment.date && time === appointment.time) {
      toast.error("Same slot.");
      return;
    }
    setSaving(true);
    await onDone(appointment._id, date, time);
    setSaving(false);
  };

  return (
    <div className="px-5 pb-4 bg-blue-50/50 border-t border-blue-100">
      <p className="text-xs font-medium text-blue-700 pt-3 mb-3 flex items-center gap-1.5">
        <CalendarClock className="h-3.5 w-3.5" /> Reschedule —{" "}
        {appointment.doctor}
      </p>
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">New date</label>
          <input
            type="date"
            value={date}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs text-gray-500 mb-1 block">New time</label>
          {loadingSlots ? (
            <div className="flex items-center gap-2 px-3 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-xs text-gray-400">
                Checking availability...
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {TIME_SLOTS.map((t) => {
                const booked = bookedSlots.includes(t);
                return (
                  <button
                    key={t}
                    disabled={booked}
                    onClick={() => setTime(t)}
                    className={`py-2 text-sm rounded-xl border transition-all ${
                      time === t
                        ? "bg-blue-600 text-white border-blue-600"
                        : booked
                          ? "bg-gray-100 text-gray-400 line-through border-gray-200 cursor-not-allowed"
                          : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    {t}
                    {booked && (
                      <span className="block text-xs text-red-400">Full</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          {!loadingSlots && bookedSlots.length > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              {bookedSlots.length} slot(s) already booked
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs h-9 px-4"
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Confirm"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onCancel}
            disabled={saving}
            className="rounded-lg text-xs h-9 px-3 text-gray-500"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard Component ────────────────────────────────────────
export default function PatientDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileErrors, setProfileErrors] = useState<{
    name?: string;
    phone?: string;
    newPassword?: string;
  }>({});

  useEffect(() => {
    if (session?.user?.name) setName(session.user.name);
  }, [session]);

  // ── Fetch appointments with silent refresh support ─────────────────
  const fetchAppointments = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch("/api/appointments/me");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAppointments(data);
    } catch {
      toast.error("Failed to load appointments.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (status === "authenticated") fetchAppointments(true);
  }, [status, fetchAppointments]);

  const cancelAppointment = async (id: string) => {
    setCancellingId(id);
    try {
      await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      setAppointments((prev) =>
        prev.map((a) => (a._id === id ? { ...a, status: "cancelled" } : a)),
      );
      toast.success("Cancelled.");
    } catch {
      toast.error("Failed.");
    } finally {
      setCancellingId(null);
    }
  };

  const rescheduleAppointment = async (
    id: string,
    date: string,
    time: string,
  ) => {
    try {
      await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, time }),
      });
      setAppointments((prev) =>
        prev.map((a) => (a._id === id ? { ...a, date, time } : a)),
      );
      setReschedulingId(null);
      toast.success("Rescheduled.");
    } catch {
      toast.error("Failed.");
    }
  };

  const saveProfile = async () => {
    const newErrors: { name?: string; phone?: string; newPassword?: string } =
      {};

    if (!name.trim()) newErrors.name = "Name is required.";
    if (phone.trim() && !/^03\d{2}-\d{7}$/.test(phone.trim())) {
      newErrors.phone = "Enter a valid number (03XX-XXXXXXX).";
    }
    if (newPassword && newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters.";
    }
    if (newPassword && !currentPassword) {
      newErrors.newPassword = "Current password is required to set a new one.";
    }

    setProfileErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSavingProfile(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || undefined,
          ...(newPassword ? { currentPassword, newPassword } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile.");
      toast.success("Profile updated.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed.");
    } finally {
      setSavingProfile(false);
    }
  };

  // No status === "loading" unmount – middleware handles auth

  const now = new Date();
  const upcoming = appointments.filter((a) => {
    const d = parseAppointmentDate(a.date, a.time || "00:00");
    return (
      a.status !== "cancelled" &&
      a.status !== "no-show" &&
      d !== null &&
      d >= now
    );
  });
  const past = appointments.filter((a) => {
    const d = parseAppointmentDate(a.date, a.time || "00:00");
    return (
      (a.status === "confirmed" || a.status === "completed") &&
      d !== null &&
      d < now
    );
  });
  const cancelled = appointments.filter(
    (a) => a.status === "cancelled" || a.status === "no-show",
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <div className="bg-blue-600 rounded-lg p-1.5">
            <Stethoscope className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            SmartClinic
          </span>
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={() => fetchAppointments(false)} // silent refresh
              className="p-2 text-gray-400 hover:text-blue-600"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {session?.user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Here's your appointment summary.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard
            label="Upcoming"
            value={upcoming.length}
            icon={Calendar}
            color="text-blue-600 bg-blue-50"
          />
          <KpiCard
            label="Completed"
            value={past.length}
            icon={CheckCircle2}
            color="text-green-600 bg-green-50"
          />
          <KpiCard
            label="Cancelled"
            value={cancelled.length}
            icon={XCircle}
            color="text-red-600 bg-red-50"
          />
        </div>

        <div className="flex justify-end">
          <Button
            onClick={() => router.push("/")}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold"
          >
            <CalendarPlus className="h-4 w-4 mr-2" /> Book new appointment
          </Button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Your appointments</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {loading &&
              [1, 2, 3].map((i) => (
                <div key={i} className="px-5 py-4 animate-pulse">
                  <div className="h-4 bg-gray-100 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              ))}
            {!loading && appointments.length === 0 && (
              <EmptyState
                icon={Calendar}
                title="No appointments yet"
                description="Book your first appointment from the homepage."
              />
            )}
            {!loading &&
              appointments.map((a) => (
                <div key={a._id}>
                  <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-40">
                      <p className="text-sm font-medium text-gray-900">
                        {a.doctor}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" /> {a.date} at {a.time}
                      </p>
                    </div>
                    <StatusBadge status={a.status} />
                    {a.status !== "cancelled" &&
                      a.status !== "no-show" &&
                      a.status !== "completed" && (
                        <div className="flex flex-wrap gap-2">
                          {(() => {
                            const d = parseAppointmentDate(
                              a.date,
                              a.time || "00:00",
                            );
                            return d !== null && d >= now;
                          })() && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-blue-600 border-blue-200 hover:bg-blue-50 rounded-lg text-xs h-7 px-3"
                              onClick={() =>
                                setReschedulingId(
                                  reschedulingId === a._id ? null : a._id,
                                )
                              }
                            >
                              <CalendarClock className="h-3 w-3 mr-1" />
                              {reschedulingId === a._id
                                ? "Close"
                                : "Reschedule"}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={cancellingId === a._id}
                            className="text-red-600 border-red-200 hover:bg-red-50 rounded-lg text-xs h-7 px-3"
                            onClick={() => cancelAppointment(a._id)}
                          >
                            {cancellingId === a._id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Cancel"
                            )}
                          </Button>
                        </div>
                      )}
                    {a.status === "no-show" && (
                      <span className="text-xs text-gray-400">
                        You missed this appointment.
                      </span>
                    )}
                  </div>
                  {reschedulingId === a._id && (
                    <ReschedulePanel
                      appointment={a}
                      onDone={rescheduleAppointment}
                      onCancel={() => setReschedulingId(null)}
                    />
                  )}
                  {(a.status === "completed" ||
                    (a.status === "confirmed" && isPast(a))) && (
                    <div className="px-5 pb-4">
                      <StarRating
                        appointmentId={a._id}
                        existingRating={a.rating ?? null}
                        onRated={(id, rating) =>
                          setAppointments((prev) =>
                            prev.map((apt) =>
                              apt._id === id ? { ...apt, rating } : apt,
                            ),
                          )
                        }
                      />
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* Profile settings */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-blue-600" /> Profile settings
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                Full name
              </label>
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (profileErrors.name)
                    setProfileErrors({ ...profileErrors, name: undefined });
                }}
                className={`w-full px-3 py-2 text-sm border rounded-xl focus:ring-2 outline-none ${
                  profileErrors.name
                    ? "border-red-300 focus:ring-red-500"
                    : "border-slate-200 focus:ring-blue-500"
                }`}
              />
              {profileErrors.name && (
                <p className="text-red-500 text-xs mt-1">
                  {profileErrors.name}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                Phone
              </label>
              <input
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (profileErrors.phone)
                    setProfileErrors({ ...profileErrors, phone: undefined });
                }}
                placeholder="03XX-XXXXXXX"
                className={`w-full px-3 py-2 text-sm border rounded-xl focus:ring-2 outline-none ${
                  profileErrors.phone
                    ? "border-red-300 focus:ring-red-500"
                    : "border-slate-200 focus:ring-blue-500"
                }`}
              />
              {profileErrors.phone && (
                <p className="text-red-500 text-xs mt-1">
                  {profileErrors.phone}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                Email
              </label>
              <input
                value={session?.user?.email ?? ""}
                disabled
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-gray-50 text-gray-400"
              />
            </div>
          </div>
          <div className="border-t border-gray-100 pt-4 mt-2">
            <p className="text-xs font-medium text-gray-500 mb-3 flex items-center gap-1">
              <Lock className="h-3 w-3" /> Change password (optional)
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <div>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (profileErrors.newPassword)
                      setProfileErrors({
                        ...profileErrors,
                        newPassword: undefined,
                      });
                  }}
                  placeholder="New password"
                  className={`w-full px-3 py-2 text-sm border rounded-xl focus:ring-2 outline-none ${
                    profileErrors.newPassword
                      ? "border-red-300 focus:ring-red-500"
                      : "border-slate-200 focus:ring-blue-500"
                  }`}
                />
                {profileErrors.newPassword && (
                  <p className="text-red-500 text-xs mt-1">
                    {profileErrors.newPassword}
                  </p>
                )}
              </div>
            </div>
          </div>
          <Button
            onClick={saveProfile}
            disabled={savingProfile}
            className="mt-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold"
          >
            {savingProfile ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Save changes
          </Button>
        </div>
      </main>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className={`inline-flex p-2.5 rounded-xl ${color} mb-3`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}
