import React from "react";
import { Badge } from "@/components/ui/badge";
import { Crown, Star, Award, Zap } from "lucide-react";

export default function UserBadge({ tier, size = "md", showLabel = true }) {
    const tierConfig = {
        bronze: {
            icon: "🥉",
            name: "Bronce",
            color: "from-orange-200 to-orange-300",
            textColor: "text-orange-800"
        },
        silver: {
            icon: "🥈",
            name: "Plata",
            color: "from-gray-300 to-gray-400",
            textColor: "text-gray-800"
        },
        gold: {
            icon: "🥇",
            name: "Oro",
            color: "from-yellow-300 to-yellow-400",
            textColor: "text-yellow-900"
        },
        platinum: {
            icon: "💎",
            name: "Platino",
            color: "from-purple-300 to-purple-400",
            textColor: "text-purple-900"
        }
    };

    const config = tierConfig[tier] || tierConfig.bronze;

    const sizeClasses = {
        sm: "text-xs px-2 py-0.5",
        md: "text-sm px-3 py-1",
        lg: "text-base px-4 py-1.5"
    };

    return (
        <Badge className={`bg-gradient-to-r ${config.color} ${config.textColor} ${sizeClasses[size]} font-bold border-0`}>
            <span className="mr-1">{config.icon}</span>
            {showLabel && config.name}
        </Badge>
    );
}

export function UserBadgeCard({ user }) {
    const tierConfig = {
        bronze: { icon: "🥉", name: "Bronce", color: "from-orange-200 to-orange-300" },
        silver: { icon: "🥈", name: "Plata", color: "from-gray-300 to-gray-400" },
        gold: { icon: "🥇", name: "Oro", color: "from-yellow-300 to-yellow-400" },
        platinum: { icon: "💎", name: "Platino", color: "from-purple-300 to-purple-400" }
    };

    const config = tierConfig[user?.reward_tier || 'bronze'];

    return (
        <div className={`clay-card rounded-[16px] p-6 bg-gradient-to-br ${config.color} text-center`}>
            <div className="text-6xl mb-2">{config.icon}</div>
            <div className="text-2xl font-bold text-white mb-1">{config.name}</div>
            <div className="text-white text-sm">{user?.reward_points || 0} puntos</div>
            {user?.active_badges && user.active_badges.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1 justify-center">
                    {user.active_badges.map((badge, idx) => (
                        <span key={idx} className="text-2xl">{badge}</span>
                    ))}
                </div>
            )}
        </div>
    );
}