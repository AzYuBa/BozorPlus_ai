import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearSession, currentUser, logout, type Role } from "../lib/api";

const BUSINESS_NAV = [
  { to: "/", label: "Bozor terminali" },
  { to: "/plan", label: "Biznes reja" },
  { to: "/adviser", label: "AI hamroh" },
  { to: "/notebook", label: "Daftar" },
  { to: "/wallet", label: "Karmon" },
];

const FORWARDER_NAV = [
  { to: "/", label: "Bozor terminali" },
  { to: "/notebook", label: "Daftar" },
  { to: "/wallet", label: "Karmon" },
  { to: "/plan", label: "Kalkulyator" },
];

export function AppLayout() {
  const user = currentUser();
  const nav = useNavigate();
  const role = (user?.role || "business") as Role;
  const items = role === "forwarder" ? FORWARDER_NAV : BUSINESS_NAV;
  const name = user?.full_name || user?.email || "Foydalanuvchi";
  const initials = name
    .split(" ")
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function onLogout() {
    await logout();
    clearSession();
    nav("/login");
  }

  return (
    <div className="react-shell">
      <header className="exchange-header">
        <div className="masthead">
          <Link className="ex-brand" to="/">
            Bozor<span>Puls</span>
            <sup>AI</sup>
          </Link>
          <span className="ex-tagline">BIZNESNING YANGI RITMI</span>
          <div className="mast-actions">
            <span className="ex-session">
              <b>{role === "forwarder" ? "Ekspeditor" : "Tadbirkor"}</b>
            </span>
            <Link className="ex-account" to="/profile">
              <span className="avatar">{initials}</span>
              <span>{name.split(" ")[0]}</span>
            </Link>
            <details className="ex-more">
              <summary aria-label="Qo'shimcha menyu">•••</summary>
              <div>
                <Link to="/profile">Profil</Link>
                <Link to="/notebook">Daftar</Link>
                <button type="button" onClick={onLogout} style={{ all: "unset", cursor: "pointer", display: "block", padding: "8px 12px" }}>
                  Chiqish
                </button>
              </div>
            </details>
          </div>
        </div>
        <div className="exchange-nav">
          <nav>
            {items.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === "/"}>
                {item.label}
                {item.to === "/adviser" ? <span className="tiny-ai">✦</span> : null}
              </NavLink>
            ))}
          </nav>
          <span className="ex-session">
            MVP <b>LIVE</b>
          </span>
        </div>
      </header>
      <div className="exchange-shell">
        <main className="exchange-content is-terminal" style={{ padding: "16px 20px 40px" }}>
          <Outlet />
        </main>
        <footer className="exchange-footer">
          <span>
            BOZORPULS AI <b>© 2026</b>
          </span>
          <span>Yahoo Finance + open FX · Mahalliy proxy UZS</span>
        </footer>
      </div>
    </div>
  );
}
