import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export default function MarketAdmin() {
  const { data } = useQuery({ queryKey: ["madmin"], queryFn: () => api("/api/market-admin/overview/") });
  return (
    <div>
      <h1 className="font-display text-3xl">Bozor ma'muriyati</h1>
      <p className="text-slate-400 text-sm">Faqat agregat narxlar — sotuvchi shaxsi ko'rinmaydi.</p>
      <div className="grid sm:grid-cols-3 gap-3 mt-4">
        <Box label="24 soat kuzatuv" value={data?.obs_24h} />
        <Box label="Anomaliyalar" value={data?.anomalies} />
        <Box label="Spekulyatsiya" value={(data?.speculation_alerts || []).length} />
      </div>
      <ul className="mt-4 space-y-2">
        {(data?.social || []).map((s: any) => (
          <li key={s.product} className="flex justify-between border border-line rounded-xl p-3">
            <span>{s.product}</span>
            <span className={s.change_pct > 0 ? "text-rose-400" : "text-emerald-400"}>{s.change_pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
function Box({ label, value }: any) {
  return (
    <div className="border border-line rounded-2xl p-4 bg-panel/60">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="font-display text-2xl">{value ?? "—"}</div>
    </div>
  );
}
