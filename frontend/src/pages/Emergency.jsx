import { useContext, useEffect, useState } from "react";
import { AlertTriangle, PhoneCall, MapPin, Clock, Users, CheckCircle2, XCircle } from "lucide-react";
import api from "../services/api";
import SectionCard from "../components/ui/SectionCard";
import { AuthContext } from "../context/AuthContext";

export default function Emergency() {
  const { user } = useContext(AuthContext);

  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState(null);
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    if (user) {
      setContacts(user.emergency_contacts || []);
    }
  }, [user]);

  const trigger = async () => {
    setConfirmOpen(false);
    setSending(true);
    setResult(null);
    try {
      const res = await api.post("/emergency/trigger");
      setResult(res.data);
    } catch (err) {
      setResult({
        status: "error",
        message: err.response?.data?.detail || "Emergency trigger failed. Please call local emergency services directly.",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-slate-500 font-semibold">
          Escalation
        </p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
          Emergency
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-xl">
          Trigger a clinically‑graded emergency workflow that alerts your configured
          emergency contacts with your last known location.
        </p>
      </div>

      <SectionCard
        title="Immediate assistance"
        subtitle="Only use this if you are unwell, feel unsafe, or have been advised by your care team."
      >
        <div className="flex flex-col lg:flex-row items-center gap-8">
          <div className="flex flex-col items-center justify-center gap-4 flex-1">
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={sending}
              className="relative h-40 w-40 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-[0_0_0_12px_rgba(248,113,113,0.35)] hover:bg-rose-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              id="sos-button"
            >
              <span className="absolute inset-0 rounded-full border border-white/20 animate-ping" />
              <span className="relative flex flex-col items-center gap-1">
                <PhoneCall className="h-7 w-7" />
                <span className="text-xs font-semibold tracking-[0.2em] uppercase">
                  SOS
                </span>
                <span className="text-[10px] font-medium">
                  {sending ? "Connecting..." : "Tap to escalate"}
                </span>
              </span>
            </button>
            <p className="text-[11px] text-slate-500 text-center max-w-xs">
              This will record an emergency event, send your GPS location, and SMS your
              emergency contacts.
            </p>
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex items-start gap-3 rounded-2xl bg-amber-50 border border-amber-100 px-3 py-2.5 text-xs text-amber-800">
              <AlertTriangle className="h-4 w-4 mt-0.5" />
              <p>
                SmartCare AI is not a replacement for local emergency services.
                If you are in immediate danger, call the regional emergency
                number first.
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-700 mb-1.5">
                Your emergency contacts
              </p>
              {contacts.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No emergency contacts configured.{" "}
                  <a href="/settings" className="text-blue-600 hover:text-blue-500 font-medium">
                    Add contacts in Settings
                  </a>
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {contacts.map((c, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-2 text-xs text-slate-600 rounded-xl border border-slate-100 px-3 py-2"
                    >
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      <span className="font-medium">{c.name}</span>
                      <span className="text-slate-400">·</span>
                      <span>{c.phone}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ───── Result Card ───── */}
      {result && (
        <SectionCard
          title={result.status === "error" ? "Emergency failed" : "Emergency triggered"}
          subtitle={result.message}
        >
          {result.status === "emergency_triggered" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start gap-3 rounded-xl border border-slate-100 p-3">
                <Clock className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-[11px] font-medium text-slate-500">Timestamp</p>
                  <p className="text-xs text-slate-900">
                    {new Date(result.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-slate-100 p-3">
                <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-[11px] font-medium text-slate-500">Location</p>
                  <p className="text-xs text-slate-900">
                    {result.location?.lat
                      ? `${result.location.lat.toFixed(4)}, ${result.location.lng.toFixed(4)}`
                      : "Not available"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-slate-100 p-3">
                <Users className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-[11px] font-medium text-slate-500">Contacts processed</p>
                  <p className="text-xs text-slate-900">{result.total_contacts} contact(s)</p>
                </div>
              </div>
              {result.contacts_notified?.length > 0 && (
                <div className="sm:col-span-3 space-y-1.5">
                  <p className="text-[11px] font-medium text-slate-500 mb-1">Notification results</p>
                  {result.contacts_notified.map((c, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-xs rounded-xl border border-slate-50 px-3 py-2"
                    >
                      {c.sms_sent ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-rose-500" />
                      )}
                      <span className="font-medium text-slate-900">{c.name}</span>
                      <span className="text-slate-400">{c.phone}</span>
                      <span className={`ml-auto text-[10px] font-medium ${c.sms_sent ? "text-emerald-600" : "text-rose-600"}`}>
                        {c.sms_sent ? "SMS sent" : "Failed"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {result.status === "error" && (
            <p className="text-sm text-rose-600">{result.message}</p>
          )}
        </SectionCard>
      )}

      {/* ───── Confirmation Modal ───── */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl border border-slate-100 p-6 text-center space-y-4">
            <div className="h-14 w-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">
              Confirm emergency
            </h2>
            <p className="text-sm text-slate-600">
              This will immediately alert your emergency contacts and record
              your GPS location. Are you sure?
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={trigger}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-medium text-white hover:bg-rose-500 transition-colors"
                id="confirm-emergency"
              >
                Yes, trigger SOS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
