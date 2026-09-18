import { useState } from "react";
import { api, som } from "../lib/api";

export default function Agent() {
  const [q, setQ] = useState("Somsaxonaga 500 kg un va 100 kg go'sht kerak, eng arzonini top");
  const [msgs, setMsgs] = useState<{ role: string; text: string; data?: any }[]>([]);
  const [loading, setLoading] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = q.trim();
    if (!text) return;
    setMsgs((m) => [...m, { role: "user", text }]);
    setLoading(true);
    try {
      const data = await api("/api/agent/chat/", { method: "POST", body: JSON.stringify({ message: text }) });
      setMsgs((m) => [...m, { role: "ai", text: data.reply, data }]);
    } catch (err: any) {
      setMsgs((m) => [...m, { role: "ai", text: err.message }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl">Xorazmiy · xarid agenti</h1>
      <p className="text-slate-400 text-sm">Raqamlar faqat tool'dan. Har bir javobda manba bor.</p>
      <div className="mt-4 space-y-3 min-h-[40vh]">
        {msgs.map((m, i) => (
          <div key={i} className={`rounded-2xl p-4 ${m.role === "user" ? "bg-violet-600/20 ml-8" : "bg-panel border border-line mr-8"}`}>
            <pre className="whitespace-pre-wrap font-sans text-sm">{m.text}</pre>
            {m.data?.data?.offers?.offers && (
              <div className="grid gap-2 mt-3">
                {m.data.data.offers.offers.map((o: any) => (
                  <div key={o.rank} className="rounded-xl border border-line p-3 text-sm">
                    <div className="flex justify-between">
                      <b>#{o.rank} {o.supplier}</b>
                      <span className="text-emerald-400">{som(o.total)}</span>
                    </div>
                    <div className="text-slate-400">
                      tovar {som(o.goods)} + yetkazish {som(o.delivery)} · {o.km} km · tejash {o.saving_vs_avg_pct}%
                    </div>
                    <button
                      className="mt-2 text-xs text-violet-300"
                      onClick={() => navigator.clipboard.writeText(o.message)}
                    >
                      Xabar matnini nusxalash
                    </button>
                  </div>
                ))}
              </div>
            )}
            {m.role === "ai" && (
              <div className="mt-2 flex gap-2 flex-wrap">
                {(m.data?.tools || []).map((t: string) => (
                  <span key={t} className="chip">{t}</span>
                ))}
                <span className="chip">manba: tool</span>
              </div>
            )}
          </div>
        ))}
      </div>
      <form onSubmit={send} className="mt-4 flex gap-2">
        <input
          className="flex-1 bg-panel border border-line rounded-xl px-4 py-3"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Savol yoki xarid so'rovi…"
        />
        <button className="px-5 rounded-xl bg-violet-600" disabled={loading}>
          {loading ? "…" : "Yuborish"}
        </button>
      </form>
    </div>
  );
}
