import { useQuery } from "@tanstack/react-query";
import { api, som } from "../lib/api";

export default function Bank() {
  return <BankPanel />;
}

export function BankPanel() {
  const { data, isLoading } = useQuery({ queryKey: ["packs"], queryFn: () => api("/api/credit-package/") });
  const packs = data || [];

  return (
    <div className="bg-panel/60 border border-line rounded-2xl p-4">
      <h2 className="font-medium">Bank paneli</h2>
      <p className="text-sm text-muted mt-1">Faqat tadbirkor roziligi bilan kelgan paketlar.</p>
      {isLoading && <p className="mt-3 text-muted text-sm">Yuklanmoqda…</p>}
      {!isLoading && packs.length === 0 && (
        <p className="mt-3 text-sm text-muted">Hozircha paket yo'q. «Paket» bo'limidan yuboring.</p>
      )}
      <div className="mt-3 space-y-2">
        {packs.map((p: any) => (
          <div key={p.id} className="border border-line rounded-xl p-3 bg-sand">
            <div className="flex justify-between gap-3 flex-wrap">
              <div className="font-medium">{p.business}</div>
              <span className={`chip ${p.consent ? "text-emerald-300" : "text-muted"}`}>
                {p.consent ? "rozilik bor" : "rozilik yo'q"}
              </span>
            </div>
            <div className="text-sm text-ink/80 mt-1">
              {p.summary?.bank && (
                <>
                  <b>{p.summary.bank}</b>
                  {p.summary?.program_name && <> · {p.summary.program_name}</>}
                  <br />
                </>
              )}
              KTI {p.summary?.kti ?? "—"}
              {p.summary?.npv != null && <> · NPV {som(p.summary.npv)}</>}
              {p.summary?.payback != null && <> · oqlash {p.summary.payback} oy</>}
            </div>
            {p.summary?.loan && (
              <div className="text-xs text-muted mt-1">
                {(p.summary.loan.rate * 100).toFixed(1)}% · {p.summary.loan.term_months} oy · max{" "}
                {som(p.summary.loan.max_amount)}
              </div>
            )}
            <div className="text-xs text-muted mt-1">
              {p.sent_to_bank_at ? `Bankka: ${new Date(p.sent_to_bank_at).toLocaleString("uz-UZ")}` : "yuborilmagan"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
