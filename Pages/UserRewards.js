import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Gift, Users, TrendingUp, Send, Copy, Check, Mail, Building2, UserPlus } from "lucide-react";
import RedeemablePrizes from "../components/rewards/RedeemablePrizes";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function UserRewardsPage() {
  const [user, setUser] = useState(null);
  const [userInviteEmail, setUserInviteEmail] = useState("");
  const [businessInviteEmail, setBusinessInviteEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      // Generar código de referido si no existe
      if (!currentUser.referral_code) {
        const initials = (currentUser.full_name || currentUser.email)
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);
        const randomNum = Math.floor(100000 + Math.random() * 900000); // 6 dígitos
        const code = `${initials}${randomNum}`;
        await base44.auth.updateMe({ referral_code: code });
      }
    };
    loadUser();
  }, []);

  const { data: myRewardActions } = useQuery({
    queryKey: ['my-reward-actions', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.RewardAction.filter({ user_email: user.email }, '-created_date');
    },
    enabled: !!user,
    initialData: [],
  });

  const { data: myInvitations } = useQuery({
    queryKey: ['my-invitations', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.ReferralInvitation.filter({ referrer_email: user.email }, '-created_date');
    },
    enabled: !!user,
    initialData: [],
  });

  const sendInviteMutation = useMutation({
    mutationFn: async ({ email, type }) => {
      let code = user.referral_code;
      if (!code) {
        const initials = (user.full_name || user.email)
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);
        const randomNum = Math.floor(100000 + Math.random() * 900000);
        code = `${initials}${randomNum}`;
      }
      
      // Crear registro de invitación
      await base44.entities.ReferralInvitation.create({
        referrer_email: user.email,
        invited_email: email,
        invitation_type: type,
        referral_code: code,
        status: "sent"
      });

      // Enviar correo de invitación
      const isUser = type === 'user';
      await base44.integrations.Core.SendEmail({
        to: email,
        subject: isUser ? "🐾 Te invitan a unirte a Groomly" : "🏢 Oportunidad de negocio en Groomly",
        body: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #f8f5ff; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #7B68BE 0%, #5BA3C9 100%); color: white; padding: 40px; text-align: center;">
      <h1 style="margin: 0; font-size: 32px;">${isUser ? '🐾 ¡Te Invitan a Groomly!' : '🏢 Únete a Groomly'}</h1>
      <p style="margin: 10px 0 0 0; font-size: 18px;">${isUser ? 'La plataforma para el cuidado de mascotas' : 'Haz crecer tu negocio de mascotas'}</p>
    </div>
    <div style="padding: 40px;">
      <p style="font-size: 16px; line-height: 1.6;">Hola,</p>
      <p style="font-size: 16px; line-height: 1.6;">
        <strong>${user.display_name || user.full_name}</strong> te invita a ${isUser ? 'descubrir Groomly' : 'registrar tu negocio en Groomly'}.
      </p>
      
      ${isUser ? `
      <div style="background: #C8F4DE; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0; color: #2d5f3f;">🎁 ¡Recibe 50 Puntos de Bienvenida!</h3>
        <p style="margin: 0; color: #2d5f3f;">Solo por registrarte con este link</p>
      </div>
      
      <h3 style="color: #7B68BE; margin-top: 30px;">Con Groomly puedes:</h3>
      <ul style="color: #666; line-height: 1.8;">
        <li>🔍 Encontrar veterinarias, grooming, spa y más</li>
        <li>📅 Agendar citas fácilmente</li>
        <li>⭐ Leer reseñas de otros usuarios</li>
        <li>💎 Ganar puntos y canjear premios</li>
      </ul>
      ` : `
      <div style="background: #E6D9F5; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0; color: #5b4791;">💰 Beneficios para tu Negocio:</h3>
        <ul style="margin: 10px 0; padding-left: 20px; color: #5b4791;">
          <li>🌟 Mayor visibilidad</li>
          <li>📅 Sistema de citas 24/7</li>
          <li>📊 Panel de control completo</li>
          <li>⭐ Gestión de reseñas</li>
        </ul>
      </div>
      `}
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://groomlypet.base44.app/SelectUserType?ref=${code}" 
           style="display: inline-block; background: linear-gradient(135deg, #7B68BE 0%, #5BA3C9 100%); color: white; padding: 15px 40px; border-radius: 25px; text-decoration: none; font-weight: bold;">
          ${isUser ? 'Crear Mi Cuenta →' : 'Registrar Mi Negocio →'}
        </a>
      </div>
      
      <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
        Código de referido: <strong>${code}</strong>
      </p>
    </div>
    <div style="background: #f8f5ff; padding: 20px; text-align: center; color: #666; font-size: 14px;">
      <p>Groomly 🐾 - ${isUser ? 'Todo lo que tu mascota necesita' : 'La plataforma para negocios de mascotas'}</p>
    </div>
  </div>
</body>
</html>`
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['my-invitations'] });
      if (variables.type === 'user') {
        setUserInviteEmail("");
      } else {
        setBusinessInviteEmail("");
      }
      alert('¡Invitación enviada exitosamente!');
    },
  });

  const copyReferralLink = () => {
    const link = `https://groomlypet.base44.app/SelectUserType?ref=${user.referral_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tierInfo = {
    bronze: { name: "Bronce", icon: "🥉", minPoints: 0, color: "from-orange-200 to-orange-300" },
    silver: { name: "Plata", icon: "🥈", minPoints: 500, color: "from-gray-300 to-gray-400" },
    gold: { name: "Oro", icon: "🥇", minPoints: 1500, color: "from-yellow-300 to-yellow-400" },
    platinum: { name: "Platino", icon: "💎", minPoints: 3000, color: "from-purple-300 to-purple-400" }
  };

  if (!user) return null;

  const currentTier = tierInfo[user.reward_tier || 'bronze'];
  const currentPoints = user.reward_points || 0;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8">
          <span className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
            Mis Recompensas
          </span>
        </h1>

        {/* Resumen de Puntos */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className={`clay-card border-0 overflow-hidden md:col-span-2`}>
            <div className={`bg-gradient-to-br ${currentTier.color} p-8`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-6xl mb-2">{currentTier.icon}</div>
                  <h2 className="text-3xl font-bold text-white mb-1">Nivel {currentTier.name}</h2>
                  <p className="text-white/80">Has acumulado {currentPoints} puntos</p>
                </div>
                <div className="text-right">
                  <div className="text-5xl font-bold text-white">{currentPoints}</div>
                  <div className="text-white/80 text-sm">puntos totales</div>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="space-y-2">
                {Object.entries(tierInfo).map(([key, tier]) => {
                  const isUnlocked = currentPoints >= tier.minPoints;
                  const isCurrent = key === (user.reward_tier || 'bronze');
                  return (
                    <div key={key} className={`flex items-center justify-between p-3 rounded-[12px] ${isCurrent ? 'bg-gradient-to-r from-[#E6D9F5] to-[#C8F4DE]' : 'bg-gray-50'}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{tier.icon}</span>
                        <span className={`font-medium ${isCurrent ? 'text-[#7B68BE]' : ''}`}>{tier.name}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {isUnlocked ? '✓ Desbloqueado' : `${tier.minPoints} pts`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="clay-card border-0">
            <CardHeader>
              <CardTitle className="text-lg">Código de Referido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="clay-inset rounded-[16px] p-6 mb-3 text-center bg-gradient-to-br from-[#E6D9F5] to-[#C8F4DE]">
                <div className="text-xs text-gray-600 mb-2 font-medium">Tu código:</div>
                <div className="text-4xl font-bold text-[#7B68BE] tracking-wider font-mono">
                  {user.referral_code || 'Generando...'}
                </div>
              </div>
              <Button
                onClick={copyReferralLink}
                className="w-full clay-button rounded-[12px] bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] text-white"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    ¡Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Link
                  </>
                )}
              </Button>
              <p className="text-xs text-gray-500 mt-3 text-center">
                Comparte este link para invitar amigos y empresas
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue={window.location.hash === '#invite' ? 'invite' : 'history'} className="space-y-6">
          <TabsList className="clay-card rounded-[20px] p-2">
            <TabsTrigger value="history" className="rounded-[14px]">
              <Star className="w-4 h-4 mr-2" />
              Historial de Puntos
            </TabsTrigger>
            <TabsTrigger value="invite" className="rounded-[14px]">
              <Users className="w-4 h-4 mr-2" />
              Invitar Amigos
            </TabsTrigger>
            <TabsTrigger value="prizes" className="rounded-[14px]">
              <Gift className="w-4 h-4 mr-2" />
              Canjear Premios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history">
            <Card className="clay-card border-0">
              <CardHeader>
                <CardTitle>Historial de Puntos</CardTitle>
              </CardHeader>
              <CardContent>
                {myRewardActions.length === 0 ? (
                  <div className="text-center py-12">
                    <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">Aún no has ganado puntos</p>
                    <p className="text-sm text-gray-500 mt-2">Completa acciones para empezar a acumular</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myRewardActions.map((action) => (
                      <div key={action.id} className="clay-card rounded-[12px] p-4 bg-white flex items-center justify-between">
                        <div>
                          <div className="font-medium">{action.description || action.action_type}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(action.created_date).toLocaleDateString('es-GT', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                        <Badge className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-white font-bold">
                          +{action.points_earned}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invite">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Invitar Usuarios */}
              <Card className="clay-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-blue-600" />
                    Invitar Usuarios
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="clay-card rounded-[16px] p-4 bg-gradient-to-br from-blue-50 to-blue-100 text-center">
                    <div className="text-4xl mb-2">👤</div>
                    <Badge className="bg-blue-600 text-white text-lg px-4 py-1">
                      +150 puntos
                    </Badge>
                    <p className="text-xs text-gray-700 mt-2">
                      Por cada usuario que complete su primera cita
                    </p>
                  </div>

                  <div>
                    <Input
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={userInviteEmail}
                      onChange={(e) => setUserInviteEmail(e.target.value)}
                      className="clay-button rounded-[12px] mb-3"
                    />
                    <Button
                      onClick={() => sendInviteMutation.mutate({ email: userInviteEmail, type: 'user' })}
                      disabled={!userInviteEmail || sendInviteMutation.isPending}
                      className="w-full clay-button rounded-[12px] bg-blue-600 text-white"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Enviar Invitación
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Invitar Empresas */}
              <Card className="clay-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-purple-600" />
                    Invitar Empresas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="clay-card rounded-[16px] p-4 bg-gradient-to-br from-purple-50 to-purple-100 text-center">
                    <div className="text-4xl mb-2">🏢</div>
                    <Badge className="bg-purple-600 text-white text-lg px-4 py-1">
                      +250 puntos
                    </Badge>
                    <p className="text-xs text-gray-700 mt-2">
                      Por cada empresa que complete su perfil
                    </p>
                  </div>

                  <div>
                    <Input
                      type="email"
                      placeholder="empresa@ejemplo.com"
                      value={businessInviteEmail}
                      onChange={(e) => setBusinessInviteEmail(e.target.value)}
                      className="clay-button rounded-[12px] mb-3"
                    />
                    <Button
                      onClick={() => sendInviteMutation.mutate({ email: businessInviteEmail, type: 'business' })}
                      disabled={!businessInviteEmail || sendInviteMutation.isPending}
                      className="w-full clay-button rounded-[12px] bg-purple-600 text-white"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Enviar Invitación
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Invitaciones Enviadas */}
            {myInvitations.length > 0 && (
              <Card className="clay-card border-0 mt-6">
                <CardHeader>
                  <CardTitle>Mis Invitaciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {myInvitations.map((inv) => (
                      <div key={inv.id} className="clay-card rounded-[12px] p-4 bg-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{inv.invitation_type === 'user' ? '👤' : '🏢'}</div>
                          <div>
                            <div className="font-medium">{inv.invited_email}</div>
                            <div className="text-sm text-gray-500">
                              {new Date(inv.created_date).toLocaleDateString('es-GT')}
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
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="prizes">
            <RedeemablePrizes user={user} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}