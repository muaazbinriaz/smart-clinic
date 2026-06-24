"use client";
import { useState, useEffect, useCallback } from "react";
import { Pencil, Trash2, Plus, X } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

import AdminSessionTimeout from "@/components/AdminSessionTimeout";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Stethoscope,
  LayoutDashboard,
  Calendar,
  Users,
  LogOut,
  Menu,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  TrendingUp,
  ChevronDown,
  UserCheck,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import AdminAnalytics from "@/components/AdminAnalytics";

// ─── TYPES ───────────────────────────────────────────────────────────
interface Appointment {
  _id: string;
  name: string;
  phone: string;
  doctor: string;
  date: string;
  time: string;
  message?: string;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "no-show";
  createdAt: string;
}

interface Doctor {
  _id: string;
  name: string;
  slug: string;
  specialty: string;
  exp?: string;
  fee: number;
  bio?: string;
  img?: string;
  available: boolean;
  rating?: number;
  workingHours: string[];
  createdAt: string;
}

type Tab = "dashboard" | "appointments" | "doctors" | "analytics";

// ─── SPINNER ─────────────────────────────────────────────────────────
function Spinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const s =
    size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-6 w-6" : "h-4 w-4";
  return (
    <span className="inline-flex items-center justify-center">
      <span
        className={`${s} rounded-full border-2 border-current border-t-transparent animate-spin opacity-80`}
      />
    </span>
  );
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Appointment["status"] }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    completed: "bg-blue-100 text-blue-700",
    "no-show": "bg-orange-100 text-orange-700",
  };
  const safeStatus = status || "pending";
  const style = styles[safeStatus] || styles.pending;
  return (
    <span
      className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-medium ${style}`}
    >
      {safeStatus === "no-show"
        ? "No‑Show"
        : safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1)}
    </span>
  );
}

// ─── KPI CARD ─────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm">
      <div className={`inline-flex p-2.5 rounded-xl ${color} mb-3`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}

// ─── APPOINTMENT CARD (mobile) ────────────────────────────────────────
function AppointmentCard({
  a,
  updatingId,
  updateStatus,
}: {
  a: Appointment;
  updatingId: string | null;
  updateStatus: (id: string, status: Appointment["status"]) => void;
}) {
  const past = isPast(a);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-gray-900 text-sm">{a.name}</p>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <Phone className="h-3 w-3" /> {a.phone}
          </p>
        </div>
        <StatusBadge status={a.status} />
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
        <Calendar className="h-3.5 w-3.5 text-blue-500 shrink-0" />
        <span className="font-medium text-gray-700">{a.doctor}</span>
        <span className="ml-auto">
          {a.date} · {a.time}
        </span>
      </div>
      <div className="flex gap-2 flex-wrap">
        {a.status === "pending" && (
          <>
            <Button
              size="sm"
              disabled={updatingId === a._id}
              className="bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs h-9 px-3 flex-1 min-w-[80px]"
              onClick={() => updateStatus(a._id, "confirmed")}
            >
              {updatingId === a._id ? <Spinner size="sm" /> : "Confirm"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={updatingId === a._id}
              className="text-red-600 border-red-200 hover:bg-red-50 rounded-lg text-xs h-9 px-3 flex-1 min-w-[80px]"
              onClick={() => updateStatus(a._id, "cancelled")}
            >
              {updatingId === a._id ? <Spinner size="sm" /> : "Cancel"}
            </Button>
          </>
        )}
        {a.status === "confirmed" && past && (
          <>
            <Button
              size="sm"
              disabled={updatingId === a._id}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs h-9 px-3 flex-1 min-w-[80px]"
              onClick={() => updateStatus(a._id, "completed")}
            >
              {updatingId === a._id ? <Spinner size="sm" /> : "Completed"}
            </Button>
            <Button
              size="sm"
              disabled={updatingId === a._id}
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs h-9 px-3 flex-1 min-w-[80px]"
              onClick={() => updateStatus(a._id, "no-show")}
            >
              {updatingId === a._id ? <Spinner size="sm" /> : "No‑Show"}
            </Button>
          </>
        )}
        {a.status === "confirmed" && !past && (
          <Button
            size="sm"
            variant="outline"
            disabled={updatingId === a._id}
            className="text-red-600 border-red-200 hover:bg-red-50 rounded-lg text-xs h-9 px-3 flex-1 min-w-[80px]"
            onClick={() => updateStatus(a._id, "cancelled")}
          >
            {updatingId === a._id ? <Spinner size="sm" /> : "Cancel"}
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── HELPER ──────────────────────────────────────────────────────────
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
  const d = parseAppointmentDate(appt.date, appt.time);
  if (!d) return false;
  // Use local time comparison — appointment date string is local date
  const now = new Date();
  return d < now;
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────
export default function AdminPanel() {
  const { data: session } = useSession();

  const [tab, setTab] = useState<Tab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDoctor, setFilterDoctor] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const [doctorsList, setDoctorsList] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [doctorModalOpen, setDoctorModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [savingDoctor, setSavingDoctor] = useState(false);

  const [deletingDoctorId, setDeletingDoctorId] = useState<string | null>(null);
  const [deleteConfirmDoctor, setDeleteConfirmDoctor] = useState<Doctor | null>(
    null,
  );

  const [formName, setFormName] = useState("");
  const [formSpecialty, setFormSpecialty] = useState("");
  const [formExp, setFormExp] = useState("");
  const [formFee, setFormFee] = useState("");
  const [formBio, setFormBio] = useState("");
  const [formImg, setFormImg] = useState("");
  const [formAvailable, setFormAvailable] = useState(true);
  const [formSlug, setFormSlug] = useState("");
  const [formWorkingHours, setFormWorkingHours] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");

  const fetchAppointments = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch("/api/appointments");
      const data = await res.json();
      setAppointments(Array.isArray(data) ? data : (data.appointments ?? []));
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments(true);
  }, [fetchAppointments]);

  useEffect(() => {
    if (tab === "dashboard" || tab === "appointments") {
      const id = setInterval(() => fetchAppointments(false), 30000);
      return () => clearInterval(id);
    }
  }, [tab, fetchAppointments]);

  const fetchDoctors = useCallback(async (silent = false) => {
    if (!silent) setLoadingDoctors(true);
    try {
      const res = await fetch("/api/doctors");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDoctorsList(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load doctors. Please try again.");
    } finally {
      setLoadingDoctors(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "doctors") fetchDoctors();
  }, [tab, fetchDoctors]);

  const updateStatus = async (id: string, newStatus: Appointment["status"]) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      setAppointments((prev) =>
        prev.map((a) => (a._id === id ? { ...a, status: newStatus } : a)),
      );
      toast.success(`Appointment marked as ${newStatus}.`);
    } catch {
      toast.error("Failed to update status. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openAddDoctor = () => {
    setEditingDoctor(null);
    setFormName("");
    setFormSpecialty("");
    setFormExp("");
    setFormFee("");
    setFormBio("");
    setFormImg("");
    setFormAvailable(true);
    setFormSlug("");
    setFormWorkingHours([
      "9:00 AM",
      "10:00 AM",
      "11:00 AM",
      "12:00 PM",
      "2:00 PM",
      "3:00 PM",
      "4:00 PM",
      "5:00 PM",
      "6:00 PM",
    ]);
    setImagePreview("");
    setDoctorModalOpen(true);
  };

  const openEditDoctor = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setFormName(doctor.name || "");
    setFormSpecialty(doctor.specialty || "");
    setFormExp(doctor.exp || "");
    setFormFee(doctor.fee ? String(doctor.fee) : "");
    setFormBio(doctor.bio || "");
    setFormImg(doctor.img || "");
    setFormAvailable(doctor.available ?? true);
    setFormSlug(doctor.slug || "");
    // Always use what came from the DB — even an empty array means "no slots selected"
    setFormWorkingHours(
      Array.isArray(doctor.workingHours) ? doctor.workingHours : [],
    );
    setImagePreview(doctor.img || "");
    setDoctorModalOpen(true);
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!,
      );
      formData.append("folder", "medibook/doctors");
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData },
      );
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setFormImg(data.secure_url);
      setImagePreview(data.secure_url);
      toast.success("Image uploaded successfully.");
    } catch {
      toast.error("Image upload failed. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDoctorSave = async () => {
    if (!formName.trim() || !formSpecialty.trim() || !formFee.trim()) {
      toast.error("Name, specialty, and fee are required.");
      return;
    }
    const payload = {
      name: formName.trim(),
      specialty: formSpecialty.trim(),
      exp: formExp.trim(),
      fee: Number(formFee),
      bio: formBio.trim(),
      img: formImg.trim(),
      available: formAvailable,
      slug: formSlug.trim() || undefined,
      workingHours: formWorkingHours,
    };
    setSavingDoctor(true);
    try {
      const url = editingDoctor
        ? `/api/doctors/${editingDoctor._id}`
        : "/api/doctors";
      const method = editingDoctor ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success(
          editingDoctor
            ? "Doctor updated successfully."
            : "Doctor added successfully.",
        );
        setDoctorModalOpen(false);
        fetchDoctors(true);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to save doctor.");
      }
    } catch {
      toast.error("Network error. Please check your connection.");
    } finally {
      setSavingDoctor(false);
    }
  };

  const handleDeleteDoctor = async (id: string) => {
    setDeletingDoctorId(id);
    try {
      const res = await fetch(`/api/doctors/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Doctor deleted successfully.");
        setDoctorsList((prev) => prev.filter((d) => d._id !== id));
        setDeleteConfirmDoctor(null);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to delete doctor.");
        setDeleteConfirmDoctor(null);
      }
    } catch {
      toast.error("Network error. Please check your connection.");
    } finally {
      setDeletingDoctorId(null);
    }
  };

  const doctorNames = [...new Set(appointments.map((a) => a.doctor))];
  const today = new Date().toISOString().split("T")[0];
  const todayCount = appointments.filter((a) => a.date === today).length;
  const pending = appointments.filter((a) => a.status === "pending").length;
  const confirmed = appointments.filter((a) => a.status === "confirmed").length;
  const cancelled = appointments.filter((a) => a.status === "cancelled").length;
  const completed = appointments.filter((a) => a.status === "completed").length;
  const noShow = appointments.filter((a) => a.status === "no-show").length;

  const filtered = appointments.filter((a) => {
    const matchSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.phone.includes(search) ||
      a.doctor.toLowerCase().includes(search.toLowerCase());
    const matchDoctor = filterDoctor === "all" || a.doctor === filterDoctor;
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    const matchFrom = !dateFrom || a.date >= dateFrom;
    const matchTo = !dateTo || a.date <= dateTo;
    return matchSearch && matchDoctor && matchStatus && matchFrom && matchTo;
  });

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((a) => a._id)));
    }
  };

  const bulkUpdateStatus = async (newStatus: Appointment["status"]) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBulkLoading(true);
    try {
      const results = await Promise.allSettled(
        ids.map((id) =>
          fetch(`/api/appointments/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
          }).then((res) => {
            if (!res.ok) throw new Error();
            return id;
          }),
        ),
      );
      const succeededIds = results
        .filter((r) => r.status === "fulfilled")
        .map((r) => (r as PromiseFulfilledResult<string>).value);
      const failedCount = results.length - succeededIds.length;

      setAppointments((prev) =>
        prev.map((a) =>
          succeededIds.includes(a._id) ? { ...a, status: newStatus } : a,
        ),
      );

      if (succeededIds.length > 0) {
        toast.success(
          `${succeededIds.length} appointment${succeededIds.length !== 1 ? "s" : ""} marked as ${newStatus}.`,
        );
      }
      if (failedCount > 0) {
        toast.error(
          `${failedCount} appointment${failedCount !== 1 ? "s" : ""} failed to update.`,
        );
      }
      setSelectedIds(new Set());
    } finally {
      setBulkLoading(false);
    }
  };

  const navItems: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "appointments", label: "Appointments", icon: Calendar },
    { id: "doctors", label: "Doctors", icon: Users },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <AdminSessionTimeout />
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-100 flex flex-col transform transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:relative lg:translate-x-0 lg:flex`}
      >
        <div className="flex items-center gap-2 px-5 py-5 border-b border-gray-100">
          <div className="bg-blue-600 rounded-lg p-1.5">
            <Stethoscope className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            SmartClinic
          </span>
          <button
            className="ml-auto lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setTab(id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px] ${tab === id ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"}`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
              {session?.user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {session?.user?.name}
              </p>
              <p className="text-xs text-gray-500">Admin</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 min-h-[44px]"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4 flex items-center gap-4">
          <button
            className="lg:hidden p-1 text-gray-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 capitalize">
            {tab}
          </h1>
          <div className="ml-auto flex items-center gap-2">
            {/* Mobile-only: who's logged in */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex items-center gap-2 pl-1 pr-2 py-1 rounded-full border border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                {session?.user?.name?.charAt(0).toUpperCase() ?? "A"}
              </div>
              <span className="text-xs font-medium text-gray-700 max-w-[80px] truncate">
                {session?.user?.name ?? "Admin"}
              </span>
            </button>
            {(tab === "appointments" || tab === "dashboard") && (
              <button
                onClick={() => fetchAppointments(false)}
                className="p-2 text-gray-400 hover:text-blue-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
            {tab === "doctors" && (
              <button
                onClick={() => fetchDoctors()}
                disabled={loadingDoctors}
                className="p-2 text-gray-400 hover:text-blue-600 min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-40"
              >
                {loadingDoctors ? (
                  <Spinner size="sm" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {/* ── Dashboard ── */}
          {tab === "dashboard" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                <KpiCard
                  label="Today"
                  value={todayCount}
                  icon={Calendar}
                  color="text-blue-600 bg-blue-50"
                />
                <KpiCard
                  label="Pending"
                  value={pending}
                  icon={Clock}
                  color="text-yellow-600 bg-yellow-50"
                />
                <KpiCard
                  label="Confirmed"
                  value={confirmed}
                  icon={CheckCircle2}
                  color="text-green-600 bg-green-50"
                />
                <KpiCard
                  label="Completed"
                  value={completed}
                  icon={UserCheck}
                  color="text-blue-600 bg-blue-50"
                />
                <KpiCard
                  label="Cancelled"
                  value={cancelled}
                  icon={XCircle}
                  color="text-red-600 bg-red-50"
                />
                <KpiCard
                  label="No‑Show"
                  value={noShow}
                  icon={XCircle}
                  color="text-orange-600 bg-orange-50"
                />
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900">
                    Recent appointments
                  </h2>
                  <button
                    onClick={() => setTab("appointments")}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View all
                  </button>
                </div>
                <div className="divide-y divide-gray-50">
                  {loading
                    ? [1, 2, 3].map((i) => (
                        <div key={i} className="px-5 py-4 animate-pulse">
                          <div className="h-4 bg-gray-100 rounded w-1/3 mb-2" />
                          <div className="h-3 bg-gray-100 rounded w-1/2" />
                        </div>
                      ))
                    : appointments.slice(0, 5).map((a) => (
                        <div
                          key={a._id}
                          className="px-4 sm:px-5 py-4 flex flex-wrap items-center justify-between gap-3"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {a.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {a.doctor} · {a.date} at {a.time}
                            </p>
                          </div>
                          <StatusBadge status={a.status} />
                        </div>
                      ))}
                  {!loading && appointments.length === 0 && (
                    <EmptyState
                      icon={Calendar}
                      title="No appointments yet"
                      description="When patients book appointments, they will appear here."
                    />
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" /> Bookings by
                  doctor
                </h2>
                <div className="space-y-3">
                  {doctorNames.length === 0 && (
                    <p className="text-sm text-gray-400">No data yet.</p>
                  )}
                  {doctorNames.map((doc) => {
                    const count = appointments.filter(
                      (a) => a.doctor === doc,
                    ).length;
                    const pct = appointments.length
                      ? Math.round((count / appointments.length) * 100)
                      : 0;
                    return (
                      <div key={doc}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700 truncate mr-2">
                            {doc}
                          </span>
                          <span className="text-gray-500 shrink-0">
                            {count} bookings
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Appointments ── */}
          {tab === "appointments" && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
                {/* Row 1 — search + dropdowns */}
                <div className="flex flex-wrap gap-3">
                  <div className="relative flex-1 min-w-[160px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search name, phone, doctor..."
                      className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="relative">
                    <select
                      value={filterDoctor}
                      onChange={(e) => setFilterDoctor(e.target.value)}
                      className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                      <option value="all">All doctors</option>
                      {doctorNames.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                  <div className="relative">
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                      <option value="all">All statuses</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="no-show">No‑Show</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Row 2 — date range + results count + clear */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-[280px]">
                    <label className="text-xs text-gray-400 shrink-0">
                      From
                    </label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="flex-1 py-2 px-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <label className="text-xs text-gray-400 shrink-0">To</label>
                    <input
                      type="date"
                      value={dateTo}
                      min={dateFrom}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="flex-1 py-2 px-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-3 ml-auto">
                    <span className="text-xs text-gray-400">
                      {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                    </span>
                    {(search ||
                      filterDoctor !== "all" ||
                      filterStatus !== "all" ||
                      dateFrom ||
                      dateTo) && (
                      <button
                        onClick={() => {
                          setSearch("");
                          setFilterDoctor("all");
                          setFilterStatus("all");
                          setDateFrom("");
                          setDateTo("");
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Bulk action bar */}
              {selectedIds.size > 0 && (
                <div className="bg-blue-600 rounded-2xl px-4 py-3 flex items-center gap-3 flex-wrap shadow-sm">
                  <span className="text-sm text-white font-medium">
                    {selectedIds.size} selected
                  </span>
                  <div className="flex gap-2 ml-auto">
                    <Button
                      size="sm"
                      disabled={bulkLoading}
                      className="bg-white text-green-700 hover:bg-green-50 rounded-lg text-xs h-8 px-3 gap-1.5"
                      onClick={() => bulkUpdateStatus("confirmed")}
                    >
                      {bulkLoading ? <Spinner size="sm" /> : "Confirm"}
                    </Button>
                    <Button
                      size="sm"
                      disabled={bulkLoading}
                      className="bg-white text-red-600 hover:bg-red-50 rounded-lg text-xs h-8 px-3 gap-1.5"
                      onClick={() => bulkUpdateStatus("cancelled")}
                    >
                      {bulkLoading ? <Spinner size="sm" /> : "Cancel"}
                    </Button>
                    <button
                      onClick={() => setSelectedIds(new Set())}
                      disabled={bulkLoading}
                      className="text-xs text-blue-100 hover:text-white px-2"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}

              {/* Select all (desktop only, shown when results exist) */}
              {filtered.length > 0 && (
                <div className="hidden md:flex items-center gap-2 px-1">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filtered.length}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-500">Select all</span>
                </div>
              )}

              {/* Mobile: cards / Desktop: rows */}

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-28 bg-white animate-pulse rounded-xl border border-gray-100"
                    />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="No appointments found"
                  description={
                    search || filterDoctor !== "all" || filterStatus !== "all"
                      ? "Try adjusting your filters."
                      : "When patients book appointments, they will appear here."
                  }
                />
              ) : (
                <>
                  {/* Mobile cards — hidden on md+ */}
                  <div className="md:hidden space-y-3">
                    {filtered.map((a) => (
                      <AppointmentCard
                        key={a._id}
                        a={a}
                        updatingId={updatingId}
                        updateStatus={updateStatus}
                      />
                    ))}
                  </div>

                  {/* Desktop rows — hidden on mobile */}
                  <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="divide-y divide-gray-50">
                      {filtered.map((a) => (
                        <div
                          key={a._id}
                          className="px-5 py-4 flex items-center gap-4"
                        >
                          <input
                            type="checkbox"
                            checked={selectedIds.has(a._id)}
                            onChange={() => toggleSelect(a._id)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {a.name}
                            </p>
                            <p className="text-xs text-gray-500">{a.phone}</p>
                          </div>
                          <div className="text-sm text-gray-600 min-w-[120px]">
                            <p className="font-medium">{a.doctor}</p>
                            <p className="text-xs text-gray-400">
                              {a.date} · {a.time}
                            </p>
                          </div>
                          <StatusBadge status={a.status} />
                          <div className="flex gap-2">
                            {a.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  disabled={updatingId === a._id}
                                  className="bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs h-8 px-3"
                                  onClick={() =>
                                    updateStatus(a._id, "confirmed")
                                  }
                                >
                                  {updatingId === a._id ? (
                                    <Spinner size="sm" />
                                  ) : (
                                    "Confirm"
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={updatingId === a._id}
                                  className="text-red-600 border-red-200 hover:bg-red-50 rounded-lg text-xs h-8 px-3"
                                  onClick={() =>
                                    updateStatus(a._id, "cancelled")
                                  }
                                >
                                  {updatingId === a._id ? (
                                    <Spinner size="sm" />
                                  ) : (
                                    "Cancel"
                                  )}
                                </Button>
                              </>
                            )}
                            {a.status === "confirmed" && isPast(a) && (
                              <>
                                <Button
                                  size="sm"
                                  disabled={updatingId === a._id}
                                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs h-8 px-3"
                                  onClick={() =>
                                    updateStatus(a._id, "completed")
                                  }
                                >
                                  {updatingId === a._id ? (
                                    <Spinner size="sm" />
                                  ) : (
                                    "Mark Completed"
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  disabled={updatingId === a._id}
                                  className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs h-8 px-3"
                                  onClick={() => updateStatus(a._id, "no-show")}
                                >
                                  {updatingId === a._id ? (
                                    <Spinner size="sm" />
                                  ) : (
                                    "No‑Show"
                                  )}
                                </Button>
                              </>
                            )}
                            {a.status === "confirmed" && !isPast(a) && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={updatingId === a._id}
                                className="text-red-600 border-red-200 hover:bg-red-50 rounded-lg text-xs h-8 px-3"
                                onClick={() => updateStatus(a._id, "cancelled")}
                              >
                                {updatingId === a._id ? (
                                  <Spinner size="sm" />
                                ) : (
                                  "Cancel"
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Doctors ── */}
          {tab === "doctors" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Doctors Management
                </h2>
                <Button
                  onClick={openAddDoctor}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl min-h-[44px]"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Doctor
                </Button>
              </div>

              {loadingDoctors ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <span className="h-10 w-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
                  <p className="text-sm text-gray-400">Loading doctors...</p>
                </div>
              ) : doctorsList.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No doctors found"
                  description='Click "Add Doctor" to add the first doctor to your clinic.'
                />
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {doctorsList.map((doc) => (
                    <div
                      key={doc._id}
                      className="bg-white rounded-xl shadow-sm border p-4 sm:p-5 flex flex-wrap items-center gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-semibold text-gray-900">
                            {doc.name}
                          </p>
                          {doc.available ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                              Available
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                              Unavailable
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-blue-600">{doc.specialty}</p>
                        <p className="text-xs text-gray-500">
                          {doc.exp} · Fee: {doc.fee} PKR
                        </p>
                        <p className="text-xs text-gray-400">
                          Slug: {doc.slug}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDoctor(doc)}
                          className="rounded-lg min-h-[44px] min-w-[44px]"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={deletingDoctorId === doc._id}
                          onClick={() => setDeleteConfirmDoctor(doc)}
                          className="rounded-lg border-red-200 hover:bg-red-50 min-h-[44px] min-w-[44px]"
                        >
                          {deletingDoctorId === doc._id ? (
                            <Spinner size="sm" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-red-600" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Doctor Modal */}
              {doctorModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                  <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {editingDoctor ? "Edit Doctor" : "Add New Doctor"}
                      </h3>
                      <button
                        onClick={() => setDoctorModalOpen(false)}
                        className="text-gray-400 hover:text-gray-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1 block">
                          Name *
                        </label>
                        <input
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          placeholder="Dr. Ahmed"
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1 block">
                          Specialty *
                        </label>
                        <input
                          value={formSpecialty}
                          onChange={(e) => setFormSpecialty(e.target.value)}
                          placeholder="Cardiologist"
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-gray-500 mb-1 block">
                            Experience
                          </label>
                          <input
                            value={formExp}
                            onChange={(e) => setFormExp(e.target.value)}
                            placeholder="15+ years"
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 mb-1 block">
                            Fee (PKR) *
                          </label>
                          <input
                            type="number"
                            value={formFee}
                            onChange={(e) => setFormFee(e.target.value)}
                            placeholder="3000"
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-2 block">
                          Doctor Photo
                        </label>
                        <div className="flex items-center gap-4">
                          {/* Preview */}
                          <div className="h-16 w-16 rounded-full border-2 border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center shrink-0">
                            {imagePreview ? (
                              <img
                                src={imagePreview}
                                alt="Preview"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-xs text-gray-400 text-center px-1">
                                No photo
                              </span>
                            )}
                          </div>
                          {/* Upload button */}
                          <div className="flex-1">
                            <label className="cursor-pointer">
                              <div
                                className={`flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed rounded-xl text-sm transition-colors ${uploadingImage ? "border-blue-300 bg-blue-50 text-blue-500" : "border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-500 hover:text-blue-600"}`}
                              >
                                {uploadingImage ? (
                                  <>
                                    <Spinner size="sm" />
                                    Uploading...
                                  </>
                                ) : (
                                  <>
                                    <Plus className="h-4 w-4" />
                                    {imagePreview
                                      ? "Change Photo"
                                      : "Upload Photo"}
                                  </>
                                )}
                              </div>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={uploadingImage}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleImageUpload(file);
                                }}
                              />
                            </label>
                            <p className="text-xs text-gray-400 mt-1.5 text-center">
                              JPG, PNG, WebP — max 5MB
                            </p>
                          </div>
                        </div>
                        {/* Keep URL input as fallback */}
                        {!imagePreview && (
                          <input
                            value={formImg}
                            onChange={(e) => {
                              setFormImg(e.target.value);
                              setImagePreview(e.target.value);
                            }}
                            placeholder="Or paste image URL..."
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none mt-3"
                          />
                        )}
                        {imagePreview && (
                          <button
                            type="button"
                            onClick={() => {
                              setImagePreview("");
                              setFormImg("");
                            }}
                            className="text-xs text-red-400 hover:text-red-600 mt-2 transition-colors"
                          >
                            Remove photo
                          </button>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1 block">
                          Slug{" "}
                          <span className="text-gray-400 font-normal">
                            (auto-generated if empty)
                          </span>
                        </label>
                        <input
                          value={formSlug}
                          onChange={(e) => setFormSlug(e.target.value)}
                          placeholder="dr-ahmed"
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1 block">
                          Bio
                        </label>
                        <textarea
                          value={formBio}
                          onChange={(e) => setFormBio(e.target.value)}
                          rows={3}
                          placeholder="Brief biography..."
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-2 block">
                          Working Hours
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            "9:00 AM",
                            "10:00 AM",
                            "11:00 AM",
                            "12:00 PM",
                            "2:00 PM",
                            "3:00 PM",
                            "4:00 PM",
                            "5:00 PM",
                            "6:00 PM",
                          ].map((slot) => {
                            const checked = formWorkingHours.includes(slot);

                            return (
                              <button
                                key={slot}
                                type="button"
                                onClick={() =>
                                  setFormWorkingHours((prev) =>
                                    checked
                                      ? prev.filter((s) => s !== slot)
                                      : [...prev, slot],
                                  )
                                }
                                className={`py-1.5 text-xs rounded-xl border transition-all ${checked ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-600 hover:border-blue-300"}`}
                              >
                                {slot}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formAvailable}
                          onChange={(e) => setFormAvailable(e.target.checked)}
                          id="doctor-available"
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label
                          htmlFor="doctor-available"
                          className="text-sm text-gray-700"
                        >
                          Available for appointments
                        </label>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <Button
                        onClick={handleDoctorSave}
                        disabled={savingDoctor}
                        className="bg-blue-600 hover:bg-blue-700 text-white flex-1 rounded-xl min-h-[44px] gap-2"
                      >
                        {savingDoctor && <Spinner size="sm" />}
                        {savingDoctor
                          ? editingDoctor
                            ? "Updating..."
                            : "Adding..."
                          : editingDoctor
                            ? "Update Doctor"
                            : "Add Doctor"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setDoctorModalOpen(false)}
                        disabled={savingDoctor}
                        className="rounded-xl min-h-[44px]"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Analytics ── */}
          {tab === "analytics" && <AdminAnalytics />}
        </main>
      </div>
      {deleteConfirmDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Delete doctor?</h3>
                <p className="text-sm text-gray-500">
                  {deleteConfirmDoctor.name}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              This will permanently remove the doctor. Doctors with upcoming
              appointments cannot be deleted.
            </p>
            <div className="flex gap-3 pt-1">
              <Button
                onClick={() => handleDeleteDoctor(deleteConfirmDoctor._id)}
                disabled={!!deletingDoctorId}
                className="bg-red-600 hover:bg-red-700 text-white flex-1 rounded-xl min-h-[44px] gap-2"
              >
                {deletingDoctorId ? <Spinner size="sm" /> : null}
                {deletingDoctorId ? "Deleting..." : "Yes, delete"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmDoctor(null)}
                disabled={!!deletingDoctorId}
                className="rounded-xl min-h-[44px] flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
