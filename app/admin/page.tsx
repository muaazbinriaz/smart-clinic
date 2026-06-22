"use client";
import { useEffect, useState } from "react";

interface Appointment {
  _id: string;
  name: string;
  phone: string;
  doctor: string;
  date: string;
  time: string;
  message: string;
  status: string;
}

export default function AdminPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    const res = await fetch("/api/appointments");
    const data = await res.json();
    setAppointments(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Appointments Dashboard
          </h1>
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
            {appointments.length} Total
          </span>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 bg-gray-200 animate-pulse rounded-xl"
              />
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <p className="text-gray-500 text-center py-12">
            No appointments yet.
          </p>
        ) : (
          <div className="space-y-4">
            {appointments.map((appt) => (
              <div
                key={appt._id}
                className="bg-white rounded-xl shadow-sm p-5 border border-gray-100"
              >
                <p className="font-semibold text-gray-800">
                  {appt.name}{" "}
                  <span className="text-blue-600">({appt.doctor})</span>
                </p>
                <p className="text-sm text-gray-500">
                  {appt.phone} | {appt.date} at {appt.time}
                </p>
                {appt.message && (
                  <p className="text-sm text-gray-400 mt-1">"{appt.message}"</p>
                )}
                <span
                  className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${
                    appt.status === "confirmed"
                      ? "bg-green-100 text-green-700"
                      : appt.status === "cancelled"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {appt.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
