import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, currentUser, som } from "../lib/api";
import TerminalChart from "../components/TerminalChart";
import { MarketPanel } from "./MarketAdmin";

export default function Pulse() {
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const view = ["bozor", "partiya", "arbitraj"].includes(params.get("tab") || "") ? params.get("tab")! : "pulse";
  const [raw, setRaw] = useState("Dehqon bozorida un, 50 kglik qopi 450 ming");
  const [parsed, setParsed] = useState<any>(null);
  const [slug, setSlug] = useState("un");
  const [days, setDays] = useState(90);
  const { data, isLoading } = useQuery({
    queryKey: ["pulse"],
    queryFn: () => api("/api/prices/pulse/"),
    refetchInterval: 10000,
  });
  const ticker = data?.ticker || [];
  const canIngest = currentUser()?.role === "entrepreneur";

  return (
    <div className="bp-page">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="bp-title">Bozor pulsi</h1>
          <p className="bp-sub">Jonli tiker, terminal va bozor paneli</p>
        </div>
        <div className="text-right bp-panel px-4 py-3">
          <div className="text-[11px] uppercase tracking-wider text-muted">Ijtimoiy indeks</div>
          <div className={`font-display text-2xl font-bold ${(data?.social_index_change_pct || 0) >= 0 ? "text-up" : "text-down"}`}>
            {data?.social_index_change_pct ?? "—"}%
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-5 flex-wrap">
        <button
          className={view === "pulse" ? "bp-tab-on" : "bp-tab"}
          onClick={() => setParams({})}
        >
          Narxlar
        </button>
        <button
          className={view === "partiya" ? "bp-tab-on" : "bp-tab"}
          onClick={() => setParams({ tab: "partiya" })}
        >
          Partiya xaridi
        </button>
        <button
          className={view === "arbitraj" ? "bp-tab-on" : "bp-tab"}
          onClick={() => setParams({ tab: "arbitraj" })}
        >
          Arbitraj
        </button>
        <button
          className={view === "bozor" ? "bp-tab-on" : "bp-tab"}
          onClick={() => setParams({ tab: "bozor" })}
        >
          Bozor paneli
        </button>
      </div>
      {view === "bozor" ? (
        <div className="mt-4">
          <MarketPanel
            onPick={(s) => {
              setSlug(s);
              setParams({});
            }}
          />
        </div>
      ) : view === "partiya" ? (
        <div className="mt-4">
          <LotCalc product={slug} onProduct={setSlug} />
        </div>
      ) : view === "arbitraj" ? (
        <div className="mt-4">
          <Arbitrage product={slug} onProduct={setSlug} />
        </div>
      ) : (
        <>
      {canIngest && (
        <>
          <form
            className="mt-4 flex gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              const r = await api("/api/prices/ingest/", { method: "POST", body: JSON.stringify({ text: raw }) });
              setParsed(r);
            }}
          >
            <input className="flex-1 bp-input !py-3" value={raw} onChange={(e) => setRaw(e.target.value)} />
            <button className="bp-btn">Ovoz/matn</button>
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
        </>
      )}
      <div className="mt-4 overflow-hidden border border-line rounded-2xl bg-panel shadow-soft">
        <div className="flex ticker w-max gap-8 py-2.5 px-4 text-sm">
          {ticker.concat(ticker).map((t: any, i: number) => (
            <button key={i} className="whitespace-nowrap hover:text-teal transition" onClick={() => setSlug(t.slug)}>
              <b className="font-display">{t.name}</b> {som(t.price).replace(" so'm", "")}{" "}
              <span className={t.change_pct >= 0 ? "text-up font-semibold" : "text-down font-semibold"}>
                {t.change_pct >= 0 ? "+" : ""}
                {t.change_pct}%
              </span>
            </button>
          ))}
        </div>
      </div>
      {isLoading && <p className="mt-6 text-muted">Yuklanmoqda…</p>}
      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <Card title="Eng ko'p o'sgan" rows={data?.gainers} onPick={setSlug} active={slug} />
        <Card title="Eng ko'p tushgan" rows={data?.losers} onPick={setSlug} active={slug} />
      </div>
      <TerminalChart slug={slug} days={days} onDays={setDays} />
      <p className="mt-4 text-xs text-muted">
        Manba: BozorPuls narx bazasi · <span className="chip">DEMO</span>
      </p>
        </>
      )}
    </div>
  );
}

function Card({ title, rows, onPick, active }: { title: string; rows?: any[]; onPick: (s: string) => void; active?: string }) {
  return (
    <div className="bp-panel p-4">
      <h2 className="text-xs uppercase tracking-wider text-muted mb-3 font-semibold">{title}</h2>
      <div className="space-y-1">
        {(rows || []).map((r) => (
          <button
            key={r.slug}
            onClick={() => onPick(r.slug)}
            className={`w-full flex justify-between items-center hover:bg-sand rounded-xl px-2.5 py-2 transition ${active === r.slug ? "bg-accent/10 ring-1 ring-accent/30" : ""}`}
          >
            <span className="font-medium">{r.name}</span>
            <span className={r.change_pct >= 0 ? "text-up font-semibold" : "text-down font-semibold"}>
              {som(r.price)} · {r.change_pct}%
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

const LOT_PRODUCTS = [
  { slug: "kartoshka", name: "Kartoshka" },
  { slug: "un", name: "Un" },
  { slug: "piyoz", name: "Piyoz" },
  { slug: "guruch", name: "Guruch" },
  { slug: "shakar", name: "Shakar" },
  { slug: "mol-gosht", name: "Mol go'shti" },
];

function LotCalc({ product, onProduct }: { product: string; onProduct: (s: string) => void }) {
  const [qty, setQty] = useState(3000);
  const [res, setRes] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  async function run() {
    setBusy(true);
    try {
      setRes(await api("/api/sourcing/search/", { method: "POST", body: JSON.stringify({ product, qty, unit: "kg", district: "urganch-shahar" }) }));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <h2 className="font-display text-2xl">Aqlli partiya xaridi</h2>
      <p className="text-muted text-sm">Hajmni kiriting — eng arzon yetkazib beruvchi, transport va tejash.</p>
      <div className="mt-4 flex gap-2 flex-wrap items-end">
        <label className="text-sm text-ink/80">
          Mahsulot
          <select className="mt-1 block bg-panel border border-line rounded-xl px-3 py-2" value={product} onChange={(e) => onProduct(e.target.value)}>
            {LOT_PRODUCTS.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-ink/80">
          Hajm, kg
          <input className="mt-1 block bg-panel border border-line rounded-xl px-3 py-2" type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} />
        </label>
        <button className="bp-btn h-10" disabled={busy} onClick={run}>
          {busy ? "…" : "Hisoblash"}
        </button>
      </div>
      {res && (
        <div className="mt-4 space-y-2">
          <div className="text-sm text-up">O'rtacha bilan solishtirganda tejash: {res.saving_pct}%</div>
          {(res.offers || []).map((o: any) => (
            <div key={o.rank} className="border border-line rounded-2xl p-4 bg-panel/60">
              <div className="flex justify-between">
                <b>
                  #{o.rank} {o.supplier}
                </b>
                <span className="text-up">{som(o.total)}</span>
              </div>
              <div className="text-sm text-muted mt-1">
                {o.market} · tovar {som(o.goods)} + yetkazish {som(o.delivery)} · {o.km} km
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Arbitrage({ product, onProduct }: { product: string; onProduct: (s: string) => void }) {
  const { data } = useQuery({
    queryKey: ["compare", product],
    queryFn: () => api(`/api/prices/compare/?product=${product}&qty=1000`),
  });
  const arb = data?.arbitrage;
  return (
    <div>
      <h2 className="font-display text-2xl">Viloyatlararo arbitraj</h2>
      <p className="text-muted text-sm">Qayerdan olib, qayerda sotish — 1 tonna asosida, transport chegirilgan.</p>
      <select className="mt-3 bg-panel border border-line rounded-xl px-3 py-2" value={product} onChange={(e) => onProduct(e.target.value)}>
        {LOT_PRODUCTS.map((p) => (
          <option key={p.slug} value={p.slug}>
            {p.name}
          </option>
        ))}
      </select>
      {arb && (
        <div className="mt-4 grid sm:grid-cols-3 gap-3">
          <div className="border border-line rounded-2xl p-4 bg-panel/60">
            <div className="text-xs text-muted">Olish</div>
            <div className="font-medium">{arb.buy_market}</div>
            <div>{som(arb.buy_price)}</div>
          </div>
          <div className="border border-line rounded-2xl p-4 bg-panel/60">
            <div className="text-xs text-muted">Sotish</div>
            <div className="font-medium">{arb.sell_market}</div>
            <div>{som(arb.sell_price)}</div>
          </div>
          <div className="border border-line rounded-2xl p-4 bg-panel/60">
            <div className="text-xs text-muted">Sof (1 t)</div>
            <div className={`font-display text-2xl ${arb.net >= 0 ? "text-up" : "text-down"}`}>{som(arb.net)}</div>
            <div className="text-xs text-muted">spred {arb.spread_pct}% · {arb.km} km</div>
          </div>
        </div>
      )}
      <p className="text-sm text-ink/80 mt-3">{arb?.comment}</p>
      <div className="mt-4 overflow-x-auto border border-line rounded-2xl">
        <table className="w-full text-sm">
          <thead className="bg-sand text-muted">
            <tr>
              <th className="p-2 text-left">Bozor</th>
              <th className="p-2 text-right">Narx</th>
              <th className="p-2 text-right">O'rtachadan</th>
            </tr>
          </thead>
          <tbody>
            {(data?.rows || []).map((r: any) => (
              <tr key={r.slug} className="border-t border-line">
                <td className="p-2">{r.market}</td>
                <td className="p-2 text-right">{som(r.price)}</td>
                <td className={`p-2 text-right ${r.diff_pct >= 0 ? "text-down" : "text-up"}`}>
                  {r.diff_pct}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
