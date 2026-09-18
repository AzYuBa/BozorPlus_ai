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
    <div className="text-slate-900">
      <h1 className="font-display text-3xl">Ovozli daftar</h1>
      <p className="text-slate-500 text-sm">{data?.business} · oy yakuni</p>
      <div className="grid md:grid-cols-3 gap-3 mt-4">
        <Stat label="Kirim" value={som(data?.income)} />
        <Stat label="Chiqim" value={som(data?.expense)} />
        <Stat label="Sof" value={som(data?.net)} />
      </div>
      <div className="h-48 mt-4 bg-white rounded-2xl border border-slate-200 p-2">
        <ResponsiveContainer>
          <BarChart data={data?.daily || []}>
            <XAxis dataKey="date" hide />
            <YAxis hide />
            <Tooltip />
            <Bar dataKey="income" fill="#22c55e" />
            <Bar dataKey="expense" fill="#f43f5e" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <form onSubmit={submit} className="mt-4 flex gap-2">
        <input className="flex-1 border rounded-xl px-4 py-3" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="px-5 rounded-xl bg-violet-600 text-white">Yozish</button>
      </form>
      {pending && (
        <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          {pending.message}
          <div className="mt-2 flex gap-2">
            <button className="px-3 py-1 bg-emerald-600 text-white rounded-lg" onClick={() => confirm(true)}>To'g'ri</button>
            <button className="px-3 py-1 bg-rose-600 text-white rounded-lg" onClick={() => confirm(false)}>Yo'q</button>
          </div>
        </div>
      )}
      <ul className="mt-4 divide-y bg-white rounded-2xl border border-slate-200">
        {(data?.entries || []).slice(0, 12).map((e: any) => (
          <li key={e.id} className="flex justify-between p-3 text-sm">
            <span>{e.date} · {e.category || e.type}</span>
            <span className={e.type === "income" ? "text-emerald-600" : "text-rose-600"}>{som(e.amount)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-display text-xl">{value}</div>
    </div>
  );
}
