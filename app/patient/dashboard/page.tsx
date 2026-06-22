"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
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
  Star, // ← Added import
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Appointment {
  _id: string;
  name: string;
  phone: string;
  doctor: string;
  date: string;
  time: string;
  message?: string;
  status: "pending" | "confirmed" | "cancelled";
  rating?: number | null; // ← Added rating field
  createdAt: string;
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
            className={`h-5 w-5 transition-colors ${
              s <= (hovered ?? 0)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function parseAppointmentDate(date: string, time: string): Date {
  const [timePart, modifier] = time.split(" ");
  let [hours, minutes] = timePart.split(":").map(Number);
  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;
  const d = new Date(date);
  d.setHours(hours, minutes || 0, 0, 0);
  return d;
}

function StatusBadge({ status }: { status: Appointment["status"] }) {
  const styles = {
    confirmed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    pending: "bg-yellow-100 text-yellow-700",
  };
  return (
    <span
      className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-medium ${styles[status]}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
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

  const handleSave = async () => {
    if (!date || !time) {
      toast.error("Please select a date and time.");
      return;
    }
    if (date === appointment.date && time === appointment.time) {
      toast.error("Please choose a different date or time.");
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
        <div>
          <label className="text-xs text-gray-500 mb-1 block">New time</label>
          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            {TIME_SLOTS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
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

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && session?.user?.role !== "patient") {
      router.push(
        session?.user?.role === "admin" ? "/admin" : "/doctor/dashboard",
      );
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user?.name) setName(session.user.name);
  }, [session]);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/appointments/me");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAppointments(data);
    } catch {
      toast.error("Failed to load your appointments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") fetchAppointments();
  }, [status, fetchAppointments]);

  const cancelAppointment = async (id: string) => {
    setCancellingId(id);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (!res.ok) throw new Error();
      setAppointments((prev) =>
        prev.map((a) => (a._id === id ? { ...a, status: "cancelled" } : a)),
      );
      toast.success("Appointment cancelled.");
    } catch {
      toast.error("Failed to cancel appointment.");
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
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, time }),
      });
      if (!res.ok) throw new Error();
      setAppointments((prev) =>
        prev.map((a) => (a._id === id ? { ...a, date, time } : a)),
      );
      setReschedulingId(null);
      toast.success("Appointment rescheduled.");
    } catch {
      toast.error("Failed to reschedule appointment.");
    }
  };

  const saveProfile = async () => {
    if (newPassword && newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    if (newPassword && !currentPassword) {
      toast.error("Enter your current password to set a new one.");
      return;
    }
    setSavingProfile(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          ...(newPassword ? { currentPassword, newPassword } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile.");
      toast.success("Profile updated.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update profile.",
      );
    } finally {
      setSavingProfile(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  const now = new Date();
  const upcoming = appointments.filter(
    (a) =>
      a.status !== "cancelled" &&
      parseAppointmentDate(a.date, a.time || "00:00") >= now,
  );
  const past = appointments.filter(
    (a) =>
      a.status !== "cancelled" &&
      parseAppointmentDate(a.date, a.time || "00:00") < now,
  );
  const cancelled = appointments.filter((a) => a.status === "cancelled");

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
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
              onClick={fetchAppointments}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors"
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
            Here's what's happening with your appointments.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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

        {/* Appointments list */}
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
              <div className="px-5 py-12 text-center text-gray-400">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No appointments yet.</p>
              </div>
            )}

            {!loading &&
              appointments.map((a) => (
                <div key={a._id}>
                  {/* Appointment row */}
                  <div className="px-5 py-4 flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-40">
                      <p className="text-sm font-medium text-gray-900">
                        {a.doctor}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" /> {a.date} at {a.time}
                      </p>
                    </div>
                    <StatusBadge status={a.status} />
                    {a.status !== "cancelled" && (
                      <div className="flex gap-2">
                        {parseAppointmentDate(a.date, a.time || "00:00") >=
                          now && (
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
                            {reschedulingId === a._id ? "Close" : "Reschedule"}
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
                  </div>

                  {/* Inline reschedule panel */}
                  {reschedulingId === a._id && (
                    <ReschedulePanel
                      appointment={a}
                      onDone={rescheduleAppointment}
                      onCancel={() => setReschedulingId(null)}
                    />
                  )}

                  {/* ← Star rating for confirmed past appointments */}
                  {a.status === "confirmed" &&
                    parseAppointmentDate(a.date, a.time || "00:00") < now && (
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
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                Phone
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="03XX-XXXXXXX"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
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
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
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
