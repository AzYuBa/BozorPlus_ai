import { useNavigate } from "react-router-dom";
import { currentUser } from "../lib/api";

export default function Profile() {
  const nav = useNavigate();
  const user = currentUser();
  const roleLabel = user?.role === "buyer" ? "Xaridor" : user?.role === "entrepreneur" ? "Tadbirkor" : user?.role;
  return (
    <div className="max-w-xl">
      <h1 className="font-display text-3xl">Profil</h1>
      <p className="text-slate-400 text-sm mt-1">Sizning akkauntingiz</p>
      <div className="mt-5 bg-panel/60 border border-line rounded-2xl p-5 space-y-3 text-sm">
        <Row k="Ism" v={user?.first_name || user?.username} />
        <Row k="Rol" v={roleLabel} />
        <Row k="Tuman" v={user?.district_name || user?.district_slug || "—"} />
        <Row k="Til" v={user?.lang === "ru" ? "Русский" : "O'zbek"} />
        <Row k="Telefon" v={user?.phone || "—"} />
        <Row k="Ball" v={String(user?.points ?? 0)} />
      </div>
      {user?.role === "entrepreneur" && (
        <button className="mt-4 bg-violet-600 px-4 py-2 rounded-xl" onClick={() => nav("/plan")}>
          Biznes-rejaga o'tish
        </button>
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
