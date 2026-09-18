import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, homeFor, setAuth } from "../lib/api";

const FALLBACK_DISTRICTS = [
  { slug: "urganch-shahar", name_uz: "Urganch shahri" },
  { slug: "xiva", name_uz: "Xiva" },
  { slug: "gurlan", name_uz: "Gurlan" },
  { slug: "shovot", name_uz: "Shovot" },
  { slug: "hazorasp", name_uz: "Hazorasp" },
  { slug: "xonqa", name_uz: "Xonqa" },
];

const STEPS = ["Rol", "Joy", "Ism", "Rozilik"];

export default function Login() {
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [districts, setDistricts] = useState(FALLBACK_DISTRICTS);
  const [form, setForm] = useState({
    role: "" as "" | "buyer" | "entrepreneur",
    lang: "uz",
    district: "urganch-shahar",
    first_name: "",
    phone: "",
    consent: false,
  });

  useEffect(() => {
    api("/api/markets/")
      .then((d) => {
        const list = (d.regions || []).flatMap((r: any) => r.districts || []);
        if (list.length) setDistricts(list);
      })
      .catch(() => {});
  }, []);

  function next() {
    setErr("");
    if (step === 0 && !form.role) return setErr("Xaridor yoki tadbirkorni tanlang");
    if (step === 1 && !form.district) return setErr("Tumanni tanlang");
    if (step === 2 && form.first_name.trim().length < 2) return setErr("Ismingizni yozing");
    if (step === 3 && !form.consent) return setErr("Davom etish uchun rozilik belgilang");
    if (step < 3) setStep(step + 1);
    else submit();
  }

  async function submit() {
    setBusy(true);
    try {
      const data = await api("/api/auth/register/", {
        method: "POST",
        body: JSON.stringify({ ...form, consent: true }),
      });
      setAuth(data);
      nav(homeFor(form.role));
    } catch (e: any) {
      setErr(e.message || "Ro'yxatdan o'tib bo'lmadi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-xl w-full">
        <p className="text-violet-400 text-sm tracking-[0.2em] uppercase">Umummilliy AI Xakaton · Xorazm</p>
        <h1 className="font-display text-4xl mt-2">BozorPuls AI</h1>
        <p className="text-slate-400 mt-2">Akkaunt ochish — 4 qadam</p>
        <div className="flex gap-2 mt-5 text-xs">
          {STEPS.map((s, i) => (
            <span key={s} className={`px-2 py-1 rounded-full ${i === step ? "bg-violet-600" : i < step ? "bg-violet-600/30" : "border border-line text-slate-400"}`}>
              {i + 1}. {s}
            </span>
          ))}
        </div>

        <div className="mt-6 bg-panel/80 border border-line rounded-2xl p-5">
          {step === 0 && (
            <div className="grid sm:grid-cols-2 gap-3">
              <RoleCard
                active={form.role === "buyer"}
                title="Xaridor"
                text="Narxlarni ko'raman, arzon joyni topaman"
                onClick={() => setForm({ ...form, role: "buyer" })}
              />
              <RoleCard
                active={form.role === "entrepreneur"}
                title="Tadbirkor"
                text="Daftar, biznes-reja, kredit va soliq"
                onClick={() => setForm({ ...form, role: "entrepreneur" })}
              />
            </div>
          )}
          {step === 1 && (
            <div className="space-y-3">
              <label className="block text-sm text-slate-300">
                Til
                <select className="mt-1 w-full bg-panel border border-line rounded-xl px-3 py-2" value={form.lang} onChange={(e) => setForm({ ...form, lang: e.target.value })}>
                  <option value="uz">O'zbek (lotin)</option>
                  <option value="ru">Русский</option>
                </select>
              </label>
              <label className="block text-sm text-slate-300">
                Tuman / shahar
                <select className="mt-1 w-full bg-panel border border-line rounded-xl px-3 py-2" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })}>
                  {districts.map((d) => (
                    <option key={d.slug} value={d.slug}>
                      {d.name_uz}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-3">
              <label className="block text-sm text-slate-300">
                Ism
                <input className="mt-1 w-full bg-panel border border-line rounded-xl px-3 py-2" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} placeholder="Masalan: Dilshod" />
              </label>
              <label className="block text-sm text-slate-300">
                Telefon (ixtiyoriy)
                <input className="mt-1 w-full bg-panel border border-line rounded-xl px-3 py-2" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+998 90 000 00 00" />
              </label>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-3 text-sm text-slate-300">
              <p>
                BozorPuls AI shaxsiy ma'lumotni (ism, tuman, Telegram/telefon) faqat xizmat uchun ishlatadi.
                Moliyaviy ma'lumot bankka faqat sizning roziligingiz bilan yuboriladi.
              </p>
              <label className="flex items-start gap-2">
                <input type="checkbox" className="mt-1" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} />
                <span>Ommaviy oferta va shaxsiy ma'lumotlarga roziman.</span>
              </label>
            </div>
          )}

          {err && <p className="mt-4 text-sm text-rose-400">{err}</p>}
          <div className="mt-5 flex justify-between">
            <button className="text-slate-400" disabled={step === 0 || busy} onClick={() => { setErr(""); setStep(Math.max(0, step - 1)); }}>
              Orqaga
            </button>
            <button className="bg-violet-600 px-5 py-2 rounded-xl" disabled={busy} onClick={next}>
              {busy ? "…" : step === 3 ? "Akkaunt ochish" : "Keyingi"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RoleCard({ title, text, active, onClick }: { title: string; text: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-2xl border p-4 transition ${active ? "border-violet-500 bg-violet-600/20" : "border-line hover:border-violet-500"}`}
    >
      <div className="font-medium">{title}</div>
      <div className="text-sm text-slate-400 mt-1">{text}</div>
    </button>
  );
}
