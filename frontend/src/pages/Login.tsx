import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { api, setAuth } from "../lib/api";

const roles = [
  { id: "entrepreneur", title: "Dilshod aka", sub: "Tadbirkor · somsaxona" },
  { id: "supplier", title: "Hasan aka", sub: "Yetkazib beruvchi" },
  { id: "market_admin", title: "Bozor ma'muri", sub: "Urganch markaziy" },
  { id: "bank", title: "Bank xodimi", sub: "Kredit bo'limi" },
];

export default function Login() {
  const nav = useNavigate();
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function enter(role: string) {
    setErr("");
    setBusy(true);
    try {
      const data = await api("/api/auth/demo/", {
        method: "POST",
        body: JSON.stringify({ role }),
      });
      setAuth(data);
      nav("/pulse");
    } catch (e: any) {
      setErr(e.message || "Serverga ulanib bo'lmadi. Backend 8000-portda ishlayotganini tekshiring.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-xl w-full">
        <p className="text-violet-400 text-sm tracking-[0.2em] uppercase">Umummilliy AI Xakaton · Xorazm</p>
        <h1 className="font-display text-5xl mt-2">BozorPuls AI</h1>
        <p className="text-slate-400 mt-3 text-lg">
          Bozor narxidan biznes-rejagacha: tadbirkorning AI hamrohi.
        </p>
        <div className="mt-8 grid sm:grid-cols-2 gap-3">
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => enter(r.id)}
              className="text-left rounded-2xl border border-line bg-panel/80 p-4 hover:border-violet-500 transition"
            >
              <div className="font-medium">{r.title}</div>
              <div className="text-sm text-slate-400">{r.sub}</div>
            </button>
          ))}
        </div>
        {err && <p className="mt-4 text-sm text-rose-400">{err}</p>}
        {busy && <p className="mt-2 text-sm text-slate-400">Kirilmoqda…</p>}
        <p className="text-xs text-slate-500 mt-6">
          Demo kirish. Ommaviy oferta va shaxsiy ma'lumotlarga rozilik demo rejimida belgilangan.
          Sintetik qatorlar <span className="chip">DEMO</span> belgisi bilan.
        </p>
      </div>
    </div>
  );
}
