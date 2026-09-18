import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useQueryClient } from "@tanstack/react-query";
import { api, som } from "../lib/api";
import { BankPanel } from "./Bank";

const TABS = [
  { id: "reja", label: "1. Reja" },
  { id: "stress", label: "2. Stress-test" },
  { id: "kredit", label: "3. Kredit markazi" },
  { id: "soliq", label: "4. Soliq" },
  { id: "paket", label: "5. Paket" },
  { id: "keys", label: "6. Keys" },
] as const;

const TEMPLATES = [
  { id: "somsaxona", title: "2-filial somsaxona", sector: "ovqatlanish", place: "Urganch", investment: 150000000, employees: 6, wage: 2500000, rent: 5000000, units_month: 8000, sell_price: 9000, un: 1500, gosht: 400, piyoz: 200, loan_payment: 8000000 },
  { id: "novvoy", title: "Novvoyxona", sector: "ovqatlanish", place: "Urganch", investment: 80000000, employees: 4, wage: 2200000, rent: 3500000, units_month: 12000, sell_price: 3500, un: 4000, gosht: 0, piyoz: 40, loan_payment: 4000000 },
  { id: "minimarket", title: "Oziq-ovqat minimarketi", sector: "savdo", place: "Xiva", investment: 200000000, employees: 5, wage: 2500000, rent: 8000000, units_month: 5000, sell_price: 18000, un: 800, gosht: 200, piyoz: 150, loan_payment: 9000000 },
  { id: "issiqxona", title: "Issiqxona", sector: "qishloq", place: "Gurlan", investment: 250000000, employees: 3, wage: 2800000, rent: 2000000, units_month: 4000, sell_price: 12000, un: 0, gosht: 0, piyoz: 50, loan_payment: 10000000 },
  { id: "tikuv", title: "Tikuvchilik sexi", sector: "ishlab-chiqarish", place: "Urganch", investment: 120000000, employees: 8, wage: 2000000, rent: 4000000, units_month: 1500, sell_price: 45000, un: 0, gosht: 0, piyoz: 0, loan_payment: 6000000 },
];

export default function Plan() {
  const [params, setParams] = useSearchParams();
  const requested = params.get("tab");
  const tab = (TABS.some((t) => t.id === requested) ? requested : "reja") as (typeof TABS)[number]["id"];
  const setTab = (id: (typeof TABS)[number]["id"]) => setParams(id === "reja" ? {} : { tab: id });
  const [form, setForm] = useState({ ...TEMPLATES[0] });
  const [plan, setPlan] = useState<any>(null);
  const [stress, setStress] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const yearlyRev = form.units_month * form.sell_price * 12;

  async function build() {
    setBusy(true);
    try {
      const data = await api("/api/plans/", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          materials: { un: form.un, "mol-gosht": form.gosht, piyoz: form.piyoz },
        }),
      });
      setPlan(data);
      if (data.id) {
        const st = await api(`/api/plans/${data.id}/stress-test/`, { method: "POST", body: JSON.stringify({ n: 1000 }) });
        setStress(st);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl">Biznes-reja</h1>
      <p className="text-slate-400 text-sm">Bitta joyda: reja, risk, kredit, soliq va bank paketi</p>
      <div className="flex gap-2 mt-4 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-full text-sm ${tab === t.id ? "bg-violet-600" : "border border-line text-slate-300"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "reja" && (
        <div className="mt-4 space-y-4">
          <div className="flex gap-2 flex-wrap">
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                className={`px-3 py-1.5 rounded-full text-sm ${form.title === tpl.title ? "bg-violet-600" : "border border-line text-slate-300"}`}
                onClick={() => setForm({ ...tpl })}
              >
                {tpl.title}
              </button>
            ))}
          </div>
          <div className="bg-panel/60 border border-line rounded-2xl p-5 grid sm:grid-cols-2 gap-3">
            <Field label="Reja nomi" value={form.title} onChange={(v) => set("title", v)} />
            <Field label="Soha" value={form.sector} onChange={(v) => set("sector", v)} />
            <Field label="Joy" value={form.place} onChange={(v) => set("place", v)} />
            <Field label="Investitsiya, so'm" type="number" value={form.investment} onChange={(v) => set("investment", Number(v))} />
            <Field label="Xodimlar" type="number" value={form.employees} onChange={(v) => set("employees", Number(v))} />
            <Field label="Oylik maosh" type="number" value={form.wage} onChange={(v) => set("wage", Number(v))} />
            <Field label="Ijara, so'm" type="number" value={form.rent} onChange={(v) => set("rent", Number(v))} />
            <Field label="Oylik sotuv (dona)" type="number" value={form.units_month} onChange={(v) => set("units_month", Number(v))} />
            <Field label="Sotuv narxi" type="number" value={form.sell_price} onChange={(v) => set("sell_price", Number(v))} />
            <Field label="Un, kg/oy" type="number" value={form.un} onChange={(v) => set("un", Number(v))} />
            <Field label="Go'sht, kg/oy" type="number" value={form.gosht} onChange={(v) => set("gosht", Number(v))} />
            <Field label="Piyoz, kg/oy" type="number" value={form.piyoz} onChange={(v) => set("piyoz", Number(v))} />
          </div>
          <button className="bg-violet-600 px-5 py-2 rounded-xl" disabled={busy} onClick={build}>
            {busy ? "Hisoblanmoqda…" : "Hisoblash (narxlar BozorPulsdan)"}
          </button>
          {plan && (
            <div className="grid sm:grid-cols-3 gap-3">
              <Stat label="Oylik sof" value={som(plan.outputs?.net_month)} />
              <Stat label="NPV" value={som(plan.outputs?.npv)} />
              <Stat label="O'zini oqlash" value={`${plan.outputs?.payback_months ?? "—"} oy`} />
              <Stat label="Zararsizlik" value={`${plan.outputs?.break_even_units ?? "—"} dona`} />
              <Stat label="Yillik aylanma" value={som(yearlyRev)} />
              <Stat label="Xom ashyo/oy" value={som(plan.outputs?.materials_cost_month)} />
              <Stat label="CAPEX" value={som(plan.outputs?.capex)} />
              <Stat label="OPEX / oy" value={som(plan.outputs?.opex_month)} />
              <div className="sm:col-span-3 bg-panel/60 border border-line rounded-2xl p-4 text-sm">
                <div className="font-medium mb-2">Xom ashyo — BozorPuls narxi</div>
                {Object.entries(plan.price_snapshot || {}).map(([k, v]: any) => (
                  <div key={k} className="flex justify-between py-1">
                    <span>{v.name}</span>
                    <span>
                      {som(v.price)} <span className="chip">{v.source}</span>
                    </span>
                  </div>
                ))}
                <div className="flex gap-2 mt-3 flex-wrap">
                  <button className="bg-violet-600 px-4 py-2 rounded-lg" onClick={() => setTab("stress")}>
                    Stress-test
                  </button>
                  <button className="border border-line px-4 py-2 rounded-lg" onClick={() => setTab("kredit")}>
                    Kredit
                  </button>
                  <button className="border border-line px-4 py-2 rounded-lg" onClick={() => setTab("soliq")}>
                    Soliq
                  </button>
                  <button className="border border-line px-4 py-2 rounded-lg" onClick={() => window.print()}>
                    PDF / chop etish
                  </button>
                </div>
              </div>
              {(plan.outputs?.cashflow_12 || []).length > 0 && (
                <div className="sm:col-span-3 overflow-x-auto border border-line rounded-2xl">
                  <div className="p-3 font-medium text-sm">12 oylik kassa oqimi</div>
                  <table className="w-full text-sm">
                    <thead className="bg-black/30 text-slate-400">
                      <tr>
                        <th className="p-2 text-left">Oy</th>
                        <th className="p-2 text-right">Kirim</th>
                        <th className="p-2 text-right">OPEX</th>
                        <th className="p-2 text-right">Kredit</th>
                        <th className="p-2 text-right">Sof</th>
                        <th className="p-2 text-right">Kassa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plan.outputs.cashflow_12.map((r: any) => (
                        <tr key={r.month} className="border-t border-line">
                          <td className="p-2">{r.month}</td>
                          <td className="p-2 text-right">{som(r.inflow)}</td>
                          <td className="p-2 text-right">{som(r.opex)}</td>
                          <td className="p-2 text-right">{som(r.loan)}</td>
                          <td className="p-2 text-right">{som(r.net)}</td>
                          <td className={`p-2 text-right ${r.gap ? "text-rose-400" : "text-emerald-400"}`}>{som(r.cash)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {plan.outputs?.swot && (
                <div className="sm:col-span-3 grid sm:grid-cols-2 gap-3 text-sm">
                  <SwotBox title="Kuchli (S)" items={plan.outputs.swot.s} />
                  <SwotBox title="Zaif (W)" items={plan.outputs.swot.w} />
                  <SwotBox title="Imkoniyat (O)" items={plan.outputs.swot.o} />
                  <SwotBox title="Xavf (T)" items={plan.outputs.swot.t} />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === "stress" && <StressBlock planId={plan?.id} stress={stress} setStress={setStress} />}
      {tab === "kredit" && <CreditBlock amount={form.investment} monthlyIncome={Math.round(yearlyRev / 12)} />}
      {tab === "soliq" && <TaxBlock turnover={yearlyRev} expenses={Math.round(yearlyRev * 0.6)} sector={form.sector} />}
      {tab === "paket" && <PackageBlock onOpenBank={() => setTab("kredit")} />}
      {tab === "keys" && <CaseStudy />}
    </div>
  );
}

function StressBlock({ planId, stress, setStress }: { planId?: number; stress: any; setStress: (v: any) => void }) {
  const [busy, setBusy] = useState(false);
  async function run() {
    if (!planId) return;
    setBusy(true);
    try {
      setStress(await api(`/api/plans/${planId}/stress-test/`, { method: "POST", body: JSON.stringify({ n: 1000 }) }));
    } finally {
      setBusy(false);
    }
  }
  if (!planId) return <p className="mt-4 text-slate-400">Avval reja hisoblang.</p>;
  return (
    <div className="mt-4">
      <button className="bg-violet-600 px-4 py-2 rounded-xl" onClick={run} disabled={busy}>
        {busy ? "…" : "1 000 ssenariy ishga tushirish"}
      </button>
      {stress && (
        <>
          <div className="grid sm:grid-cols-4 gap-3 mt-4">
            <Stat label="Zarar ehtimoli" value={`${(stress.p_loss * 100).toFixed(1)}%`} />
            <Stat label="P10" value={som(stress.p10)} />
            <Stat label="P50" value={som(stress.p50)} />
            <Stat label="P90" value={som(stress.p90)} />
          </div>
          <div className="mt-4 bg-panel/60 border border-line rounded-2xl p-4 h-56">
            <ResponsiveContainer>
              <BarChart data={stress.histogram}>
                <XAxis dataKey="x" hide />
                <Tooltip contentStyle={{ background: "#101826", border: "1px solid #1e2a3d" }} />
                <Bar dataKey="n" fill="#7c5cff" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 text-sm">
            Eng xavfli omil: <b>{stress.top_risk_factor}</b>
          </p>
          <p className="text-xs text-slate-500">{stress.disclaimer}</p>
        </>
      )}
    </div>
  );
}

function CreditBlock({ amount, monthlyIncome }: { amount: number; monthlyIncome: number }) {
  const [loan, setLoan] = useState<any>(null);
  const [programs, setPrograms] = useState<any[]>([]);
  const [kti, setKti] = useState<any>(null);
  const [form, setForm] = useState({ amount, rate: 14, months: 36, grace: 3, subsidy: 4, type: "annuity" });
  useEffect(() => {
    setForm((f) => ({ ...f, amount }));
  }, [amount]);
  async function calc() {
    const r = await api("/api/finance/loan/calc/", {
      method: "POST",
      body: JSON.stringify({ ...form, monthly_income: monthlyIncome }),
    });
    setLoan(r);
  }
  useEffect(() => {
    calc();
    api(`/api/finance/programs/match/?amount=${amount}&sector=ovqatlanish`).then(setPrograms);
    api("/api/credit-readiness/1/").then(setKti);
  }, [amount]);
  const score = kti?.score ?? 0;
  const labels: Record<string, string> = { amount: "Summa, so'm", rate: "Stavka %", months: "Muddat, oy", grace: "Imtiyoz, oy", subsidy: "Kompensatsiya %" };
  return (
    <div className="mt-4 grid lg:grid-cols-2 gap-4">
      <div className="bg-panel/60 border border-line rounded-2xl p-4 space-y-2">
        <h2 className="font-medium">Smart kredit kalkulyatori</h2>
        {(["amount", "rate", "months", "grace", "subsidy"] as const).map((k) => (
          <Field key={k} label={labels[k]} type="number" value={(form as any)[k]} onChange={(v) => setForm({ ...form, [k]: Number(v) })} />
        ))}
        <label className="block text-sm text-slate-300">
          Jadval
          <select className="mt-1 w-full bg-panel border border-line rounded-xl px-3 py-2" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="annuity">Anuitet</option>
            <option value="differential">Differensial</option>
          </select>
        </label>
        <button className="bg-violet-600 px-4 py-2 rounded-lg" onClick={calc}>
          Hisoblash
        </button>
        {loan && (
          <div className="text-sm space-y-1 text-slate-300">
            <div>Oylik: {som(loan.monthly_payment)}</div>
            <div>Jami foiz: {som(loan.total_interest)}</div>
            <div>Samarali stavka: {(loan.effective_rate * 100).toFixed(2)}%</div>
            {loan.dti_pct != null && (
              <div className={loan.dti_ok ? "text-emerald-400" : "text-rose-400"}>
                DTI {loan.dti_pct}% {loan.dti_ok ? "(40% dan past)" : "(yuqori — bank rad etishi mumkin)"}
              </div>
            )}
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
        <h3 className="mt-4 font-medium">3 qadam</h3>
        <ol className="list-decimal ml-5 text-sm text-slate-300">
          {(kti?.recommendations || []).map((r: string) => (
            <li key={r}>{r}</li>
          ))}
        </ol>
      </div>
      <div className="lg:col-span-2 bg-panel/60 border border-line rounded-2xl overflow-hidden">
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
                  <div className="text-xs text-slate-400">{p.provider}</div>
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
      {loan?.schedule?.length > 0 && (
        <div className="lg:col-span-2 overflow-x-auto border border-line rounded-2xl">
          <div className="p-3 font-medium text-sm">To'lov jadvali (birinchi 12 oy)</div>
          <table className="w-full text-sm">
            <thead className="bg-black/30 text-slate-400">
              <tr>
                <th className="p-2 text-left">Oy</th>
                <th className="p-2 text-right">Asosiy</th>
                <th className="p-2 text-right">Foiz</th>
                <th className="p-2 text-right">To'lov</th>
                <th className="p-2 text-right">Qoldiq</th>
              </tr>
            </thead>
            <tbody>
              {loan.schedule.slice(0, 12).map((r: any) => (
                <tr key={r.month} className="border-t border-line">
                  <td className="p-2">{r.month}</td>
                  <td className="p-2 text-right">{som(r.principal)}</td>
                  <td className="p-2 text-right">{som(r.interest)}</td>
                  <td className="p-2 text-right">{som(r.payment)}</td>
                  <td className="p-2 text-right">{som(r.remaining)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="lg:col-span-2">
        <BankPanel />
      </div>
    </div>
  );
}

function TaxBlock({ turnover, expenses, sector }: { turnover: number; expenses: number; sector: string }) {
  const [t, setT] = useState(turnover);
  const [e, setE] = useState(expenses);
  const [tax, setTax] = useState<any>(null);
  const [st, setSt] = useState<any>(null);
  useEffect(() => {
    setT(turnover);
    setE(expenses);
  }, [turnover, expenses]);
  async function run() {
    setTax(await api("/api/finance/tax/compare/", { method: "POST", body: JSON.stringify({ turnover: t, expenses: e, sector }) }));
    setSt(await api("/api/finance/status/compare/", { method: "POST", body: JSON.stringify({ turnover: t, expenses: e, sector }) }));
  }
  useEffect(() => {
    run();
  }, []);
  return (
    <div className="mt-4">
      <div className="flex gap-2 flex-wrap">
        <Field label="Yillik aylanma" type="number" value={t} onChange={(v) => setT(Number(v))} />
        <Field label="Xarajat" type="number" value={e} onChange={(v) => setE(Number(v))} />
        <button className="self-end bg-violet-600 px-4 py-2 rounded-xl h-10" onClick={run}>
          Taqqoslash
        </button>
      </div>
      {tax?.warnings?.length > 0 && (
        <div className="mt-4 border border-amber-500/40 bg-amber-500/10 rounded-2xl p-4 text-sm text-amber-200 space-y-1">
          {tax.warnings.map((w: string) => (
            <div key={w}>{w}</div>
          ))}
        </div>
      )}
      {tax && (
        <div className="mt-4 bg-panel/60 border border-line rounded-2xl p-4 h-64">
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
            <b>{r.regime}</b> — {som(r.tax)} · {r.rate}%{" "}
            <a className="text-violet-400 text-xs" href={r.legal_ref_url} target="_blank">
              lex.uz
            </a>
          </li>
        ))}
      </ul>
      {st && (
        <div className="mt-4 grid md:grid-cols-3 gap-3">
          {st.variants.map((v: any) => (
            <div key={v.status} className="bg-panel/60 border border-line rounded-2xl p-4">
              <div className="font-medium">{v.label}</div>
              <div className="text-sm text-slate-300">Soliq {som(v.tax)}</div>
              <div className="text-sm">Xavf {v.risk} · kredit: {v.credit_access}</div>
            </div>
          ))}
        </div>
      )}
      {(tax?.calendar || []).length > 0 && (
        <div className="mt-4 border border-line rounded-2xl overflow-hidden">
          <div className="p-3 font-medium text-sm">Tadbirkor soliq taqvimi</div>
          <table className="w-full text-sm">
            <thead className="bg-black/30 text-slate-400">
              <tr>
                <th className="p-2 text-left">Qachon</th>
                <th className="p-2 text-left">Nima</th>
                <th className="p-2 text-left">Xavf</th>
              </tr>
            </thead>
            <tbody>
              {tax.calendar.map((c: any) => (
                <tr key={c.title} className="border-t border-line">
                  <td className="p-2">{c.when}</td>
                  <td className="p-2">{c.title}</td>
                  <td className="p-2 text-rose-300">{c.risk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PackageBlock({ onOpenBank }: { onOpenBank: () => void }) {
  const qc = useQueryClient();
  const [consent, setConsent] = useState(false);
  const [res, setRes] = useState<any>(null);
  async function send() {
    const r = await api("/api/credit-package/", { method: "POST", body: JSON.stringify({ consent, send: true }) });
    setRes(r);
    qc.invalidateQueries({ queryKey: ["packs"] });
  }
  return (
    <div className="mt-4 max-w-xl bg-panel/60 border border-line rounded-2xl p-5">
      <p className="text-sm text-slate-400">Reja + KTI. Bankka faqat rozilik bilan yuboriladi.</p>
      <label className="mt-4 flex items-center gap-2">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        Bankka yuborishga roziman
      </label>
      <button className="mt-4 bg-violet-600 px-4 py-2 rounded-lg" onClick={send}>
        Paket yaratish
      </button>
      {res && (
        <div className="mt-4 text-sm space-y-1">
          <div>KTI: {res.summary?.kti}</div>
          <div>NPV: {som(res.summary?.npv)}</div>
          <div>Bank: {res.bank_inbox ? "yuborildi" : "yo'q"}</div>
          {res.bank_inbox && (
            <button className="mt-2 border border-line px-3 py-1.5 rounded-lg" onClick={onOpenBank}>
              Bank panelini ochish
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: any) {
  return (
    <label className="block text-sm text-slate-300">
      {label}
      <input className="mt-1 w-full bg-panel border border-line rounded-xl px-3 py-2" type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-panel/60 border border-line rounded-2xl p-4">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="font-display text-xl">{value}</div>
    </div>
  );
}

function SwotBox({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="bg-panel/60 border border-line rounded-2xl p-4">
      <div className="font-medium mb-2">{title}</div>
      <ul className="list-disc ml-4 text-slate-300 space-y-1">
        {(items || []).map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    </div>
  );
}

function CaseStudy() {
  return (
    <div className="mt-4 space-y-4 text-sm text-slate-300">
      <div className="bg-panel/60 border border-line rounded-2xl p-5">
        <h2 className="font-display text-2xl text-white">Alisher aka · Samarqand</h2>
        <p className="mt-2">
          Novvoyxona ochmoqchi. BozorPuls Qo'yliqda unni arzon topadi, 14 kunlik prognoz «HOZIR OL» beradi, tannarx shu narxga
          asoslanadi. Kredit markazi Xalq bankining 17.5% dasturini moslashtiradi, DTI va KTI ko'rsatiladi, soliq taqvimi
          YaTT 4% ni tanlaydi. Kredit paketi rozilik bilan bank paneliga tushadi.
        </p>
      </div>
      <div className="grid sm:grid-cols-5 gap-2">
        {[
          ["1", "Ovoz / OCR", "Narx yig'ish"],
          ["2", "BozorPredict", "14 kun prognoz"],
          ["3", "Fin-LLM", "Qonun / dastur"],
          ["4", "Simulyator", "CAPEX · DTI · KTI"],
          ["5", "Matchmaking", "Partiya + shartnoma"],
        ].map(([n, t, d]) => (
          <div key={n} className="border border-line rounded-2xl p-3 bg-panel/60">
            <div className="text-violet-400 text-xs">Qatlam {n}</div>
            <div className="font-medium text-white">{t}</div>
            <div className="text-xs text-slate-400">{d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
