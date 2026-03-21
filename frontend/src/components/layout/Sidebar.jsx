import { NavLink, useLocation } from "react-router-dom";
import { useEffect } from "react";
import {
  LayoutDashboard,
  Pill,
  Bell,
  PhoneCall,
  Settings,
  X,
} from "lucide-react";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/medications", label: "Medications", icon: Pill },
  { to: "/reminders", label: "Reminders", icon: Bell },
  { to: "/emergency", label: "Emergency", icon: PhoneCall },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ isOpen = false, onClose = () => {} }) {
  const location = useLocation();

  // Close mobile sidebar on route change
  useEffect(() => {
    onClose();
  }, [location.pathname]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const sidebarContent = (
    <>
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/60">
        <div className="flex items-center">
          <div className="h-9 w-9 rounded-2xl bg-blue-600/90 flex items-center justify-center shadow-soft">
            <span className="text-white text-lg font-semibold">SC</span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-semibold tracking-wide">SmartCare AI</p>
            <p className="text-[11px] text-slate-400">Clinical Adherence Suite</p>
          </div>
        </div>
        {/* Close button — mobile only */}
        <button
          type="button"
          onClick={onClose}
          className="md:hidden rounded-full p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 py-4 space-y-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  "hover:bg-slate-800/80 hover:text-slate-50",
                  isActive
                    ? "bg-slate-800/90 text-white shadow-soft"
                    : "text-slate-300",
                ].join(" ")
              }
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="px-4 pb-5 pt-2 border-t border-slate-800/60 text-[11px] text-slate-500">
        <p>SmartCare AI · v1.0</p>
        <p>Designed for clinical adherence.</p>
      </div>
    </>
  );

  return (
    <>
      {/* ───── Desktop sidebar (static) ───── */}
      <aside className="hidden md:flex md:flex-col w-64 bg-slate-950 border-r border-slate-800/60 text-slate-100">
        {sidebarContent}
      </aside>

      {/* ───── Mobile sidebar (overlay) ───── */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      {/* Drawer */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-slate-950 text-slate-100 flex flex-col shadow-2xl transition-transform duration-300 ease-out md:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
