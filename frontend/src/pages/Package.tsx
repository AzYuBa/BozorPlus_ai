import { useEffect, useState } from "react";
import { api, som } from "../lib/api";

export default function Package() {
  const [consent, setConsent] = useState(false);
  const [res, setRes] = useState<any>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [programs, setPrograms] = useState<any[]>([]);
  const [bank, setBank] = useState("");
  const [programId, setProgramId] = useState<number | "">("");

  useEffect(() => {
    api("/api/finance/programs/match/?amount=150000000&sector=ovqatlanish")
      .then((list) => {
        setPrograms(list || []);
        if (list?.length) {
          const preferred = list.find((p: any) => p.provider === "Xalq banki") || list[0];
          setBank(preferred.provider);
          setProgramId(preferred.id);
        }
      })
      .catch(() => {});
  }, []);

  const banks = Array.from(new Set(programs.map((p) => p.provider).filter(Boolean)));
  const bankPrograms = programs.filter((p) => p.provider === bank);
  const selected = bankPrograms.find((p) => p.id === programId) || bankPrograms[0] || null;

  useEffect(() => {
    if (!bank) return;
    const list = programs.filter((p) => p.provider === bank);
    if (list.length && !list.some((p) => p.id === programId)) setProgramId(list[0].id);
  }, [bank, programs, programId]);

  async function send() {
    setErr("");
    if (!selected) return setErr("Bank va kredit turini tanlang");
    if (!consent) return setErr("Rozilik kerak");
    setBusy(true);
    try {
      const r = await api("/api/credit-package/", {
        method: "POST",
        body: JSON.stringify({
          consent,
          send: true,
          program_id: selected.id,
          bank: selected.provider,
          program_name: selected.name,
        }),
      });
      setRes(r);
    } catch (e: any) {
      setErr(e?.message || "Yuborilmadi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-xl bp-page">
      <h1 className="bp-title">Kredit paketi</h1>
      <p className="bp-sub">Bank va kredit turini tanlang. Reja + hisobot + KTI. Bankka faqat rozilik bilan.</p>

      <div className="mt-5 bp-panel p-5 space-y-3">
        <label className="block text-sm">
          Bank
          <select className="mt-1 bp-input" value={bank} onChange={(e) => setBank(e.target.value)}>
            <option value="">Tanlang</option>
            {banks.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Kredit turi
          <select
            className="mt-1 bp-input"
            value={programId === "" ? "" : String(programId)}
            onChange={(e) => setProgramId(e.target.value ? Number(e.target.value) : "")}
            disabled={!bank}
          >
            <option value="">Tanlang</option>
            {bankPrograms.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        {selected && (
          <div className="text-sm text-muted rounded-xl bg-mist border border-line p-3">
            {selected.provider} · {(selected.rate * 100).toFixed(1)}% · {selected.term_months} oy · max{" "}
            {som(selected.max_amount)}
          </div>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          Moliyaviy ma'lumotlarimni tanlangan bankka yuborishga roziman.
        </label>
        {err && <p className="text-sm text-down">{err}</p>}
        <button className="bp-btn" disabled={busy || !selected} onClick={send}>
          {busy ? "…" : "Bankka yuborish"}
        </button>
      </div>

      {res && (
        <div className="mt-4 bp-panel p-4 text-sm space-y-1">
          <div>
            Bank: <b>{res.summary?.bank}</b>
          </div>
          <div>
            Kredit: <b>{res.summary?.program_name}</b>
          </div>
          <div>KTI: {res.summary?.kti}</div>
          <div>NPV: {som(res.summary?.npv)}</div>
          <div>Bank inbox: {res.bank_inbox ? "yuborildi" : "yo'q"}</div>
          <p className="text-xs text-muted mt-2">{res.summary?.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
