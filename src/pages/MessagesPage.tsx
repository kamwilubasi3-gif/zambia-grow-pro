import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { MessageSquare, Send, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface Msg {
  id: string;
  user_id: string;
  sender: string;
  body: string;
  read: boolean;
  created_at: string;
}

interface Contact {
  id: string;
  name: string;
  phone: string;
  province: string | null;
  district: string | null;
}

const MessagesPage = () => {
  const { user, isAdmin, profile } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [contacts, setContacts] = useState<Record<string, Contact>>({});
  const [active, setActive] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const { data, error } = await supabase
      .from("support_messages")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) {
      toast.error(error.message);
    } else {
      setMessages((data as Msg[]) || []);
      if (isAdmin) {
        const ids = Array.from(new Set((data as Msg[]).map((m) => m.user_id)));
        if (ids.length) {
          const { data: profs } = await supabase
            .from("profiles")
            .select("id,name,phone,province,district")
            .in("id", ids);
          const map: Record<string, Contact> = {};
          (profs as Contact[] | null)?.forEach((p) => { map[p.id] = p; });
          setContacts(map);
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("support-messages")
      .on("postgres_changes", { event: "*", schema: "public", table: "support_messages" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [isAdmin]);

  const threads = useMemo(() => {
    const map = new Map<string, Msg[]>();
    messages.forEach((m) => {
      const list = map.get(m.user_id) || [];
      list.push(m);
      map.set(m.user_id, list);
    });
    return Array.from(map.entries()).sort(
      (a, b) =>
        new Date(b[1][b[1].length - 1].created_at).getTime() -
        new Date(a[1][a[1].length - 1].created_at).getTime(),
    );
  }, [messages]);

  const thread = isAdmin
    ? messages.filter((m) => m.user_id === active)
    : messages;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread.length]);

  const send = async () => {
    const body = text.trim();
    if (!body || !user) return;
    const targetUser = isAdmin ? active : user.id;
    if (!targetUser) return;
    setSending(true);
    const { error } = await supabase.from("support_messages").insert({
      user_id: targetUser,
      sender: isAdmin ? "admin" : "user",
      body,
    });
    setSending(false);
    if (error) return toast.error(error.message);
    setText("");
    load();
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  // Admin inbox list
  if (isAdmin && !active) {
    return (
      <div className="px-4 pt-6 pb-24 space-y-3 max-w-3xl mx-auto animate-slide-up">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Messages</h1>
        </div>
        {threads.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">No farmer messages yet.</p>
        ) : (
          threads.map(([uid, msgs]) => {
            const c = contacts[uid];
            const last = msgs[msgs.length - 1];
            const unread = msgs.filter((m) => m.sender === "user" && !m.read).length;
            return (
              <button
                key={uid}
                onClick={() => setActive(uid)}
                className="w-full glass-card rounded-xl p-4 text-left space-y-1"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm text-foreground">{c?.name || "Farmer"}</p>
                  {unread > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground">
                      {unread} new
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {c?.phone} · {c?.district ? `${c.district}, ${c.province}` : "Location not set"}
                </p>
                <p className="text-xs text-foreground/80 truncate">{last.body}</p>
              </button>
            );
          })
        )}
      </div>
    );
  }

  const activeContact = active ? contacts[active] : null;

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto w-full">
      <div className="px-4 pt-6 pb-3 flex items-center gap-2 border-b border-border">
        {isAdmin && (
          <button onClick={() => setActive(null)} className="p-1 -ml-1 rounded hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <MessageSquare className="w-5 h-5 text-primary" />
        <div>
          <h1 className="text-base font-bold text-foreground">
            {isAdmin ? activeContact?.name || "Farmer" : "Help & Support"}
          </h1>
          <p className="text-[11px] text-muted-foreground">
            {isAdmin
              ? `${activeContact?.phone ?? ""} · ${activeContact?.district ? `${activeContact.district}, ${activeContact.province}` : "Location not set"}`
              : `${profile?.name ?? ""} · ${profile?.phone ?? ""}`}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {thread.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-10">
            {isAdmin ? "No messages in this chat." : "Type your problem below and our team will reply here."}
          </p>
        )}
        {thread.map((m) => {
          const mine = isAdmin ? m.sender === "admin" : m.sender === "user";
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  mine ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                }`}
              >
                <p className="whitespace-pre-wrap">{m.body}</p>
                <p className="text-[10px] opacity-70 mt-1">
                  {new Date(m.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="p-3 border-t border-border flex items-end gap-2 bg-background">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
          }}
          rows={1}
          placeholder="Write your message..."
          className="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm max-h-32"
        />
        <button
          onClick={send}
          disabled={sending || !text.trim()}
          className="h-10 w-10 rounded-lg gradient-hero flex items-center justify-center disabled:opacity-50"
          aria-label="Send message"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin text-primary-foreground" /> : <Send className="w-4 h-4 text-primary-foreground" />}
        </button>
      </div>
    </div>
  );
};

export default MessagesPage;
