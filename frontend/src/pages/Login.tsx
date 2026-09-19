import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../lib/api";

export default function Login() {
  const nav = useNavigate();
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    try {
      await login(String(fd.get("email")), String(fd.get("password")));
      nav("/");
    } catch (ex: any) {
      setErr(ex.message || "Kirib bo'lmadi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="card auth" style={{ width: "min(920px, 100%)" }}>
        <div className="auth-art">
          <img src="/favicon.svg" width={50} alt="" />
          <h2>
            Biznesingiz.
            <br />
            Bilimingiz.
            <br />
            Yangi imkoniyatingiz.
          </h2>
          <p>Tadbirkor va ekspeditorlar uchun yagona ish maydoni.</p>
        </div>
        <form className="auth-form" onSubmit={onSubmit}>
          <div className="eyebrow">BOZOR-PULS.AI</div>
          <h2>Xush kelibsiz</h2>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required />
          </div>
          <div className="field">
            <label htmlFor="password">Parol</label>
            <input id="password" name="password" type="password" minLength={8} required />
          </div>
          {err ? <p className="form-error">{err}</p> : null}
          <button className="btn" type="submit" disabled={busy} style={{ marginTop: 16 }}>
            {busy ? "…" : "Kirish →"}
          </button>
          <p style={{ fontSize: 14, marginTop: 25 }}>
            <Link className="inline-link" to="/register">
              Yangi profil yaratish
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
