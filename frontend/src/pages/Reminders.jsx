import { useEffect, useState } from "react";
import { Clock, CheckCircle2, XCircle, PauseCircle, PlusCircle } from "lucide-react";
import api from "../services/api";
import SectionCard from "../components/ui/SectionCard";

export default function Reminders() {
  const [list, setList] = useState([]);
  const [creating, setCreating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    medication_name: "",
    scheduled_time: "",
  });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const res = await api.get("/reminders/");
    setList(res.data);
  };

  const taken = async (id) => {
    await api.put(`/reminders/${id}/taken`);
    load();
  };

  const missed = async (id) => {
    await api.put(`/reminders/${id}/missed`);
    load();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post("/reminders/", form);
      setForm({ medication_name: "", scheduled_time: "" });
      await load();
      setModalOpen(false);
    } finally {
      setCreating(false);
    }
  };

  const statusTone = (status) => {
    if (status === "taken")
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    if (status === "missed")
      return "bg-rose-50 text-rose-700 border-rose-100";
    return "bg-amber-50 text-amber-700 border-amber-100";
  };

  const statusIcon = (status) => {
    if (status === "taken") return CheckCircle2;
    if (status === "missed") return XCircle;
    return Clock;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500 font-semibold">
            Timeline
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
            Reminders
          </h1>
          <p className="mt-2 text-sm text-slate-500 max-w-xl">
            Every reminder is tracked with a clear status so care teams can see
            exactly what happened across the day.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 text-white text-sm font-medium px-4 py-2 shadow-soft hover:bg-blue-500 transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          Add reminder
        </button>
      </div>

      <SectionCard
        title="Today’s timeline"
        subtitle="Visual history of all reminders, coloured by outcome."
      >
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <PauseCircle className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-slate-700">
              No reminders for this profile yet
            </p>
            <p className="text-xs text-slate-500 max-w-sm">
              Once SmartCare generates reminders from your regimen, they will
              show here in a clinical-grade timeline.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((r, idx) => {
              const Icon = statusIcon(r.status);
              return (
                <div
                  key={r.id}
                  className="flex gap-3 sm:gap-4 items-start"
                >
                  <div className="flex flex-col items-center pt-1">
                    <div
                      className={`h-7 w-7 rounded-full border text-[11px] flex items-center justify-center bg-white shadow-sm ${statusTone(
                        r.status
                      )}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    {idx !== list.length - 1 && (
                      <div className="mt-1 w-px flex-1 bg-slate-200" />
                    )}
                  </div>
                  <div className="flex-1 rounded-2xl bg-white border border-slate-100 px-3.5 py-2.5 shadow-soft">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {r.medication_name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Scheduled at {r.scheduled_time}
                        </p>
                      </div>
                      <div
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusTone(
                          r.status
                        )}`}
                      >
                        <Icon className="h-3 w-3" />
                        <span className="capitalize">{r.status}</span>
                      </div>
                    </div>

                    {r.status === "pending" && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => taken(r.id)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 text-white text-[11px] font-medium px-3 py-1 hover:bg-emerald-500 transition-colors"
                        >
                          Mark taken
                        </button>
                        <button
                          type="button"
                          onClick={() => missed(r.id)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 text-rose-700 text-[11px] font-medium px-3 py-1 hover:bg-rose-100 transition-colors"
                        >
                          Mark missed
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {modalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-soft border border-slate-100">
            <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Add manual reminder
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Useful for ad‑hoc changes your clinician asks for.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                Esc
              </button>
            </div>

            <form onSubmit={handleCreate} className="px-5 pt-4 pb-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Medication name
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/60 transition-shadow"
                  value={form.medication_name}
                  onChange={(e) =>
                    setForm({ ...form, medication_name: e.target.value })
                  }
                  placeholder="e.g. Metformin 500mg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Scheduled time
                </label>
                <input
                  type="datetime-local"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/60 transition-shadow"
                  value={form.scheduled_time}
                  onChange={(e) =>
                    setForm({ ...form, scheduled_time: e.target.value })
                  }
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  SmartCare will align this with your timezone.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 text-white text-xs font-medium px-4 py-1.5 shadow-soft hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  {creating ? "Saving..." : "Save reminder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
