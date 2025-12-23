import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, Lock, CheckCircle, AlertCircle } from "lucide-react";
import UserBadge from "./UserBadge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

export default function RedeemablePrizes({ user }) {
    const queryClient = useQueryClient();
    const [selectedReward, setSelectedReward] = useState(null);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

    const { data: rewards } = useQuery({
        queryKey: ['redeemable-rewards'],
        queryFn: async () => {
            return await base44.entities.RedeemableReward.filter({ is_active: true }, 'sort_order');
        },
        initialData: [],
    });

    const { data: myRedemptions } = useQuery({
        queryKey: ['my-redemptions', user?.email],
        queryFn: async () => {
            if (!user) return [];
            return await base44.entities.RewardRedemption.filter({
                user_email: user.email,
                status: 'active'
            });
        },
        enabled: !!user,
        initialData: [],
    });

    const redeemMutation = useMutation({
        mutationFn: async (reward) => {
            // Crear el registro de canje
            const expiresAt = reward.duration_days
                ? new Date(Date.now() + reward.duration_days * 24 * 60 * 60 * 1000).toISOString()
                : null;

            await base44.entities.RewardRedemption.create({
                user_email: user.email,
                reward_type: 'platform_reward',
                reward_id: reward.id,
                reward_name: reward.reward_name,
                points_spent: reward.points_required,
                status: 'active',
                expires_at: expiresAt
            });

            // Actualizar puntos del usuario
            await base44.auth.updateMe({
                reward_points: (user.reward_points || 0) - reward.points_required
            });

            // Si es un badge, agregarlo a active_badges
            if (reward.reward_type === 'badge') {
                const badges = user.active_badges || [];
                await base44.auth.updateMe({
                    active_badges: [...badges, reward.icon]
                });
            }

            // Enviar correo de confirmación
            await base44.integrations.Core.SendEmail({
                to: user.email,
                subject: "✅ ¡Premio Canjeado Exitosamente!",
                body: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #f8f5ff; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); color: white; padding: 40px; text-align: center;">
      <h1 style="margin: 0; font-size: 32px;">${reward.icon} ¡Premio Canjeado!</h1>
    </div>
    <div style="padding: 40px;">
      <h2 style="color: #7B68BE;">${reward.reward_name}</h2>
      <p style="font-size: 16px; line-height: 1.6; color: #666;">
        ${reward.description}
      </p>
      
      <div style="background: #E6D9F5; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0; color: #5b4791;">
          <strong>Puntos utilizados:</strong> ${reward.points_required} puntos<br>
          <strong>Puntos restantes:</strong> ${(user.reward_points || 0) - reward.points_required} puntos
        </p>
        ${reward.duration_days ? `<p style="margin: 10px 0 0 0; color: #5b4791;"><strong>Válido por:</strong> ${reward.duration_days} días</p>` : ''}
      </div>
      
      <p style="color: #666;">
        Este beneficio ya está activo en tu cuenta. ${reward.reward_type === 'badge' ? 'Puedes verlo en tu perfil.' : ''}
      </p>
    </div>
    <div style="background: #f8f5ff; padding: 20px; text-align: center; color: #666; font-size: 14px;">
      <p>Groomly 🐾 - Gracias por ser parte de nuestro sistema de recompensas</p>
    </div>
  </div>
</body>
</html>`
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-redemptions'] });
            window.location.reload(); // Recargar para actualizar puntos
        },
    });

    const tierLevels = {
        bronze: 0,
        silver: 1,
        gold: 2,
        platinum: 3
    };

    const canRedeem = (reward) => {
        const userTierLevel = tierLevels[user?.reward_tier || 'bronze'];
        const rewardTierLevel = tierLevels[reward.min_tier];
        const hasEnoughPoints = (user?.reward_points || 0) >= reward.points_required;
        const meetsLevel = userTierLevel >= rewardTierLevel;

        return hasEnoughPoints && meetsLevel;
    };

    const handleRedeem = (reward) => {
        setSelectedReward(reward);
        setConfirmDialogOpen(true);
    };

    const confirmRedeem = () => {
        if (selectedReward) {
            redeemMutation.mutate(selectedReward);
            setConfirmDialogOpen(false);
            setSelectedReward(null);
        }
    };

    const groupedRewards = {
        badge: rewards.filter(r => r.reward_type === 'badge'),
        feature: rewards.filter(r => r.reward_type === 'feature'),
        priority: rewards.filter(r => r.reward_type === 'priority'),
        upgrade: rewards.filter(r => r.reward_type === 'upgrade'),
        vip: rewards.filter(r => r.reward_type === 'vip'),
        exclusive: rewards.filter(r => r.reward_type === 'exclusive')
    };

    const typeLabels = {
        badge: "Badges & Distintivos",
        feature: "Funciones Especiales",
        priority: "Prioridad & Reservas",
        upgrade: "Upgrades",
        vip: "Experiencias VIP",
        exclusive: "Exclusivos Platino"
    };

    return (
        <div className="space-y-8">
            {/* Mis Canjes Activos */}
            {myRedemptions.length > 0 && (
                <Card className="clay-card border-0">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            Mis Canjes Activos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {myRedemptions.map((redemption) => (
                                <div key={redemption.id} className="clay-card rounded-[12px] p-4 bg-gradient-to-r from-green-50 to-green-100">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-bold">{redemption.reward_name}</div>
                                            {redemption.expires_at && (
                                                <div className="text-sm text-gray-600">
                                                    Expira: {new Date(redemption.expires_at).toLocaleDateString('es-GT')}
                                                </div>
                                            )}
                                        </div>
                                        <Badge className="bg-green-600 text-white">ACTIVO</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Premios por Categoría */}
            {Object.entries(groupedRewards).map(([type, items]) => (
                items.length > 0 && (
                    <Card key={type} className="clay-card border-0">
                        <CardHeader>
                            <CardTitle>{typeLabels[type]}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {items.map((reward) => {
                                    const isLocked = !canRedeem(reward);
                                    const needsHigherTier = tierLevels[user?.reward_tier || 'bronze'] < tierLevels[reward.min_tier];
                                    const needsPoints = (user?.reward_points || 0) < reward.points_required;

                                    return (
                                        <div
                                            key={reward.id}
                                            className={`clay-card rounded-[16px] p-6 ${isLocked ? 'opacity-60' : 'hover:scale-105'} transition-all`}
                                        >
                                            <div className="text-center mb-4">
                                                <div className="text-5xl mb-3">{reward.icon}</div>
                                                <h4 className="font-bold mb-2">{reward.reward_name}</h4>
                                                <p className="text-xs text-gray-600 mb-3">{reward.description}</p>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-600">Costo:</span>
                                                    <Badge className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-white">
                                                        {reward.points_required} pts
                                                    </Badge>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-600">Nivel:</span>
                                                    <UserBadge tier={reward.min_tier} size="sm" />
                                                </div>

                                                {reward.duration_days && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm text-gray-600">Duración:</span>
                                                        <Badge variant="outline" className="text-xs">
                                                            {reward.duration_days} días
                                                        </Badge>
                                                    </div>
                                                )}
                                            </div>

                                            <Button
                                                onClick={() => handleRedeem(reward)}
                                                disabled={isLocked || redeemMutation.isPending}
                                                className={`w-full mt-4 clay-button rounded-[12px] ${isLocked
                                                        ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                                        : 'bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] text-white'
                                                    }`}
                                            >
                                                {needsHigherTier ? (
                                                    <>
                                                        <Lock className="w-4 h-4 mr-2" />
                                                        Nivel {reward.min_tier}
                                                    </>
                                                ) : needsPoints ? (
                                                    <>
                                                        <Lock className="w-4 h-4 mr-2" />
                                                        Faltan {reward.points_required - (user?.reward_points || 0)} pts
                                                    </>
                                                ) : (
                                                    <>
                                                        <Gift className="w-4 h-4 mr-2" />
                                                        Canjear
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )
            ))}

            {/* Confirm Dialog */}
            <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
                <DialogContent className="clay-card">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">Confirmar Canje</DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de que deseas canjear este premio?
                        </DialogDescription>
                    </DialogHeader>
                    {selectedReward && (
                        <div className="py-4">
                            <div className="text-center mb-4">
                                <div className="text-6xl mb-3">{selectedReward.icon}</div>
                                <h3 className="font-bold text-xl">{selectedReward.reward_name}</h3>
                                <p className="text-sm text-gray-600 mt-2">{selectedReward.description}</p>
                            </div>
                            <div className="clay-inset rounded-[12px] p-4 bg-gray-50">
                                <div className="flex justify-between mb-2">
                                    <span>Puntos a usar:</span>
                                    <span className="font-bold text-[#FFD700]">-{selectedReward.points_required}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Puntos restantes:</span>
                                    <span className="font-bold">{(user?.reward_points || 0) - selectedReward.points_required}</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setConfirmDialogOpen(false);
                                setSelectedReward(null);
                            }}
                            className="clay-button rounded-[12px]"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={confirmRedeem}
                            disabled={redeemMutation.isPending}
                            className="clay-button rounded-[12px] bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] text-white"
                        >
                            {redeemMutation.isPending ? 'Canjeando...' : 'Confirmar Canje'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}