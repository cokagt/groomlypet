import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Users, TrendingUp, Mail, ArrowLeft, Building2, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AdminRewardsPage() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      if (currentUser.user_type !== 'admin') {
        navigate(createPageUrl("Home"));
        return;
      }
      setUser(currentUser);
    };
    loadUser();
  }, []);

  const { data: allUsers } = useQuery({
    queryKey: ['all-users-rewards'],
    queryFn: async () => {
      return await base44.entities.User.list('-reward_points');
    },
    enabled: !!user,
    initialData: [],
  });

  const { data: allInvitations } = useQuery({
    queryKey: ['all-invitations'],
    queryFn: async () => {
      return await base44.entities.ReferralInvitation.list('-created_date');
    },
    enabled: !!user,
    initialData: [],
  });

  const { data: rewardActions } = useQuery({
    queryKey: ['all-reward-actions'],
    queryFn: async () => {
      return await base44.entities.RewardAction.list('-created_date', 100);
    },
    enabled: !!user,
    initialData: [],
  });

  if (!user) return null;

  const filteredUsers = allUsers.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const petOwners = allUsers.filter(u => u.user_type === 'pet_owner');
  const totalPoints = petOwners.reduce((sum, u) => sum + (u.reward_points || 0), 0);
  const avgPoints = petOwners.length > 0 ? Math.round(totalPoints / petOwners.length) : 0;

  const tierInfo = {
    bronze: { name: "Bronce", icon: "🥉" },
    silver: { name: "Plata", icon: "🥈" },
    gold: { name: "Oro", icon: "🥇" },
    platinum: { name: "Platino", icon: "💎" }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("Profile"))}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-4xl font-bold">
              <span className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
                Sistema de Recompensas
              </span>
            </h1>
            <p className="text-gray-600">Administración de puntos y referidos</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="clay-card border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-[#7B68BE]" />
                <Star className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="text-3xl font-bold">{petOwners.length}</div>
              <div className="text-sm text-gray-600">Usuarios con Puntos</div>
            </CardContent>
          </Card>

          <Card className="clay-card border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-3xl font-bold">{totalPoints.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Puntos Totales</div>
            </CardContent>
          </Card>

          <Card className="clay-card border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Star className="w-8 h-8 text-yellow-500" />
              </div>
              <div className="text-3xl font-bold">{avgPoints}</div>
              <div className="text-sm text-gray-600">Promedio por Usuario</div>
            </CardContent>
          </Card>

          <Card className="clay-card border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              <div className="text-3xl font-bold">{allInvitations.length}</div>
              <div className="text-sm text-gray-600">Invitaciones Enviadas</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="clay-card rounded-[20px] p-2">
            <TabsTrigger value="users" className="rounded-[14px]">
              <Users className="w-4 h-4 mr-2" />
              Usuarios
            </TabsTrigger>
            <TabsTrigger value="invitations" className="rounded-[14px]">
              <Mail className="w-4 h-4 mr-2" />
              Invitaciones
            </TabsTrigger>
            <TabsTrigger value="actions" className="rounded-[14px]">
              <TrendingUp className="w-4 h-4 mr-2" />
              Actividad Reciente
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="clay-card border-0">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Usuarios y Puntos</CardTitle>
                  <Input
                    placeholder="Buscar usuario..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="clay-button rounded-[12px] max-w-xs"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredUsers.filter(u => u.user_type === 'pet_owner').map((usr) => (
                    <div key={usr.id} className="clay-card rounded-[12px] p-4 bg-white flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-3xl">{tierInfo[usr.reward_tier || 'bronze']?.icon}</div>
                        <div>
                          <div className="font-medium">{usr.full_name}</div>
                          <div className="text-sm text-gray-500">{usr.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-bold text-xl">{usr.reward_points || 0}</div>
                          <div className="text-xs text-gray-500">puntos</div>
                        </div>
                        <Badge className={
                          usr.reward_tier === 'platinum' ? 'bg-purple-600 text-white' :
                          usr.reward_tier === 'gold' ? 'bg-yellow-600 text-white' :
                          usr.reward_tier === 'silver' ? 'bg-gray-500 text-white' :
                          'bg-orange-600 text-white'
                        }>
                          {tierInfo[usr.reward_tier || 'bronze']?.name}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invitations">
            <Card className="clay-card border-0">
              <CardHeader>
                <CardTitle>Seguimiento de Invitaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {allInvitations.map((inv) => (
                    <div key={inv.id} className="clay-card rounded-[12px] p-4 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">
                            {inv.invitation_type === 'user' ? '👤' : '🏢'}
                          </div>
                          <div>
                            <div className="font-medium">{inv.invited_email}</div>
                            <div className="text-sm text-gray-500">
                              Invitado por: {inv.referrer_email}
                            </div>
                          </div>
                        </div>
                        <Badge className={
                          inv.status === 'completed' ? 'bg-green-100 text-green-800' :
                          inv.status === 'registered' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {inv.status === 'completed' ? '✓ Completado' :
                           inv.status === 'registered' ? 'Registrado' :
                           'Enviado'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>Código: {inv.referral_code}</span>
                        <span>{new Date(inv.created_date).toLocaleDateString('es-GT')}</span>
                      </div>
                      {inv.status === 'sent' && inv.invitation_type === 'business' && (
                        <div className="mt-3 p-3 bg-yellow-50 rounded-[8px] text-sm">
                          💡 <strong>Pendiente de seguimiento</strong> - Contactar a la empresa para más información
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions">
            <Card className="clay-card border-0">
              <CardHeader>
                <CardTitle>Actividad Reciente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {rewardActions.map((action) => (
                    <div key={action.id} className="clay-card rounded-[12px] p-4 bg-white flex items-center justify-between">
                      <div>
                        <div className="font-medium">{action.user_email}</div>
                        <div className="text-sm text-gray-600">{action.description || action.action_type}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(action.created_date).toLocaleDateString('es-GT', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <Badge className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-white font-bold">
                        +{action.points_earned}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}