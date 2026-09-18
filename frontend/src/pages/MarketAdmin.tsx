import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, som } from "../lib/api";

const SLICES = [
  { id: "umumiy", label: "Umumiy" },
  { id: "viloyat", label: "Viloyat" },
  { id: "bozor", label: "Bozor" },
] as const;

type Slice = (typeof SLICES)[number]["id"];

export default function MarketAdmin() {
  return <MarketPanel />;
}

export function MarketPanel({ onPick }: { onPick?: (slug: string) => void }) {
  const { data } = useQuery({ queryKey: ["madmin"], queryFn: () => api("/api/market-admin/overview/") });
  const { data: matrix, isLoading } = useQuery({
    queryKey: ["price-matrix"],
    queryFn: () => api("/api/prices/matrix/"),
  });
  const [slice, setSlice] = useState<Slice>("viloyat");
  const [regionSlug, setRegionSlug] = useState<string>("");
  const [marketSlug, setMarketSlug] = useState<string>("");
  const [q, setQ] = useState("");
  const [report, setReport] = useState<any>(null);

  const regions = matrix?.regions || [];
  const region = useMemo(
    () => regions.find((r: any) => r.slug === regionSlug) || regions[0],
    [regions, regionSlug]
  );
  const market = useMemo(
    () => (region?.markets || []).find((m: any) => m.slug === marketSlug) || region?.markets?.[0],
    [region, marketSlug]
  );

  return (
    <div>
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-2xl">Bozor paneli</h2>
          <p className="text-slate-400 text-sm">Viloyat va bozor kesimida barcha mahsulot narxlari — sotuvchi shaxsi ko'rinmaydi.</p>
        </div>
        <button
          className="border border-line px-3 py-1.5 rounded-lg text-sm"
          onClick={async () => setReport(await api("/api/market-admin/report/"))}
        >
          Haftalik hisobot
        </button>
      </div>

      <div className="flex gap-2 mt-4 flex-wrap">
        {SLICES.map((s) => (
          <button
            key={s.id}
            className={`px-3 py-1.5 rounded-full text-sm ${slice === s.id ? "bg-violet-600" : "border border-line text-slate-300"}`}
            onClick={() => setSlice(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {slice === "umumiy" && (
        <>
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
        </>
      )}

      {slice === "viloyat" && (
        <div className="mt-4">
          {isLoading && <p className="text-sm text-slate-400">Viloyat narxlari yuklanmoqda…</p>}
          <div className="flex gap-2 flex-wrap">
            {regions.map((r: any) => (
              <button
                key={r.slug}
                className={`px-3 py-1.5 rounded-full text-sm ${region?.slug === r.slug ? "bg-violet-600" : "border border-line text-slate-300"}`}
                onClick={() => setRegionSlug(r.slug)}
              >
                {r.name}
                <span className="ml-1 text-[10px] text-slate-300">{r.product_count}</span>
              </button>
            ))}
          </div>
          {region && (
            <>
              <div className="flex items-end justify-between gap-3 mt-4 flex-wrap">
                <div>
                  <div className="font-display text-xl">{region.name}</div>
                  <p className="text-xs text-slate-500">
                    {region.market_count} bozor · {region.product_count} mahsulot · o'rtacha narx
                  </p>
                </div>
                <Search q={q} setQ={setQ} />
              </div>
              <ProductTable
                products={filterProducts(region.products, q)}
                onPick={onPick}
                extra={(p) => (
                  <span className="text-slate-500 text-xs">
                    {som(p.min)}–{som(p.max)} · {p.markets} bozor
                  </span>
                )}
              />
              <div className="mt-4">
                <div className="text-xs text-slate-500 mb-2">Viloyatdagi bozorlar</div>
                <div className="flex gap-2 flex-wrap">
                  {region.markets.map((m: any) => (
                    <button
                      key={m.slug}
                      className="border border-line rounded-xl px-3 py-2 text-sm hover:bg-white/5"
                      onClick={() => {
                        setRegionSlug(region.slug);
                        setMarketSlug(m.slug);
                        setSlice("bozor");
                      }}
                    >
                      <div>{m.name}</div>
                      <div className="text-[10px] text-slate-500">
                        {m.district} · {m.products.length} mahsulot
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {slice === "bozor" && (
        <div className="mt-4">
          {isLoading && <p className="text-sm text-slate-400">Bozor narxlari yuklanmoqda…</p>}
          <div className="flex gap-2 flex-wrap">
            {regions.map((r: any) => (
              <button
                key={r.slug}
                className={`px-3 py-1.5 rounded-full text-sm ${region?.slug === r.slug ? "bg-violet-600" : "border border-line text-slate-300"}`}
                onClick={() => {
                  setRegionSlug(r.slug);
                  setMarketSlug(r.markets?.[0]?.slug || "");
                }}
              >
                {r.name}
              </button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap mt-3">
            {(region?.markets || []).map((m: any) => (
              <button
                key={m.slug}
                className={`px-3 py-1.5 rounded-full text-sm ${market?.slug === m.slug ? "bg-violet-600" : "border border-line text-slate-300"}`}
                onClick={() => setMarketSlug(m.slug)}
              >
                {m.name}
              </button>
            ))}
          </div>
          {market && (
            <>
              <div className="flex items-end justify-between gap-3 mt-4 flex-wrap">
                <div>
                  <div className="font-display text-xl">{market.name}</div>
                  <p className="text-xs text-slate-500">
                    {region?.name} · {market.district} · {market.type} · {market.products.length} mahsulot
                  </p>
                </div>
                <Search q={q} setQ={setQ} />
              </div>
              <ProductTable products={filterProducts(market.products, q)} onPick={onPick} />
            </>
          )}
        </div>
      )}

      {slice !== "umumiy" && <p className="mt-3 text-xs text-slate-500">{matrix?.source}</p>}
    </div>
  );
}

function Search({ q, setQ }: { q: string; setQ: (v: string) => void }) {
  return (
    <input
      value={q}
      onChange={(e) => setQ(e.target.value)}
      placeholder="Mahsulot qidirish"
      className="border border-line rounded-lg px-3 py-1.5 text-sm w-48"
    />
  );
}

function filterProducts(products: any[] = [], q: string) {
  const s = q.trim().toLowerCase();
  if (!s) return products;
  return products.filter((p) => `${p.name} ${p.slug} ${p.category || ""}`.toLowerCase().includes(s));
}

function ProductTable({
  products,
  onPick,
  extra,
}: {
  products: any[];
  onPick?: (slug: string) => void;
  extra?: (p: any) => ReactNode;
}) {
  const groups = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const p of products) {
      const k = p.category || "Boshqa";
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(p);
    }
    return [...map.entries()];
  }, [products]);

  if (!products.length) {
    return <p className="mt-4 text-sm text-slate-500">Bu kesimda narx topilmadi.</p>;
  }

  return (
    <div className="mt-3 space-y-4">
      {groups.map(([cat, rows]) => (
        <div key={cat}>
          <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">{cat}</div>
          <ul className="space-y-1">
            {rows.map((p) => (
              <li key={p.slug}>
                <button
                  className="w-full flex items-center justify-between gap-3 border border-line rounded-xl px-3 py-2.5 hover:bg-white/5 text-left"
                  onClick={() => onPick?.(p.slug)}
                  disabled={!onPick}
                >
                  <span>
                    <span className="block">{p.name}</span>
                    <span className="text-[10px] text-slate-500">1 {p.unit}</span>
                  </span>
                  <span className="text-right shrink-0">
                    <span className="block">{som(p.price)}</span>
                    <span className={chgClass(p.change_pct)}>
                      {p.change_pct > 0 ? "+" : ""}
                      {p.change_pct}%
                    </span>
                    {extra ? <span className="block mt-0.5">{extra(p)}</span> : null}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function chgClass(pct: number) {
  if (pct > 0) return "text-rose-400 text-xs";
  if (pct < 0) return "text-emerald-400 text-xs";
  return "text-slate-500 text-xs";
}

function Box({ label, value }: { label: string; value?: number }) {
  return (
    <div className="border border-line rounded-2xl p-4 bg-panel/60">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="font-display text-2xl">{value ?? "—"}</div>
    </div>
  );
}
