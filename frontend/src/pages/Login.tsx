import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { api, homeFor, setAuth } from "../lib/api";

const FALLBACK_REGIONS = [
  {
    slug: "xorazm",
    name_uz: "Xorazm viloyati",
    districts: [
      { slug: "urganch-shahar", name_uz: "Urganch shahri" },
      { slug: "xiva", name_uz: "Xiva" },
      { slug: "gurlan", name_uz: "Gurlan" },
      { slug: "shovot", name_uz: "Shovot" },
      { slug: "hazorasp", name_uz: "Hazorasp" },
      { slug: "xonqa", name_uz: "Xonqa" },
    ],
  },
];

const SECTORS = [
  { id: "", label: "Tanlanmagan" },
  { id: "ovqatlanish", label: "Ovqatlanish" },
  { id: "savdo", label: "Savdo" },
  { id: "qishloq", label: "Qishloq xo'jaligi" },
  { id: "ishlab-chiqarish", label: "Ishlab chiqarish" },
  { id: "xizmat", label: "Xizmat" },
];

const LEGAL = [
  { id: "", label: "Tanlanmagan" },
  { id: "informal", label: "Norasmiy" },
  { id: "self_employed", label: "O'zini o'zi band qilgan" },
  { id: "yatt", label: "YaTT" },
  { id: "llc", label: "MChJ" },
];

const TAX = [
  { id: "", label: "Tanlanmagan" },
  { id: "aylanma", label: "Aylanmadan soliq" },
  { id: "foyda", label: "Foyda solig'i" },
  { id: "qqs", label: "QQS" },
  { id: "ozini-ozi-band", label: "O'zini o'zi band" },
];

const emptyForm = {
  role: "" as "" | "buyer" | "entrepreneur",
  lang: "uz",
  region: "",
  district: "",
  first_name: "",
  phone: "",
  consent: false,
  gender: "",
  birth_year: "",
  stir: "",
  market: "",
  business_name: "",
  sector: "",
  legal_status: "",
  tax_regime: "",
  employees: "",
  monthly_revenue: "",
};

export default function Login() {
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [regions, setRegions] = useState(FALLBACK_REGIONS);
  const [markets, setMarkets] = useState<any[]>([]);
  const [form, setForm] = useState(emptyForm);
  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const steps = form.role === "buyer" ? ["Rol", "Joy", "Rozilik"] : form.role === "entrepreneur" ? ["Rol", "Shaxs", "Joy", "Biznes", "Rozilik"] : ["Rol"];
  const last = steps.length - 1;
  const districts = useMemo(() => {
    if (form.region) {
      return regions.find((r) => r.slug === form.region)?.districts || [];
    }
    return regions.flatMap((r) => r.districts || []);
  }, [regions, form.region]);
  const marketOptions = useMemo(() => {
    return markets.filter((m) => {
      if (form.district) return m.district_slug === form.district;
      if (form.region) return m.region_slug === form.region;
      return true;
    });
  }, [markets, form.district, form.region]);

  useEffect(() => {
    api("/api/markets/")
      .then((d) => {
        if (d.regions?.length) setRegions(d.regions);
        if (d.markets?.length) setMarkets(d.markets);
      })
      .catch(() => {});
  }, []);

  function next() {
    setErr("");
    if (step === 0 && !form.role) return setErr("Xaridor yoki tadbirkorni tanlang");
    if (form.role === "buyer" && step === 1 && !form.district) return setErr("Tumanni tanlang — yaqin bozor narxlari shu bo'yicha chiqadi");
    if (step === last && !form.consent) return setErr("Davom etish uchun rozilik belgilang");
    if (step < last) setStep(step + 1);
    else submit();
  }

  async function submit() {
    setBusy(true);
    try {
      const data = await api("/api/auth/register/", {
        method: "POST",
        body: JSON.stringify({
          role: form.role,
          lang: form.lang,
          district: form.district,
          first_name: form.first_name,
          phone: form.phone,
          consent: true,
          gender: form.gender,
          birth_year: form.birth_year,
          stir: form.stir,
          market: form.market,
          business_name: form.business_name,
          sector: form.sector,
          legal_status: form.legal_status,
          tax_regime: form.tax_regime,
          employees: form.employees,
          monthly_revenue: form.monthly_revenue,
        }),
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
        <p className="text-slate-400 mt-2">
          {form.role === "buyer"
            ? "Xaridor: faqat narxlar uchun kerakli maydonlar"
            : form.role === "entrepreneur"
              ? "Tadbirkor: barcha maydonlar ixtiyoriy"
              : "Rolni tanlang"}
        </p>
        <div className="flex gap-2 mt-5 text-xs flex-wrap">
          {steps.map((s, i) => (
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
                text="Narx, yaqin bozor va arzon joyni topish"
                onClick={() => {
                  setForm({ ...emptyForm, role: "buyer" });
                  setStep(0);
                }}
              />
              <RoleCard
                active={form.role === "entrepreneur"}
                title="Tadbirkor"
                text="Daftar, biznes-reja, kredit va soliq"
                onClick={() => {
                  setForm({ ...emptyForm, role: "entrepreneur" });
                  setStep(0);
                }}
              />
            </div>
          )}

          {form.role === "buyer" && step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-slate-400">Yaqin bozor narxlari uchun tuman kerak.</p>
              <Field label="Til">
                <select className={inputCls} value={form.lang} onChange={(e) => set("lang", e.target.value)}>
                  <option value="uz">O'zbek (lotin)</option>
                  <option value="ru">Русский</option>
                </select>
              </Field>
              <PlaceFields form={form} set={set} regions={regions} districts={districts} requireDistrict />
            </div>
          )}

          {form.role === "entrepreneur" && step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-slate-400">Shaxsiy ma'lumot — hammasini keyinroq to'ldirish mumkin.</p>
              <Field label="Ism" optional>
                <input className={inputCls} value={form.first_name} onChange={(e) => set("first_name", e.target.value)} placeholder="Masalan: Dilshod" />
              </Field>
              <Field label="Telefon" optional>
                <input className={inputCls} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+998 90 000 00 00" />
              </Field>
              <Field label="Til" optional>
                <select className={inputCls} value={form.lang} onChange={(e) => set("lang", e.target.value)}>
                  <option value="uz">O'zbek (lotin)</option>
                  <option value="ru">Русский</option>
                </select>
              </Field>
              <Field label="Jins" optional hint="Ayollar tadbirkorligi dasturlari uchun">
                <select className={inputCls} value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                  <option value="">Tanlanmagan</option>
                  <option value="female">Ayol</option>
                  <option value="male">Erkak</option>
                </select>
              </Field>
              <Field label="Tug'ilgan yil" optional hint="Yoshlar tadbirkorligi dasturi uchun">
                <input className={inputCls} type="number" min={1940} max={2015} value={form.birth_year} onChange={(e) => set("birth_year", e.target.value)} placeholder="1995" />
              </Field>
            </div>
          )}

          {form.role === "entrepreneur" && step === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-slate-400">Qayerda ishlaysiz — bozor narxlari shu kesimda ochiladi.</p>
              <PlaceFields form={form} set={set} regions={regions} districts={districts} />
              <Field label="Asosiy bozor" optional>
                <select className={inputCls} value={form.market} onChange={(e) => set("market", e.target.value)}>
                  <option value="">Tanlanmagan</option>
                  {marketOptions.map((m) => (
                    <option key={m.slug} value={m.slug}>
                      {m.name_uz}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          )}

          {form.role === "entrepreneur" && step === 3 && (
            <div className="space-y-3">
              <p className="text-sm text-slate-400">Biznes reja, soliq va kredit uchun foydali, lekin majburiy emas.</p>
              <Field label="Biznes nomi" optional>
                <input className={inputCls} value={form.business_name} onChange={(e) => set("business_name", e.target.value)} placeholder="Masalan: Dilshod somsaxonasi" />
              </Field>
              <Field label="Soha" optional>
                <select className={inputCls} value={form.sector} onChange={(e) => set("sector", e.target.value)}>
                  {SECTORS.map((s) => (
                    <option key={s.id || "none"} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Huquqiy maqom" optional>
                <select className={inputCls} value={form.legal_status} onChange={(e) => set("legal_status", e.target.value)}>
                  {LEGAL.map((s) => (
                    <option key={s.id || "none"} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Soliq tartibi" optional>
                <select className={inputCls} value={form.tax_regime} onChange={(e) => set("tax_regime", e.target.value)}>
                  {TAX.map((s) => (
                    <option key={s.id || "none"} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="STIR" optional>
                <input className={inputCls} value={form.stir} onChange={(e) => set("stir", e.target.value)} placeholder="123456789" />
              </Field>
              <Field label="Xodimlar soni" optional>
                <input className={inputCls} type="number" min={0} value={form.employees} onChange={(e) => set("employees", e.target.value)} placeholder="4" />
              </Field>
              <Field label="Oylik aylanma, so'm" optional>
                <input className={inputCls} type="number" min={0} value={form.monthly_revenue} onChange={(e) => set("monthly_revenue", e.target.value)} placeholder="80000000" />
              </Field>
            </div>
          )}

          {step === last && form.role && (
            <div className="space-y-3 text-sm text-slate-300">
              <p>
                {form.role === "buyer"
                  ? "BozorPuls AI tumaningizdagi narxlarni ko'rsatish uchun joyni ishlatadi. Sotuvchi shaxsi ko'rinmaydi."
                  : "BozorPuls AI shaxsiy va biznes ma'lumotini faqat xizmat uchun ishlatadi. Moliyaviy ma'lumot bankka faqat sizning alohida roziligingiz bilan yuboriladi."}
              </p>
              <label className="flex items-start gap-2">
                <input type="checkbox" className="mt-1" checked={form.consent} onChange={(e) => set("consent", e.target.checked)} />
                <span>Ommaviy oferta va shaxsiy ma'lumotlarga roziman.</span>
              </label>
            </div>
          )}

          {err && <p className="mt-4 text-sm text-rose-400">{err}</p>}
          <div className="mt-5 flex justify-between gap-3">
            <button className="text-slate-400" disabled={step === 0 || busy} onClick={() => { setErr(""); setStep(Math.max(0, step - 1)); }}>
              Orqaga
            </button>
            <div className="flex gap-2">
              {step > 0 && step < last && !(form.role === "buyer" && step === 1) && (
                <button className="border border-line px-4 py-2 rounded-xl text-sm text-slate-300" disabled={busy} onClick={() => { setErr(""); setStep(step + 1); }}>
                  O'tkazib yuborish
                </button>
              )}
              <button className="bg-violet-600 px-5 py-2 rounded-xl" disabled={busy} onClick={next}>
                {busy ? "…" : step === last ? "Akkaunt ochish" : "Keyingi"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputCls = "mt-1 w-full bg-panel border border-line rounded-xl px-3 py-2";

function Field({ label, optional, hint, children }: { label: string; optional?: boolean; hint?: string; children: ReactNode }) {
  return (
    <label className="block text-sm text-slate-300">
      <span className="flex items-center gap-2">
        {label}
        {optional && <span className="chip">ixtiyoriy</span>}
      </span>
      {hint && <span className="block text-[11px] text-slate-500 mt-0.5">{hint}</span>}
      {children}
    </label>
  );
}

function PlaceFields({
  form,
  set,
  regions,
  districts,
  requireDistrict,
}: {
  form: typeof emptyForm;
  set: (k: string, v: string) => void;
  regions: any[];
  districts: any[];
  requireDistrict?: boolean;
}) {
  return (
    <>
      <Field label="Viloyat" optional={!requireDistrict}>
        <select
          className={inputCls}
          value={form.region}
          onChange={(e) => {
            set("region", e.target.value);
            set("district", "");
            set("market", "");
          }}
        >
          <option value="">Tanlanmagan</option>
          {regions.map((r) => (
            <option key={r.slug} value={r.slug}>
              {r.name_uz}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Tuman / shahar" optional={!requireDistrict}>
        <select
          className={inputCls}
          value={form.district}
          onChange={(e) => {
            set("district", e.target.value);
            set("market", "");
          }}
        >
          <option value="">Tanlanmagan</option>
          {districts.map((d) => (
            <option key={d.slug} value={d.slug}>
              {d.name_uz}
            </option>
          ))}
        </select>
      </Field>
    </>
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
