import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api, som, type Candle, type Instrument } from "../lib/api";
import { TerminalChart } from "../components/TerminalChart";

function ohlcStats(candles: Candle[]) {
  if (!candles.length) return null;
  const first = candles[0];
  const last = candles[candles.length - 1];
  let high = first.high;
  let low = first.low;
  for (const c of candles) {
    if (c.high > high) high = c.high;
    if (c.low < low) low = c.low;
  }
  const rangePct = low > 0 ? ((high - low) / low) * 100 : 0;
  const periodPct = first.open > 0 ? ((last.close - first.open) / first.open) * 100 : 0;
  return { open: first.open, high, low, close: last.close, rangePct, periodPct };
}

export default function Terminal() {
  const [slug, setSlug] = useState("un");
  const [days, setDays] = useState(90);
  const [qty, setQty] = useState(1000);

  const instrumentsQ = useQuery({
    queryKey: ["instruments"],
    queryFn: () => api<{ instruments: Instrument[]; source: string; note: string }>("/api/v1/market/instruments/"),
    refetchInterval: 5 * 60_000,
  });

  const candlesQ = useQuery({
    queryKey: ["candles", slug, days],
    queryFn: () =>
      api<{ candles: Candle[]; product: Instrument; disclaimer: string; source: string }>(
        `/api/v1/market/candles/?product=${slug}&days=${days}`
      ),
  });

  const list = instrumentsQ.data?.instruments || [];
  const active = useMemo(() => list.find((x) => x.slug === slug) || list[0], [list, slug]);
  const candles = candlesQ.data?.candles || [];
  const product = candlesQ.data?.product || active;
  const stats = useMemo(() => ohlcStats(candles), [candles]);
  const change = product?.change_pct || 0;
  const signal = change <= -1.2 ? "HOZIR OL" : change >= 1.5 ? "KUT" : "KUZAT";
  const signalHint =
    signal === "HOZIR OL"
      ? "Narx pasaygan — xarid uchun qulay zona."
      : signal === "KUT"
        ? "Narx ko‘tarilgan — biroz kutish mumkin."
        : "Barqaror zona — miqdorni rejangizga moslang.";

  const movers = useMemo(() => {
    return [...list].sort((a, b) => Math.abs(b.change_pct) - Math.abs(a.change_pct)).slice(0, 4);
  }, [list]);

  return (
    <div>
      <div className="exchange-ticker">
        <span className="ticker-label">
          BOZOR
          <br />
          <b>LENTASI</b>
        </span>
        <div className="ticker-scroll">
          {list.map((p) => (
            <button key={p.slug} type="button" className="ticker-item" onClick={() => setSlug(p.slug)}>
              <span>{p.name}</span>
              <b>{som(p.price).replace(" so'm", "")}</b>
              <em className={p.change_pct >= 0 ? "up" : "down"}>
                {p.change_pct >= 0 ? "↗ +" : "↘ "}
                {p.change_pct.toFixed(2)}%
              </em>
            </button>
          ))}
        </div>
        <span className="ticker-demo">
          LIVE
          <br />
          UZS
        </span>
      </div>

      <div className="exchange-heading" style={{ marginTop: 18 }}>
        <div>
          <div className="terminal-eyebrow">
            OCHIQ MANBA <span>/ YAHOO + FX</span>
          </div>
          <h1>
            Bozor <i>pulsi.</i>
          </h1>
          <p>Haqiqiy OHLC grafik — futures indeksi asosida mahalliy UZS proxy.</p>
        </div>
      </div>

      {instrumentsQ.isError ? (
        <div className="notice">Bozor ma'lumoti yuklanmadi: {(instrumentsQ.error as Error).message}</div>
      ) : null}

      <div className="terminal-layout" style={{ marginTop: 16 }}>
        <aside className="watchlist">
          <div className="watch-head">
            <b>Mahsulotlar</b>
            <span>{list.length}</span>
          </div>
          <div className="watch-col-label">
            <span>MAHSULOT</span>
            <span>NARX</span>
          </div>
          <div>
            {list.map((p) => (
              <button
                key={p.slug}
                type="button"
                className={`watch-row ${slug === p.slug ? "selected" : ""}`}
                onClick={() => setSlug(p.slug)}
              >
                <span className="watch-symbol">{p.code}</span>
                <span>
                  <b>{p.name}</b>
                  <small>
                    {p.region} · {p.yahoo_symbol}
                  </small>
                </span>
                <span className="watch-numbers">
                  <b>{som(p.price).replace(" so'm", "")}</b>
                  <small className={p.change_pct >= 0 ? "up" : "down"}>
                    {p.change_pct >= 0 ? "+" : ""}
                    {p.change_pct.toFixed(2)}%
                  </small>
                </span>
              </button>
            ))}
          </div>
          <div className="watch-bottom">
            <span>MANBA</span>
            <b>Yahoo Finance</b>
            <small>Ochiq chart API · UZS proxy</small>
          </div>
        </aside>

        <section className="trading-terminal">
          <div className="instrument-top">
            <div>
              <span className="instrument-name">
                {product?.name || "—"} <small>/ UZS</small>
              </span>
              <div className="instrument-sub">
                {product?.market} · {product?.region} · {product?.yahoo_symbol}
              </div>
            </div>
            <span className={`signal-chip signal-${signal === "HOZIR OL" ? "buy" : signal === "KUT" ? "wait" : "hold"}`}>
              {signal}
            </span>
          </div>
          <div className="quote-bar">
            <div className="main-quote">
              {som(product?.price).replace(" so'm", "")}
              <small>so'm / {product?.unit || "kg"}</small>
            </div>
            <span className={`quote-change ${(product?.change_pct || 0) >= 0 ? "positive" : "negative"}`}>
              {(product?.change_pct || 0) >= 0 ? "↗ +" : "↘ "}
              {(product?.change_pct || 0).toFixed(2)}%
            </span>
            {stats ? (
              <>
                <div className="quote-stat">
                  <small>OCHILISH</small>
                  <b>{som(stats.open).replace(" so'm", "")}</b>
                </div>
                <div className="quote-stat">
                  <small>MAX</small>
                  <b>{som(stats.high).replace(" so'm", "")}</b>
                </div>
                <div className="quote-stat">
                  <small>MIN</small>
                  <b>{som(stats.low).replace(" so'm", "")}</b>
                </div>
              </>
            ) : null}
          </div>
          <div className="chart-toolbar">
            <div>
              {[7, 30, 90].map((d) => (
                <button key={d} type="button" className={days === d ? "active" : ""} onClick={() => setDays(d)}>
                  {d} kun
                </button>
              ))}
            </div>
            <div>
              <span className="muted" style={{ fontSize: 12 }}>
                {candles.length} sham · {product?.as_of || "…"}
              </span>
            </div>
          </div>
          {candlesQ.isLoading ? <div className="notice">Grafik yuklanmoqda…</div> : null}
          {candlesQ.isError ? (
            <div className="notice">Grafik xatosi: {(candlesQ.error as Error).message}</div>
          ) : (
            <TerminalChart candles={candles} height={440} />
          )}

          <div className="chart-under">
            <div className="chart-under-grid">
              <div className="chart-metric">
                <span>Davr o‘zgarishi</span>
                <b className={(stats?.periodPct || 0) >= 0 ? "up" : "down"}>
                  {(stats?.periodPct || 0) >= 0 ? "+" : ""}
                  {(stats?.periodPct || 0).toFixed(2)}%
                </b>
              </div>
              <div className="chart-metric">
                <span>Max–Min diapazon</span>
                <b>{(stats?.rangePct || 0).toFixed(2)}%</b>
              </div>
              <div className="chart-metric">
                <span>Yopilish</span>
                <b>{stats ? som(stats.close).replace(" so'm", "") : "—"}</b>
              </div>
              <div className="chart-metric signal-metric">
                <span>Signal</span>
                <b>{signal}</b>
                <small>{signalHint}</small>
              </div>
            </div>
            <div className="terminal-caption">
              <span>
                <b>BP</b> TERMINAL
              </span>
              <span>{candlesQ.data?.source || "yahoo"}</span>
            </div>
            <p className="muted chart-disclaimer">{candlesQ.data?.disclaimer || product?.proxy_note}</p>
          </div>
        </section>

        <aside className="trade-panel">
          <div className="trade-heading">
            <span>HISOB</span>
          </div>
          <h2>Xarid miqdori.</h2>
          <p>Narx × miqdor — mahalliy proxy asosida.</p>
          <div className="trade-product">
            <span className="watch-symbol">{product?.code}</span>
            <div>
              <b>{product?.name}</b>
              <small>
                {product?.region} · {product?.market}
              </small>
            </div>
          </div>
          <label className="quantity-label" htmlFor="qty">
            Miqdor <span>{product?.unit}</span>
          </label>
          <div className="quantity-field">
            <button type="button" onClick={() => setQty((q) => Math.max(100, q - 100))}>
              −
            </button>
            <input id="qty" type="number" min={100} step={100} value={qty} onChange={(e) => setQty(+e.target.value || 0)} />
            <button type="button" onClick={() => setQty((q) => q + 100)}>
              +
            </button>
          </div>
          <div className="trade-row">
            <span>Birlik narxi</span>
            <b>{som(product?.price)}</b>
          </div>
          <div className="trade-total">
            <span>Jami</span>
            <strong>
              {som((product?.price || 0) * qty)}
              <small>so'm</small>
            </strong>
          </div>
          <Link className="trade-cta" to="/adviser">
            <span>AI dan so‘rang</span>
            <span>→</span>
          </Link>
          <p className="trade-footnote">
            Bu buyurtma emas — faqat hisob.
            <br />
            To'lov/xarid Stage 4 da.
          </p>
        </aside>
      </div>

      <div className="terminal-bottom-grid">
        <section className="regional-panel">
          <div className="section-top">
            <div>
              <span className="ai-pill">BOZOR HARAKATI</span>
              <h2>Eng kuchli siljishlar</h2>
            </div>
          </div>
          <div className="movers-inline">
            {movers.map((p) => (
              <button key={p.slug} type="button" className="mover-row" onClick={() => setSlug(p.slug)}>
                <span className="watch-symbol">{p.code}</span>
                <span>
                  {p.name}
                  <small>
                    {p.region} · {p.unit}
                  </small>
                </span>
                <b>
                  {som(p.price).replace(" so'm", "")}
                  <small>so'm</small>
                </b>
                <em className={p.change_pct >= 0 ? "up" : "down"}>
                  {p.change_pct >= 0 ? "+" : ""}
                  {p.change_pct.toFixed(2)}%
                </em>
              </button>
            ))}
            {!movers.length ? <p className="muted">Ma’lumot yuklanmoqda…</p> : null}
          </div>
        </section>

        <section className="forecast-panel">
          <span className="ai-pill">AI HAMROH</span>
          <h2>
            {product?.name || "Mahsulot"} uchun <i>{signal.toLowerCase()}</i>
          </h2>
          <p>
            {signalHint} Jami hisob: {som((product?.price || 0) * qty)}. AI maslahatchi bozor proxy narxlarini
            kontekstga qo‘shib javob beradi.
          </p>
          <div className="forecast-scale" aria-hidden>
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="forecast-status">
            <span>
              SIGNAL <b>{signal}</b>
            </span>
            <span>
              DAVR <b>{days} kun</b>
            </span>
          </div>
          <Link className="forecast-link" to="/adviser">
            AI Biznes-Adviser ochish <span>→</span>
          </Link>
        </section>
      </div>
    </div>
  );
}
