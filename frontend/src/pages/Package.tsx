import { useState } from "react";
import { api, som } from "../lib/api";

export default function Package() {
  const [consent, setConsent] = useState(false);
  const [res, setRes] = useState<any>(null);
  async function send() {
    const r = await api("/api/credit-package/", {
      method: "POST",
      body: JSON.stringify({ consent, send: true }),
    });
    setRes(r);
  }
  return (
    <div className="text-slate-900 max-w-xl">
      <h1 className="font-display text-3xl">Kredit paketi</h1>
      <p className="text-sm text-slate-500">Reja + hisobot + KTI. Bankka faqat rozilik bilan.</p>
      <label className="mt-4 flex items-center gap-2">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        Moliyaviy ma'lumotlarimni tanlangan bankka yuborishga roziman.
      </label>
      <button className="mt-4 bg-violet-600 text-white px-4 py-2 rounded-lg" onClick={send}>
        Bankka yuborish
      </button>
      {res && (
        <div className="mt-4 bg-white border rounded-2xl p-4 text-sm">
          <div>KTI: {res.summary?.kti}</div>
          <div>NPV: {som(res.summary?.npv)}</div>
          <div>Bank inbox: {res.bank_inbox ? "yuborildi" : "yo'q"}</div>
          <p className="text-xs text-slate-500 mt-2">{res.summary?.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
