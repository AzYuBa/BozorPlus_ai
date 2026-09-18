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
    <div className="bp-page">
      <h1 className="bp-title">Biznes-reja</h1>
      <p className="bp-sub">Reja, risk, kredit, soliq va bank paketi — bir oqimda</p>
      <div className="flex gap-2 mt-5 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={tab === t.id ? "bp-tab-on" : "bp-tab"}
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
                className={form.title === tpl.title ? "bp-tab-on" : "bp-tab"}
                onClick={() => setForm({ ...tpl })}
              >
                {tpl.title}
              </button>
            ))}
          </div>
          <div className="bp-panel p-5 grid sm:grid-cols-2 gap-3">
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
          <button className="bp-btn px-5 py-2 rounded-xl" disabled={busy} onClick={build}>
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
              <div className="sm:col-span-3 bp-panel p-4 text-sm">
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
                  <button className="bp-btn px-4 py-2 rounded-lg" onClick={() => setTab("stress")}>
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
                    <thead className="bg-sand text-muted">
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
                          <td className={`p-2 text-right ${r.gap ? "text-down" : "text-up"}`}>{som(r.cash)}</td>
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
      {tab === "paket" && (
        <PackageBlock
          amount={form.investment}
          sector={form.sector}
          onOpenBank={() => setTab("kredit")}
        />
      )}
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
  if (!planId) return <p className="mt-4 text-muted">Avval reja hisoblang.</p>;
  return (
    <div className="mt-4">
      <button className="bp-btn px-4 py-2 rounded-xl" onClick={run} disabled={busy}>
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
          <div className="mt-4 bp-panel p-4 h-56">
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
          <p className="text-xs text-muted">{stress.disclaimer}</p>
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
      <div className="bp-panel p-4 space-y-2">
        <h2 className="font-medium">Smart kredit kalkulyatori</h2>
        {(["amount", "rate", "months", "grace", "subsidy"] as const).map((k) => (
          <Field key={k} label={labels[k]} type="number" value={(form as any)[k]} onChange={(v) => setForm({ ...form, [k]: Number(v) })} />
        ))}
        <label className="block text-sm text-ink/80">
          Jadval
          <select className="mt-1 w-full bp-input px-3 py-2" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="annuity">Anuitet</option>
            <option value="differential">Differensial</option>
          </select>
        </label>
        <button className="bp-btn px-4 py-2 rounded-lg" onClick={calc}>
          Hisoblash
        </button>
        {loan && (
          <div className="text-sm space-y-1 text-ink/80">
            <div>Oylik: {som(loan.monthly_payment)}</div>
            <div>Jami foiz: {som(loan.total_interest)}</div>
            <div>Samarali stavka: {(loan.effective_rate * 100).toFixed(2)}%</div>
            {loan.dti_pct != null && (
              <div className={loan.dti_ok ? "text-up" : "text-down"}>
                DTI {loan.dti_pct}% {loan.dti_ok ? "(40% dan past)" : "(yuqori — bank rad etishi mumkin)"}
              </div>
            )}
            <span className="chip">kalkulyator</span>
          </div>
        )}
      </div>
      <div className="bp-panel p-4">
        <h2 className="font-medium">KTI {score}/100</h2>
        <div className="h-3 bg-white/10 rounded-full mt-2">
          <div className="h-3 bg-accent rounded-full" style={{ width: `${score}%` }} />
        </div>
        <ul className="mt-3 text-sm space-y-1">
          {(kti?.factors || []).map((f: any) => (
            <li key={f.key} className="flex justify-between text-ink/80">
              <span>{f.label}</span>
              <span>{f.score}</span>
            </li>
          ))}
        </ul>
        <h3 className="mt-4 font-medium">3 qadam</h3>
        <ol className="list-decimal ml-5 text-sm text-ink/80">
          {(kti?.recommendations || []).map((r: string) => (
            <li key={r}>{r}</li>
          ))}
        </ol>
      </div>
      <div className="lg:col-span-2 bp-panel overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-sand text-muted">
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
                  <div className="text-xs text-muted">{p.provider}</div>
                  <div className="text-xs text-teal">{p.legal_ref_url}</div>
                </td>
                <td className="p-2 text-center">{(p.rate * 100).toFixed(1)}%</td>
                <td className="p-2 text-center">{som(p.max_amount)}</td>
                <td className="p-2 text-muted">{(p.reasons || []).join("; ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {loan?.schedule?.length > 0 && (
        <div className="lg:col-span-2 overflow-x-auto border border-line rounded-2xl">
          <div className="p-3 font-medium text-sm">To'lov jadvali (birinchi 12 oy)</div>
          <table className="w-full text-sm">
            <thead className="bg-sand text-muted">
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
        <button className="self-end bg-accent px-4 py-2 rounded-xl h-10" onClick={run}>
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
        <div className="mt-4 bp-panel p-4 h-64">
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
            <a className="text-teal text-xs" href={r.legal_ref_url} target="_blank">
              lex.uz
            </a>
          </li>
        ))}
      </ul>
      {st && (
        <div className="mt-4 grid md:grid-cols-3 gap-3">
          {st.variants.map((v: any) => (
            <div key={v.status} className="bp-panel p-4">
              <div className="font-medium">{v.label}</div>
              <div className="text-sm text-ink/80">Soliq {som(v.tax)}</div>
              <div className="text-sm">Xavf {v.risk} · kredit: {v.credit_access}</div>
            </div>
          ))}
        </div>
      )}
      {(tax?.calendar || []).length > 0 && (
        <div className="mt-4 border border-line rounded-2xl overflow-hidden">
          <div className="p-3 font-medium text-sm">Tadbirkor soliq taqvimi</div>
          <table className="w-full text-sm">
            <thead className="bg-sand text-muted">
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
                  <td className="p-2 text-down">{c.risk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PackageBlock({
  amount,
  sector,
  onOpenBank,
}: {
  amount: number;
  sector: string;
  onOpenBank: () => void;
}) {
  const qc = useQueryClient();
  const [consent, setConsent] = useState(false);
  const [res, setRes] = useState<any>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [programs, setPrograms] = useState<any[]>([]);
  const [bank, setBank] = useState("");
  const [programId, setProgramId] = useState<number | "">("");

  useEffect(() => {
    api(`/api/finance/programs/match/?amount=${amount}&sector=${encodeURIComponent(sector || "ovqatlanish")}`)
      .then((list) => {
        setPrograms(list || []);
        if (list?.length) {
          const preferred =
            list.find((p: any) => p.provider === "Xalq banki") ||
            list.find((p: any) => p.eligible) ||
            list[0];
          setBank(preferred.provider);
          setProgramId(preferred.id);
        }
      })
      .catch(() => setPrograms([]));
  }, [amount, sector]);

  const banks = Array.from(new Set(programs.map((p) => p.provider).filter(Boolean)));
  const bankPrograms = programs.filter((p) => p.provider === bank);
  const selected = bankPrograms.find((p) => p.id === programId) || bankPrograms[0] || null;

  useEffect(() => {
    if (!bank) return;
    const list = programs.filter((p) => p.provider === bank);
    if (!list.length) return;
    if (!list.some((p) => p.id === programId)) {
      setProgramId(list[0].id);
    }
  }, [bank, programs, programId]);

  async function send() {
    setErr("");
    if (!selected) {
      setErr("Bank va kredit turini tanlang");
      return;
    }
    if (!consent) {
      setErr("Bankka yuborish uchun rozilik kerak");
      return;
    }
    setBusy(true);
    try {
      const r = await api("/api/credit-package/", {
        method: "POST",
        body: JSON.stringify({
          consent,
          send: true,
          program_id: selected.id,
          bank: selected.provider,
          program_name: selected.name,
        }),
      });
      setRes(r);
      qc.invalidateQueries({ queryKey: ["packs"] });
    } catch (e: any) {
      setErr(e?.message || "Paket yaratilmadi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 max-w-2xl bp-panel p-5 space-y-4">
      <div>
        <h2 className="font-display text-xl font-bold">Kredit paketi</h2>
        <p className="text-sm text-muted mt-1">
          Avval bank va kredit turini tanlang. Reja + KTI shu dastur uchun yig‘iladi; bankka faqat rozilik bilan
          yuboriladi.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block text-sm text-ink/80">
          Bank
          <select
            className="mt-1 w-full bp-input"
            value={bank}
            onChange={(e) => setBank(e.target.value)}
          >
            <option value="">Tanlang</option>
            {banks.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm text-ink/80">
          Kredit turi / dastur
          <select
            className="mt-1 w-full bp-input"
            value={programId === "" ? "" : String(programId)}
            onChange={(e) => setProgramId(e.target.value ? Number(e.target.value) : "")}
            disabled={!bank}
          >
            <option value="">Tanlang</option>
            {bankPrograms.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selected ? (
        <div className="rounded-2xl border border-line bg-mist/80 p-4 text-sm space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted font-semibold">Tanlangan paket</div>
              <div className="font-display font-bold text-lg mt-0.5">{selected.provider}</div>
              <div className="text-ink/80">{selected.name}</div>
            </div>
            <span className={`chip ${selected.eligible ? "" : "!border-amber-300 !text-amber-700"}`}>
              {selected.eligible ? "mos" : "shartli"}
            </span>
          </div>
          <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1 text-ink/80">
            <div>
              Stavka: <b>{(selected.rate * 100).toFixed(1)}%</b>
            </div>
            <div>
              Max summa: <b>{som(selected.max_amount)}</b>
            </div>
            <div>
              Muddat: <b>{selected.term_months} oy</b>
            </div>
            <div>
              Imtiyoz: <b>{selected.grace_months || 0} oy</b>
            </div>
            {selected.collateral && (
              <div className="sm:col-span-2">
                Garov: <b>{selected.collateral}</b>
              </div>
            )}
          </div>
          {(selected.reasons || []).length > 0 && (
            <p className="text-xs text-muted">{(selected.reasons || []).join(" · ")}</p>
          )}
          {selected.legal_ref_url && (
            <a className="bp-link text-xs" href={selected.legal_ref_url} target="_blank" rel="noreferrer">
              Huquqiy manba
            </a>
          )}
          <button type="button" className="bp-link text-xs" onClick={onOpenBank}>
            Kredit markazida dasturlarni ko‘rish
          </button>
        </div>
      ) : (
        <p className="text-sm text-muted">Dasturlar yuklanmoqda yoki topilmadi…</p>
      )}

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          className="mt-1"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        <span>
          <b>{selected?.provider || "Tanlangan bank"}</b>
          {selected ? ` — «${selected.name}»` : ""} dasturiga moliyaviy ma'lumotlarimni yuborishga roziman.
        </span>
      </label>

      {err && <p className="text-sm text-down">{err}</p>}

      <button className="bp-btn" disabled={busy || !selected} onClick={send}>
        {busy ? "…" : "Paket yaratish"}
      </button>

      {res && (
        <div className="text-sm space-y-1 border-t border-line pt-4">
          <div className="font-medium text-up">Paket yaratildi</div>
          <div>
            Bank: <b>{res.summary?.bank || res.bank}</b>
          </div>
          <div>
            Kredit turi: <b>{res.summary?.program_name || res.program_name}</b>
          </div>
          {res.summary?.loan && (
            <div className="text-muted text-xs">
              {(res.summary.loan.rate * 100).toFixed(1)}% · {res.summary.loan.term_months} oy · max{" "}
              {som(res.summary.loan.max_amount)}
            </div>
          )}
          <div>KTI: {res.summary?.kti}</div>
          <div>NPV: {som(res.summary?.npv)}</div>
          <div>Bank paneli: {res.bank_inbox ? "yuborildi" : "yo'q"}</div>
          {res.bank_inbox && (
            <button className="mt-2 bp-btn-ghost !px-3 !py-1.5" onClick={onOpenBank}>
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
    <label className="block text-sm text-ink/80">
      {label}
      <input className="mt-1 w-full bp-input px-3 py-2" type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bp-panel p-4">
      <div className="text-xs text-muted">{label}</div>
      <div className="font-display text-xl">{value}</div>
    </div>
  );
}

function SwotBox({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="bp-panel p-4">
      <div className="font-medium mb-2">{title}</div>
      <ul className="list-disc ml-4 text-ink/80 space-y-1">
        {(items || []).map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    </div>
  );
}

function CaseStudy() {
  return (
    <div className="mt-4 space-y-4 text-sm text-ink/80">
      <div className="bp-panel p-5">
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
            <div className="text-teal text-xs">Qatlam {n}</div>
            <div className="font-medium text-white">{t}</div>
            <div className="text-xs text-muted">{d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
