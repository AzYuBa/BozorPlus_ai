import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, UserPlus } from "lucide-react";
import { api, currentUser, homeFor, setAuth } from "../lib/api";

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
  password: "",
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

type Mode = "home" | "register" | "login";

export default function Login() {
  const nav = useNavigate();
  const [mode, setMode] = useState<Mode>("home");
  const [step, setStep] = useState(0);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [regions, setRegions] = useState(FALLBACK_REGIONS);
  const [markets, setMarkets] = useState<any[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loginForm, setLoginForm] = useState({ phone: "", password: "" });
  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    const u = currentUser();
    if (u?.role) nav(homeFor(u.role), { replace: true });
  }, [nav]);

  const steps =
    form.role === "buyer"
      ? ["Rol", "Joy", "Kirish", "Rozilik"]
      : form.role === "entrepreneur"
        ? ["Rol", "Shaxs", "Joy", "Biznes", "Kirish", "Rozilik"]
        : ["Rol"];
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

  function startRegister() {
    setErr("");
    setForm(emptyForm);
    setStep(0);
    setMode("register");
  }

  function startLogin() {
    setErr("");
    setLoginForm({ phone: "", password: "" });
    setMode("login");
  }

  function backHome() {
    setErr("");
    setForm(emptyForm);
    setStep(0);
    setMode("home");
  }

  function next() {
    setErr("");
    if (step === 0 && !form.role) return setErr("Xaridor yoki tadbirkorni tanlang");
    if (form.role === "buyer" && step === 1 && !form.district) {
      return setErr("Tumanni tanlang — yaqin bozor narxlari shu bo'yicha chiqadi");
    }
    const credStep = form.role === "buyer" ? 2 : 4;
    if (step === credStep) {
      if (!form.phone.trim()) return setErr("Telefon raqamni kiriting — keyin shu bilan profilga kirasiz");
      if (form.password.trim().length < 4) return setErr("Parol kamida 4 belgidan iborat bo'lsin");
    }
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
          password: form.password,
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

  async function doLogin() {
    setErr("");
    if (!loginForm.phone.trim() || !loginForm.password) {
      return setErr("Telefon (yoki login) va parolni kiriting");
    }
    setBusy(true);
    try {
      const data = await api("/api/auth/login/", {
        method: "POST",
        body: JSON.stringify({
          phone: loginForm.phone.trim(),
          password: loginForm.password,
        }),
      });
      setAuth(data);
      nav(homeFor(data.user?.role));
    } catch (e: any) {
      setErr(e.message || "Kirib bo'lmadi");
    } finally {
      setBusy(false);
    }
  }

  const credStep = form.role === "buyer" ? 2 : 4;

  return (
    <div className="min-h-[100dvh] relative overflow-hidden flex items-center justify-center p-5 md:p-8">
      <div className="landing-glow bg-teal/30 -top-24 -left-16" />
      <div className="landing-glow bg-accent/25 bottom-0 -right-20" />

      <div className="relative max-w-xl w-full">
        <p className="animate-fade text-teal text-xs md:text-sm font-semibold tracking-[0.22em] uppercase">
          Umummilliy AI Xakaton · Xorazm
        </p>
        <h1 className="animate-rise font-display text-5xl md:text-6xl font-extrabold tracking-tight mt-3 leading-[0.95]">
          Bozor<span className="text-accent">Puls</span>
          <span className="block text-2xl md:text-3xl font-bold text-teal mt-2">AI</span>
        </h1>
        <p className="animate-rise-late text-muted text-base md:text-lg mt-4 max-w-md leading-relaxed">
          {mode === "home"
            ? "Bozor narxidan biznes-rejagacha — tadbirkorning jonli AI hamrohi."
            : mode === "login"
              ? "Mavjud profilingizga kiring."
              : form.role === "buyer"
                ? "Xaridor: narxlar uchun kerakli maydonlar."
                : form.role === "entrepreneur"
                  ? "Tadbirkor: maydonlar ixtiyoriy, keyinroq to'ldirasiz."
                  : "Yangi profil yaratish."}
        </p>

        {mode === "home" && (
          <div className="animate-rise-later mt-10 grid sm:grid-cols-2 gap-3">
            <ModeCard
              icon={<UserPlus size={22} strokeWidth={1.75} />}
              title="Profil yaratish"
              text="Yangi akkaunt — xaridor yoki tadbirkor"
              onClick={startRegister}
            />
            <ModeCard
              icon={<LogIn size={22} strokeWidth={1.75} />}
              title="Profilga kirish"
              text="Telefon va parol bilan davom eting"
              onClick={startLogin}
            />
          </div>
        )}

        {mode === "login" && (
          <div className="animate-rise-late mt-8 bp-panel p-5 md:p-6 space-y-3">
            <Field label="Telefon yoki login">
              <input
                className={inputCls}
                value={loginForm.phone}
                onChange={(e) => setLoginForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+998 90 000 00 00"
                autoComplete="username"
              />
            </Field>
            <Field label="Parol">
              <input
                className={inputCls}
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                autoComplete="current-password"
                onKeyDown={(e) => e.key === "Enter" && doLogin()}
              />
            </Field>
            {err && <p className="text-sm text-down">{err}</p>}
            <div className="pt-2 flex justify-between gap-3 items-center">
              <button type="button" className="text-muted text-sm" disabled={busy} onClick={backHome}>
                Orqaga
              </button>
              <button type="button" className="bp-btn" disabled={busy} onClick={doLogin}>
                {busy ? "…" : "Kirish"}
              </button>
            </div>
            <p className="text-xs text-muted pt-1">
              Akkauntingiz yo'qmi?{" "}
              <button type="button" className="bp-link" onClick={startRegister}>
                Profil yaratish
              </button>
            </p>
          </div>
        )}

        {mode === "register" && (
          <>
            <div className="animate-rise-late flex gap-2 mt-6 text-xs flex-wrap">
              {steps.map((s, i) => (
                <span
                  key={`${s}-${i}`}
                  className={i === step ? "bp-tab-on" : i < step ? "bp-tab !border-teal/40 !text-teal" : "bp-tab"}
                >
                  {i + 1}. {s}
                </span>
              ))}
            </div>

            <div className="animate-rise-later mt-5 bp-panel p-5 md:p-6">
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
                  <p className="text-sm text-muted">Yaqin bozor narxlari uchun tuman kerak.</p>
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
                  <p className="text-sm text-muted">Shaxsiy ma'lumot — hammasini keyinroq to'ldirish mumkin.</p>
                  <Field label="Ism" optional>
                    <input
                      className={inputCls}
                      value={form.first_name}
                      onChange={(e) => set("first_name", e.target.value)}
                      placeholder="Masalan: Dilshod"
                    />
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
                    <input
                      className={inputCls}
                      type="number"
                      min={1940}
                      max={2015}
                      value={form.birth_year}
                      onChange={(e) => set("birth_year", e.target.value)}
                      placeholder="1995"
                    />
                  </Field>
                </div>
              )}

              {form.role === "entrepreneur" && step === 2 && (
                <div className="space-y-3">
                  <p className="text-sm text-muted">Qayerda ishlaysiz — bozor narxlari shu kesimda ochiladi.</p>
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
                  <p className="text-sm text-muted">Biznes reja, soliq va kredit uchun foydali, lekin majburiy emas.</p>
                  <Field label="Biznes nomi" optional>
                    <input
                      className={inputCls}
                      value={form.business_name}
                      onChange={(e) => set("business_name", e.target.value)}
                      placeholder="Masalan: Dilshod somsaxonasi"
                    />
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
                    <select
                      className={inputCls}
                      value={form.legal_status}
                      onChange={(e) => set("legal_status", e.target.value)}
                    >
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
                    <input
                      className={inputCls}
                      value={form.stir}
                      onChange={(e) => set("stir", e.target.value)}
                      placeholder="123456789"
                    />
                  </Field>
                  <Field label="Xodimlar soni" optional>
                    <input
                      className={inputCls}
                      type="number"
                      min={0}
                      value={form.employees}
                      onChange={(e) => set("employees", e.target.value)}
                      placeholder="4"
                    />
                  </Field>
                  <Field label="Oylik aylanma, so'm" optional>
                    <input
                      className={inputCls}
                      type="number"
                      min={0}
                      value={form.monthly_revenue}
                      onChange={(e) => set("monthly_revenue", e.target.value)}
                      placeholder="80000000"
                    />
                  </Field>
                </div>
              )}

              {form.role && step === credStep && (
                <div className="space-y-3">
                  <p className="text-sm text-muted">
                    Keyin profilga shu telefon va parol bilan kirasiz. Telefon boshqa akkauntda bo'lmasligi kerak.
                  </p>
                  <Field label="Telefon">
                    <input
                      className={inputCls}
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      placeholder="+998 90 000 00 00"
                      autoComplete="tel"
                    />
                  </Field>
                  <Field label="Parol">
                    <input
                      className={inputCls}
                      type="password"
                      value={form.password}
                      onChange={(e) => set("password", e.target.value)}
                      placeholder="Kamida 4 belgi"
                      autoComplete="new-password"
                    />
                  </Field>
                </div>
              )}

              {step === last && form.role && (
                <div className="space-y-3 text-sm text-ink/80">
                  <p>
                    {form.role === "buyer"
                      ? "BozorPuls AI tumaningizdagi narxlarni ko'rsatish uchun joyni ishlatadi. Sotuvchi shaxsi ko'rinmaydi."
                      : "BozorPuls AI shaxsiy va biznes ma'lumotini faqat xizmat uchun ishlatadi. Moliyaviy ma'lumot bankka faqat sizning alohida roziligingiz bilan yuboriladi."}
                  </p>
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={form.consent}
                      onChange={(e) => set("consent", e.target.checked)}
                    />
                    <span>Ommaviy oferta va shaxsiy ma'lumotlarga roziman.</span>
                  </label>
                </div>
              )}

              {err && <p className="mt-4 text-sm text-down">{err}</p>}
              <div className="mt-5 flex justify-between gap-3">
                <button
                  type="button"
                  className="text-muted"
                  disabled={busy}
                  onClick={() => {
                    setErr("");
                    if (step === 0) backHome();
                    else setStep(Math.max(0, step - 1));
                  }}
                >
                  Orqaga
                </button>
                <div className="flex gap-2">
                  {step > 0 && step < last && step !== credStep && !(form.role === "buyer" && step === 1) && (
                    <button
                      type="button"
                      className="border border-line px-4 py-2 rounded-xl text-sm text-ink/80"
                      disabled={busy}
                      onClick={() => {
                        setErr("");
                        setStep(step + 1);
                      }}
                    >
                      O'tkazib yuborish
                    </button>
                  )}
                  <button type="button" className="bp-btn" disabled={busy} onClick={next}>
                    {busy ? "…" : step === last ? "Akkaunt ochish" : "Keyingi"}
                  </button>
                </div>
              </div>
              {step === 0 && (
                <p className="text-xs text-muted mt-4">
                  Allaqachon akkauntingiz bormi?{" "}
                  <button type="button" className="bp-link text-sm" onClick={startLogin}>
                    Profilga kirish
                  </button>
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const inputCls = "bp-input mt-1";

function Field({
  label,
  optional,
  hint,
  children,
}: {
  label: string;
  optional?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm text-ink/80">
      <span className="flex items-center gap-2">
        {label}
        {optional && <span className="chip">ixtiyoriy</span>}
      </span>
      {hint && <span className="block text-[11px] text-muted mt-0.5">{hint}</span>}
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

function RoleCard({
  title,
  text,
  active,
  onClick,
}: {
  title: string;
  text: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-2xl border p-4 transition ${
        active ? "border-accent bg-accent/10 shadow-soft" : "border-line bg-mist/60 hover:border-teal"
      }`}
    >
      <div className="font-display font-bold">{title}</div>
      <div className="text-sm text-muted mt-1 leading-snug">{text}</div>
    </button>
  );
}

function ModeCard({
  icon,
  title,
  text,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left rounded-2xl border border-line bg-white p-5 shadow-soft hover:border-accent hover:-translate-y-0.5 transition duration-300"
    >
      <div className="text-teal mb-3 transition group-hover:text-accent group-hover:scale-105 origin-left">{icon}</div>
      <div className="font-display font-bold text-lg tracking-tight text-ink">{title}</div>
      <div className="text-sm text-muted mt-1.5 leading-snug">{text}</div>
    </button>
  );
}
