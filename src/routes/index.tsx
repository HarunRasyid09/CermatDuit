import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Menu, MessageSquare, PanelLeftClose, PanelLeftOpen, Plus, SendHorizontal, Sparkles, X } from "lucide-react";
import { sendToAssistant } from "@/lib/assistant";
import { ChatMarkdown } from "@/components/chat-markdown";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CermatDuit — Asisten Literasi Keuangan Pribadi" },
      { name: "description", content: "Tanya apa saja seputar keuangan pribadi bersama CermatDuit." },
      { property: "og:title", content: "CermatDuit" },
      { property: "og:description", content: "Asisten Literasi Keuangan Pribadi" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

type Msg = { role: "user" | "assistant"; content: string };
type Thread = { id: string; title: string; messages: Msg[]; updatedAt: number };
const KEY = "cermatduit.threads";
const GREETING = "Halo! Saya CermatDuit. Ada yang ingin kamu tanyakan seputar keuangan pribadi?";
const newThread = (): Thread => ({ id: crypto.randomUUID(), title: "Chat Baru", messages: [], updatedAt: Date.now() });

function Logo({ size = "h-12 w-12 text-lg" }: { size?: string }) {
  return <div className={`grid shrink-0 place-items-center rounded-full bg-brand font-semibold text-primary-foreground ${size}`}>Rp</div>;
}
function Brand({ className = "" }: { className?: string }) {
  return <span className={`font-medium text-foreground ${className}`}>Cermat<span className="text-brand">Duit</span></span>;
}

function Index() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeId, setActiveId] = useState("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let list: Thread[] = [];
    try { list = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { /* ignore */ }
    if (!list.length) list = [newThread()];
    setThreads(list);
    setActiveId(list[0]?.id ?? "");
  }, []);

  const save = (list: Thread[]) => { setThreads(list); localStorage.setItem(KEY, JSON.stringify(list)); };
  const active = threads.find((t) => t.id === activeId);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [active?.messages.length, loading]);

  const startNew = () => {
    const empty = threads.find((t) => !t.messages.length);
    if (empty) setActiveId(empty.id);
    else { const t = newThread(); save([t, ...threads]); setActiveId(t.id); }
    setError(""); setMobileOpen(false); inputRef.current?.focus();
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading || !active) return;
    const id = active.id;
    const msgs: Msg[] = [...active.messages, { role: "user", content: text }];
    let list = threads.map((t) => t.id === id ? { ...t, messages: msgs, title: t.messages.length ? t.title : text.slice(0, 40), updatedAt: Date.now() } : t);
    save(list); setInput(""); setError(""); setLoading(true);
    try {
      const reply = await sendToAssistant(text, id);
      list = list.map((t) => t.id === id ? { ...t, messages: [...msgs, { role: "assistant", content: reply }] } : t);
      save(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim pesan.");
    } finally { setLoading(false); inputRef.current?.focus(); }
  };

  const sidebar = (
    <div className="flex h-full flex-col bg-background">
      <div className="flex h-[86px] items-center justify-between border-b border-border px-5">
        <div className="flex items-center gap-4"><Logo /><Brand className="text-2xl" /></div>
        <button aria-label="Sembunyikan sidebar" className="hidden text-muted-foreground hover:text-foreground md:block" onClick={() => setCollapsed(true)}><PanelLeftClose className="h-5 w-5" /></button>
        <button aria-label="Tutup menu" className="text-muted-foreground md:hidden" onClick={() => setMobileOpen(false)}><X className="h-5 w-5" /></button>
      </div>
      <div className="p-4">
        <button onClick={startNew} className="flex w-full items-center gap-3 rounded-full bg-brand px-7 py-3.5 text-lg text-primary-foreground shadow-sm transition hover:opacity-90"><Plus className="h-5 w-5" />Chat Baru</button>
      </div>
      <p className="px-7 pb-3 pt-4 text-sm font-medium tracking-wider text-muted-foreground">RIWAYAT PERCAKAPAN</p>
      <nav className="flex-1 space-y-1 overflow-y-auto px-4">
        {threads.filter((t) => t.messages.length).map((t) => (
          <button key={t.id} onClick={() => { setActiveId(t.id); setMobileOpen(false); }}
            className={`flex w-full items-center gap-4 rounded-2xl px-5 py-5 text-left text-lg transition ${t.id === activeId ? "bg-brand-soft font-medium text-brand" : "text-foreground hover:bg-chat-bg"}`}>
            <MessageSquare className="h-5 w-5 shrink-0" /><span className="truncate">{t.title}</span>
          </button>
        ))}
      </nav>
      <div className="border-t border-border py-5 text-center text-muted-foreground">Asisten Literasi Keuangan Pribadi</div>
    </div>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {!collapsed && <aside className="hidden w-[430px] shrink-0 border-r border-border md:block">{sidebar}</aside>}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-foreground/30" onClick={() => setMobileOpen(false)} />
          <aside className="relative h-full w-[85%] max-w-sm shadow-xl">{sidebar}</aside>
        </div>
      )}
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[86px] shrink-0 items-center justify-between border-b border-border px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <button aria-label="Buka menu" className="text-muted-foreground md:hidden" onClick={() => setMobileOpen(true)}><Menu className="h-6 w-6" /></button>
            {collapsed && <button aria-label="Tampilkan sidebar" className="hidden text-muted-foreground md:block" onClick={() => setCollapsed(false)}><PanelLeftOpen className="h-5 w-5" /></button>}
            <Logo size="h-14 w-14 text-xl" />
            <div className="min-w-0"><Brand className="block text-3xl leading-tight" /><p className="truncate text-muted-foreground">Asisten Literasi Keuangan Pribadi</p></div>
          </div>
          <div className="grid h-12 w-14 shrink-0 place-items-center rounded-full border border-border text-brand shadow-sm"><Sparkles className="h-5 w-5" /></div>
        </header>
        <div className="flex-1 overflow-y-auto bg-chat-bg">
          <div className="mx-auto flex max-w-[1104px] flex-col gap-6 px-4 py-9">
            <div className="max-w-[85%] self-start rounded-3xl border border-border bg-background px-6 py-5 text-lg shadow-sm">{GREETING}</div>
            {active?.messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] px-6 py-5 text-lg shadow-sm ${
                  m.role === "user"
                    ? "self-end whitespace-pre-wrap break-words rounded-3xl bg-brand text-primary-foreground"
                    : "self-start min-w-0 rounded-3xl border border-border bg-background"
                }`}
              >
                {m.role === "user" ? m.content : <ChatMarkdown>{m.content}</ChatMarkdown>}
              </div>
            ))}
            {loading && <div className="self-start rounded-3xl border border-border bg-background px-6 py-5 text-muted-foreground shadow-sm">Sedang mengetik…</div>}
            {error && <div className="self-start rounded-2xl bg-destructive/10 px-5 py-3 text-destructive">{error}</div>}
            <div ref={endRef} />
          </div>
        </div>
        <form onSubmit={send} className="shrink-0 border-t border-border bg-background">
          <div className="mx-auto flex max-w-[1104px] gap-3 px-4 py-5">
            <input ref={inputRef} autoFocus value={input} onChange={(e) => setInput(e.target.value)} placeholder="Tulis pertanyaanmu tentang keuangan pribadi..."
              className="min-w-0 flex-1 rounded-full border border-border bg-chat-bg px-6 py-4 text-lg outline-none placeholder:text-muted-foreground focus:border-brand" />
            <button type="submit" aria-label="Kirim" disabled={!input.trim() || loading}
              className="grid h-[66px] w-[66px] shrink-0 place-items-center rounded-full bg-brand text-primary-foreground transition disabled:opacity-50"><SendHorizontal className="h-6 w-6" /></button>
          </div>
        </form>
      </main>
    </div>
  );
}
