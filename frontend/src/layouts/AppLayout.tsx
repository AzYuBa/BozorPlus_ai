import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { currentUser, navFor } from "../lib/api";

export default function AppLayout() {
  const nav = useNavigate();
  const loc = useLocation();
  const user = currentUser();
  const items = navFor(user?.role);
  const roleLabel = user?.role === "buyer" ? "Xaridor" : user?.role === "entrepreneur" ? "Tadbirkor" : user?.role;

  return (
    <div className="min-h-screen flex text-slate-100">
      <aside className="w-60 shrink-0 hidden md:flex flex-col border-r bg-panel/80 border-line">
        <div className="px-5 py-5">
          <div className="font-display text-xl tracking-wide text-violet-400">BozorPuls</div>
          <div className="text-[11px] text-slate-500">
            {user?.role === "buyer" ? "Arzon narx va xarid" : "Moliyaviy hamroh"}
          </div>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-sm ${
                  isActive ? "bg-violet-600 text-white" : "text-slate-300 hover:bg-white/5"
                }`
              }
            >
              {it.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 text-xs text-slate-500">
          {user ? `${user.first_name || user.username} · ${roleLabel}` : "mehmon"}
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
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-line">
          <span className="font-display text-lg">BozorPuls</span>
          <select
            className="bg-panel border border-line rounded-lg px-2 py-1 text-sm"
            onChange={(e) => nav(e.target.value)}
            value={items.some((i) => i.to === loc.pathname) ? loc.pathname : items[0]?.to}
          >
            {items.map((it) => (
              <option key={it.to} value={it.to}>
                {it.label}
              </option>
            ))}
          </select>
        </header>
        <main className="p-4 md:p-6 max-w-6xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
