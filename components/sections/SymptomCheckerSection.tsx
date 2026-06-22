"use client";
import { useState } from "react";
import {
  Stethoscope,
  Sparkles,
  AlertTriangle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface TriageResult {
  specialty: string;
  recommendedDoctor: string;
  urgency: "low" | "medium" | "high";
  summary: string;
  advice: string;
}

const URGENCY_STYLES: Record<TriageResult["urgency"], string> = {
  low: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-red-100 text-red-700",
};

const URGENCY_LABEL: Record<TriageResult["urgency"], string> = {
  low: "Low urgency",
  medium: "See a doctor soon",
  high: "Seek care promptly",
};

const EXAMPLES = [
  "I have a sore throat and mild fever",
  "Lower back pain after lifting something heavy",
  "Red itchy rash on my arm",
  "Chest tightness when climbing stairs",
];

export default function SymptomCheckerSection({
  onBookClick,
}: {
  onBookClick: (doctorName?: string) => void;
}) {
  const [symptoms, setSymptoms] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TriageResult | null>(null);

  const checkSymptoms = async (text?: string) => {
    const query = (text ?? symptoms).trim();
    if (query.length < 3) {
      toast.error("Please describe your symptoms first.");
      return;
    }
    setSymptoms(query);
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/symptom-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms: query }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setResult(data);
    } catch {
      toast.error("Couldn't analyze symptoms. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-br from-blue-50/60 via-white to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
            <Sparkles className="h-3.5 w-3.5" /> AI-powered
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Not sure who to see?
          </h2>
          <p className="text-gray-500 mt-3">
            Describe how you're feeling and our AI will suggest the right
            specialist for you.
          </p>
        </div>

        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="e.g. I've had a headache and mild fever since yesterday..."
              rows={3}
              className="flex-1 resize-none px-4 py-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => checkSymptoms(ex)}
                disabled={loading}
                className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-colors disabled:opacity-50"
              >
                {ex}
              </button>
            ))}
          </div>

          <Button
            onClick={() => checkSymptoms()}
            disabled={loading}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold h-11"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Analyzing...
              </span>
            ) : (
              "Check my symptoms"
            )}
          </Button>

          <p className="text-xs text-gray-400 text-center mt-3 flex items-center justify-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Not a diagnosis. Please
            consult a doctor.
          </p>

          {result && (
            <div className="mt-6 pt-6 border-t border-gray-100 animate-fade-in-up">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                  <Stethoscope className="h-4 w-4 text-blue-600" />{" "}
                  {result.specialty}
                </span>
                <span
                  className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${URGENCY_STYLES[result.urgency]}`}
                >
                  {URGENCY_LABEL[result.urgency]}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-1">{result.summary}</p>
              <p className="text-sm text-gray-500 mb-5">{result.advice}</p>

              <div className="flex items-center justify-between bg-blue-50 rounded-xl px-4 py-3">
                <div>
                  <p className="text-xs text-gray-500">Recommended doctor</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {result.recommendedDoctor}
                  </p>
                </div>
                <Button
                  onClick={() => onBookClick(result.recommendedDoctor)}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm h-9 px-4"
                >
                  Book now <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
