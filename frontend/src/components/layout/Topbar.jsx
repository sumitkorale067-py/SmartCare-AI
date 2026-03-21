import { useContext, useEffect, useRef, useState } from "react";
import { Bell, LogOut, Menu, Settings, User, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";

export default function Topbar({ onMenuToggle }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [bellOpen, setBellOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const bellRef = useRef(null);
  const profileRef = useRef(null);

  const initials =
    user?.name?.split(" ").map((n) => n[0]).join("") ||
    (user?.phone ? user.phone.slice(-2) : "SC");

  // Fetch recent reminders for the bell
  useEffect(() => {
    if (bellOpen) {
      api
        .get("/reminders/")
        .then((res) => {
          const data = Array.isArray(res.data) ? res.data : [];
          setNotifications(data.slice(-8).reverse());
        })
        .catch(() => setNotifications([]));
    }
  }, [bellOpen]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const pendingCount = notifications.filter((n) => n.status === "pending").length;

  const statusIcon = (status) => {
    if (status === "taken") return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
    if (status === "missed") return <XCircle className="h-3.5 w-3.5 text-rose-500" />;
    return <Clock className="h-3.5 w-3.5 text-amber-500" />;
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          type="button"
          onClick={onMenuToggle}
          className="md:hidden rounded-lg p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          id="hamburger-menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-[0.16em] text-slate-400 font-semibold">
            SmartCare AI
          </span>
          <span className="text-sm sm:text-base font-semibold text-slate-900">
            {greeting()}, {user?.name || "Patient"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* ───── Notification Bell ───── */}
        <div className="relative" ref={bellRef}>
          <button
            type="button"
            onClick={() => { setBellOpen((p) => !p); setProfileOpen(false); }}
            className="relative rounded-full p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            id="notification-bell"
          >
            <Bell className="h-5 w-5" />
            {pendingCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-rose-500 ring-2 ring-white text-[9px] text-white font-bold flex items-center justify-center">
                {pendingCount > 9 ? "9+" : pendingCount}
              </span>
            )}
            {pendingCount === 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-slate-100 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-900">Notifications</p>
                <button
                  type="button"
                  onClick={() => { setBellOpen(false); navigate("/reminders"); }}
                  className="text-[11px] text-blue-600 hover:text-blue-500 font-medium"
                >
                  View all
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <Bell className="h-6 w-6 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => { setBellOpen(false); navigate("/reminders"); }}
                    >
                      <div className="mt-0.5">{statusIcon(n.status)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-900 truncate">
                          {n.medication_name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {n.scheduled_time ? new Date(n.scheduled_time).toLocaleString() : "—"}
                        </p>
                      </div>
                      <span className={`text-[10px] font-medium capitalize px-1.5 py-0.5 rounded-full ${
                        n.status === "taken" ? "bg-emerald-50 text-emerald-700" :
                        n.status === "missed" ? "bg-rose-50 text-rose-700" :
                        "bg-amber-50 text-amber-700"
                      }`}>
                        {n.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* ───── User Profile Dropdown ───── */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => { setProfileOpen((p) => !p); setBellOpen(false); }}
            className="flex items-center gap-3 rounded-full hover:bg-slate-50 px-2 py-1 transition-colors"
            id="user-profile"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium text-slate-900">
                {user?.name || "SmartCare Member"}
              </p>
              <p className="text-[11px] text-slate-500">
                {user?.phone || "Protected account"}
              </p>
            </div>
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center text-xs font-semibold text-white shadow-soft">
              {initials}
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-100 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-slate-50">
                <p className="text-sm font-semibold text-slate-900">
                  {user?.name || "Patient"}
                </p>
                <p className="text-[11px] text-slate-500">{user?.phone}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Timezone: {user?.timezone || "UTC"}
                </p>
              </div>
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => { setProfileOpen(false); navigate("/settings"); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Settings className="h-3.5 w-3.5 text-slate-400" />
                  Settings
                </button>
                <button
                  type="button"
                  onClick={() => { setProfileOpen(false); navigate("/settings"); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  Edit profile
                </button>
              </div>
              <div className="border-t border-slate-50 py-1">
                <button
                  type="button"
                  onClick={() => { setProfileOpen(false); logout(); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={logout}
          className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Logout
        </button>
      </div>
    </header>
  );
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}
