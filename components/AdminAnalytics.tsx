"use client";
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const FEES: Record<string, number> = {
  "Dr. Ahmed": 3000,
  "Dr. Husnain Ali": 2000,
  "Dr. Ali": 2500,
  "Dr. Fatima": 1500,
};

interface Appointment {
  doctor: string;
  status: string;
  createdAt: string;
}

interface DailyPoint {
  date: string;
  confirmed: number;
  pending: number;
  cancelled: number;
}

interface DoctorPoint {
  doctor: string;
  bookings: number;
  revenue: number;
}

export default function AdminAnalytics() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/appointments")
      .then((r) => r.json())
      .then((data) => {
        setAppointments(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        Loading analytics…
      </div>
    );

  // ── Last 14 days daily breakdown ──────────────────────────────
  const dailyMap: Record<string, DailyPoint> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    dailyMap[key] = {
      date: d.toLocaleDateString("en-PK", { month: "short", day: "numeric" }),
      confirmed: 0,
      pending: 0,
      cancelled: 0,
    };
  }
  appointments.forEach((a) => {
    const key = new Date(a.createdAt).toISOString().split("T")[0];
    if (dailyMap[key]) {
      const s = a.status as keyof Omit<DailyPoint, "date">;
      if (s in dailyMap[key]) dailyMap[key][s]++;
    }
  });
  const dailyData = Object.values(dailyMap);

  // ── Per-doctor stats ──────────────────────────────────────────
  const doctorMap: Record<string, DoctorPoint> = {};
  Object.keys(FEES).forEach((d) => {
    doctorMap[d] = { doctor: d.replace("Dr. ", ""), bookings: 0, revenue: 0 };
  });
  appointments.forEach((a) => {
    if (doctorMap[a.doctor] && a.status === "confirmed") {
      doctorMap[a.doctor].bookings++;
      doctorMap[a.doctor].revenue += FEES[a.doctor] ?? 0;
    }
  });
  const doctorData = Object.values(doctorMap);

  // ── KPI cards ─────────────────────────────────────────────────
  const total = appointments.length;
  const confirmed = appointments.filter((a) => a.status === "confirmed").length;
  const totalRevenue = doctorData.reduce((s, d) => s + d.revenue, 0);
  const rate = total ? Math.round((confirmed / total) * 100) : 0;

  const kpis = [
    { label: "Total bookings", value: total },
    {
      label: "Revenue est.",
      value: `PKR ${totalRevenue.toLocaleString("en-PK")}`,
    },
    {
      label: "Avg/day (14d)",
      value: Math.round(
        dailyData.reduce((s, d) => s + d.confirmed + d.pending, 0) / 14,
      ),
    },
    { label: "Confirm rate", value: `${rate}%` },
  ];

  return (
    <div className="space-y-6 py-4">
      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">{k.label}</p>
            <p className="text-2xl font-medium text-slate-800">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Line chart — bookings/day */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <h3 className="text-sm font-medium text-slate-700 mb-4">
          Bookings per day — last 14 days
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="confirmed"
              stroke="#2563EB"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="pending"
              stroke="#10B981"
              strokeWidth={2}
              dot={false}
              strokeDasharray="4 3"
            />
            <Line
              type="monotone"
              dataKey="cancelled"
              stroke="#EF4444"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="2 3"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bar chart — bookings by doctor */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <h3 className="text-sm font-medium text-slate-700 mb-4">
          Confirmed bookings by doctor
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={doctorData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="doctor" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="bookings" fill="#2563EB" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bar chart — revenue by doctor */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <h3 className="text-sm font-medium text-slate-700 mb-4">
          Revenue estimate by doctor (PKR, confirmed only)
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={doctorData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              type="number"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <YAxis
              type="category"
              dataKey="doctor"
              tick={{ fontSize: 11 }}
              width={80}
            />
            {/* FIXED: allow any type for value to avoid build error */}
            <Tooltip
              formatter={(value: any) =>
                `PKR ${(value ?? 0).toLocaleString("en-PK")}`
              }
            />
            <Bar dataKey="revenue" fill="#10B981" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
