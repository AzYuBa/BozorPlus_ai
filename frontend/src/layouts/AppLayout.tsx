import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { currentUser } from "../lib/api";

const items = [
  { to: "/pulse", label: "Bozor pulsi", group: "M1" },
  { to: "/product/un", label: "Terminal", group: "M1" },
  { to: "/agent", label: "Xarid agenti", group: "M1" },
  { to: "/ledger", label: "Ovozli daftar", group: "M2" },
  { to: "/plan", label: "Biznes-reja", group: "M2" },
  { to: "/credit", label: "Kredit markazi", group: "M2" },
  { to: "/tax", label: "Soliq / formallashuv", group: "M2" },
  { to: "/package", label: "Kredit paketi", group: "M2" },
  { to: "/market-admin", label: "Bozor paneli", group: "ops" },
  { to: "/bank", label: "Bank paneli", group: "ops" },
  { to: "/moderation", label: "Moderatsiya", group: "ops" },
];

export default function AppLayout() {
  const nav = useNavigate();
  const loc = useLocation();
  const user = currentUser();
  const m2 = ["/ledger", "/plan", "/credit", "/tax", "/package", "/stress"].some((p) => loc.pathname.startsWith(p));

  return (
    <div className={`min-h-screen flex ${m2 ? "bg-slate-50 text-slate-900" : "text-slate-100"}`}>
      <aside className={`w-60 shrink-0 hidden md:flex flex-col border-r ${m2 ? "bg-white border-slate-200" : "bg-panel/80 border-line"}`}>
        <div className="px-5 py-5">
          <div className="font-display text-xl tracking-wide text-violet-400">BozorPuls</div>
          <div className="text-[11px] text-slate-500">Narxdan biznes-rejagacha</div>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-sm ${
                  isActive
                    ? "bg-violet-600 text-white"
                    : m2
                    ? "text-slate-600 hover:bg-slate-100"
                    : "text-slate-300 hover:bg-white/5"
                }`
              }
            >
              {it.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 text-xs text-slate-500">
          {user ? `${user.first_name || user.username} · ${user.role}` : "mehmon"}
          <button
            className="block mt-2 text-violet-400"
            onClick={() => {
              localStorage.clear();
              nav("/");
            }}
          >
            Chiqish
          </button>
        </div>
      </aside>
      <div className="flex-1 min-w-0">
        <header className={`md:hidden flex items-center justify-between px-4 py-3 border-b ${m2 ? "border-slate-200" : "border-line"}`}>
          <span className="font-display text-lg">BozorPuls</span>
          <select
            className="bg-transparent text-sm"
            onChange={(e) => nav(e.target.value)}
            value={loc.pathname}
          >
            {items.map((it) => (
              <option key={it.to} value={it.to}>
                {it.label}
              </option>
            ))}
          </select>
        </header>
        <main className="p-4 md:p-6 max-w-6xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
