import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export default function Bank() {
  const { data } = useQuery({ queryKey: ["packs"], queryFn: () => api("/api/credit-package/") });
  return (
    <div>
      <h1 className="font-display text-3xl">Bank paneli</h1>
      <p className="text-sm text-slate-400">Faqat tadbirkor roziligi bilan kelgan paketlar.</p>
      <div className="mt-4 space-y-2">
        {(data || []).map((p: any) => (
          <div key={p.id} className="bg-panel/60 border border-line rounded-2xl p-4">
            <div className="font-medium">{p.business}</div>
            <div className="text-sm text-slate-300">KTI {p.summary?.kti} · rozilik {p.consent ? "ha" : "yo'q"}</div>
            <div className="text-xs text-slate-500">{p.sent_to_bank_at || "yuborilmagan"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
