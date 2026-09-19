import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { currentUser, som } from "../lib/api";

type TxType = "topup" | "send" | "cash";

type Tx = {
  id: string;
  type: TxType;
  amount: number;
  note: string;
  at: string;
};

type WalletState = {
  balance: number;
  txs: Tx[];
};

const START_BALANCE = 25_000_000;

const ACTIONS: { id: TxType; title: string; hint: string }[] = [
  { id: "topup", title: "To‘ldirish", hint: "Demo +balans" },
  { id: "send", title: "O‘tkazma", hint: "Demo −balans" },
  { id: "cash", title: "Yechish", hint: "Demo −balans" },
];

function storageKey() {
  const u = currentUser();
  return `bp_demo_wallet_${u?.id || u?.email || "guest"}`;
}

function loadWallet(): WalletState {
  try {
    const raw = localStorage.getItem(storageKey());
    if (raw) {
      const parsed = JSON.parse(raw) as WalletState;
      if (typeof parsed.balance === "number" && Array.isArray(parsed.txs)) return parsed;
    }
  } catch {
    /* ignore */
  }
  return {
    balance: START_BALANCE,
    txs: [
      {
        id: "seed-1",
        type: "topup",
        amount: START_BALANCE,
        note: "Demo boshlang‘ich balans",
        at: new Date().toISOString(),
      },
    ],
  };
}

function saveWallet(state: WalletState) {
  localStorage.setItem(storageKey(), JSON.stringify(state));
}

function labelType(t: TxType) {
  if (t === "topup") return "To‘ldirish";
  if (t === "send") return "O‘tkazma";
  return "Yechish";
}

export default function Wallet() {
  const [wallet, setWallet] = useState<WalletState>(() => loadWallet());
  const [mode, setMode] = useState<TxType | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const txs = useMemo(() => [...wallet.txs].sort((a, b) => b.at.localeCompare(a.at)), [wallet.txs]);

  function apply(next: WalletState) {
    setWallet(next);
    saveWallet(next);
  }

  function resetDemo() {
    const fresh: WalletState = {
      balance: START_BALANCE,
      txs: [
        {
          id: `reset-${Date.now()}`,
          type: "topup",
          amount: START_BALANCE,
          note: "Demo qayta o‘rnatildi",
          at: new Date().toISOString(),
        },
      ],
    };
    apply(fresh);
    setMode(null);
    setErr("");
    setOk("Demo balans qayta o‘rnatildi.");
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!mode) return;
    setErr("");
    setOk("");
    const n = Math.round(Number(amount));
    if (!Number.isFinite(n) || n <= 0) {
      setErr("Miqdor noto‘g‘ri.");
      return;
    }
    if (mode !== "topup" && n > wallet.balance) {
      setErr("Balans yetarli emas.");
      return;
    }

    const delta = mode === "topup" ? n : -n;
    const tx: Tx = {
      id: `tx-${Date.now()}`,
      type: mode,
      amount: n,
      note: note.trim() || labelType(mode),
      at: new Date().toISOString(),
    };
    apply({
      balance: wallet.balance + delta,
      txs: [tx, ...wallet.txs].slice(0, 40),
    });
    setAmount("");
    setNote("");
    setMode(null);
    setOk(`${labelType(mode)} (DEMO) bajarildi.`);
  }

  return (
    <div className="wallet-console">
      <header className="wallet-head">
        <div>
          <div className="terminal-eyebrow">
            MOLIYA <span>/ DEMO</span>
          </div>
          <h1>
            Karmon <i>terminali.</i>
          </h1>
          <p>Kalit shart emas — lokal demo balans. Haqiqiy to‘lov keyinroq ulanadi.</p>
        </div>
        <div className="wallet-head-status">
          <span className="wallet-badge on">DEMO LIVE</span>
          <small>localStorage · API kalitsiz</small>
        </div>
      </header>

      <div className="wallet-layout">
        <section className="wallet-hero">
          <div className="wallet-hero-top">
            <span>KARMON · UZS</span>
            <span className="wallet-live">DEMO</span>
          </div>
          <strong className="wallet-balance">
            {wallet.balance.toLocaleString("uz-UZ")} <small>so'm</small>
          </strong>
          <p className="wallet-balance-note">Demo balans — faqat shu qurilmada saqlanadi.</p>
          <div className="wallet-hero-meta">
            <div>
              <span>Valyuta</span>
              <b>UZS</b>
            </div>
            <div>
              <span>Rejim</span>
              <b>Demo</b>
            </div>
            <div>
              <span>Operatsiya</span>
              <b>{wallet.txs.length}</b>
            </div>
          </div>
        </section>

        <aside className="wallet-side">
          <div className="wallet-side-head">
            <span>AMALLAR</span>
            <b className="up">Faol</b>
          </div>
          <div className="wallet-actions">
            {ACTIONS.map((a) => (
              <button
                key={a.id}
                type="button"
                className={`wallet-action active ${mode === a.id ? "selected" : ""}`}
                onClick={() => {
                  setMode(a.id);
                  setErr("");
                  setOk("");
                }}
              >
                <b>{a.title}</b>
                <small>{a.hint}</small>
              </button>
            ))}
            <button type="button" className="wallet-action active reset" onClick={resetDemo}>
              <b>Qayta o‘rnatish</b>
              <small>25 mln so‘m</small>
            </button>
          </div>
          <p className="wallet-side-foot">Bu haqiqiy pul emas — faqat demo.</p>
        </aside>
      </div>

      {mode ? (
        <form className="wallet-form card" onSubmit={onSubmit}>
          <div className="wallet-form-head">
            <h2>{labelType(mode)} (DEMO)</h2>
            <button type="button" className="ai-clear" onClick={() => setMode(null)}>
              Yopish
            </button>
          </div>
          <div className="wallet-form-grid">
            <label className="field">
              Miqdor (so‘m)
              <input
                type="number"
                min={1000}
                step={1000}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="masalan 500000"
                required
              />
            </label>
            <label className="field">
              Izoh
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ixtiyoriy" />
            </label>
          </div>
          {err ? <p className="form-error">{err}</p> : null}
          <button className="btn" type="submit">
            Tasdiqlash
          </button>
        </form>
      ) : null}

      {ok ? <div className="notice" style={{ marginTop: 14 }}>{ok}</div> : null}

      <div className="wallet-mid">
        <section className="wallet-panel">
          <div className="wallet-panel-head">
            <span className="ai-pill">TARIX</span>
            <h2>Demo operatsiyalar</h2>
          </div>
          <div className="wallet-tx-list">
            {txs.map((t) => (
              <div key={t.id} className="wallet-tx-row">
                <span className={`wallet-tx-type ${t.type}`}>{labelType(t.type)}</span>
                <div>
                  <b>{t.note}</b>
                  <small>{new Date(t.at).toLocaleString("uz-UZ")}</small>
                </div>
                <em className={t.type === "topup" ? "up" : "down"}>
                  {t.type === "topup" ? "+" : "−"}
                  {som(t.amount)}
                </em>
              </div>
            ))}
            {!txs.length ? <p className="muted">Hali operatsiya yo‘q.</p> : null}
          </div>
        </section>

        <section className="wallet-panel wallet-panel-accent">
          <div className="wallet-panel-head">
            <span className="ai-pill">KEYINGI</span>
            <h2>Haqiqiy to‘lov</h2>
          </div>
          <p className="wallet-next-copy">
            Payme / Click / bank kaliti bo‘lganda shu UI live rejimga o‘tadi. Hozircha demo bilan
            oqimni ko‘rsatish mumkin.
          </p>
          <ul className="wallet-now-list">
            <li>
              <b>Daftar</b>
              <span>Haqiqiy kirim-chiqim</span>
              <Link to="/notebook">Ochish →</Link>
            </li>
            <li>
              <b>AI hamroh</b>
              <span>Byudjet maslahati</span>
              <Link to="/adviser">Ochish →</Link>
            </li>
            <li>
              <b>Terminal</b>
              <span>Narx hisobi</span>
              <Link to="/">Ochish →</Link>
            </li>
          </ul>
          <div className="wallet-notice">DEMO: ma’lumot brauzerda saqlanadi, serverga yuborilmaydi.</div>
        </section>
      </div>
    </div>
  );
}
