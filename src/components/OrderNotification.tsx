import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/use-store";
import { ShoppingBag, Check, X } from "lucide-react";

interface IncomingOrder {
  id: string;
  customer_name: string;
  customer_email: string;
  amount: number;
  created_at: string;
  product_id: string;
}

export default function OrderNotification() {
  const { store } = useStore();
  const [orders, setOrders] = useState<IncomingOrder[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const alarmIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const startAlarm = useCallback(() => {
    stopAlarm();
    try {
      const ctx = new AudioContext();
      audioContextRef.current = ctx;

      const playTone = () => {
        if (!audioContextRef.current) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = "sine";
        const now = ctx.currentTime;

        // Pleasant two-tone chime pattern
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1100, now + 0.15);
        osc.frequency.setValueAtTime(880, now + 0.3);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
        gain.gain.setValueAtTime(0.3, now + 0.25);
        gain.gain.linearRampToValueAtTime(0, now + 0.5);

        osc.start(now);
        osc.stop(now + 0.5);
        oscillatorRef.current = osc;
        gainRef.current = gain;
      };

      playTone();
      alarmIntervalRef.current = setInterval(playTone, 2000);
    } catch (e) {
      console.error("Audio failed:", e);
    }
  }, []);

  const stopAlarm = useCallback(() => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  }, []);

  const handleAccept = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  const handleDecline = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  // Stop alarm when no orders left
  useEffect(() => {
    if (orders.length === 0) stopAlarm();
  }, [orders, stopAlarm]);

  // Show browser notification
  const showBrowserNotification = useCallback((order: IncomingOrder) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("🛒 New Order!", {
        body: `${order.customer_name} — $${order.amount}`,
        icon: "/pwa-192x192.png",
        tag: order.id,
      });
    }
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Subscribe to realtime orders
  useEffect(() => {
    if (!store?.id) return;

    const channel = supabase
      .channel("new-orders")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `store_id=eq.${store.id}`,
        },
        (payload) => {
          const newOrder = payload.new as IncomingOrder;
          setOrders((prev) => [...prev, newOrder]);
          startAlarm();
          showBrowserNotification(newOrder);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      stopAlarm();
    };
  }, [store?.id, startAlarm, stopAlarm, showBrowserNotification]);

  if (orders.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 max-w-sm w-full">
      {orders.map((order) => (
        <div
          key={order.id}
          className="bg-card border border-border rounded-2xl shadow-2xl p-5 animate-slideInRight"
        >
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-bold text-sm text-foreground">
                New Order! 🎉
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {order.customer_name}
              </p>
              <p className="font-heading font-bold text-lg text-primary mt-1">
                ${Number(order.amount).toFixed(2)}
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => handleAccept(order.id)}
              className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground font-heading font-semibold text-sm flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-[0.97] transition-all"
            >
              <Check className="w-4 h-4" />
              Accept
            </button>
            <button
              onClick={() => handleDecline(order.id)}
              className="flex-1 h-10 rounded-xl bg-muted text-muted-foreground font-heading font-semibold text-sm flex items-center justify-center gap-1.5 hover:bg-muted/80 active:scale-[0.97] transition-all"
            >
              <X className="w-4 h-4" />
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
