import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { clearAuth, currentUser, navFor } from "../lib/api";

export default function AppLayout() {
  const nav = useNavigate();
  const loc = useLocation();
  const user = currentUser();
  const items = navFor(user?.role);
  const roleLabel = user?.role === "buyer" ? "Xaridor" : user?.role === "entrepreneur" ? "Tadbirkor" : user?.role;
  const initial = (user?.first_name || user?.username || "?").slice(0, 1).toUpperCase();

  return (
    <div className="min-h-screen flex text-ink">
      <aside className="w-64 shrink-0 hidden md:flex flex-col border-r border-line bg-panel/80 backdrop-blur-md">
        <div className="px-5 py-6">
          <div className="font-display text-2xl font-extrabold tracking-tight">
            Bozor<span className="text-accent">Puls</span>
          </div>
          <div className="text-[11px] text-muted mt-1 tracking-wide">
            {user?.role === "buyer" ? "Arzon narx va xarid" : "Moliyaviy hamroh"}
          </div>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {items.map((it) => (
            <NavLink key={it.to} to={it.to} className={({ isActive }) => (isActive ? "bp-nav-on" : "bp-nav")}>
              {it.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 m-3 rounded-2xl bg-sand/80 border border-line">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal text-white flex items-center justify-center font-display font-bold text-sm">
              {initial}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">{user?.first_name || user?.username || "mehmon"}</div>
              <div className="text-[11px] text-muted">{roleLabel}</div>
            </div>
          </div>
          <button
            type="button"
            className="mt-3 text-xs font-medium text-accent hover:underline"
            onClick={() => {
              clearAuth();
              nav("/");
            }}
          >
            Chiqish
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="md:hidden sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-3 border-b border-line bg-panel/90 backdrop-blur-md">
          <span className="font-display text-lg font-bold">
            Bozor<span className="text-accent">Puls</span>
          </span>
          <select
            className="bp-input !py-1.5 !w-auto max-w-[55%] text-sm"
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
        <main className="p-4 md:p-8 max-w-6xl mx-auto w-full flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
