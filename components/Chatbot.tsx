"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, X, Send } from "lucide-react";

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hello! Ask me about timings, fees, doctors, or services.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", text: data.reply }]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Sorry, something went wrong. Please call us at 03XX-XXXXXXX.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-xl transition-all"
        aria-label="Chat with us"
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>

      {/* Chat Window — Fixed Height */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-80 sm:w-96 h-[500px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <span className="font-semibold text-sm">
                SmartClinic AI Assistant
              </span>
            </div>
            <button onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages Area — Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] text-sm px-3 py-2 rounded-xl ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-gray-200 text-gray-800"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="text-gray-400 text-xs italic pl-2">Typing...</div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-gray-200 flex gap-2 shrink-0 bg-white">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask about fees, timings..."
              className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button
              size="icon"
              onClick={sendMessage}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
