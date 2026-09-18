import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUpload, currentUser, som } from "../lib/api";

const HINTS = [
  { label: "Narx kiritish", q: "Dehqon bozorida un, 50 kglik qopi 450 ming" },
  { label: "Arzon xarid", q: "3 tonna kartoshka eng arzonini top" },
  { label: "Kredit", q: "150 mln kredit oylik to'lov va qaysi bank dasturi mos" },
  { label: "Soliq", q: "YaTT 4% va MChJ ni tushuntir, mening aylanmam 800 mln" },
  { label: "Biznes-reja", q: "Somsaxona uchun biznes-reja tuz" },
  { label: "Daftar", q: "Bugun 2 million so'mga un oldim, daftarga yoz" },
];

const TOOL_LABEL: Record<string, string> = {
  ingest_price: "Narx kiritildi",
  confirm_price: "Narx tasdiqlandi",
  ledger_add: "Daftarga yozildi",
  ledger_report: "Daftar hisoboti",
  search_offers: "Takliflar",
  get_price_stats: "Narx statistikasi",
  forecast_price: "Prognoz",
  calc_loan: "Kredit hisobi",
  match_programs: "Bank dasturlari",
  calc_tax: "Soliq taqqoslovi",
  compare_status: "Formallashuv",
  build_business_plan: "Biznes-reja",
  stress_test: "Stress-test",
  credit_readiness: "KTI",
  search_knowledge: "Qonun bazasi",
  open_section: "Bo'lim",
};

type Msg = { role: "user" | "assistant"; text: string; image?: string; data?: any };

export default function Agent() {
  const nav = useNavigate();
  const user = currentUser();
  const canPlan = user?.role === "entrepreneur";
  const [q, setQ] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "assistant",
      text: "Salom. Men Xorazmiy. Narx, chek, kredit, soliq yoki biznes savolini yozing — ovoz yoki rasm ham bo‘ladi.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const preview = image ? URL.createObjectURL(image) : "";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading]);

  async function sendPayload(text: string, audio?: Blob, img?: File | null) {
    const t = text.trim();
    if (!t && !audio && !img) return;
    setMsgs((m) => [
      ...m,
      { role: "user", text: t || (audio ? "Ovozli xabar" : "Rasm yuborildi"), image: img ? URL.createObjectURL(img) : undefined },
    ]);
    setQ("");
    setImage(null);
    setLoading(true);
    try {
      const form = new FormData();
      if (t) form.append("message", t);
      const hist = msgs.slice(-8).map((x) => ({ role: x.role === "assistant" ? "assistant" : "user", content: x.text }));
      form.append("history", JSON.stringify(hist));
      if (img) form.append("image", img);
      if (audio) form.append("audio", audio, "voice.webm");
      const data = await apiUpload("/api/agent/chat/", form);
      setMsgs((m) => [...m, { role: "assistant", text: data.reply || data.detail || "Javob yo'q", data }]);
    } catch (err: any) {
      setMsgs((m) => [...m, { role: "assistant", text: err.message || "Xatolik" }]);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendPayload(q, undefined, image);
  }

  async function toggleVoice() {
    if (recording) {
      recRef.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (ev) => {
        if (ev.data.size) chunksRef.current.push(ev.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop());
        sendPayload(q, new Blob(chunksRef.current, { type: "audio/webm" }), image);
      };
      recRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      const Rec = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (!Rec) {
        setMsgs((m) => [...m, { role: "assistant", text: "Mikrofon ruxsati yo‘q. Matn yozing yoki rasm yuboring." }]);
        return;
      }
      const rec = new Rec();
      rec.lang = "uz-UZ";
      rec.onresult = (e: any) => sendPayload(e.results[0][0].transcript, undefined, image);
      rec.start();
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl">AI chat</h1>
      <p className="text-slate-400 text-sm mt-1">Xorazmiy · matn, ovoz va rasm · buyruq tegishli bo‘limga yoziladi</p>

      <div className="flex gap-2 mt-4 flex-wrap">
        {HINTS.map((h) => (
          <button
            key={h.label}
            className="px-3 py-1.5 rounded-full text-sm border border-line text-slate-300 hover:bg-white/5"
            onClick={() => sendPayload(h.q)}
          >
            {h.label}
          </button>
        ))}
      </div>

      <div className="mt-4 bg-panel/60 border border-line rounded-2xl p-4 md:p-5 space-y-3 min-h-[52vh] max-h-[60vh] overflow-y-auto">
        {msgs.map((m, i) => (
          <Bubble key={i} m={m} canPlan={canPlan} onOpen={(r) => nav(r)} />
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-black/20 border border-line rounded-2xl px-4 py-2 text-sm text-slate-400">Yozilmoqda…</div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={onSubmit} className="mt-4 bg-panel/60 border border-line rounded-2xl p-3 space-y-2">
        {image && (
          <div className="flex items-center gap-2 text-sm">
            <img src={preview} alt="" className="h-12 w-12 object-cover rounded-xl border border-line" />
            <span className="text-slate-400 truncate">{image.name}</span>
            <button type="button" className="text-rose-300 text-xs" onClick={() => setImage(null)}>
              Olib tashlash
            </button>
          </div>
        )}
        {recording && <p className="text-xs text-rose-300">Ovoz yozilmoqda… yana bosing</p>}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => setImage(e.target.files?.[0] || null)} />
        <div className="flex gap-2">
          <textarea
            className="flex-1 bg-panel border border-line rounded-xl px-4 py-3 min-h-[52px] resize-none"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendPayload(q, undefined, image);
              }
            }}
            placeholder="Savol yoki buyruq…"
            rows={2}
          />
        </div>
        <div className="flex gap-2">
          <button type="button" className="px-4 py-2 rounded-xl border border-line text-sm" onClick={() => fileRef.current?.click()}>
            Rasm
          </button>
          <button type="button" className={`px-4 py-2 rounded-xl border text-sm ${recording ? "bg-rose-600 border-rose-600" : "border-line"}`} onClick={toggleVoice}>
            {recording ? "To‘xta" : "Ovoz"}
          </button>
          <button className="ml-auto px-5 py-2 rounded-xl bg-violet-600 text-sm" disabled={loading}>
            {loading ? "…" : "Yuborish"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Bubble({ m, canPlan, onOpen }: { m: Msg; canPlan: boolean; onOpen: (r: string) => void }) {
  const mine = m.role === "user";
  const tools = [...new Set((m.data?.tools || []).map((t: string) => TOOL_LABEL[t] || t))];
  const offers = m.data?.data?.search_offers?.offers || m.data?.data?.offers?.offers;
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[85%]">
        <div
          className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap rounded-2xl ${
            mine ? "bg-violet-600 text-white" : "bg-black/20 border border-line"
          }`}
        >
          {m.image && <img src={m.image} alt="" className="mb-2 max-h-40 rounded-xl" />}
          {m.text}
        </div>
        {m.data?.transcript && <p className="mt-1 text-xs text-slate-500">Ovoz: {m.data.transcript}</p>}
        {offers && (
          <div className="mt-2 space-y-2">
            {offers.map((o: any) => (
              <div key={o.rank} className="rounded-xl border border-line bg-black/20 p-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="font-medium">
                    #{o.rank} {o.supplier}
                  </span>
                  <span className="text-emerald-400">{som(o.total)}</span>
                </div>
                <div className="text-xs text-slate-400">
                  {o.market} · tovar {som(o.goods)} + yetkazish {som(o.delivery)}
                </div>
              </div>
            ))}
          </div>
        )}
        {!mine && m.data && (
          <div className="mt-2 flex gap-2 flex-wrap">
            {tools.map((t: string) => (
              <span key={t} className="chip">
                {t}
              </span>
            ))}
            {(m.data.actions || []).map((a: any) => (
              <button key={a.route} className="px-3 py-1 rounded-lg bg-violet-600 text-xs" onClick={() => onOpen(a.route)}>
                {a.label}
              </button>
            ))}
            {canPlan && !m.data.actions?.length && (
              <>
                <button className="px-3 py-1 rounded-lg border border-line text-xs" onClick={() => onOpen("/plan")}>
                  Reja
                </button>
                <button className="px-3 py-1 rounded-lg border border-line text-xs" onClick={() => onOpen("/pulse")}>
                  Bozor pulsi
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
