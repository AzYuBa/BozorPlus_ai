import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, som, type Note } from "../lib/api";

export default function Notebook() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "in" | "out">("all");
  const [open, setOpen] = useState(false);
  const { data = [], isLoading } = useQuery({
    queryKey: ["notes"],
    queryFn: () => api<Note[]>("/api/v1/notebook/entries/"),
  });

  const add = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api<Note>("/api/v1/notebook/entries/", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes"] });
      setOpen(false);
    },
  });

  const list = data.filter((n) => filter === "all" || n.type === filter);
  const income = data.filter((n) => n.type === "in").reduce((s, n) => s + n.amount, 0);
  const expense = data.filter((n) => n.type === "out").reduce((s, n) => s + n.amount, 0);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const amount = Number(fd.get("amount"));
    if (amount <= 0) return;
    add.mutate({
      name: String(fd.get("name")),
      type: fd.get("type") === "Kirim" ? "in" : "out",
      amount,
      date: String(fd.get("date")),
      category: String(fd.get("category")),
    });
  }

  return (
    <div>
      <div className="pagehead">
        <div>
          <div className="eyebrow">DAFTAR</div>
          <h1>B.P.Ai-daftar</h1>
          <p>Kirim-chiqim serverda saqlanadi — faqat sizning akkauntingiz.</p>
        </div>
        <button className="btn" type="button" onClick={() => setOpen(true)}>
          + Qayd qo'shish
        </button>
      </div>
      <div className="grid kpis" style={{ gridTemplateColumns: "repeat(3,minmax(0,1fr))", display: "grid", gap: 12 }}>
        <div className="card kpi">
          <div className="kpi-top">Kirim</div>
          <strong>
            {som(income)} <small>so'm</small>
          </strong>
        </div>
        <div className="card kpi">
          <div className="kpi-top">Chiqim</div>
          <strong>
            {som(expense)} <small>so'm</small>
          </strong>
        </div>
        <div className="card kpi">
          <div className="kpi-top">Sof oqim</div>
          <strong>
            {som(income - expense)} <small>so'm</small>
          </strong>
        </div>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="cardhead">
          <h2>Operatsiyalar</h2>
          <select value={filter} onChange={(e) => setFilter(e.target.value as any)}>
            <option value="all">Barchasi</option>
            <option value="in">Kirim</option>
            <option value="out">Chiqim</option>
          </select>
        </div>
        {isLoading ? <p className="muted">Yuklanmoqda…</p> : null}
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Operatsiya</th>
                <th>Kategoriya</th>
                <th>Sana</th>
                <th>Summa</th>
              </tr>
            </thead>
            <tbody>
              {list.map((n) => (
                <tr key={n.id}>
                  <td>
                    <b>{n.name}</b>
                  </td>
                  <td>{n.category}</td>
                  <td>{n.date}</td>
                  <td className={n.type === "in" ? "up" : "down"}>
                    <b>
                      {n.type === "in" ? "+" : "−"}
                      {som(n.amount)}
                    </b>
                  </td>
                </tr>
              ))}
              {!list.length && !isLoading ? (
                <tr>
                  <td colSpan={4} className="empty">
                    Hali qayd yo'q
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {open ? (
        <dialog open className="card" style={{ position: "fixed", inset: 0, margin: "auto", zIndex: 50, maxWidth: 480 }}>
          <div className="dialoghead">
            <h2>Yangi qayd</h2>
            <button type="button" onClick={() => setOpen(false)}>
              ×
            </button>
          </div>
          <form onSubmit={onSubmit}>
            <div className="field">
              <label>Izoh</label>
              <input name="name" required />
            </div>
            <div className="formgrid">
              <div className="field">
                <label>Tur</label>
                <select name="type">
                  <option>Kirim</option>
                  <option>Chiqim</option>
                </select>
              </div>
              <div className="field">
                <label>Summa</label>
                <input name="amount" type="number" min={1} required />
              </div>
              <div className="field">
                <label>Sana</label>
                <input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
              </div>
              <div className="field">
                <label>Kategoriya</label>
                <select name="category">
                  <option>Savdo</option>
                  <option>Xarid</option>
                  <option>Logistika</option>
                  <option>Ijara</option>
                  <option>Boshqa</option>
                </select>
              </div>
            </div>
            {add.isError ? <p className="form-error">{(add.error as Error).message}</p> : null}
            <button className="btn" type="submit" disabled={add.isPending} style={{ marginTop: 12 }}>
              Saqlash
            </button>
          </form>
        </dialog>
      ) : null}
    </div>
  );
}
