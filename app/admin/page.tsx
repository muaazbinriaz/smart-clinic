"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchAppointments();
    toast.success(`Appointment ${status}`);
  };

  const deleteAppointment = async (id: string) => {
    await fetch(`/api/appointments/${id}`, { method: "DELETE" });
    fetchAppointments();
    toast.success("Appointment deleted");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Appointments Dashboard
          </h1>
          <div className="flex gap-2">
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
              {appointments.length} Total
            </span>
          </div>
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
                className="bg-white rounded-xl shadow-sm p-5 flex flex-col sm:flex-row justify-between gap-4 border border-gray-100"
              >
                <div>
                  <p className="font-semibold text-gray-800">
                    {appt.name}{" "}
                    <span className="text-blue-600">({appt.doctor})</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    {appt.phone} | {appt.date} at {appt.time}
                  </p>
                  {appt.message && (
                    <p className="text-sm text-gray-400 mt-1">
                      "{appt.message}"
                    </p>
                  )}
                  <span
                    className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
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
                <div className="flex gap-2 items-start">
                  {appt.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => updateStatus(appt._id, "confirmed")}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(appt._id, "cancelled")}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteAppointment(appt._id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
