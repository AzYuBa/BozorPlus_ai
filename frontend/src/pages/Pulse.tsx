import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, som } from "../lib/api";

export default function Pulse() {
  const qc = useQueryClient();
  const [raw, setRaw] = useState("Dehqon bozorida un, 50 kglik qopi 450 ming");
  const [parsed, setParsed] = useState<any>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["pulse"],
    queryFn: () => api("/api/prices/pulse/"),
    refetchInterval: 10000,
  });
  const ticker = data?.ticker || [];
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Bozor pulsi</h1>
          <p className="text-slate-400 text-sm">Xorazm dehqon bozorlari · yangilanish 10 s</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">Ijtimoiy tovarlar indeksi</div>
          <div className={`font-display text-2xl ${(data?.social_index_change_pct || 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {data?.social_index_change_pct ?? "—"}%
          </div>
        </div>
      </div>
      <form
        className="mt-4 flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          const r = await api("/api/prices/ingest/", { method: "POST", body: JSON.stringify({ text: raw }) });
          setParsed(r);
        }}
      >
        <input className="flex-1 bg-panel border border-line rounded-xl px-4 py-3" value={raw} onChange={(e) => setRaw(e.target.value)} />
        <button className="px-4 rounded-xl bg-violet-600">Ovoz/matn</button>
      </form>
      {parsed && (
        <div className="mt-3 border border-line rounded-xl p-3 text-sm">
          {parsed.message}
          <div className="mt-2 flex gap-2">
            <button
              className="bg-emerald-600 px-3 py-1 rounded-lg"
              onClick={async () => {
                await api(`/api/prices/${parsed.id}/confirm/`, { method: "POST", body: JSON.stringify({ ok: true }) });
                setParsed(null);
                qc.invalidateQueries({ queryKey: ["pulse"] });
              }}
            >
              To'g'ri ✅ +10
            </button>
          </div>
        </div>
      )}
      <div className="mt-4 overflow-hidden border border-line rounded-xl bg-black/30">
        <div className="flex ticker w-max gap-8 py-2 px-4 text-sm">
          {ticker.concat(ticker).map((t: any, i: number) => (
            <span key={i} className="whitespace-nowrap">
              <b>{t.name}</b> {som(t.price).replace(" so'm", "")}{" "}
              <span className={t.change_pct >= 0 ? "text-emerald-400" : "text-rose-400"}>
                {t.change_pct >= 0 ? "+" : ""}
                {t.change_pct}%
              </span>
            </span>
          ))}
        </div>
      </div>
      {isLoading && <p className="mt-6 text-slate-500">Yuklanmoqda…</p>}
      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <Card title="Eng ko'p o'sgan" rows={data?.gainers} positive />
        <Card title="Eng ko'p tushgan" rows={data?.losers} />
      </div>
      <p className="mt-4 text-xs text-slate-500">
        Manba: BozorPuls narx bazasi · <span className="chip">DEMO</span>
      </p>
    </div>
  );
}

function Card({ title, rows, positive }: { title: string; rows?: any[]; positive?: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-panel/60 p-4">
      <h2 className="text-sm text-slate-400 mb-3">{title}</h2>
      <div className="space-y-2">
        {(rows || []).map((r) => (
          <Link key={r.slug} to={`/product/${r.slug}`} className="flex justify-between items-center hover:bg-white/5 rounded-lg px-2 py-1">
            <span>{r.name}</span>
            <span className={r.change_pct >= 0 ? "text-emerald-400" : "text-rose-400"}>
              {som(r.price)} · {r.change_pct}%
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
