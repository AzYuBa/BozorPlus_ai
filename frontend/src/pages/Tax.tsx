import { useState } from "react";
import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api, som } from "../lib/api";

export default function Tax() {
  const [turnover, setTurnover] = useState(800000000);
  const [expenses, setExpenses] = useState(500000000);
  const [tax, setTax] = useState<any>(null);
  const [st, setSt] = useState<any>(null);

  async function run() {
    setTax(await api("/api/finance/tax/compare/", { method: "POST", body: JSON.stringify({ turnover, expenses, sector: "ovqatlanish" }) }));
    setSt(await api("/api/finance/status/compare/", { method: "POST", body: JSON.stringify({ turnover, expenses, sector: "ovqatlanish" }) }));
  }

  return (
    <div>
      <h1 className="font-display text-3xl">Soliq va formallashuv</h1>
      <div className="flex gap-2 mt-3 flex-wrap">
        <input type="number" className="bg-panel border border-line rounded-lg px-3 py-2" value={turnover} onChange={(e) => setTurnover(Number(e.target.value))} />
        <input type="number" className="bg-panel border border-line rounded-lg px-3 py-2" value={expenses} onChange={(e) => setExpenses(Number(e.target.value))} />
        <button className="bg-violet-600 px-4 rounded-lg" onClick={run}>
          Taqqoslash
        </button>
      </div>
      {tax && (
        <div className="mt-4 bg-panel/60 border border-line rounded-2xl p-4 h-72">
          <ResponsiveContainer>
            <BarChart data={tax.rows}>
              <XAxis dataKey="regime" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: "#101826", border: "1px solid #1e2a3d" }} />
              <Legend />
              <Bar dataKey="tax" fill="#7c5cff" name="Soliq" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <ul className="mt-3 text-sm space-y-2">
        {(tax?.rows || []).map((r: any) => (
          <li key={r.regime} className="bg-panel/60 border border-line rounded-xl p-3">
            <b>{r.regime}</b> — {som(r.tax)} · stavka {r.rate}%
            <div className="text-xs">
              <a className="text-violet-400" href={r.legal_ref_url} target="_blank">
                lex.uz
              </a>{" "}
              <span className="chip">{r.source}</span>
            </div>
          </li>
        ))}
      </ul>
      {st && (
        <div className="mt-4 grid md:grid-cols-3 gap-3">
          {st.variants.map((v: any) => (
            <div key={v.status} className="bg-panel/60 border border-line rounded-2xl p-4">
              <div className="font-medium">{v.label}</div>
              <div className="text-sm text-slate-300">Soliq {som(v.tax)}</div>
              <div className="text-sm text-slate-300">Xavf {v.risk} · kredit: {v.credit_access}</div>
              <div className="text-xs text-slate-500 mt-2">{v.extras.join(" · ")}</div>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-slate-500 mt-3">{tax?.disclaimer}</p>
    </div>
  );
}
