import { useEffect, useState, useContext, useCallback } from "react";
import { Bell, X, Pill } from "lucide-react";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";

/**
 * NotificationToast — polls /api/notifications every 30 s and shows
 * pill-shaped toast popups for unacknowledged reminders.
 */
export default function NotificationToast() {
  const { user } = useContext(AuthContext);
  const [toasts, setToasts] = useState([]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await api.get("/notifications/");
      if (Array.isArray(data) && data.length > 0) {
        setToasts((prev) => {
          const existingIds = new Set(prev.map((t) => t.id));
          const fresh = data.filter((n) => !existingIds.has(n.id));
          return [...prev, ...fresh].slice(-5); // keep max 5
        });
      }
    } catch {
      // silently ignore — user not logged in or server down
    }
  }, [user]);

  // Poll every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const dismiss = async (notifId) => {
    setToasts((prev) => prev.filter((t) => t.id !== notifId));
    try {
      await api.put(`/notifications/${notifId}/acknowledge`);
    } catch {
      // best-effort
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-start gap-3 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200 shadow-xl px-4 py-3 animate-[slideUp_0.35s_ease-out]"
        >
          <div className="h-9 w-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Pill className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {t.title || "Medication Reminder"}
            </p>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
              {t.message || "Time to take your medication"}
            </p>
          </div>
          <button
            onClick={() => dismiss(t.id)}
            className="rounded-full p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
