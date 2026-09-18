import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, som } from "../lib/api";

export default function MarketAdmin() {
  return <MarketPanel />;
}

export function MarketPanel({ onPick }: { onPick?: (slug: string) => void }) {
  const { data } = useQuery({ queryKey: ["madmin"], queryFn: () => api("/api/market-admin/overview/") });
  const [report, setReport] = useState<any>(null);

  return (
    <div>
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-2xl">Bozor paneli</h2>
          <p className="text-slate-400 text-sm">Faqat agregat narxlar — sotuvchi shaxsi ko'rinmaydi.</p>
        </div>
        <button
          className="border border-line px-3 py-1.5 rounded-lg text-sm"
          onClick={async () => setReport(await api("/api/market-admin/report/"))}
        >
          Haftalik hisobot
        </button>
      </div>
      <div className="grid sm:grid-cols-3 gap-3 mt-4">
        <Box label="24 soat kuzatuv" value={data?.obs_24h} />
        <Box label="Anomaliyalar" value={data?.anomalies} />
        <Box label="Spekulyatsiya" value={(data?.speculation_alerts || []).length} />
      </div>
      {report && (
        <div className="mt-4 border border-line rounded-2xl p-4 bg-panel/60 text-sm">
          <div className="font-medium">{report.title}</div>
          <p className="text-slate-300 mt-1">{report.summary}</p>
          <span className="chip mt-2 inline-block">{report.source}</span>
        </div>
      )}
      {(data?.speculation_alerts || []).length > 0 && (
        <div className="mt-4 border border-rose-500/30 bg-rose-500/10 rounded-2xl p-4">
          <div className="text-sm text-rose-300 mb-2">Spekulyatsiya ogohlantirishlari (≥15%)</div>
          <ul className="space-y-1 text-sm">
            {data.speculation_alerts.map((s: any) => (
              <li key={s.slug || s.product} className="flex justify-between">
                <span>{s.product}</span>
                <span className="text-rose-400">+{s.change_pct}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <ul className="mt-4 space-y-2">
        {(data?.social || []).map((s: any) => (
          <li key={s.slug || s.product}>
            <button
              className="w-full flex justify-between border border-line rounded-xl p-3 hover:bg-white/5"
              onClick={() => s.slug && onPick?.(s.slug)}
              disabled={!onPick || !s.slug}
            >
              <span>{s.product}</span>
              <span className={s.change_pct > 0 ? "text-rose-400" : "text-emerald-400"}>
                {som(s.price)} · {s.change_pct}%
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-slate-500">{data?.source}</p>
    </div>
  );
}

function Box({ label, value }: { label: string; value?: number }) {
  return (
    <div className="border border-line rounded-2xl p-4 bg-panel/60">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="font-display text-2xl">{value ?? "—"}</div>
    </div>
  );
}
