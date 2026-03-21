import { useEffect, useState } from "react";
import { Pill, PlusCircle, Trash2, PackageOpen } from "lucide-react";
import api from "../services/api";
import SectionCard from "../components/ui/SectionCard";

export default function Medications() {
  const [meds, setMeds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [form, setForm] = useState({
    name: "",
    time: "",
    total_stock: "",
    dosage_per_intake: "1",
    start_date: "",
    end_date: "",
  });

  const load = async () => {
    const res = await api.get("/medications/");
    setMeds(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);

    // Validate required fields
    if (!form.name.trim()) { setSaveError("Medication name is required."); return; }
    if (!form.time) { setSaveError("Daily time is required."); return; }
    if (!form.total_stock || Number(form.total_stock) < 1) { setSaveError("Total stock must be at least 1."); return; }
    if (!form.dosage_per_intake || Number(form.dosage_per_intake) < 1) { setSaveError("Dose per intake must be at least 1."); return; }
    if (!form.start_date) { setSaveError("Start date is required."); return; }
    if (!form.end_date) { setSaveError("End date is required."); return; }

    setSaving(true);
    try {
      await api.post("/medications/", {
        name: form.name.trim(),
        times: form.time ? [form.time] : [],
        total_stock: Number(form.total_stock),
        dosage_per_intake: Number(form.dosage_per_intake),
        start_date: form.start_date,
        end_date: form.end_date,
      });
      setForm({
        name: "",
        time: "",
        total_stock: "",
        dosage_per_intake: "1",
        start_date: "",
        end_date: "",
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await load();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setSaveError(
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
          ? detail.map((d) => d.msg || d).join(", ")
          : "Failed to save medication. Check all fields and try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteMed = async (id) => {
    await api.delete(`/medications/${id}`);
    load();
  };

  const addStock = async (id) => {
    await api.put(`/medications/${id}/add-stock`, {
      additional_stock: 10,
    });
    load();
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-slate-500 font-semibold">
          Regimen
        </p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
          Medications
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-xl">
          Maintain a clinically accurate medication schedule with precise times,
          dosing, and stock visibility.
        </p>
      </div>

      <SectionCard
        title="New medication"
        subtitle="Define how and when this medication should be taken. SmartCare will automatically generate reminders."
      >
        {saveError && (
          <div className="mb-3 rounded-xl bg-rose-50 border border-rose-100 px-3 py-2 text-xs text-rose-700 font-medium">
            ⚠️ {saveError}
          </div>
        )}
        {saveSuccess && (
          <div className="mb-3 rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2 text-xs text-emerald-700 font-medium">
            ✅ Medication saved successfully!
          </div>
        )}
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Medication name
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/60 transition-shadow"
              placeholder="e.g. Metformin 500mg"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Use the exact label as printed on the prescription.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Daily time
            </label>
            <input
              type="time"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/60 transition-shadow"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Local time when this dose should be taken.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Total stock (tablets / units)
            </label>
            <input
              type="number"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/60 transition-shadow"
              value={form.total_stock}
              onChange={(e) =>
                setForm({ ...form, total_stock: e.target.value })
              }
              placeholder="e.g. 30"
              min={1}
            />
            <p className="mt-1 text-[11px] text-slate-500">
              How many doses are currently available in the pack.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Dose per intake
            </label>
            <input
              type="number"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/60 transition-shadow"
              value={form.dosage_per_intake}
              onChange={(e) =>
                setForm({ ...form, dosage_per_intake: e.target.value })
              }
              min={1}
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Tablets or units taken each time (e.g. 1, 2).
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Start date
            </label>
            <input
              type="date"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/60 transition-shadow"
              value={form.start_date}
              onChange={(e) =>
                setForm({ ...form, start_date: e.target.value })
              }
            />
            <p className="mt-1 text-[11px] text-slate-500">
              The first day this medication should be taken.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              End date
            </label>
            <input
              type="date"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/60 transition-shadow"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            />
            <p className="mt-1 text-[11px] text-slate-500">
              When this course is scheduled to complete.
            </p>
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 text-white text-sm font-medium px-4 py-2 shadow-soft hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              {saving ? "Saving..." : "Save medication"}
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="Current regimen"
        subtitle="Live view of every active medication, including remaining stock and schedule."
      >
        {meds.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <Pill className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-slate-700">
              No medications configured yet
            </p>
            <p className="text-xs text-slate-500 max-w-sm">
              Once you add a medication, SmartCare will automatically derive
              reminders and track adherence.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-100">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                    Medication
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                    Times
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                    Stock
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                    Window
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {meds.map((m, idx) => (
                  <tr
                    key={m.id}
                    className={
                      idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                    }
                  >
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center">
                          <Pill className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {m.name}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Dose: {m.dosage_per_intake} unit(s)
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-xs text-slate-600">
                      {m.times?.join(", ") || "-"}
                    </td>
                    <td className="px-4 py-3 align-top text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-700 px-2 py-0.5">
                        <PackageOpen className="h-3 w-3" />
                        {m.remaining_stock} / {m.total_stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top text-xs text-slate-600">
                      <div className="space-y-0.5">
                        <p>From: {m.start_date}</p>
                        <p>To: {m.end_date}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => addStock(m.id)}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-[11px] text-slate-700 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-colors"
                        >
                          +10
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteMed(m.id)}
                          className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-2.5 py-1 text-[11px] text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
