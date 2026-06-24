"use client";
import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const IDLE_TIMEOUT = 28 * 60 * 1000; // 28 minutes of inactivity
const WARNING_DURATION = 2 * 60 * 1000; // 2‑minute warning

export default function AdminSessionTimeout() {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(120); // seconds
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimers = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    setShowWarning(false);
    setCountdown(120);

    // Start idle timer
    timerRef.current = setTimeout(() => {
      // Show warning
      setShowWarning(true);
      // Start countdown
      let remaining = 120;
      warningTimerRef.current = setInterval(() => {
        remaining -= 1;
        setCountdown(remaining);
        if (remaining <= 0) {
          signOut({ callbackUrl: "/login" });
        }
      }, 1000);
    }, IDLE_TIMEOUT);
  };

  useEffect(() => {
    // Listen for user activity
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    const handleActivity = () => resetTimers();

    events.forEach((e) => window.addEventListener(e, handleActivity));
    resetTimers();

    return () => {
      events.forEach((e) => window.removeEventListener(e, handleActivity));
      if (timerRef.current) clearTimeout(timerRef.current);
      if (warningTimerRef.current) clearInterval(warningTimerRef.current);
    };
  }, []);

  if (!showWarning) return null;

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full text-center space-y-4">
        <LogOut className="h-8 w-8 text-amber-500 mx-auto" />
        <h3 className="text-lg font-semibold text-gray-900">
          Session Expiring
        </h3>
        <p className="text-sm text-gray-500">
          You've been inactive. You'll be logged out automatically in{" "}
          <strong>
            {minutes}:{seconds.toString().padStart(2, "0")}
          </strong>{" "}
          minutes unless you continue.
        </p>
        <Button
          onClick={resetTimers}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
        >
          I'm still here
        </Button>
      </div>
    </div>
  );
}
