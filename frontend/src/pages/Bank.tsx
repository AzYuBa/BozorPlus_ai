import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export default function Bank() {
  const { data } = useQuery({ queryKey: ["packs"], queryFn: () => api("/api/credit-package/") });
  return (
    <div className="text-slate-900">
      <h1 className="font-display text-3xl">Bank paneli</h1>
      <p className="text-sm text-slate-500">Faqat tadbirkor roziligi bilan kelgan paketlar.</p>
      <div className="mt-4 space-y-2">
        {(data || []).map((p: any) => (
          <div key={p.id} className="bg-white border rounded-2xl p-4">
            <div className="font-medium">{p.business}</div>
            <div className="text-sm">KTI {p.summary?.kti} · rozilik {p.consent ? "ha" : "yo'q"}</div>
            <div className="text-xs text-slate-500">{p.sent_to_bank_at || "yuborilmagan"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
