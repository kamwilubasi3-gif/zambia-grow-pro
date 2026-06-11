import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface AppUser {
  name: string;
  phone: string;
  isAdmin?: boolean;
  paid?: boolean;
  paidAt?: string; // ISO date
  signedUpAt?: string;
}

const ADMIN_NAME = "Blessed";
const ADMIN_PHONE = "0974867566";
const ADMIN_PASSWORD = "admin"; // simple password for admin login
const USERS_KEY = "tf_users";
const SESSION_KEY = "tf_session";
const NOTIF_BROADCAST_KEY = "tf_broadcast";

export const SUBSCRIPTION_DAYS = 30;

interface AuthState {
  user: AppUser | null;
  login: (name: string, phone: string, password?: string) => { ok: boolean; error?: string };
  signup: (name: string, phone: string) => { ok: boolean; error?: string };
  markPaid: () => void;
  logout: () => void;
  listUsers: () => AppUser[];
  updateUser: (phone: string, patch: Partial<AppUser>) => void;
  daysLeft: (u: AppUser) => number;
}

const AuthContext = createContext<AuthState | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

const loadUsers = (): AppUser[] => {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || "[]"); } catch { return []; }
};
const saveUsers = (u: AppUser[]) => localStorage.setItem(USERS_KEY, JSON.stringify(u));

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(() => {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); } catch { return null; }
  });

  useEffect(() => {
    if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    else localStorage.removeItem(SESSION_KEY);
  }, [user]);

  const daysLeft = (u: AppUser): number => {
    if (!u.paidAt) return 0;
    const ms = new Date(u.paidAt).getTime() + SUBSCRIPTION_DAYS * 86400000 - Date.now();
    return Math.max(0, Math.ceil(ms / 86400000));
  };

  const signup = (name: string, phone: string) => {
    name = name.trim();
    phone = phone.trim();
    if (!name || !phone) return { ok: false, error: "Name and phone required" };
    if (!/^0?9[5-7]\d{7}$/.test(phone)) return { ok: false, error: "Enter a valid Zambian number (e.g. 0971234567)" };
    if (name.toLowerCase() === ADMIN_NAME.toLowerCase()) return { ok: false, error: "Name reserved" };
    const users = loadUsers();
    if (users.find((u) => u.phone === phone)) return { ok: false, error: "Phone already registered. Please login." };
    const newUser: AppUser = { name, phone, paid: false, signedUpAt: new Date().toISOString() };
    users.push(newUser);
    saveUsers(users);
    setUser(newUser);
    return { ok: true };
  };

  const login = (name: string, phone: string, password?: string) => {
    name = name.trim();
    phone = phone.trim();
    if (name === ADMIN_NAME && phone === ADMIN_PHONE) {
      if (password !== ADMIN_PASSWORD) return { ok: false, error: "Admin password incorrect (hint: admin)" };
      const admin: AppUser = { name: ADMIN_NAME, phone: ADMIN_PHONE, isAdmin: true, paid: true, paidAt: new Date().toISOString() };
      setUser(admin);
      return { ok: true };
    }
    const users = loadUsers();
    const found = users.find((u) => u.phone === phone && u.name.toLowerCase() === name.toLowerCase());
    if (!found) return { ok: false, error: "User not found. Please sign up." };
    setUser(found);
    return { ok: true };
  };

  const markPaid = () => {
    if (!user) return;
    const updated: AppUser = { ...user, paid: true, paidAt: new Date().toISOString() };
    setUser(updated);
    if (!user.isAdmin) {
      const users = loadUsers();
      const idx = users.findIndex((u) => u.phone === user.phone);
      if (idx >= 0) { users[idx] = updated; saveUsers(users); }
    }
  };

  const updateUser = (phone: string, patch: Partial<AppUser>) => {
    const users = loadUsers();
    const idx = users.findIndex((u) => u.phone === phone);
    if (idx >= 0) { users[idx] = { ...users[idx], ...patch }; saveUsers(users); }
  };

  const logout = () => setUser(null);

  const listUsers = () => loadUsers();

  return (
    <AuthContext.Provider value={{ user, login, signup, markPaid, logout, listUsers, updateUser, daysLeft }}>
      {children}
    </AuthContext.Provider>
  );
};

export const broadcastNotification = (title: string, message: string) => {
  const item = { id: Date.now().toString(), title, message, timestamp: new Date().toISOString() };
  const existing = JSON.parse(localStorage.getItem(NOTIF_BROADCAST_KEY) || "[]");
  existing.unshift(item);
  localStorage.setItem(NOTIF_BROADCAST_KEY, JSON.stringify(existing.slice(0, 50)));
  window.dispatchEvent(new CustomEvent("tf-broadcast", { detail: item }));
};

export const readBroadcasts = () => {
  try { return JSON.parse(localStorage.getItem(NOTIF_BROADCAST_KEY) || "[]"); } catch { return []; }
};
