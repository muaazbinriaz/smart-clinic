"use client";
import { useState, useEffect, useCallback } from "react";
import { Pencil, Trash2, Plus, X } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import AdminAnalytics from "@/components/AdminAnalytics";

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface Appointment {
  _id: string;
  name: string;
  phone: string;
  doctor: string;
  date: string;
  time: string;
  message?: string;
  status: "pending" | "confirmed" | "cancelled";
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
  createdAt: string;
}

type Tab = "dashboard" | "appointments" | "doctors" | "analytics"; // ← added analytics

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
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

// ─── KPI CARD ─────────────────────────────────────────────────────────────────
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
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <div className={`inline-flex p-2.5 rounded-xl ${color} mb-4`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function AdminPanel() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDoctor, setFilterDoctor] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // ── Doctors state ──────────────────────────────────────────────────────────
  const [doctorsList, setDoctorsList] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [doctorModalOpen, setDoctorModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [savingDoctor, setSavingDoctor] = useState(false);

  // Doctor form fields
  const [formName, setFormName] = useState("");
  const [formSpecialty, setFormSpecialty] = useState("");
  const [formExp, setFormExp] = useState("");
  const [formFee, setFormFee] = useState("");
  const [formBio, setFormBio] = useState("");
  const [formImg, setFormImg] = useState("");
  const [formAvailable, setFormAvailable] = useState(true);
  const [formSlug, setFormSlug] = useState("");

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && session?.user?.role !== "admin") {
      router.push("/patient/dashboard");
    }
  }, [status, session, router]);

  // ── Fetch appointments ──────────────────────────────────────────────────────
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/appointments");
      const data = await res.json();
      setAppointments(Array.isArray(data) ? data : (data.appointments ?? []));
    } catch {
      toast.error("Failed to load appointments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // ── Fetch doctors ──────────────────────────────────────────────────────────
  const fetchDoctors = useCallback(async () => {
    setLoadingDoctors(true);
    try {
      const res = await fetch("/api/doctors");
      const data = await res.json();
      setDoctorsList(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load doctors.");
    } finally {
      setLoadingDoctors(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "doctors") {
      fetchDoctors();
    }
  }, [tab, fetchDoctors]);

  // ── Update status ───────────────────────────────────────────────────────────
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
      toast.success(`Appointment ${newStatus}.`);
    } catch {
      toast.error("Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Doctor CRUD handlers (same as before) ─────────────────────────────────
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
    setDoctorModalOpen(true);
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
          editingDoctor ? "Doctor updated." : "Doctor added successfully.",
        );
        setDoctorModalOpen(false);
        fetchDoctors();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to save doctor.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSavingDoctor(false);
    }
  };

  const handleDeleteDoctor = async (id: string) => {
    if (!confirm("Delete this doctor? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/doctors/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Doctor deleted.");
        fetchDoctors();
      } else {
        const err = await res.json();
        toast.error(err.error || "Delete failed.");
      }
    } catch {
      toast.error("Network error.");
    }
  };

  // ── Derived data ────────────────────────────────────────────────────────────
  const doctorNames = [...new Set(appointments.map((a) => a.doctor))];
  const today = new Date().toISOString().split("T")[0];
  const todayCount = appointments.filter((a) => a.date === today).length;
  const pending = appointments.filter((a) => a.status === "pending").length;
  const confirmed = appointments.filter((a) => a.status === "confirmed").length;
  const cancelled = appointments.filter((a) => a.status === "cancelled").length;

  const filtered = appointments.filter((a) => {
    const matchSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.phone.includes(search) ||
      a.doctor.toLowerCase().includes(search.toLowerCase());
    const matchDoctor = filterDoctor === "all" || a.doctor === filterDoctor;
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    return matchSearch && matchDoctor && matchStatus;
  });

  // ── Loading state ───────────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  // ── Nav items (added Analytics) ─────────────────────────────────────────────
  const navItems: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "appointments", label: "Appointments", icon: Calendar },
    { id: "doctors", label: "Doctors", icon: Users },
    { id: "analytics", label: "Analytics", icon: TrendingUp }, // ← new
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* ── SIDEBAR ── */}
      <aside
        className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-100 flex flex-col
        transform transition-transform duration-200
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:relative lg:translate-x-0 lg:flex
      `}
      >
        {/* Logo */}
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

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setTab(id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${
                  tab === id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>

        {/* User */}
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
            className="w-full flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors px-1 py-1"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4 flex items-center gap-4">
          <button
            className="lg:hidden p-1 text-gray-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 capitalize">
            {tab}
          </h1>
          <div className="ml-auto flex items-center gap-2">
            {tab === "appointments" && (
              <button
                onClick={fetchAppointments}
                className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
            {tab === "doctors" && (
              <button
                onClick={fetchDoctors}
                className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {/* ── DASHBOARD TAB ── */}
          {tab === "dashboard" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                  label="Today's bookings"
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
                  label="Cancelled"
                  value={cancelled}
                  icon={XCircle}
                  color="text-red-600 bg-red-50"
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
                          className="px-5 py-4 flex items-center justify-between gap-4"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {a.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {a.doctor} · {a.date} at {a.time}
                            </p>
                          </div>
                          <StatusBadge status={a.status || "pending"} />
                        </div>
                      ))}
                  {!loading && appointments.length === 0 && (
                    <p className="px-5 py-8 text-center text-sm text-gray-400">
                      No appointments yet.
                    </p>
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
                          <span className="text-gray-700">{doc}</span>
                          <span className="text-gray-500">
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

          {/* ── APPOINTMENTS TAB ── */}
          {tab === "appointments" && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, phone, doctor..."
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
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
                <span className="text-xs text-gray-400 self-center">
                  {filtered.length} results
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                  <div className="space-y-px">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="px-5 py-4 animate-pulse flex gap-4"
                      >
                        <div className="h-4 bg-gray-100 rounded flex-1" />
                        <div className="h-4 bg-gray-100 rounded w-24" />
                        <div className="h-4 bg-gray-100 rounded w-20" />
                      </div>
                    ))}
                  </div>
                ) : filtered.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 py-12">
                    No appointments match your filters.
                  </p>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {filtered.map((a) => (
                      <div
                        key={a._id}
                        className="px-5 py-4 flex flex-wrap items-center gap-4"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {a.name}
                          </p>
                          <p className="text-xs text-gray-500">{a.phone}</p>
                        </div>
                        <div className="text-sm text-gray-600 min-w-28">
                          <p className="font-medium">{a.doctor}</p>
                          <p className="text-xs text-gray-400">
                            {a.date} · {a.time}
                          </p>
                        </div>
                        <StatusBadge status={a.status || "pending"} />
                        <div className="flex gap-2">
                          {a.status !== "confirmed" && (
                            <Button
                              size="sm"
                              disabled={updatingId === a._id}
                              className="bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs h-7 px-2"
                              onClick={() => updateStatus(a._id, "confirmed")}
                            >
                              Confirm
                            </Button>
                          )}
                          {a.status !== "cancelled" && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={updatingId === a._id}
                              className="text-red-600 border-red-200 hover:bg-red-50 rounded-lg text-xs h-7 px-2"
                              onClick={() => updateStatus(a._id, "cancelled")}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── DOCTORS TAB ── */}
          {tab === "doctors" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Doctors Management
                </h2>
                <Button
                  onClick={openAddDoctor}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Doctor
                </Button>
              </div>

              {loadingDoctors ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-20 bg-gray-100 animate-pulse rounded-xl"
                    />
                  ))}
                </div>
              ) : doctorsList.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-gray-400">
                  <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium text-gray-600">No doctors found</p>
                  <p className="text-sm mt-1">
                    Click "Add Doctor" to add the first doctor to your clinic.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {doctorsList.map((doc) => (
                    <div
                      key={doc._id}
                      className="bg-white rounded-xl shadow-sm border p-5 flex flex-wrap items-center gap-4"
                    >
                      <div className="flex-1 min-w-40">
                        <div className="flex items-center gap-2 mb-1">
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
                          className="rounded-lg"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteDoctor(doc._id)}
                          className="rounded-lg border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add/Edit Doctor Modal */}
              {doctorModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                  <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {editingDoctor ? "Edit Doctor" : "Add New Doctor"}
                      </h3>
                      <button
                        onClick={() => setDoctorModalOpen(false)}
                        className="text-gray-400 hover:text-gray-600"
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
                        <label className="text-xs font-medium text-gray-500 mb-1 block">
                          Image URL
                        </label>
                        <input
                          value={formImg}
                          onChange={(e) => setFormImg(e.target.value)}
                          placeholder="https://ui-avatars.com/api/..."
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
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
                        className="bg-blue-600 hover:bg-blue-700 text-white flex-1 rounded-xl"
                      >
                        {savingDoctor
                          ? "Saving..."
                          : editingDoctor
                            ? "Update Doctor"
                            : "Add Doctor"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setDoctorModalOpen(false)}
                        className="rounded-xl"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── ANALYTICS TAB ── */}
          {tab === "analytics" && <AdminAnalytics />}
        </main>
      </div>
    </div>
  );
}
