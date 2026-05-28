"use client";

import React, { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Bell, Check, Calendar, CreditCard, Info, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getPusherClient } from "@/lib/pusher";
import { getUnreadNotifications, markAsRead } from "@/actions/notifications";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export default function NotificationBell({ userId }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    // Load unread notifications on mount
    async function loadNotifications() {
      const res = await getUnreadNotifications(userId);
      if (res.success) {
        // Map backend Date objects or strings to standard JS Date
        const mapped = res.notifications.map((n) => ({
          ...n,
          createdAt: new Date(n.createdAt),
        }));
        setNotifications(mapped);
        setUnreadCount(mapped.length);
      }
    }
    loadNotifications();

    // Connect to Pusher client
    const pusher = getPusherClient();
    if (!pusher) return;

    const channelName = `user-${userId}`;
    const channel = pusher.subscribe(channelName);

    channel.bind("new-notification", (newNotification) => {
      // Append to local state in real-time
      setNotifications((prev) => [
        {
          ...newNotification,
          createdAt: new Date(newNotification.createdAt),
        },
        ...prev,
      ]);
      setUnreadCount((count) => count + 1);
      toast("New notification received!", {
        description: newNotification.message,
        icon: <Bell className="h-4 w-4 text-sky-500" />,
      });
    });

    return () => {
      channel.unbind("new-notification");
      pusher.unsubscribe(channelName);
    };
  }, [userId]);

  const handleMarkRead = async (id) => {
    try {
      const res = await markAsRead(id);
      if (res.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        setUnreadCount((count) => Math.max(0, count - 1));
        toast.success("Notification marked as read");
      }
    } catch (err) {
      toast.error("Failed to mark notification as read");
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "APPOINTMENT":
        return <Calendar className="h-4 w-4 text-sky-500" />;
      case "PAYOUT":
        return <CreditCard className="h-4 w-4 text-emerald-500" />;
      case "REMINDER":
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      default:
        return <Info className="h-4 w-4 text-slate-400" />;
    }
  };

  if (!userId) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full h-9 w-9 border border-border bg-background/50 hover:bg-muted text-foreground flex items-center justify-center transition-all shrink-0 focus-visible:ring-1 focus-visible:ring-sky-500"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white leading-none shadow-sm shadow-red-500/20">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 sm:w-96 bg-card/95 backdrop-blur-xl border border-border shadow-xl rounded-2xl p-2 z-[100]"
      >
        <DropdownMenuLabel className="px-3 py-2 flex items-center justify-between text-foreground">
          <span className="font-bold text-sm">Notifications</span>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="bg-sky-500/10 text-sky-500 hover:bg-sky-500/15 border-sky-500/20 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
              {unreadCount} Unread
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/60" />
        <div className="max-h-[300px] overflow-y-auto space-y-1.5 py-1.5 px-1 scrollbar-thin">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-xs italic">
              No new notifications. You are all caught up!
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex items-start gap-3 p-2.5 rounded-xl bg-background/40 hover:bg-muted/50 border border-transparent hover:border-border/50 transition-all cursor-default focus:bg-muted/50 focus:text-foreground text-foreground"
                onSelect={(e) => e.preventDefault()}
              >
                <div className="p-2 rounded-xl bg-muted/60 border border-border shrink-0 mt-0.5">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-xs text-foreground font-semibold leading-relaxed break-words">
                    {notification.message}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleMarkRead(notification.id)}
                  className="h-7 w-7 rounded-lg text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 shrink-0 self-center"
                  title="Mark as read"
                >
                  <Check className="h-4 w-4" />
                </Button>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
