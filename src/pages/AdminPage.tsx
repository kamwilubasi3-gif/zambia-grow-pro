import { useEffect, useState } from "react";
import { useAuth, broadcastNotification, SUBSCRIPTION_DAYS } from "@/context/AuthContext";
import { Users, Send, LogOut, Shield } from "lucide-react";

const AdminPage = () => {
  const { user, listUsers, logout } = useAuth();
  const [users, setUsers] = useState(listUsers());
  const [title, setTitle] = useState("");
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const i = setInterval(() => setUsers(listUsers()), 3000);
    return () => clearInterval(i);
  }, []);

  if (!user?.isAdmin) {
    return <div className="p-8 text-center text-muted-foreground">Admin only.</div>;
  }

  const daysLeft = (paidAt?: string) => {
    if (!paidAt) return 0;
    const ms = new Date(paidAt).getTime() + SUBSCRIPTION_DAYS * 86400000 - Date.now();
    return Math.max(0, Math.ceil(ms / 86400000));
  };

  const send = () => {
    if (!title.trim() || !msg.trim()) return;
    broadcastNotification(title, msg);
    setTitle(""); setMsg(""); setSent(true);
    setTimeout(() => setSent(false), 2000);
  };

  const dueCount = users.filter((u) => u.paid && daysLeft(u.paidAt) <= 3).length;
  const activeCount = users.filter((u) => u.paid && daysLeft(u.paidAt) > 0).length;

  return (
    <div className="px-4 pt-6 pb-10 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
        </div>
        <button onClick={logout} className="text-xs text-destructive flex items-center gap-1">
          <LogOut className="w-3 h-3" /> Logout
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-card border rounded-xl p-3 text-center">
          <p className="text-2xl font-bold">{users.length}</p>
          <p className="text-[10px] text-muted-foreground">TOTAL USERS</p>
        </div>
        <div className="bg-card border rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-primary">{activeCount}</p>
          <p className="text-[10px] text-muted-foreground">ACTIVE SUBS</p>
        </div>
        <div className="bg-card border rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-destructive">{dueCount}</p>
          <p className="text-[10px] text-muted-foreground">DUE SOON</p>
        </div>
      </div>

      <div className="bg-card border rounded-xl p-4 space-y-2">
        <h2 className="font-semibold flex items-center gap-2"><Send className="w-4 h-4" /> Broadcast Notification</h2>
        <input
          className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          placeholder="Message to all users"
          rows={3}
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
        />
        <button onClick={send} className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-medium">
          {sent ? "✓ Sent" : "Send to All"}
        </button>
      </div>

      <div className="bg-card border rounded-xl p-4">
        <h2 className="font-semibold flex items-center gap-2 mb-3"><Users className="w-4 h-4" /> Real-time Users</h2>
        {users.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No users yet.</p>
        ) : (
          <div className="space-y-2">
            {users.map((u) => {
              const days = daysLeft(u.paidAt);
              return (
                <div key={u.phone} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.phone}</p>
                  </div>
                  <div className="text-right">
                    {u.paid ? (
                      <>
                        <p className={`text-sm font-bold ${days <= 3 ? "text-destructive" : "text-primary"}`}>
                          {days}d left
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          paid {new Date(u.paidAt!).toLocaleDateString()}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-warning">Unpaid</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <p className="text-[10px] text-muted-foreground text-center mt-3">Auto-refreshes every 3s</p>
      </div>
    </div>
  );
};

export default AdminPage;
