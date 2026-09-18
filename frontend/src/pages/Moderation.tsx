import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, som } from "../lib/api";

export default function Moderation() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["mod"], queryFn: () => api("/api/prices/moderation/") });
  async function decide(id: number, ok: boolean) {
    await api(`/api/prices/${id}/confirm/`, { method: "POST", body: JSON.stringify({ ok }) });
    qc.invalidateQueries({ queryKey: ["mod"] });
  }
  return (
    <div>
      <h1 className="font-display text-3xl">Moderatsiya navbati</h1>
      <p className="text-slate-400 text-sm">MAD z-skor &gt; 3.5 yoki past ishonch.</p>
      <div className="mt-4 space-y-2">
        {(data || []).map((o: any) => (
          <div key={o.id} className="border border-line rounded-2xl p-4 flex justify-between gap-3">
            <div>
              <div className="font-medium">
                {o.product} · {o.market}
              </div>
              <div className="text-sm text-slate-400">{o.raw_text}</div>
              <div className="text-xs">z={Number(o.z).toFixed(2)} · {som(o.price)}</div>
            </div>
            <div className="flex gap-2">
              <button className="bg-emerald-600 px-3 rounded-lg" onClick={() => decide(o.id, true)}>
                OK
              </button>
              <button className="bg-rose-600 px-3 rounded-lg" onClick={() => decide(o.id, false)}>
                Rad
              </button>
            </div>
          </div>
        ))}
        {(!data || data.length === 0) && <p className="text-slate-500">Navbat bo'sh.</p>}
      </div>
    </div>
  );
}
