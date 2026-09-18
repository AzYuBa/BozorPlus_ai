import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { createChart, ColorType } from "lightweight-charts";
import { api, som } from "../lib/api";

export default function TerminalChart({ slug, days, onDays }: { slug: string; days: number; onDays: (d: number) => void }) {
  const { data } = useQuery({
    queryKey: ["ohlc", slug, days],
    queryFn: () => api(`/api/prices/ohlc/?product=${slug}&days=${days}`),
    enabled: !!slug,
  });
  const { data: fc } = useQuery({
    queryKey: ["fc", slug],
    queryFn: () => api(`/api/forecast/?product=${slug}&horizon=14`),
    enabled: !!slug,
  });
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current || !data?.series?.length) return;
    const chart = createChart(ref.current, {
      height: 320,
      layout: { background: { type: ColorType.Solid, color: "#ffffff" }, textColor: "#5c726a" },
      grid: { vertLines: { color: "#e4ece8" }, horzLines: { color: "#e4ece8" } },
      rightPriceScale: { borderColor: "#d2ded8" },
      timeScale: { borderColor: "#d2ded8" },
    });
    const s = chart.addCandlestickSeries({
      upColor: "#047857",
      downColor: "#be123c",
      borderVisible: false,
      wickUpColor: "#047857",
      wickDownColor: "#be123c",
    });
    s.setData(
      data.series.map((r: any) => ({
        time: r.time as string,
        open: r.open,
        high: r.high,
        low: r.low,
        close: r.close,
      }))
    );
    if (fc?.points?.length) {
      const line = chart.addLineSeries({ color: "#0f766e", lineWidth: 2 });
      line.setData(fc.points.map((p: any) => ({ time: p.date, value: p.yhat })));
    }
    chart.timeScale().fitContent();
    const ro = new ResizeObserver(() => chart.applyOptions({ width: ref.current?.clientWidth }));
    ro.observe(ref.current);
    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, [data, fc]);

  const sig = fc?.signal || "NEYTRAL";
  const color = sig === "HOZIR OL" ? "bg-emerald-500" : sig === "KUT" ? "bg-rose-500" : "bg-amber-400 text-black";

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">{data?.product?.name_uz || slug}</h2>
          <p className="text-muted text-sm">so'm / {data?.product?.unit} · sham grafik · {fc?.horizon || 14} kunlik AI prognoz</p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <button key={d} onClick={() => onDays(d)} className={`px-3 py-1 rounded-lg text-sm border ${days === d ? "bg-accent border-accent" : "border-line"}`}>
              {d} kun
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className={`px-3 py-1 rounded-xl text-sm font-semibold ${color}`}>{sig}</span>
        <span className="text-sm text-ink/80">{fc?.comment}</span>
        <span className="chip">MAPE {fc?.mape ?? "—"}</span>
        <span className="chip">ishonch {fc?.confidence ?? "—"}%</span>
        <span className="chip">DEMO</span>
      </div>
      {(fc?.reasons || []).length > 0 && (
        <ul className="mt-2 text-xs text-muted list-disc ml-5 space-y-1">
          {fc.reasons.map((r: string) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      )}
      <div ref={ref} className="mt-3 rounded-2xl overflow-hidden border border-line" />
      <div className="mt-4 overflow-x-auto rounded-2xl border border-line">
        <table className="w-full text-sm">
          <thead className="text-muted bg-sand">
            <tr>
              <th className="text-left p-3">Bozor</th>
              <th className="text-right p-3">Narx</th>
              <th className="text-right p-3">Kuzatuv</th>
              <th className="text-right p-3">Sana</th>
            </tr>
          </thead>
          <tbody>
            {(data?.markets || []).map((m: any) => (
              <tr key={m.market_slug} className="border-t border-line">
                <td className="p-3">{m.market}</td>
                <td className="p-3 text-right">{som(m.price)}</td>
                <td className="p-3 text-right">{m.n_obs}</td>
                <td className="p-3 text-right text-muted">{m.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
