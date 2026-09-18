import { useEffect, useState } from "react";
import { api, som } from "../lib/api";

export default function Credit() {
  const [loan, setLoan] = useState<any>(null);
  const [programs, setPrograms] = useState<any[]>([]);
  const [kti, setKti] = useState<any>(null);
  const [form, setForm] = useState({ amount: 150000000, rate: 14, months: 36, type: "annuity", grace: 3, subsidy: 4 });

  async function calc() {
    const r = await api("/api/finance/loan/calc/", { method: "POST", body: JSON.stringify(form) });
    setLoan(r);
  }
  useEffect(() => {
    calc();
    api("/api/finance/programs/match/?amount=150000000&sector=ovqatlanish").then(setPrograms);
    api("/api/credit-readiness/1/").then(setKti);
  }, []);

  const score = kti?.score ?? 0;
  return (
    <div>
      <h1 className="font-display text-3xl">Kredit markazi</h1>
      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <div className="bg-panel/60 border border-line rounded-2xl p-4 space-y-2">
          <h2 className="font-medium">Kalkulyator</h2>
          {["amount", "rate", "months", "grace", "subsidy"].map((k) => (
            <label key={k} className="block text-sm text-slate-300">
              {k}
              <input
                type="number"
                className="w-full bg-panel border border-line rounded-lg px-2 py-1"
                value={(form as any)[k]}
                onChange={(e) => setForm({ ...form, [k]: Number(e.target.value) })}
              />
            </label>
          ))}
          <button className="bg-violet-600 px-4 py-2 rounded-lg" onClick={calc}>
            Hisoblash
          </button>
          {loan && (
            <div className="text-sm space-y-1 text-slate-300">
              <div>Oylik: {som(loan.monthly_payment)}</div>
              <div>Jami foiz: {som(loan.total_interest)}</div>
              <div>Samarali stavka: {(loan.effective_rate * 100).toFixed(2)}%</div>
              <span className="chip">kalkulyator</span>
            </div>
          )}
        </div>
        <div className="bg-panel/60 border border-line rounded-2xl p-4">
          <h2 className="font-medium">KTI {score}/100</h2>
          <div className="h-3 bg-white/10 rounded-full mt-2">
            <div className="h-3 bg-violet-600 rounded-full" style={{ width: `${score}%` }} />
          </div>
          <ul className="mt-3 text-sm space-y-1">
            {(kti?.factors || []).map((f: any) => (
              <li key={f.key} className="flex justify-between text-slate-300">
                <span>{f.label}</span>
                <span>{f.score}</span>
              </li>
            ))}
          </ul>
          <h3 className="mt-4 font-medium">Indeksni oshirish uchun 3 qadam</h3>
          <ol className="list-decimal ml-5 text-sm text-slate-300">
            {(kti?.recommendations || []).map((r: string) => (
              <li key={r}>{r}</li>
            ))}
          </ol>
          <p className="text-xs text-slate-500 mt-2">{kti?.disclaimer}</p>
        </div>
      </div>
      <div className="mt-4 bg-panel/60 border border-line rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-black/30 text-slate-400">
            <tr>
              <th className="p-2 text-left">Dastur</th>
              <th className="p-2">Stavka</th>
              <th className="p-2">Max</th>
              <th className="p-2">Sabab</th>
            </tr>
          </thead>
          <tbody>
            {programs.map((p) => (
              <tr key={p.id} className="border-t border-line">
                <td className="p-2">
                  {p.name}
                  <div className="text-xs text-violet-400">{p.legal_ref_url}</div>
                </td>
                <td className="p-2 text-center">{(p.rate * 100).toFixed(1)}%</td>
                <td className="p-2 text-center">{som(p.max_amount)}</td>
                <td className="p-2 text-slate-400">{(p.reasons || []).join("; ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
