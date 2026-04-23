import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Send, MessageCircle, Instagram, Facebook, ArrowLeft, CornerUpLeft, MessageSquare, AtSign } from "lucide-react";
import { useStore } from "@/hooks/use-store";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Conversation {
  id: string;
  store_id: string;
  platform: string;
  source: "dm" | "story_reply" | "comment" | "story_mention";
  customer_psid: string;
  customer_name: string;
  customer_profile_pic: string | null;
  status: "active" | "needs_human" | "resolved";
  last_message_at: string;
  last_message_preview: string;
  unread_count: number;
}

interface Message {
  id: string;
  conversation_id: string;
  direction: "in" | "out";
  sender: "customer" | "ai" | "human";
  text: string;
  attachments: any;
  created_at: string;
  detected_language: string | null;
  confidence_score: number | null;
}

const sourceMeta = {
  dm: { label: "DM", icon: MessageCircle },
  story_reply: { label: "Story reply", icon: CornerUpLeft },
  comment: { label: "Comment", icon: MessageSquare },
  story_mention: { label: "Mention", icon: AtSign },
};

export default function DashboardInbox() {
  const { store } = useStore();
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [filter, setFilter] = useState<"all" | "needs_human" | "dm" | "story_reply" | "comment">("all");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load conversations
  useEffect(() => {
    if (!store) return;
    (async () => {
      const { data } = await supabase
        .from("chatbot_conversations")
        .select("*")
        .eq("store_id", store.id)
        .order("last_message_at", { ascending: false });
      setConvs((data ?? []) as any);
      setLoading(false);
    })();

    // realtime
    const channel = supabase
      .channel("inbox-conv")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chatbot_conversations", filter: `store_id=eq.${store.id}` },
        () => {
          supabase
            .from("chatbot_conversations")
            .select("*")
            .eq("store_id", store.id)
            .order("last_message_at", { ascending: false })
            .then(({ data }) => setConvs((data ?? []) as any));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [store]);

  // Load messages for active conv
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("chatbot_messages")
        .select("*")
        .eq("conversation_id", activeId)
        .order("created_at");
      setMessages((data ?? []) as any);
      // mark read
      await supabase.from("chatbot_conversations").update({ unread_count: 0 }).eq("id", activeId);
    })();

    const channel = supabase
      .channel(`inbox-msg-${activeId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chatbot_messages", filter: `conversation_id=eq.${activeId}` },
        (payload) => setMessages((m) => [...m, payload.new as any]),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const filtered = useMemo(() => {
    if (filter === "all") return convs;
    if (filter === "needs_human") return convs.filter((c) => c.status === "needs_human");
    return convs.filter((c) => c.source === filter);
  }, [convs, filter]);

  const active = convs.find((c) => c.id === activeId) ?? null;

  const sendHuman = async () => {
    if (!reply.trim() || !active) return;
    setSending(true);
    const { error } = await supabase.from("chatbot_messages").insert({
      conversation_id: active.id,
      direction: "out",
      sender: "human",
      text: reply.trim(),
    });
    if (!error) {
      await supabase
        .from("chatbot_conversations")
        .update({ status: "active", last_message_at: new Date().toISOString(), last_message_preview: reply.trim().slice(0, 100) })
        .eq("id", active.id);
      setReply("");
    } else {
      toast.error(error.message);
    }
    setSending(false);
  };

  const markResolved = async () => {
    if (!active) return;
    await supabase.from("chatbot_conversations").update({ status: "resolved" }).eq("id", active.id);
    toast.success("Marked resolved");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="-m-4 sm:-m-6 md:-m-8">
      <div className="grid grid-cols-1 md:grid-cols-[340px_1fr] h-[calc(100vh-3.5rem)] md:h-screen">
        {/* List */}
        <aside className={cn(
          "border-r border-border bg-card flex flex-col",
          activeId && "hidden md:flex",
        )}>
          <div className="p-4 border-b border-border">
            <h1 className="text-lg font-heading font-bold mb-3">Inbox</h1>
            <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="needs_human">Needs Human</TabsTrigger>
                <TabsTrigger value="comment">Comments</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex-1 overflow-auto">
            {filtered.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">No conversations yet.</div>
            )}
            {filtered.map((c) => {
              const Icon = sourceMeta[c.source]?.icon ?? MessageCircle;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={cn(
                    "w-full text-left p-3 border-b border-border hover:bg-muted/50 transition-colors",
                    activeId === c.id && "bg-muted",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                      {(c.customer_name || c.customer_psid).slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm truncate">{c.customer_name || c.customer_psid}</span>
                        {c.unread_count > 0 && (
                          <Badge variant="default" className="h-5 px-1.5 text-[10px]">{c.unread_count}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{c.last_message_preview}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        {c.platform === "instagram" ? <Instagram className="h-3 w-3 text-muted-foreground" /> : <Facebook className="h-3 w-3 text-muted-foreground" />}
                        <Icon className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">{sourceMeta[c.source]?.label}</span>
                        {c.status === "needs_human" && <Badge variant="destructive" className="h-4 px-1 text-[9px]">Needs Human</Badge>}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Thread */}
        <section className={cn("flex flex-col bg-background", !activeId && "hidden md:flex")}>
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
              Select a conversation
            </div>
          ) : (
            <>
              <div className="border-b border-border p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setActiveId(null)}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <h2 className="font-semibold text-sm">{active.customer_name || active.customer_psid}</h2>
                    <p className="text-xs text-muted-foreground">{sourceMeta[active.source]?.label} · {active.platform}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={markResolved}>Mark resolved</Button>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-auto p-4 space-y-3">
                {messages.map((m) => (
                  <div key={m.id} className={cn("flex", m.direction === "out" ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[75%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap",
                      m.direction === "out"
                        ? m.sender === "ai" ? "bg-primary/10 text-foreground" : "bg-primary text-primary-foreground"
                        : "bg-muted",
                    )}>
                      {m.text}
                      {(m.attachments as any[])?.map?.((a, i) => a.url && (
                        <img key={i} src={a.url} alt="" className="mt-2 rounded-lg max-w-full" />
                      ))}
                      <div className="text-[10px] mt-1 opacity-70">
                        {m.sender === "ai" && "🤖 AI · "}
                        {m.sender === "human" && "👤 You · "}
                        {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border p-3 flex gap-2">
                <Input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendHuman()}
                  placeholder="Take over and reply…"
                />
                <Button onClick={sendHuman} disabled={sending || !reply.trim()}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
