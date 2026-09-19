import { useMemo, useState } from "react";
import { som } from "../lib/api";

export default function Plan() {
  const [price, setPrice] = useState(10000);
  const [cost, setCost] = useState(6000);
  const [qty, setQty] = useState(1000);
  const [fixed, setFixed] = useState(2_000_000);

  const result = useMemo(() => {
    const rev = price * qty;
    const profit = rev - cost * qty - fixed;
    const be = price > cost ? Math.ceil(fixed / (price - cost)) : null;
    return { rev, profit, be };
  }, [price, cost, qty, fixed]);

  return (
    <div>
      <div className="pagehead">
        <div>
          <div className="eyebrow">REJA</div>
          <h1>Biznes kalkulyator</h1>
          <p>Mahalliy hisob — API kalitsiz. Soliq/kredit manbalari alohida.</p>
        </div>
      </div>
      <div className="grid two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <form className="card" onSubmit={(e) => e.preventDefault()}>
          <h2>Parametrlar</h2>
          <div className="formgrid">
            <div className="field">
              <label>Sotuv narxi</label>
              <input type="number" value={price} onChange={(e) => setPrice(+e.target.value)} />
            </div>
            <div className="field">
              <label>Tannarx</label>
              <input type="number" value={cost} onChange={(e) => setCost(+e.target.value)} />
            </div>
            <div className="field">
              <label>Oylik hajm</label>
              <input type="number" value={qty} onChange={(e) => setQty(+e.target.value)} />
            </div>
            <div className="field">
              <label>Doimiy xarajat</label>
              <input type="number" value={fixed} onChange={(e) => setFixed(+e.target.value)} />
            </div>
          </div>
        </form>
        <div className="card">
          <h2>Natija</h2>
          <div className="result">
            <span>Operatsion foyda / oy</span>
            <strong className={result.profit < 0 ? "down" : "up"}>{som(result.profit)}</strong>
            <div className="resultrow">
              <span>Tushum</span>
              <b>{som(result.rev)}</b>
            </div>
            <div className="resultrow">
              <span>Zararsizlik</span>
              <b>{result.be === null ? "Erishib bo'lmaydi" : `${result.be} dona`}</b>
            </div>
          </div>
          <div className="notice">Soliq va foiz kiritilmagan.</div>
        </div>
      </div>
    </div>
  );
}
