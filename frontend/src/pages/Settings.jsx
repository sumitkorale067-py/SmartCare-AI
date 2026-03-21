import { useContext, useEffect, useState } from "react";
import { Globe2, Users, User, PlusCircle, Trash2, Save, CheckCircle2, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import api from "../services/api";
import SectionCard from "../components/ui/SectionCard";
import { AuthContext } from "../context/AuthContext";

export default function Settings() {
  const { user, fetchUser } = useContext(AuthContext);

  // ───── Profile state ─────
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState("");

  // ───── Emergency contacts state ─────
  const [contacts, setContacts] = useState([]);
  const [newContact, setNewContact] = useState({ name: "", phone: "" });
  const [contactSaving, setContactSaving] = useState(false);
  const [contactSaved, setContactSaved] = useState(false);

  // ───── Timezone state ─────
  const [tzSaving, setTzSaving] = useState(false);
  const [tzSaved, setTzSaved] = useState(false);

  // ───── Password state ─────
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Load from user profile on mount
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setTimezone(user.timezone || "UTC");
      setContacts(user.emergency_contacts || []);
    }
  }, [user]);

  // ───── Profile save ─────
  const saveProfile = async () => {
    setProfileSaving(true);
    setProfileSaved(false);
    setProfileError("");
    try {
      await api.put("/users/me", { name: name.trim() });
      await fetchUser();
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } catch (err) {
      setProfileError(err.response?.data?.detail || "Failed to save profile");
    } finally {
      setProfileSaving(false);
    }
  };

  // ───── Timezone save ─────
  // ───── Timezone state (error) ─────
  const [tzError, setTzError] = useState("");

  const saveTimezone = async () => {
    setTzSaving(true);
    setTzSaved(false);
    setTzError("");
    try {
      await api.put("/users/me/timezone", { timezone: timezone.trim() });
      await fetchUser();
      setTzSaved(true);
      setTimeout(() => setTzSaved(false), 2000);
    } catch (err) {
      setTzError(err.response?.data?.detail || "Failed to save timezone");
    } finally {
      setTzSaving(false);
    }
  };

  // ───── Password change ─────
  const changePassword = async () => {
    setPwError("");
    if (newPw.length < 6) { setPwError("New password must be at least 6 characters"); return; }
    if (newPw !== confirmPw) { setPwError("Passwords do not match"); return; }
    setPwSaving(true);
    setPwSaved(false);
    try {
      await api.put("/users/me/password", {
        current_password: currentPw,
        new_password: newPw,
      });
      setPwSaved(true);
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setTimeout(() => setPwSaved(false), 3000);
    } catch (err) {
      setPwError(err.response?.data?.detail || "Failed to change password");
    } finally {
      setPwSaving(false);
    }
  };

  // ───── Emergency contacts ─────
  const addContact = () => {
    if (!newContact.name.trim() || !newContact.phone.trim()) return;
    setContacts([...contacts, { name: newContact.name.trim(), phone: newContact.phone.trim() }]);
    setNewContact({ name: "", phone: "" });
  };

  const removeContact = (idx) => {
    setContacts(contacts.filter((_, i) => i !== idx));
  };

  // ───── Contacts state (error) ─────
  const [contactError, setContactError] = useState("");

  const saveContacts = async () => {
    setContactSaving(true);
    setContactSaved(false);
    setContactError("");
    try {
      await api.put("/users/me/emergency-contacts", { emergency_contacts: contacts });
      await fetchUser();
      setContactSaved(true);
      setTimeout(() => setContactSaved(false), 2000);
    } catch (err) {
      setContactError(err.response?.data?.detail || "Failed to save contacts");
    } finally {
      setContactSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-slate-500 font-semibold">
          Configuration
        </p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
          Settings
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-xl">
          Manage your profile, timezone, and emergency contacts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ───── Profile Card ───── */}
        <SectionCard
          title="Profile"
          subtitle="Update the name shown across SmartCare and used in voice call greetings."
        >
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Display name
                  </label>
                  <input
                    id="settings-name"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/60 transition-shadow"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ananya Singh"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Phone
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
                    value={user?.phone || ""}
                    readOnly
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Phone cannot be changed after registration.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={saveProfile}
                disabled={profileSaving}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 text-white text-xs font-medium px-3 py-1.5 hover:bg-slate-800 disabled:opacity-60 transition-colors"
                id="save-profile"
              >
                {profileSaved ? (
                  <><CheckCircle2 className="h-3 w-3" /> Saved</>
                ) : (
                  <><Save className="h-3 w-3" /> {profileSaving ? "Saving..." : "Save profile"}</>
                )}
              </button>
            </div>
            {profileError && (
              <p className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 rounded-xl px-3 py-2">
                <AlertCircle className="h-3 w-3 flex-shrink-0" /> {profileError}
              </p>
            )}
          </div>
        </SectionCard>

        {/* ───── Timezone Card ───── */}
        <SectionCard
          title="Timezone"
          subtitle="Your medication reminders and escalation windows are calculated using this timezone."
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Globe2 className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <input
                id="settings-timezone"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/60 transition-shadow"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Example: Asia/Kolkata, Europe/London, America/New_York.
              </p>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={saveTimezone}
              disabled={tzSaving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 text-white text-xs font-medium px-3 py-1.5 hover:bg-slate-800 disabled:opacity-60 transition-colors"
              id="save-timezone"
            >
              {tzSaved ? (
                <><CheckCircle2 className="h-3 w-3" /> Saved</>
              ) : (
                <><Save className="h-3 w-3" /> {tzSaving ? "Saving..." : "Save timezone"}</>
              )}
            </button>
          </div>
          {tzError && (
            <p className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 rounded-xl px-3 py-2">
              <AlertCircle className="h-3 w-3 flex-shrink-0" /> {tzError}
            </p>
          )}
        </SectionCard>
      </div>

      {/* ───── Change Password Card ───── */}
      <SectionCard
        title="Change Password"
        subtitle="Update your account password. You'll need your current password to confirm."
      >
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mt-0.5">
              <Lock className="h-4 w-4" />
            </div>
            <div className="flex-1 space-y-3">
              {/* Current password */}
              <div className="relative">
                <label className="block text-xs font-medium text-slate-600 mb-1">Current password</label>
                <div className="relative">
                  <input
                    id="current-password"
                    type={showCurrent ? "text" : "password"}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60 transition-shadow"
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    placeholder="Enter current password"
                  />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showCurrent ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
              {/* New password */}
              <div className="relative">
                <label className="block text-xs font-medium text-slate-600 mb-1">New password</label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showNew ? "text" : "password"}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60 transition-shadow"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    placeholder="Min 6 characters"
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showNew ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
              {/* Confirm */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Confirm new password</label>
                <input
                  id="confirm-password"
                  type="password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60 transition-shadow"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="Re-enter new password"
                />
              </div>
            </div>
          </div>

          {pwError && (
            <p className="text-xs text-rose-600 bg-rose-50 rounded-xl px-3 py-2">{pwError}</p>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={changePassword}
              disabled={pwSaving || !currentPw || !newPw || !confirmPw}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 text-white text-xs font-medium px-3 py-1.5 hover:bg-slate-800 disabled:opacity-60 transition-colors"
              id="change-password"
            >
              {pwSaved ? (
                <><CheckCircle2 className="h-3 w-3" /> Changed</>
              ) : (
                <><Lock className="h-3 w-3" /> {pwSaving ? "Changing..." : "Change password"}</>
              )}
            </button>
          </div>
        </div>
      </SectionCard>

      {/* ───── Emergency Contacts Card (full width) ───── */}
      <SectionCard
        title="Emergency contacts"
        subtitle="SmartCare will alert these contacts when it detects repeated missed doses or you trigger an emergency."
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mt-0.5">
              <Users className="h-4 w-4" />
            </div>
            <div className="flex-1 space-y-3">
              {/* Existing contacts */}
              {contacts.length === 0 ? (
                <p className="text-xs text-slate-500 py-2">
                  No emergency contacts configured yet. Add one below.
                </p>
              ) : (
                <div className="space-y-2">
                  {contacts.map((c, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{c.name}</p>
                        <p className="text-[11px] text-slate-500">{c.phone}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeContact(idx)}
                        className="rounded-full p-1.5 text-rose-500 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new contact */}
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="contact-name"
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60 transition-shadow"
                  placeholder="Contact name"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                />
                <input
                  id="contact-phone"
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60 transition-shadow"
                  placeholder="+91 98765 43210"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                />
                <button
                  type="button"
                  onClick={addContact}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 text-white text-xs font-medium px-4 py-2 hover:bg-emerald-500 transition-colors whitespace-nowrap"
                  id="add-contact"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  Add
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={saveContacts}
              disabled={contactSaving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 text-white text-xs font-medium px-4 py-1.5 hover:bg-slate-800 disabled:opacity-60 transition-colors"
              id="save-contacts"
            >
              {contactSaved ? (
                <><CheckCircle2 className="h-3 w-3" /> Saved</>
              ) : (
                <><Save className="h-3 w-3" /> {contactSaving ? "Saving..." : "Save contacts"}</>
              )}
            </button>
          </div>
        </div>
          {contactError && (
            <p className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 rounded-xl px-3 py-2 mt-2">
              <AlertCircle className="h-3 w-3 flex-shrink-0" /> {contactError}
            </p>
          )}
      </SectionCard>
    </div>
  );
}
