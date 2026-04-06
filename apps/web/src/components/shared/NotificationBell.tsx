"use client";

import { useState, useEffect } from "react";
import { Bell, ShieldAlert, Award, Send, LayoutTemplate, Zap } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { useSession } from "next-auth/react";

// Initialize Supabase Client dynamically for client-side
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mock-supabase.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "mock-key";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Notification = {
  id: string;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
  metadata?: any;
};

export default function NotificationBell() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([
    {
       id: "mock-1",
       type: "post_published",
       message: "A new LinkedIn post was published autonomously.",
       read: false,
       created_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
       id: "mock-2",
       type: "lead_milestone",
       message: "We've discovered 50 new highly-qualified leads.",
       read: true,
       created_at: new Date(Date.now() - 86400000).toISOString()
    }
  ]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!session?.user?.id || supabaseUrl.includes("mock-supabase.supabase.co")) return;
    
    // Fetch initial unread count or last 10 notifications
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", session.user!.id)
        .order("created_at", { ascending: false })
        .limit(10);
        
      if (data) {
        setNotifications(data);
      }
    };
    
    fetchNotifications();

    // Subscribe to realtime updates
    const channel = supabase.channel('custom-all-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${session.user.id}` },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev].slice(0, 10));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = async () => {
    // Optimistic update
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    
    if (session?.user?.id && !supabaseUrl.includes("mock-supabase.supabase.co")) {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", session.user.id)
        .eq("read", false);
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'quota_warning': return <ShieldAlert className="text-amber-400" size={16}/>;
      case 'post_published': return <Send className="text-green-400" size={16}/>;
      case 'lead_milestone': return <Award className="text-blue-400" size={16}/>;
      case 'subscription_event': return <LayoutTemplate className="text-purple-400" size={16}/>;
      default: return <Zap className="text-[var(--text-secondary)]" size={16}/>;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-[var(--text-muted)] hover:text-white transition rounded-xl hover:bg-white/5"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-[var(--bg-base)]"></span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-80 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[#111114]">
              <h3 className="font-serif text-white flex items-center gap-2">
                Notifications
                {unreadCount > 0 && <span className="bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] text-xs px-2 py-0.5 rounded-full font-sans">{unreadCount} new</span>}
              </h3>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] hover:text-white transition">Mark Read</button>
              )}
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-sm text-[var(--text-muted)]">No recent notifications.</div>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {notifications.map(n => (
                    <div key={n.id} className={`p-4 flex gap-3 hover:bg-white/5 transition ${!n.read ? 'bg-white/[0.02]' : ''}`}>
                      <div className="mt-0.5">{getIcon(n.type)}</div>
                      <div className="flex-1">
                        <p className={`text-sm ${!n.read ? 'text-white' : 'text-[var(--text-secondary)]'}`}>{n.message}</p>
                        <p className="text-[10px] text-[var(--text-muted)] mt-1 uppercase tracking-wider">
                          {new Date(n.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                      </div>
                      {!n.read && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
