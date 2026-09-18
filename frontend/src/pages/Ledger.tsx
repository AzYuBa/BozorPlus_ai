import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api, som } from "../lib/api";

export default function Ledger() {
  const qc = useQueryClient();
  const [text, setText] = useState("bugun 3 qop guruch qopi 450 mingdan sotdim");
  const [pending, setPending] = useState<any>(null);
  const { data } = useQuery({ queryKey: ["ledger"], queryFn: () => api("/api/ledger/report/?period=month") });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = await api("/api/ledger/voice/", { method: "POST", body: JSON.stringify({ text, voice: true }) });
    setPending(r);
  }
  async function confirm(ok: boolean) {
    if (!pending?.id) return;
    await api(`/api/ledger/voice/${pending.id}/confirm/`, { method: "POST", body: JSON.stringify({ ok }) });
    setPending(null);
    qc.invalidateQueries({ queryKey: ["ledger"] });
  }

  return (
    <div className="bp-page">
      <h1 className="bp-title">Ovozli daftar</h1>
      <p className="bp-sub">{data?.business} · oy yakuni</p>
      <div className="grid md:grid-cols-3 gap-3 mt-5">
        <Stat label="Kirim" value={som(data?.income)} tone="up" />
        <Stat label="Chiqim" value={som(data?.expense)} tone="down" />
        <Stat label="Sof" value={som(data?.net)} />
      </div>
      <div className="h-48 mt-4 bp-panel p-2">
        <ResponsiveContainer>
          <BarChart data={data?.daily || []}>
            <XAxis dataKey="date" hide />
            <YAxis hide />
            <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #d2ded8", borderRadius: 12 }} />
            <Bar dataKey="income" fill="#047857" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" fill="#be123c" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <form onSubmit={submit} className="mt-4 flex gap-2">
        <input className="flex-1 bp-input !py-3" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="bp-btn">Yozish</button>
      </form>
      {pending && (
        <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          {pending.message}
          <div className="mt-2 flex gap-2">
            <button className="bp-btn-teal !px-3 !py-1" onClick={() => confirm(true)}>
              To'g'ri
            </button>
            <button className="bp-btn-ghost !px-3 !py-1 !text-down" onClick={() => confirm(false)}>
              Yo'q
            </button>
          </div>
        </div>
      )}
      <ul className="mt-4 divide-y divide-line bp-panel overflow-hidden">
        {(data?.entries || []).slice(0, 12).map((e: any) => (
          <li key={e.id} className="flex justify-between p-3.5 text-sm">
            <span className="text-ink/80">
              {e.date} · {e.category || e.type}
            </span>
            <span className={e.type === "income" ? "text-up font-semibold" : "text-down font-semibold"}>{som(e.amount)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  return (
    <div className="bp-panel p-4">
      <div className="text-[11px] uppercase tracking-wider text-muted font-semibold">{label}</div>
      <div className={`font-display text-xl font-bold mt-1 ${tone === "up" ? "text-up" : tone === "down" ? "text-down" : "text-ink"}`}>
        {value}
      </div>
    </div>
  );
}
