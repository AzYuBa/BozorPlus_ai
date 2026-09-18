import { useNavigate } from "react-router-dom";
import { currentUser } from "../lib/api";

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

export default function Profile() {
  const nav = useNavigate();
  const user = currentUser();
  const roleLabel = user?.role === "buyer" ? "Xaridor" : user?.role === "entrepreneur" ? "Tadbirkor" : user?.role;
  const biz = user?.business;
  return (
    <div className="max-w-xl">
      <h1 className="font-display text-3xl">Profil</h1>
      <p className="text-slate-400 text-sm mt-1">Sizning akkauntingiz</p>
      <div className="mt-5 bg-panel/60 border border-line rounded-2xl p-5 space-y-3 text-sm">
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
      {user?.role === "entrepreneur" && (
        <>
          <div className="mt-4 bg-panel/60 border border-line rounded-2xl p-5 space-y-3 text-sm">
            <div className="text-xs uppercase tracking-wide text-slate-500">Biznes</div>
            <Row k="Nomi" v={biz?.name || "—"} />
            <Row k="Soha" v={SECTOR[biz?.sector] || biz?.sector || "—"} />
            <Row k="Maqom" v={LEGAL[biz?.legal_status] || biz?.legal_status || "—"} />
            <Row k="Soliq" v={biz?.tax_regime || "—"} />
            <Row k="Xodimlar" v={biz?.employees != null ? String(biz.employees) : "—"} />
            <Row k="Oylik aylanma" v={biz?.monthly_revenue ? `${Number(biz.monthly_revenue).toLocaleString("uz-UZ")} so'm` : "—"} />
          </div>
          <button className="mt-4 bg-violet-600 px-4 py-2 rounded-xl" onClick={() => nav("/plan")}>
            Biznes-rejaga o'tish
          </button>
        </>
      )}
      {user?.role === "buyer" && (
        <button className="mt-4 bg-violet-600 px-4 py-2 rounded-xl" onClick={() => nav("/pulse")}>
          Bozor pulsiga o'tish
        </button>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between border-b border-line/60 pb-2">
      <span className="text-slate-400">{k}</span>
      <span>{v}</span>
    </div>
  );
}
