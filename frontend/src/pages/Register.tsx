import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register, type Role } from "../lib/api";

export default function Register() {
  const nav = useNavigate();
  const [step, setStep] = useState<"form" | "role">("form");
  const [draft, setDraft] = useState({ full_name: "", email: "", password: "", phone: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  function prepare(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setDraft({
      full_name: String(fd.get("full_name") || ""),
      email: String(fd.get("email") || "").toLowerCase(),
      password: String(fd.get("password") || ""),
      phone: String(fd.get("phone") || ""),
    });
    setStep("role");
  }

  async function finish(role: Role) {
    setBusy(true);
    setErr("");
    try {
      await register({ ...draft, role, consent: true });
      nav("/");
    } catch (ex: any) {
      setErr(ex.message || "Ro'yxatdan o'tib bo'lmadi");
      setStep("form");
    } finally {
      setBusy(false);
    }
  }

  if (step === "role") {
    return (
      <div className="auth-wrap">
        <div style={{ width: "min(920px, 100%)" }}>
          <div className="pagehead">
            <div>
              <div className="eyebrow">RO‘YXAT</div>
              <h1>Siz uchun qaysi ish maydoni?</h1>
              <p>Rol keyin o‘zgarmaydi — alohida akkaunt oching.</p>
            </div>
          </div>
          <div className="role-grid">
            <button className="role-option" type="button" disabled={busy} onClick={() => finish("business")}>
              <h3>Tadbirkor</h3>
              <p>Biznes reja, bozor tahlili, daftar va hisob-kitob.</p>
              <span className="inline-link">Tadbirkor kabineti →</span>
            </button>
            <button className="role-option" type="button" disabled={busy} onClick={() => finish("forwarder")}>
              <h3>Ekspeditor</h3>
              <p>Buyurtmalar, safar iqtisodiyoti va daftar.</p>
              <span className="inline-link">Ekspeditor kabineti →</span>
            </button>
          </div>
          {err ? <p className="form-error">{err}</p> : null}
        </div>
      </div>
    );
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
          <p>Email + parol orqali haqiqiy hisob.</p>
        </div>
        <form className="auth-form" onSubmit={prepare}>
          <div className="eyebrow">BOZOR-PULS.AI</div>
          <h2>Profil yarating</h2>
          <div className="field">
            <label htmlFor="full_name">F.I.Sh.</label>
            <input id="full_name" name="full_name" required />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required />
          </div>
          <div className="field">
            <label htmlFor="password">Parol</label>
            <input id="password" name="password" type="password" minLength={8} required />
          </div>
          <div className="field">
            <label htmlFor="phone">Telefon (ixtiyoriy)</label>
            <input id="phone" name="phone" type="tel" />
          </div>
          <label style={{ fontSize: 13, display: "block", marginBottom: 20 }}>
            <input type="checkbox" required /> Ommaviy oferta va maxfiylikka roziman
          </label>
          {err ? <p className="form-error">{err}</p> : null}
          <button className="btn" type="submit">
            Rolni tanlash →
          </button>
          <p style={{ fontSize: 14, marginTop: 25 }}>
            <Link className="inline-link" to="/login">
              Profilingiz bormi? Kirish
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
