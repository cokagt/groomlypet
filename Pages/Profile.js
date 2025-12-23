import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Phone, Mail, Save, Star, LogOut, Bell, BookOpen, Users, Gift } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import MyReviews from "../components/profile/MyReviews";
import NotificationBell from "../components/notifications/NotificationBell";
import UserBadge from "../components/rewards/UserBadge";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    display_name: "",
    phone: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setFormData({
        display_name: currentUser.display_name || "",
        phone: currentUser.phone || ""
      });
    };
    loadUser();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Verificar si es la primera vez que completa el perfil
      const isFirstTimeComplete = !user.display_name && !user.phone && 
                                   formData.display_name && formData.phone;
      
      await base44.auth.updateMe(formData);
      
      // Dar puntos solo la primera vez que completa el perfil
      if (isFirstTimeComplete) {
        const pointsToAdd = 50;
        const currentPoints = user.reward_points || 0;
        const lifetimePoints = user.total_lifetime_points || 0;
        
        await base44.auth.updateMe({
          reward_points: currentPoints + pointsToAdd,
          total_lifetime_points: lifetimePoints + pointsToAdd
        });
        
        await base44.entities.RewardAction.create({
          user_email: user.email,
          action_type: 'complete_profile',
          points_earned: pointsToAdd,
          description: 'Completaste tu perfil'
        });
        
        window.location.reload();
      }
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      alert("Error al guardar los cambios");
    }
    setIsSaving(false);
  };

  const handleLogout = () => {
    base44.auth.logout(createPageUrl("Home"));
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Cargando...</div>
      </div>
    );
  }

  const userTypeLabels = {
    pet_owner: "Dueño de Mascota",
    business: "Empresa",
    admin: "Administrador"
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl("Home")}>
            <Button variant="outline" size="icon" className="clay-button rounded-[16px]">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              <span className="bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] bg-clip-text text-transparent">
                Mi Perfil
              </span>
            </h1>
            <p className="text-gray-600">Configura tu cuenta</p>
          </div>
        </div>

        {/* User Info Card */}
        <Card className="clay-card border-0 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#E6D9F5] to-[#C7E9F8] clay-card flex items-center justify-center">
                <User className="w-8 h-8 text-[#7B68BE]" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{user.full_name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] text-white">
                    {userTypeLabels[user.user_type] || "Usuario"}
                  </Badge>
                  {user.loyalty_stars > 0 && (
                    <Badge className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-white">
                      <Star className="w-3 h-3 mr-1 fill-white" />
                      {user.loyalty_stars} estrellas
                    </Badge>
                  )}
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="clay-inset rounded-[12px] p-4 bg-gray-50">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Mail className="w-4 h-4" />
                  Email
                </div>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Contact Info */}
        <Card className="clay-card border-0 mb-6">
          <CardHeader>
            <CardTitle>Información de Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nombre para mostrar</Label>
              <div className="relative mt-2">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  className="clay-button rounded-[16px] pl-10"
                  placeholder="Tu nombre"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Este nombre aparecerá en tus reservaciones</p>
            </div>

            <div>
              <Label>Teléfono</Label>
              <div className="relative mt-2">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="clay-button rounded-[16px] pl-10"
                  placeholder="+502 1234 5678"
                />
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full clay-button rounded-[16px] bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar Cambios'}
            </Button>
          </CardContent>
        </Card>

        {/* Notificaciones - Link para móvil */}
        <Card className="clay-card border-0 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#7B68BE]" />
              Notificaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Ver todas tus notificaciones</p>
              <NotificationBell user={user} />
            </div>
          </CardContent>
        </Card>

        {/* Admin Features */}
        {user.user_type === 'admin' && (
          <>
            <Card className="clay-card border-0 mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#7B68BE]" />
                  Blog
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">Administra los artículos del blog</p>
                  <Link to={createPageUrl("ManageBlog")}>
                    <Button variant="outline" className="clay-button rounded-[12px]">
                      Gestionar Blog
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="clay-card border-0 mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-[#7B68BE]" />
                  Plantillas de Correo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">Edita los correos del sistema</p>
                  <Link to={createPageUrl("AdminEmailTemplates")}>
                    <Button variant="outline" className="clay-button rounded-[12px]">
                      Gestionar Correos
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="clay-card border-0 mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Sistema de Recompensas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">Administra puntos y referidos</p>
                  <Link to={createPageUrl("AdminRewards")}>
                    <Button variant="outline" className="clay-button rounded-[12px]">
                      Ver Recompensas
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* User Rewards */}
        {user.user_type === 'pet_owner' && (
          <>
            {/* Sistema de Recompensas Unificado */}
            <Card className="clay-card border-0 mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  Mi Sistema de Recompensas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Badge/Medalla Actual */}
                <div className="mb-6 text-center clay-card rounded-[16px] p-6 bg-gradient-to-br from-[#E6D9F5] to-[#C8F4DE]">
                  <UserBadge tier={user.reward_tier || 'bronze'} size="lg" showName={true} />
                  <p className="text-sm text-gray-600 mt-3">Tu nivel actual</p>
                </div>

                {/* Puntos */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="clay-inset rounded-[12px] p-4 bg-gray-50 text-center">
                    <div className="text-3xl font-bold bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
                      {user.reward_points || 0}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Puntos disponibles</p>
                  </div>
                  <div className="clay-inset rounded-[12px] p-4 bg-gray-50 text-center">
                    <div className="text-3xl font-bold text-[#7B68BE]">
                      {user.total_lifetime_points || 0}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Puntos totales</p>
                  </div>
                </div>

                {/* Progreso al siguiente nivel */}
                <div className="clay-inset rounded-[12px] p-4 bg-gray-50 mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">Progreso al siguiente nivel</span>
                    <span className="text-gray-600">
                      {(() => {
                        const lifetime = user.total_lifetime_points || 0;
                        if (lifetime >= 2000) return 'Nivel máximo alcanzado! 🎉';
                        if (lifetime >= 1000) return `${2000 - lifetime} pts para Platino`;
                        if (lifetime >= 500) return `${1000 - lifetime} pts para Oro`;
                        return `${500 - lifetime} pts para Plata`;
                      })()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] h-2 rounded-full transition-all"
                      style={{ 
                        width: `${(() => {
                          const lifetime = user.total_lifetime_points || 0;
                          if (lifetime >= 2000) return 100;
                          if (lifetime >= 1000) return ((lifetime - 1000) / 1000) * 100;
                          if (lifetime >= 500) return ((lifetime - 500) / 500) * 100;
                          return (lifetime / 500) * 100;
                        })()}%` 
                      }}
                    />
                  </div>
                </div>

                {/* Estrellas de Lealtad */}
                <div className="clay-card rounded-[12px] p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-yellow-700">⭐ Estrellas de Lealtad</div>
                      <p className="text-xs text-yellow-600">1 por cada reseña</p>
                    </div>
                    <div className="text-2xl font-bold text-yellow-700">
                      {user.loyalty_stars || 0}
                    </div>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="space-y-2">
                  <Link to={createPageUrl("UserRewards")}>
                    <Button className="w-full clay-button rounded-[16px] bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-white">
                      <Gift className="w-4 h-4 mr-2" />
                      Canjear Premios
                    </Button>
                  </Link>
                  <Link to={createPageUrl("RewardsInfo")}>
                    <Button variant="outline" className="w-full clay-button rounded-[16px]">
                      Ver Cómo Ganar Más Puntos
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Invitar Amigos */}
            <Card className="clay-card border-0 mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#7B68BE]" />
                  Invitar y Ganar Puntos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="clay-card rounded-[12px] p-4 bg-gradient-to-r from-blue-50 to-blue-100">
                    <div className="font-medium">👤 Invitar Usuarios</div>
                    <div className="text-xs text-gray-600">+150 puntos por referido</div>
                  </div>

                  <div className="clay-card rounded-[12px] p-4 bg-gradient-to-r from-purple-50 to-purple-100">
                    <div className="font-medium">🏢 Invitar Empresas</div>
                    <div className="text-xs text-gray-600">+250 puntos por referido</div>
                  </div>

                  <Link to={createPageUrl("UserRewards") + "#invite"}>
                    <Button variant="outline" className="clay-button rounded-[12px] w-full">
                      <Mail className="w-4 h-4 mr-2" />
                      Enviar Invitaciones
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Mis Reseñas */}
            <div className="mb-6">
              <MyReviews userEmail={user.email} />
            </div>
          </>
        )}

        {/* Logout Button */}
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full clay-button rounded-[16px] text-red-500 border-red-200 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
}