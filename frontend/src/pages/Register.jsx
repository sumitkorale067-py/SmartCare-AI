import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserPlus, AlertCircle, CheckCircle2 } from "lucide-react";
import api from "../services/api";

export default function Register() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await api.post("/auth/register", {
        phone: phone.trim(),
        password: password.trim(),
        name: name.trim(),
        timezone: timezone.trim(),
      });
      setSuccess("Account created successfully! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(detail || "Registration failed. Please check your details and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-3xl bg-slate-950/80 border border-slate-800/80 shadow-[0_18px_45px_rgba(15,23,42,0.85)] p-6 sm:p-8 text-slate-50">
      <div className="flex items-center gap-2 mb-6">
        <div className="h-9 w-9 rounded-2xl bg-blue-600 flex items-center justify-center shadow-soft">
          <span className="text-sm font-semibold">SC</span>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">
            SmartCare AI
          </p>
          <p className="text-sm text-slate-300">Create a patient account</p>
        </div>
      </div>

      <h1 className="text-2xl font-semibold tracking-tight mb-1">
        Join SmartCare
      </h1>
      <p className="text-sm text-slate-400 mb-6">
        A verified mobile number is required so SmartCare can send adherence and
        emergency alerts.
      </p>

      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm px-3 py-2.5 mb-4">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm px-3 py-2.5 mb-4">
          <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Full name
          </label>
          <input
            className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70 transition-shadow"
            placeholder="e.g. Ananya Singh"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <p className="mt-1 text-[11px] text-slate-500">
            Used to personalise calls and alerts (stored after first login).
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Phone number
          </label>
          <input
            className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70 transition-shadow"
            placeholder="+91 98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Password
          </label>
          <input
            type="password"
            className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70 transition-shadow"
            placeholder="Minimum 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Timezone
          </label>
          <input
            className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70 transition-shadow"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
          />
          <p className="mt-1 text-[11px] text-slate-500">
            SmartCare uses this to align your dose times.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 text-white text-sm font-medium px-4 py-2.5 mt-1 shadow-soft hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          {loading ? "Creating account..." : "Create SmartCare account"}
        </button>
      </form>

      <p className="mt-4 text-xs text-slate-400">
        Already registered?{" "}
        <Link
          to="/login"
          className="text-blue-400 hover:text-blue-300 font-medium"
        >
          Back to login
        </Link>
      </p>
    </div>
  );
}
