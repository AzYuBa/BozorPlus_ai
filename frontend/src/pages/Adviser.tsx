import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api, som, type Instrument } from "../lib/api";

type Msg = { role: "user" | "assistant"; content: string };

const PROMPTS = [
  "Un narxi ko‘tarilsa, oylik rejamni qanday moslashtiraman?",
  "500 kg un uchun xarid strategiyasi bering.",
  "Hozir qaysi mahsulotda kutish kerak?",
  "Kichik do‘kon uchun 1 haftalik xarid rejasini tuzing.",
];

export default function Adviser() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const scroller = useRef<HTMLDivElement>(null);

  const statusQ = useQuery({
    queryKey: ["ai-status"],
    queryFn: () => api<{ configured: boolean; model: string }>("/api/v1/ai/status/"),
  });

  const instrumentsQ = useQuery({
    queryKey: ["instruments"],
    queryFn: () => api<{ instruments: Instrument[] }>("/api/v1/market/instruments/"),
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    setErr("");
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setBusy(true);
    try {
      const res = await api<{ reply: string }>("/api/v1/ai/chat/", {
        method: "POST",
        body: JSON.stringify({
          message: q,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      setMessages([...next, { role: "assistant", content: res.reply }]);
    } catch (ex: any) {
      setErr(ex.message || "AI javob bermadi");
      setMessages(next);
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send(input);
  }

  const configured = statusQ.data?.configured;
  const list = instrumentsQ.data?.instruments?.slice(0, 5) || [];

  return (
    <div className="ai-console">
      <aside className="ai-rail">
        <div className="ai-rail-head">
          <span className="ai-pill">AI TERMINAL</span>
          <h2>Hamroh</h2>
          <p>Bozor proxy narxlari + OpenAI maslahat.</p>
        </div>

        <div className={`ai-status ${configured ? "on" : "off"}`}>
          <span className="ai-status-dot" />
          <div>
            <b>{configured ? "ONLINE" : "KALIT YO‘Q"}</b>
            <small>{statusQ.data?.model || "gpt-4o-mini"}</small>
          </div>
        </div>

        <div className="ai-rail-block">
          <span>KONTEKST</span>
          <div className="ai-pulse-list">
            {list.map((p) => (
              <div key={p.slug} className="ai-pulse-row">
                <b>{p.code}</b>
                <span>{som(p.price).replace(" so'm", "")}</span>
                <em className={p.change_pct >= 0 ? "up" : "down"}>
                  {p.change_pct >= 0 ? "+" : ""}
                  {p.change_pct.toFixed(1)}%
                </em>
              </div>
            ))}
            {!list.length ? <small className="muted">Narxlar yuklanmoqda…</small> : null}
          </div>
        </div>

        <div className="ai-rail-block">
          <span>TEZKOR</span>
          <div className="ai-prompt-stack">
            {PROMPTS.map((p) => (
              <button key={p} type="button" disabled={busy || configured === false} onClick={() => void send(p)}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <Link className="ai-rail-link" to="/">
          ← Bozor terminaliga
        </Link>
      </aside>

      <section className="ai-stage">
        <header className="ai-stage-head">
          <div>
            <div className="terminal-eyebrow">
              OPENAI <span>/ BOZOR KONTEKSTI</span>
            </div>
            <h1>
              AI <i>hamroh.</i>
            </h1>
          </div>
          <button
            type="button"
            className="ai-clear"
            disabled={!messages.length || busy}
            onClick={() => {
              setMessages([]);
              setErr("");
            }}
          >
            Tozalash
          </button>
        </header>

        {configured === false ? (
          <div className="notice">OPENAI_API_KEY backend/.env da topilmadi. Serverni qayta ishga tushiring.</div>
        ) : null}

        <div className="ai-chat" ref={scroller}>
          {!messages.length ? (
            <div className="ai-empty">
              <div className="ai-empty-mark">✦</div>
              <h2>Savolingizni yozing.</h2>
              <p>Narx, xarid miqdori, biznes reja yoki soliq — bozor kontekstida javob beradi.</p>
              <div className="ai-chip-row">
                {PROMPTS.slice(0, 3).map((p) => (
                  <button key={p} type="button" disabled={busy || configured === false} onClick={() => void send(p)}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="ai-thread">
              {messages.map((m, i) => (
                <article key={i} className={`ai-msg ${m.role}`}>
                  <div className="ai-msg-meta">
                    <span className="ai-msg-who">{m.role === "assistant" ? "BP AI" : "SIZ"}</span>
                  </div>
                  <div className="ai-msg-body">{m.content}</div>
                </article>
              ))}
              {busy ? (
                <article className="ai-msg assistant typing">
                  <div className="ai-msg-meta">
                    <span className="ai-msg-who">BP AI</span>
                  </div>
                  <div className="ai-msg-body">
                    <span className="ai-dots">
                      <i />
                      <i />
                      <i />
                    </span>
                  </div>
                </article>
              ) : null}
            </div>
          )}
        </div>

        {err ? <p className="form-error ai-err">{err}</p> : null}

        <form className="ai-composer" onSubmit={onSubmit}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Masalan: Un 500 kg uchun eng yaxshi vaqt qachon?"
            disabled={busy || configured === false}
            aria-label="Savol"
          />
          <button type="submit" disabled={busy || !input.trim() || configured === false}>
            {busy ? "…" : "Yuborish"}
          </button>
        </form>
      </section>
    </div>
  );
}
