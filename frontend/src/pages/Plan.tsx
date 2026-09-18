import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, som } from "../lib/api";

const steps = ["Soha", "Joy", "Investitsiya", "Xodimlar", "Sotuv"];

export default function Plan() {
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    title: "2-filial somsaxona",
    sector: "ovqatlanish",
    place: "Urganch",
    investment: 150000000,
    employees: 6,
    wage: 2500000,
    rent: 5000000,
    units_month: 8000,
    sell_price: 9000,
    loan_payment: 8000000,
  });
  const [plan, setPlan] = useState<any>(null);
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  async function build() {
    const data = await api("/api/plans/", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        materials: { un: 1500, "mol-gosht": 400, piyoz: 200 },
      }),
    });
    setPlan(data);
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl">Biznes-reja ustasi</h1>
      <div className="flex gap-2 mt-3 text-xs flex-wrap">
        {steps.map((s, i) => (
          <span key={s} className={`px-2 py-1 rounded-full ${i === step ? "bg-violet-600 text-white" : "border border-line text-slate-300"}`}>
            {i + 1}. {s}
          </span>
        ))}
      </div>
      <div className="mt-4 bg-panel/60 border border-line rounded-2xl p-5 space-y-3">
        {step === 0 && <Field label="Soha" value={form.sector} onChange={(v) => set("sector", v)} />}
        {step === 1 && <Field label="Joy" value={form.place} onChange={(v) => set("place", v)} />}
        {step === 2 && <Field label="Investitsiya, so'm" type="number" value={form.investment} onChange={(v) => set("investment", Number(v))} />}
        {step === 3 && <Field label="Xodimlar" type="number" value={form.employees} onChange={(v) => set("employees", Number(v))} />}
        {step === 4 && (
          <>
            <Field label="Oylik sotuv (dona somsa)" type="number" value={form.units_month} onChange={(v) => set("units_month", Number(v))} />
            <Field label="Sotuv narxi" type="number" value={form.sell_price} onChange={(v) => set("sell_price", Number(v))} />
          </>
        )}
        <div className="flex justify-between">
          <button className="text-slate-400" onClick={() => setStep(Math.max(0, step - 1))}>Orqaga</button>
          {step < 4 ? (
            <button className="bg-violet-600 px-4 py-2 rounded-lg" onClick={() => setStep(step + 1)}>
              Keyingi
            </button>
          ) : (
            <button className="bg-violet-600 px-4 py-2 rounded-lg" onClick={build}>
              Hisoblash
            </button>
          )}
        </div>
      </div>
      {plan && (
        <div className="mt-4 grid sm:grid-cols-3 gap-3">
          <Stat label="NPV" value={som(plan.outputs?.npv)} />
          <Stat label="O'zini oqlash" value={`${plan.outputs?.payback_months ?? "—"} oy`} />
          <Stat label="Zararsizlik" value={`${plan.outputs?.break_even_units ?? "—"} dona`} />
          <div className="sm:col-span-3 bg-panel/60 border border-line rounded-2xl p-4 text-sm">
            <div className="font-medium mb-2">Xom ashyo narxlari (BozorPuls)</div>
            {Object.entries(plan.price_snapshot || {}).map(([k, v]: any) => (
              <div key={k} className="flex justify-between py-1">
                <span>{v.name}</span>
                <span>
                  {som(v.price)} <span className="chip">BozorPuls narxi, {v.date}</span>
                </span>
              </div>
            ))}
            <button className="mt-3 bg-violet-600 px-4 py-2 rounded-lg" onClick={() => nav(`/stress/${plan.id}`)}>
              Stress-test
            </button>
          </div>
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
