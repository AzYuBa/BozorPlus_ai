import { useState, type FormEvent } from "react";
import { api, currentUser, type User } from "../lib/api";

export default function Profile() {
  const [user, setUser] = useState<User | null>(currentUser());
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    setMsg("");
    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {
      full_name: String(fd.get("full_name")),
      phone: String(fd.get("phone") || ""),
    };
    if (user?.role === "business") {
      body.business = {
        business_name: String(fd.get("business_name") || ""),
        region: String(fd.get("region") || ""),
        activity: String(fd.get("activity") || ""),
        market: String(fd.get("market") || ""),
      };
    } else {
      body.forwarder = {
        vehicle: String(fd.get("vehicle") || ""),
        capacity: String(fd.get("capacity") || ""),
        region: String(fd.get("region") || ""),
      };
    }
    try {
      const me = await api<User>("/api/v1/me/", { method: "PATCH", body: JSON.stringify(body) });
      localStorage.setItem("bp_user", JSON.stringify(me));
      setUser(me);
      setMsg("Profil saqlandi");
    } catch (ex: any) {
      setErr(ex.message);
    }
  }

  if (!user) return null;
  const biz = user.business || { business_name: "", region: "", activity: "", market: "" };
  const fwd = user.forwarder || { vehicle: "", capacity: "", region: "" };

  return (
    <div>
      <div className="pagehead">
        <div>
          <div className="eyebrow">PROFIL</div>
          <h1>Mening profilim</h1>
          <p>
            {user.email} · {user.role === "forwarder" ? "Ekspeditor" : "Tadbirkor"}
          </p>
        </div>
      </div>
      <form className="card" onSubmit={onSubmit}>
        <div className="formgrid">
          <div className="field">
            <label>F.I.Sh.</label>
            <input name="full_name" defaultValue={user.full_name} required />
          </div>
          <div className="field">
            <label>Telefon</label>
            <input name="phone" defaultValue={user.phone} />
          </div>
          {user.role === "business" ? (
            <>
              <div className="field">
                <label>Biznes</label>
                <input name="business_name" defaultValue={biz.business_name} />
              </div>
              <div className="field">
                <label>Viloyat</label>
                <input name="region" defaultValue={biz.region} />
              </div>
              <div className="field">
                <label>Faoliyat</label>
                <input name="activity" defaultValue={biz.activity} />
              </div>
              <div className="field">
                <label>Bozor</label>
                <input name="market" defaultValue={biz.market} />
              </div>
            </>
          ) : (
            <>
              <div className="field">
                <label>Avtomobil</label>
                <input name="vehicle" defaultValue={fwd.vehicle} />
              </div>
              <div className="field">
                <label>Sig'im</label>
                <input name="capacity" defaultValue={fwd.capacity} />
              </div>
              <div className="field">
                <label>Viloyat</label>
                <input name="region" defaultValue={fwd.region} />
              </div>
            </>
          )}
        </div>
        {msg ? <p className="up">{msg}</p> : null}
        {err ? <p className="form-error">{err}</p> : null}
        <button className="btn" type="submit" style={{ marginTop: 12 }}>
          Saqlash
        </button>
      </form>
    </div>
  );
}
