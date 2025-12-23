import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

export default function NotificationBell({ user }) {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data: notifications } = useQuery({
        queryKey: ['user-notifications', user?.email],
        queryFn: async () => {
            if (!user) return [];

            const allNotifs = await base44.entities.PushNotification.filter(
                {},
                '-created_date',
                100
            );

            return allNotifs.filter(notif => {
                if (notif.target_type === "all_users") return true;
                if (notif.target_type === "business_owners" && user.user_type === "business") return true;
                if (notif.target_type === "specific_user" && notif.target_email === user.email) return true;
                return false;
            });
        },
        enabled: !!user,
        initialData: [],
        refetchInterval: 30000, // Refrescar cada 30 segundos
    });

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const markAsReadMutation = useMutation({
        mutationFn: (notificationId) =>
            base44.entities.PushNotification.update(notificationId, { is_read: true }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
        },
    });

    const handleNotificationClick = (notification) => {
        if (!notification.is_read) {
            markAsReadMutation.mutate(notification.id);
        }
        if (notification.link_url) {
            window.location.href = notification.link_url;
        }
    };

    const markAllAsRead = () => {
        const unread = notifications.filter(n => !n.is_read);
        unread.forEach(n => markAsReadMutation.mutate(n.id));
    };

    const typeIcons = {
        appointment: "📅",
        promotion: "🎉",
        system: "🔔",
        reminder: "⏰",
        review: "⭐"
    };

    const typeColors = {
        appointment: "from-blue-500 to-blue-600",
        promotion: "from-purple-500 to-purple-600",
        system: "from-gray-500 to-gray-600",
        reminder: "from-yellow-500 to-yellow-600",
        review: "from-yellow-400 to-orange-500"
    };

    if (!user) return null;

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative clay-button rounded-full">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </SheetTrigger>

            <SheetContent className="w-full sm:max-w-md">
                <SheetHeader>
                    <div className="flex items-center justify-between">
                        <SheetTitle>Notificaciones</SheetTitle>
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={markAllAsRead}
                                className="text-xs"
                            >
                                Marcar todas como leídas
                            </Button>
                        )}
                    </div>
                </SheetHeader>

                <div className="mt-6 space-y-3 max-h-[calc(100vh-120px)] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="text-center py-12">
                            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No tienes notificaciones</p>
                        </div>
                    ) : (
                        notifications.map((notif) => (
                            <button
                                key={notif.id}
                                onClick={() => handleNotificationClick(notif)}
                                className={`w-full text-left clay-card rounded-[16px] p-4 transition-all ${!notif.is_read ? 'bg-gradient-to-br from-[#E6D9F5] to-[#F8F5FF]' : 'bg-white'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${typeColors[notif.notification_type] || typeColors.system} flex items-center justify-center text-xl flex-shrink-0`}>
                                        {typeIcons[notif.notification_type] || "🔔"}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="font-bold text-sm truncate">{notif.title}</h4>
                                            {!notif.is_read && (
                                                <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 ml-2" />
                                            )}
                                        </div>

                                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                            {notif.message}
                                        </p>

                                        <p className="text-xs text-gray-400">
                                            {notif.created_date && format(new Date(notif.created_date), "dd MMM, HH:mm", { locale: es })}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}

// Export helper to get unread count for mobile indicator
export function useUnreadNotifications(user) {
    const { data: notifications } = useQuery({
        queryKey: ['user-notifications', user?.email],
        queryFn: async () => {
            if (!user) return [];
            const allNotifs = await base44.entities.PushNotification.filter({}, '-created_date', 100);
            return allNotifs.filter(notif => {
                if (notif.target_type === "all_users") return true;
                if (notif.target_type === "business_owners" && user.user_type === "business") return true;
                if (notif.target_type === "specific_user" && notif.target_email === user.email) return true;
                return false;
            });
        },
        enabled: !!user,
        initialData: [],
        refetchInterval: 30000,
    });

    return notifications.filter(n => !n.is_read).length;
}