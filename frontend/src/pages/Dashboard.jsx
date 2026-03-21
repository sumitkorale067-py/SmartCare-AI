import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  HeartPulse,
  Pill,
  Clock,
  PlusCircle,
  BellRing,
  PhoneCall,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import StatCard from "../components/ui/StatCard";
import SectionCard from "../components/ui/SectionCard";

export default function Dashboard() {
  const [reminders, setReminders] = useState([]);
  const [risk, setRisk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/reminders/");
      setReminders(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Failed to load reminders", e);
      setError(e.response?.data || "Network error");
    } finally {
      setLoading(false);
    }
  };

  const upcoming = reminders.filter((r) => r.status === "pending").length;
  const missed = reminders.filter((r) => r.status === "missed").length;

  useEffect(() => {
    if (!loading && !error) {
      api
        .get(`/ai/adherence-ai/${missed}`)
        .then((res) => setRisk(res.data))
        .catch(() => setRisk(null));
    }
  }, [missed, loading, error]);

  const takenToday = reminders.filter((r) => r.status === "taken").length;

  const adherenceSeries = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const today = new Date();

    const bucket = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      bucket.push({ key, label: days[d.getDay() === 0 ? 6 : d.getDay() - 1] });
    }

    const map = new Map(bucket.map((b) => [b.key, { taken: 0, missed: 0, total: 0 }]));

    reminders.forEach((r) => {
      if (!r.scheduled_time) return;
      const dt = new Date(r.scheduled_time);
      if (Number.isNaN(dt.getTime())) return;
      const key = dt.toISOString().slice(0, 10);
      if (!map.has(key)) return;
      const entry = map.get(key);
      entry.total += 1;
      if (r.status === "taken") entry.taken += 1;
      if (r.status === "missed") entry.missed += 1;
    });

    return bucket.map(({ key, label }) => {
      const { taken, missed, total } = map.get(key);
      const adherence = total > 0 ? Math.round((taken / total) * 100) : 0;
      return {
        day: label,
        adherence,
        taken,
        missed,
      };
    });
  }, [reminders]);

  const overallAdherence = useMemo(() => {
    if (!adherenceSeries.length) return 0;
    const withData = adherenceSeries.filter((d) => d.taken + d.missed > 0);
    if (!withData.length) return 0;
    const sum = withData.reduce((acc, d) => acc + d.adherence, 0);
    return Math.round(sum / withData.length);
  }, [adherenceSeries]);

  const todayAdherence = adherenceSeries.length
    ? adherenceSeries[adherenceSeries.length - 1].adherence
    : 0;

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-16 rounded-2xl bg-slate-200" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-200" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="h-64 rounded-2xl bg-slate-200 lg:col-span-2" />
          <div className="h-64 rounded-2xl bg-slate-200" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <SectionCard title="Dashboard">
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-rose-600 font-medium">
            We couldn&apos;t load your data.
          </p>
          <code className="text-xs bg-rose-50 text-rose-700 px-3 py-2 rounded-xl border border-rose-100">
            {JSON.stringify(error)}
          </code>
          <button
            type="button"
            onClick={load}
            className="mt-1 inline-flex items-center gap-2 rounded-full bg-slate-900 text-white text-xs font-medium px-4 py-1.5 hover:bg-slate-800 transition-colors"
          >
            <Activity className="h-3.5 w-3.5" />
            Retry sync
          </button>
        </div>
      </SectionCard>
    );
  }


  return (
    <div className="space-y-5">
      {/* Welcome + Summary */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500 font-semibold">
            Patient overview
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
            Your daily adherence at a glance
          </h1>
          <p className="mt-2 text-sm text-slate-500 max-w-xl">
            SmartCare AI continuously monitors your medication schedule, flags
            risk, and keeps your clinical team informed — automatically.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate("/medications")}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 text-white text-xs font-medium px-4 py-2 shadow-soft hover:bg-blue-500 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            Add Medication
          </button>
          <button
            type="button"
            onClick={() => navigate("/reminders")}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 text-white text-xs font-medium px-4 py-2 shadow-soft hover:bg-slate-800 transition-colors"
          >
            <BellRing className="h-4 w-4" />
            Add Reminder
          </button>
          <button
            type="button"
            onClick={() => navigate("/emergency")}
            className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 text-rose-700 text-xs font-medium px-4 py-2 hover:bg-rose-100 transition-colors"
          >
            <PhoneCall className="h-4 w-4" />
            Emergency Alert
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="7‑day adherence"
          value={`${overallAdherence}%`}
          hint="Percentage of doses taken across the last 7 days"
          icon={Activity}
        />
        <StatCard
          label="Today’s adherence"
          value={`${todayAdherence}%`}
          hint="Share of today’s scheduled doses already taken"
          icon={HeartPulse}
        />
        <StatCard
          label="Today’s Medications"
          value={`${takenToday}/${reminders.length || 1}`}
          hint="Doses taken today"
          icon={Pill}
          tone="success"
        />
        <StatCard
          label="Upcoming Reminders"
          value={upcoming}
          hint={`${missed} missed in the last cycle`}
          icon={Clock}
          tone={missed > 0 ? "alert" : undefined}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Charts */}
        <SectionCard
          title="7‑day adherence trend"
          subtitle="Based purely on real reminder history — how consistently doses were taken each day."
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={adherenceSeries} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    borderColor: "#e2e8f0",
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="adherence"
                  stroke="#2563eb"
                  strokeWidth={2.4}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard
          title="Taken vs missed"
          subtitle="How many doses were taken or missed on each of the last 7 days."
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={adherenceSeries} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    borderColor: "#e2e8f0",
                    fontSize: 12,
                  }}
                />
                <Legend
                  wrapperStyle={{
                    fontSize: 11,
                  }}
                />
                <Bar dataKey="taken" name="Taken" fill="#22c55e" radius={[6, 6, 0, 0]} />
                <Bar
                  dataKey="missed"
                  name="Missed"
                  fill="#f97316"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* AI block */}
        <SectionCard
          title="SmartCare AI risk signal"
          subtitle="Real‑time adherence risk classification based on your recent reminder history."
        >
          {risk ? (
            <div className="space-y-3 text-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-semibold">
                Current band
              </p>
              <p className="text-xl font-semibold text-slate-900">
                {risk.risk_level} risk ·{" "}
                <span className="text-slate-500">
                  score {risk.severity_score}/100
                </span>
              </p>
              <p className="text-sm text-slate-600">{risk.recommendation}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1 text-[11px] font-medium">
                  Missed doses: {risk.missed_doses}
                </span>
                <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 text-[11px] font-medium">
                  Intervention required:{" "}
                  {risk.intervention_required ? "Yes" : "No"}
                </span>
                {risk.ai_provider && (
                  <span className="inline-flex items-center rounded-full bg-violet-50 text-violet-700 border border-violet-100 px-3 py-1 text-[11px] font-medium">
                    ✨ {risk.ai_provider === "google-gemini" ? "Powered by Gemini AI" : "Rule-based"}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              We&apos;ll surface your adherence risk band here as soon as there
              is enough signal from your reminders.
            </p>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
