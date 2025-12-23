import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Send, Calendar, Users, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function AdminNotificationsPage() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    target_type: "all_users",
    target_email: "",
    notification_type: "system",
    link_url: "",
    scheduled_for: ""
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      if (currentUser.user_type !== "admin") {
        window.location.href = "/";
        return;
      }
      setUser(currentUser);
    };
    loadUser();
  }, []);

  const { data: notifications } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: () => base44.entities.PushNotification.list('-created_date'),
    initialData: [],
  });

  const { data: users } = useQuery({
    queryKey: ['all-users-notifications'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const generateEmailHTML = (title, message, linkUrl) => {
    const messageHTML = message.replace(/\n/g, '<br>');
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f5ff; margin: 0; padding: 20px;">
<div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
<div style="background: linear-gradient(135deg, #7B68BE 0%, #5BA3C9 100%); color: white; padding: 30px; text-align: center;">
<div style="font-size: 48px; margin-bottom: 10px;">🔔</div>
<h1 style="margin: 0; font-size: 24px;">${title}</h1>
</div>
<div style="padding: 30px; text-align: center;">
<div style="background: #f8f5ff; border-radius: 15px; padding: 20px; margin: 20px 0; text-align: left; line-height: 1.6;">
${messageHTML}
</div>
${linkUrl ? `<a href="${linkUrl}" style="display: inline-block; background: linear-gradient(135deg, #7B68BE 0%, #5BA3C9 100%); color: white; padding: 15px 40px; border-radius: 30px; text-decoration: none; font-weight: bold; margin: 20px 0;">Ver más información</a>` : ''}
</div>
<div style="background: #f8f5ff; padding: 20px; text-align: center; color: #666; font-size: 14px;">
<p>Con cariño,<br><strong>El equipo de Groomly 🐾</strong></p>
</div>
</div>
</body>
</html>`;
  };

  const sendNotificationMutation = useMutation({
    mutationFn: async (data) => {
      const notification = await base44.entities.PushNotification.create({
        ...data
      });

      const emailHTML = generateEmailHTML(data.title, data.message, data.link_url);

      // Enviar email según el target
      if (data.target_type === "all_users") {
        for (const u of users) {
          await base44.integrations.Core.SendEmail({
            to: u.email,
            subject: `🔔 ${data.title}`,
            body: emailHTML
          });
        }
      } else if (data.target_type === "business_owners") {
        const businessOwners = users.filter(u => u.user_type === "business");
        for (const owner of businessOwners) {
          await base44.integrations.Core.SendEmail({
            to: owner.email,
            subject: `🔔 ${data.title}`,
            body: emailHTML
          });
        }
      } else if (data.target_type === "pet_owners") {
        const petOwners = users.filter(u => u.user_type === "pet_owner" || !u.user_type || u.user_type === "user");
        for (const owner of petOwners) {
          await base44.integrations.Core.SendEmail({
            to: owner.email,
            subject: `🔔 ${data.title}`,
            body: emailHTML
          });
        }
      } else if (data.target_type === "specific_user" && data.target_email) {
        await base44.integrations.Core.SendEmail({
          to: data.target_email,
          subject: `🔔 ${data.title}`,
          body: emailHTML
        });
      }

      return notification;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      setFormData({
        title: "",
        message: "",
        target_type: "all_users",
        target_email: "",
        notification_type: "system",
        link_url: "",
        scheduled_for: ""
      });
      alert('Notificación enviada exitosamente');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.target_type === "specific_user" && !formData.target_email) {
      alert("Ingresa el email del usuario específico");
      return;
    }
    sendNotificationMutation.mutate(formData);
  };

  const typeColors = {
    appointment: "bg-blue-100 text-blue-800",
    promotion: "bg-purple-100 text-purple-800",
    system: "bg-gray-100 text-gray-800",
    reminder: "bg-yellow-100 text-yellow-800"
  };

  const typeLabels = {
    appointment: "Cita",
    promotion: "Promoción",
    system: "Sistema",
    reminder: "Recordatorio"
  };

  const targetLabels = {
    all_users: "Todos los usuarios",
    business_owners: "Dueños de negocios",
    pet_owners: "Solo usuarios (dueños de mascotas)",
    specific_user: "Usuario específico"
  };

  if (!user) return null;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] bg-clip-text text-transparent">
              Gestión de Notificaciones
            </span>
          </h1>
          <p className="text-gray-600">Envía notificaciones push a los usuarios de la plataforma</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form */}
          <Card className="clay-card border-0">
            <CardHeader>
              <CardTitle>Nueva Notificación</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Título *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="clay-button rounded-[16px] mt-2"
                    placeholder="Título de la notificación"
                  />
                </div>

                <div>
                  <Label>Mensaje *</Label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    className="clay-inset rounded-[16px] mt-2 min-h-[100px]"
                    placeholder="Contenido del mensaje..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo *</Label>
                    <Select
                      value={formData.notification_type}
                      onValueChange={(value) => setFormData({ ...formData, notification_type: value })}
                    >
                      <SelectTrigger className="clay-button rounded-[16px] mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="appointment">Cita</SelectItem>
                        <SelectItem value="promotion">Promoción</SelectItem>
                        <SelectItem value="system">Sistema</SelectItem>
                        <SelectItem value="reminder">Recordatorio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Enviar a *</Label>
                    <Select
                      value={formData.target_type}
                      onValueChange={(value) => setFormData({ ...formData, target_type: value })}
                    >
                      <SelectTrigger className="clay-button rounded-[16px] mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_users">Todos los usuarios</SelectItem>
                        <SelectItem value="pet_owners">Solo usuarios (mascotas)</SelectItem>
                        <SelectItem value="business_owners">Dueños de negocios</SelectItem>
                        <SelectItem value="specific_user">Usuario específico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.target_type === "specific_user" && (
                  <div>
                    <Label>Email del Usuario</Label>
                    <Input
                      type="email"
                      value={formData.target_email}
                      onChange={(e) => setFormData({ ...formData, target_email: e.target.value })}
                      className="clay-button rounded-[16px] mt-2"
                      placeholder="usuario@ejemplo.com"
                    />
                  </div>
                )}

                <div>
                  <Label>URL de Enlace (opcional)</Label>
                  <Input
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    className="clay-button rounded-[16px] mt-2"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <Label>Programar para (opcional)</Label>
                  <Input
                    type="datetime-local"
                    value={formData.scheduled_for}
                    onChange={(e) => setFormData({ ...formData, scheduled_for: e.target.value })}
                    className="clay-button rounded-[16px] mt-2"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={sendNotificationMutation.isPending}
                  className="w-full clay-button rounded-[16px] bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] text-white"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {sendNotificationMutation.isPending ? 'Enviando...' : 'Enviar Notificación'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Card className="clay-card border-0">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-[16px] bg-gradient-to-br from-[#7B68BE] to-[#5BA3C9] clay-card flex items-center justify-center">
                      <Bell className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Enviadas</p>
                      <p className="text-2xl font-bold">{notifications.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="clay-card border-0">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-[16px] bg-gradient-to-br from-[#6BBF98] to-[#C8F4DE] clay-card flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Usuarios Totales</p>
                      <p className="text-2xl font-bold">{users.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Notifications */}
            <Card className="clay-card border-0">
              <CardHeader>
                <CardTitle>Notificaciones Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No hay notificaciones enviadas</p>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {notifications.slice(0, 10).map(notif => (
                      <div key={notif.id} className="clay-inset rounded-[12px] p-4 bg-gray-50">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-bold text-sm">{notif.title}</h4>
                          <Badge className={typeColors[notif.notification_type]}>
                            {typeLabels[notif.notification_type]}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{notif.message}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>📨 {targetLabels[notif.target_type]}</span>
                          <span>📅 {notif.created_date ? format(new Date(notif.created_date), "dd MMM HH:mm", { locale: es }) : 'N/A'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}