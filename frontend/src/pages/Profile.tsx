import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, LogOut, Pencil, Trash2, UserRound } from "lucide-react";
import {
  api,
  clearAuth,
  currentUser,
  getAvatar,
  getToken,
  setAuth,
  setAvatar,
} from "../lib/api";

const LEGAL: Record<string, string> = {
  informal: "Norasmiy",
  self_employed: "O'zini o'zi band",
  yatt: "YaTT",
  llc: "MChJ",
};

const SECTOR: Record<string, string> = {
  ovqatlanish: "Ovqatlanish",
  savdo: "Savdo",
  qishloq: "Qishloq xo'jaligi",
  "ishlab-chiqarish": "Ishlab chiqarish",
  xizmat: "Xizmat",
};

type FormState = {
  first_name: string;
  phone: string;
  lang: string;
  gender: string;
  birth_year: string;
  stir: string;
  business_name: string;
  sector: string;
  legal_status: string;
  tax_regime: string;
  employees: string;
  monthly_revenue: string;
};

function formFromUser(user: any): FormState {
  const biz = user?.business;
  return {
    first_name: user?.first_name || "",
    phone: user?.phone || "",
    lang: user?.lang || "uz",
    gender: user?.gender || "",
    birth_year: user?.birth_year ? String(user.birth_year) : "",
    stir: user?.stir || "",
    business_name: biz?.name || "",
    sector: biz?.sector || "",
    legal_status: biz?.legal_status || "",
    tax_regime: biz?.tax_regime || "",
    employees: biz?.employees != null ? String(biz.employees) : "",
    monthly_revenue: biz?.monthly_revenue != null ? String(biz.monthly_revenue) : "",
  };
}

export default function Profile() {
  const nav = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState(() => currentUser());
  const [avatar, setAvatarUrl] = useState(() => getAvatar(currentUser()?.id));
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState>(() => formFromUser(currentUser()));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    setAvatarUrl(getAvatar(user?.id));
  }, [user?.id]);

  const roleLabel =
    user?.role === "buyer" ? "Xaridor" : user?.role === "entrepreneur" ? "Tadbirkor" : user?.role;
  const biz = user?.business;

  function logout() {
    clearAuth();
    nav("/");
  }

  async function save() {
    setBusy(true);
    setErr("");
    try {
      const payload: Record<string, string | number> = {
        first_name: form.first_name.trim(),
        phone: form.phone.trim(),
        lang: form.lang,
      };
      if (user?.role === "entrepreneur") {
        payload.gender = form.gender;
        payload.birth_year = form.birth_year;
        payload.stir = form.stir.trim();
        payload.business_name = form.business_name.trim();
        payload.sector = form.sector;
        payload.legal_status = form.legal_status;
        payload.tax_regime = form.tax_regime;
        payload.employees = form.employees;
        payload.monthly_revenue = form.monthly_revenue;
      }
      const updated = await api("/api/auth/me/", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setAuth({ access: getToken(), user: updated });
      setUser(updated);
      setForm(formFromUser(updated));
      setEditing(false);
    } catch (e: any) {
      setErr(e?.message || "Saqlashda xato");
    } finally {
      setBusy(false);
    }
  }

  async function deleteProfile() {
    if (!confirm("Profilni o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi.")) return;
    setBusy(true);
    setErr("");
    try {
      await api("/api/auth/me/", { method: "DELETE" });
    } catch {
      /* local logout even if API fails */
    }
    clearAuth();
    nav("/");
  }

  function onPickAvatar(file?: File | null) {
    if (!file || user?.id == null) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result || "");
      if (!url) return;
      setAvatar(user.id, url);
      setAvatarUrl(url);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="max-w-xl bp-page">
      <div className="flex items-start gap-4">
        <button
          type="button"
          className="relative shrink-0 w-16 h-16 rounded-2xl border border-line bg-mist overflow-hidden group shadow-soft"
          onClick={() => fileRef.current?.click()}
          title="Profil rasmini o'zgartirish"
        >
          {avatar ? (
            <img src={avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="w-full h-full flex items-center justify-center text-muted">
              <UserRound size={28} strokeWidth={1.5} />
            </span>
          )}
          <span className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Camera size={18} className="text-white" />
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onPickAvatar(e.target.files?.[0])}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="bp-title !text-3xl">Profil</h1>
              <p className="bp-sub">Sizning akkauntingiz</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                className={editing ? "bp-btn !px-3 !py-2" : "bp-btn-ghost !px-3 !py-2"}
                onClick={() => {
                  setErr("");
                  setForm(formFromUser(user));
                  setEditing((v) => !v);
                }}
              >
                <Pencil size={14} />
                Tahrirlash
              </button>
              <button
                type="button"
                className="bp-btn-ghost !px-3 !py-2"
                onClick={logout}
              >
                <LogOut size={14} />
                Chiqish
              </button>
            </div>
          </div>
        </div>
      </div>

      {editing ? (
        <div className="mt-5 bp-panel p-5 space-y-4 text-sm">
          <div className="text-xs uppercase tracking-wider text-muted font-semibold">Profilni tahrirlash</div>
          <Field label="Ism" value={form.first_name} onChange={(v) => setForm((f) => ({ ...f, first_name: v }))} />
          <Select
            label="Til"
            value={form.lang}
            onChange={(v) => setForm((f) => ({ ...f, lang: v }))}
            options={[
              { id: "uz", label: "O'zbek" },
              { id: "ru", label: "Русский" },
            ]}
          />
          {user?.role === "entrepreneur" && (
            <>
              <Field label="Telefon" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} />
              <Select
                label="Jins"
                value={form.gender}
                onChange={(v) => setForm((f) => ({ ...f, gender: v }))}
                options={[
                  { id: "", label: "Tanlanmagan" },
                  { id: "female", label: "Ayol" },
                  { id: "male", label: "Erkak" },
                ]}
              />
              <Field
                label="Tug'ilgan yil"
                value={form.birth_year}
                onChange={(v) => setForm((f) => ({ ...f, birth_year: v }))}
              />
              <Field label="STIR" value={form.stir} onChange={(v) => setForm((f) => ({ ...f, stir: v }))} />
              <div className="pt-2 text-xs uppercase tracking-wide text-muted">Biznes</div>
              <Field
                label="Nomi"
                value={form.business_name}
                onChange={(v) => setForm((f) => ({ ...f, business_name: v }))}
              />
              <Select
                label="Soha"
                value={form.sector}
                onChange={(v) => setForm((f) => ({ ...f, sector: v }))}
                options={[
                  { id: "", label: "Tanlanmagan" },
                  ...Object.entries(SECTOR).map(([id, label]) => ({ id, label })),
                ]}
              />
              <Select
                label="Maqom"
                value={form.legal_status}
                onChange={(v) => setForm((f) => ({ ...f, legal_status: v }))}
                options={[
                  { id: "", label: "Tanlanmagan" },
                  ...Object.entries(LEGAL).map(([id, label]) => ({ id, label })),
                ]}
              />
              <Field
                label="Soliq"
                value={form.tax_regime}
                onChange={(v) => setForm((f) => ({ ...f, tax_regime: v }))}
              />
              <Field
                label="Xodimlar"
                value={form.employees}
                onChange={(v) => setForm((f) => ({ ...f, employees: v }))}
              />
              <Field
                label="Oylik aylanma"
                value={form.monthly_revenue}
                onChange={(v) => setForm((f) => ({ ...f, monthly_revenue: v }))}
              />
            </>
          )}
          {err && <p className="text-down text-xs">{err}</p>}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              disabled={busy}
              className="bp-btn disabled:opacity-50"
              onClick={save}
            >
              Saqlash
            </button>
            <button
              type="button"
              className="bp-btn-ghost"
              onClick={() => {
                setEditing(false);
                setErr("");
              }}
            >
              Bekor
            </button>
          </div>
          <div className="pt-3 border-t border-line/60">
            <button
              type="button"
              disabled={busy}
              className="inline-flex items-center gap-1.5 text-down hover:text-down text-sm disabled:opacity-50"
              onClick={deleteProfile}
            >
              <Trash2 size={14} />
              Profilni o'chirish
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-5 bp-panel p-5 space-y-3 text-sm">
          <Row k="Ism" v={user?.first_name || "—"} />
          <Row k="Rol" v={roleLabel} />
          <Row k="Tuman" v={user?.district_name || user?.district_slug || "—"} />
          <Row k="Til" v={user?.lang === "ru" ? "Русский" : "O'zbek"} />
          {user?.role === "entrepreneur" && (
            <>
              <Row k="Telefon" v={user?.phone || "—"} />
              <Row k="Jins" v={user?.gender === "female" ? "Ayol" : user?.gender === "male" ? "Erkak" : "—"} />
              <Row k="Tug'ilgan yil" v={user?.birth_year ? String(user.birth_year) : "—"} />
              <Row k="Asosiy bozor" v={user?.market_name || "—"} />
              <Row k="STIR" v={user?.stir || "—"} />
            </>
          )}
          <Row k="Ball" v={String(user?.points ?? 0)} />
        </div>
      )}

      {!editing && user?.role === "entrepreneur" && (
        <>
          <div className="mt-4 bp-panel p-5 space-y-3 text-sm">
            <div className="text-xs uppercase tracking-wider text-muted font-semibold">Biznes</div>
            <Row k="Nomi" v={biz?.name || "—"} />
            <Row k="Soha" v={SECTOR[biz?.sector] || biz?.sector || "—"} />
            <Row k="Maqom" v={LEGAL[biz?.legal_status] || biz?.legal_status || "—"} />
            <Row k="Soliq" v={biz?.tax_regime || "—"} />
            <Row k="Xodimlar" v={biz?.employees != null ? String(biz.employees) : "—"} />
            <Row
              k="Oylik aylanma"
              v={biz?.monthly_revenue ? `${Number(biz.monthly_revenue).toLocaleString("uz-UZ")} so'm` : "—"}
            />
          </div>
          <button className="mt-4 bp-btn" onClick={() => nav("/plan")}>
            Biznes-rejaga o'tish
          </button>
        </>
      )}
      {!editing && user?.role === "buyer" && (
        <button className="mt-4 bp-btn" onClick={() => nav("/pulse")}>
          Bozor pulsiga o'tish
        </button>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between border-b border-line/60 pb-2">
      <span className="text-muted">{k}</span>
      <span>{v}</span>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-muted text-xs">{label}</span>
      <input
        className="w-full bp-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string }[];
}) {
  return (
    <label className="block space-y-1">
      <span className="text-muted text-xs">{label}</span>
      <select
        className="w-full bp-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
