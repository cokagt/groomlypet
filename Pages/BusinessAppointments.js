import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, Clock, CheckCircle, XCircle, AlertCircle, 
  ArrowLeft, Phone, Mail, User, Send, Star, Repeat 
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, addDays, addWeeks, addMonths } from "date-fns";
import { es } from "date-fns/locale";
import AppointmentsCalendar from "../components/calendar/AppointmentsCalendar";

export default function BusinessAppointmentsPage() {
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  const { data: myBusiness } = useQuery({
    queryKey: ['my-business-appointments', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const businesses = await base44.entities.Business.filter({ owner_email: user.email });
      return businesses[0];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (myBusiness) setBusiness(myBusiness);
  }, [myBusiness]);

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['business-appointments', business?.id],
    queryFn: async () => {
      if (!business) return [];
      return await base44.entities.Appointment.filter({ business_id: business.id }, '-appointment_date');
    },
    enabled: !!business,
    initialData: [],
  });

  const { data: services } = useQuery({
    queryKey: ['business-services-appts', business?.id],
    queryFn: async () => {
      if (!business) return [];
      return await base44.entities.Service.filter({ business_id: business.id });
    },
    enabled: !!business,
    initialData: [],
  });

  const { data: pets } = useQuery({
    queryKey: ['all-pets-appts'],
    queryFn: async () => await base44.entities.Pet.list(),
    initialData: [],
  });

  const { data: users } = useQuery({
    queryKey: ['all-users-appts'],
    queryFn: async () => await base44.entities.User.list(),
    initialData: [],
  });

  const sendReviewRequestMutation = useMutation({
    mutationFn: async (appointment) => {
      const pet = pets.find(p => p.id === appointment.pet_id);
      const service = services.find(s => s.id === appointment.service_id);
      const customer = users.find(u => u.email === appointment.user_email);
      
      const reviewUrl = `${window.location.origin}/LeaveReview?appointment=${appointment.id}`;
      
      const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f5ff; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #7B68BE 0%, #5BA3C9 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; text-align: center; }
    .emoji-title { font-size: 48px; margin-bottom: 10px; }
    .stars { font-size: 36px; margin: 20px 0; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #7B68BE 0%, #5BA3C9 100%); color: white; padding: 15px 40px; border-radius: 30px; text-decoration: none; font-weight: bold; margin: 20px 0; }
    .reward-box { background: linear-gradient(135deg, #FFF5E6 0%, #FFE5CC 100%); border-radius: 15px; padding: 15px; margin: 20px 0; }
    .footer { background: #f8f5ff; padding: 20px; text-align: center; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="emoji-title">⭐</div>
      <h1>¿Cómo fue tu experiencia?</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${customer?.full_name || 'Cliente'}</strong>,</p>
      <p>Gracias por visitar <strong>${business.business_name}</strong> con <strong>${pet?.name || 'tu mascota'}</strong>.</p>
      <p>Nos encantaría conocer tu opinión sobre el servicio: <strong>${service?.service_name || 'tu servicio'}</strong></p>
      
      <div class="stars">⭐⭐⭐⭐⭐</div>
      
      <a href="${reviewUrl}" class="cta-button">Dejar mi Reseña</a>
      
      <div class="reward-box">
        <p>🎁 <strong>¡Gana 1 Estrella de Lealtad!</strong></p>
        <p style="font-size: 14px; margin: 0;">Al dejar tu reseña acumularás puntos para promociones y descuentos exclusivos de Groomly.</p>
      </div>
    </div>
    <div class="footer">
      <p>Con cariño,<br><strong>El equipo de Groomly 🐾</strong></p>
    </div>
  </div>
</body>
</html>
      `;

      await base44.integrations.Core.SendEmail({
        to: appointment.user_email,
        subject: `⭐ ¿Cómo fue tu experiencia en ${business.business_name}?`,
        body: htmlBody
      });

      await base44.entities.Appointment.update(appointment.id, { review_sent: true });

      // Crear notificación para el usuario
      await base44.entities.PushNotification.create({
        title: "⭐ ¿Cómo fue tu experiencia?",
        message: `Cuéntanos cómo fue tu visita a ${business.business_name}. ¡Gana 1 estrella de lealtad!`,
        target_type: "specific_user",
        target_email: appointment.user_email,
        notification_type: "review",
        link_url: `/LeaveReview?appointment=${appointment.id}`
      });

      return appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-appointments'] });
      alert('¡Solicitud de reseña enviada!');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ appointmentId, status, appointment }) => {
      await base44.entities.Appointment.update(appointmentId, { status });
      return { status, appointment };
    },
    onSuccess: async ({ status, appointment }) => {
      // Si se completa una cita, dar 40 puntos al usuario
      if (status === 'completed') {
        const customer = await base44.entities.User.filter({ email: appointment.user_email });
        if (customer.length > 0) {
          const currentUser = customer[0];
          const pointsToAdd = 40;
          
          await base44.entities.User.update(currentUser.id, {
            reward_points: (currentUser.reward_points || 0) + pointsToAdd,
            total_lifetime_points: (currentUser.total_lifetime_points || 0) + pointsToAdd
          });
          
          await base44.entities.RewardAction.create({
            user_email: appointment.user_email,
            action_type: 'complete_appointment',
            points_earned: pointsToAdd,
            description: `Completaste tu cita en ${business.business_name}`
          });

          // Revisar frecuencia inteligente
          const completedAppts = await base44.entities.Appointment.filter({ 
            user_email: appointment.user_email,
            status: 'completed'
          });
          
          const totalCompleted = completedAppts.length;
          
          // 2 citas = +50 pts
          if (totalCompleted === 2) {
            await base44.entities.User.update(currentUser.id, {
              reward_points: (currentUser.reward_points || 0) + 50 + pointsToAdd,
              total_lifetime_points: (currentUser.total_lifetime_points || 0) + 50 + pointsToAdd
            });
            await base44.entities.RewardAction.create({
              user_email: appointment.user_email,
              action_type: 'complete_appointment',
              points_earned: 50,
              description: '🎉 ¡Bonus! Completaste 2 citas'
            });
          }
          
          // 4 citas = +100 pts
          if (totalCompleted === 4) {
            await base44.entities.User.update(currentUser.id, {
              reward_points: (currentUser.reward_points || 0) + 100 + pointsToAdd,
              total_lifetime_points: (currentUser.total_lifetime_points || 0) + 100 + pointsToAdd
            });
            await base44.entities.RewardAction.create({
              user_email: appointment.user_email,
              action_type: 'complete_appointment',
              points_earned: 100,
              description: '🎉 ¡Bonus! Completaste 4 citas'
            });
          }
          
          // 6 citas = +150 pts
          if (totalCompleted === 6) {
            await base44.entities.User.update(currentUser.id, {
              reward_points: (currentUser.reward_points || 0) + 150 + pointsToAdd,
              total_lifetime_points: (currentUser.total_lifetime_points || 0) + 150 + pointsToAdd
            });
            await base44.entities.RewardAction.create({
              user_email: appointment.user_email,
              action_type: 'complete_appointment',
              points_earned: 150,
              description: '🎉 ¡Bonus! Completaste 6 citas'
            });
          }
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['business-appointments'] });
      
      // Si se confirma la cita, enviar email HTML al usuario
      if (status === 'confirmed') {
        const pet = pets.find(p => p.id === appointment.pet_id);
        const service = services.find(s => s.id === appointment.service_id);
        const appointmentDate = new Date(appointment.appointment_date);
        const customer = users.find(u => u.email === appointment.user_email);
        
        const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f5ff; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #7B68BE 0%, #5BA3C9 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { padding: 30px; }
    .emoji-title { font-size: 48px; margin-bottom: 10px; }
    .detail-box { background: #f8f5ff; border-radius: 15px; padding: 20px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0d9f0; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #666; }
    .detail-value { font-weight: bold; color: #333; }
    .footer { background: #f8f5ff; padding: 20px; text-align: center; color: #666; font-size: 14px; }
    .success-badge { display: inline-block; background: linear-gradient(135deg, #C8F4DE 0%, #B0E7C9 100%); color: #2d7a4d; padding: 10px 20px; border-radius: 20px; font-weight: bold; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="emoji-title">🎉</div>
      <h1>¡Cita Confirmada!</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${customer?.full_name || 'Cliente'}</strong>,</p>
      <p>¡Excelentes noticias! Tu cita ha sido confirmada por <strong>${business.business_name}</strong>.</p>
      
      <div class="success-badge">✅ Confirmada</div>
      
      <div class="detail-box">
        <h3 style="margin-top: 0;">📋 Detalles de tu cita</h3>
        <div class="detail-row">
          <span class="detail-label">🐾 Mascota:</span>
          <span class="detail-value">${pet?.name || 'Tu mascota'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">✂️ Servicio:</span>
          <span class="detail-value">${service?.service_name || 'Servicio'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">📅 Fecha:</span>
          <span class="detail-value">${format(appointmentDate, "EEEE dd 'de' MMMM, yyyy", { locale: es })}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">🕐 Hora:</span>
          <span class="detail-value">${format(appointmentDate, 'HH:mm')} hrs</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">📍 Lugar:</span>
          <span class="detail-value">${business.business_name}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">🏠 Dirección:</span>
          <span class="detail-value">${business.address}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">💰 Precio:</span>
          <span class="detail-value">$${service?.price || '0'}</span>
        </div>
      </div>
      
      <p>📱 Recibirás recordatorios 24 horas y 1 hora antes de tu cita.</p>
      <p>Si necesitas reagendar o cancelar, por favor contacta directamente al negocio.</p>
    </div>
    <div class="footer">
      <p>Con cariño,<br><strong>El equipo de Groomly 🐾</strong></p>
    </div>
  </div>
</body>
</html>
        `;

        await base44.integrations.Core.SendEmail({
          to: appointment.user_email,
          subject: `🎉 ¡Cita Confirmada! - ${pet?.name || 'Tu mascota'} en ${business.business_name}`,
          body: htmlBody
        });

        // Crear notificación para el usuario
        await base44.entities.PushNotification.create({
          title: "🎉 ¡Cita Confirmada!",
          message: `Tu cita en ${business.business_name} para ${pet?.name || 'tu mascota'} ha sido confirmada para el ${format(appointmentDate, "dd MMM", { locale: es })}`,
          target_type: "specific_user",
          target_email: appointment.user_email,
          notification_type: "appointment",
          link_url: "/MyAppointments"
        });

        // Si es cita recurrente, crear la siguiente cita automáticamente
        if (appointment.is_recurring && appointment.recurring_interval) {
          let nextDate = new Date(appointmentDate);
          
          switch (appointment.recurring_interval) {
            case '1_week':
              nextDate = addWeeks(nextDate, 1);
              break;
            case '15_days':
              nextDate = addDays(nextDate, 15);
              break;
            case '3_weeks':
              nextDate = addWeeks(nextDate, 3);
              break;
            case '1_month':
              nextDate = addMonths(nextDate, 1);
              break;
          }

          const recurringLabels = {
            '1_week': 'cada semana',
            '15_days': 'cada 15 días',
            '3_weeks': 'cada 3 semanas',
            '1_month': 'cada mes'
          };

          // Crear la siguiente cita
          await base44.entities.Appointment.create({
            user_email: appointment.user_email,
            user_name: appointment.user_name,
            user_phone: appointment.user_phone,
            business_id: appointment.business_id,
            pet_id: appointment.pet_id,
            pet_name: appointment.pet_name,
            service_id: appointment.service_id,
            service_name: appointment.service_name,
            appointment_date: nextDate.toISOString(),
            status: "confirmed",
            notes: appointment.notes,
            is_recurring: true,
            recurring_interval: appointment.recurring_interval,
            parent_appointment_id: appointment.id,
            reminder_sent_24h: false,
            reminder_sent_1h: false,
            reminder_sent_3d: false,
            reminder_sent_1d: false
          });

          // Notificar al usuario de la próxima cita
          await base44.entities.PushNotification.create({
            title: "🔄 Próxima Cita Programada",
            message: `Tu siguiente cita recurrente en ${business.business_name} ha sido agendada para el ${format(nextDate, "dd MMM", { locale: es })}`,
            target_type: "specific_user",
            target_email: appointment.user_email,
            notification_type: "appointment",
            link_url: "/MyAppointments"
          });

          // Notificar a la empresa
          await base44.entities.PushNotification.create({
            title: "🔄 Cita Recurrente Agendada",
            message: `Se ha programado automáticamente la siguiente cita de ${appointment.user_name || appointment.user_email} para ${pet?.name || 'mascota'} el ${format(nextDate, "dd MMM", { locale: es })}`,
            target_type: "specific_user",
            target_email: business.owner_email,
            notification_type: "appointment",
            link_url: "/BusinessAppointments"
          });

          // Enviar email al usuario sobre la próxima cita
          await base44.integrations.Core.SendEmail({
            to: appointment.user_email,
            subject: `🔄 Próxima Cita Programada - ${business.business_name}`,
            body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f5ff; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #7B68BE 0%, #5BA3C9 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .detail-box { background: #f8f5ff; border-radius: 15px; padding: 20px; margin: 20px 0; }
    .recurring-badge { display: inline-block; background: linear-gradient(135deg, #E6D9F5 0%, #C8F4DE 100%); color: #7B68BE; padding: 10px 20px; border-radius: 20px; font-weight: bold; margin: 15px 0; }
    .footer { background: #f8f5ff; padding: 20px; text-align: center; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔄 Próxima Cita Programada</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${customer?.full_name || 'Cliente'}</strong>,</p>
      <p>Tu cita recurrente ha sido agendada automáticamente:</p>
      
      <div class="recurring-badge">🔄 Cita Recurrente: ${recurringLabels[appointment.recurring_interval]}</div>
      
      <div class="detail-box">
        <p><strong>🐾 Mascota:</strong> ${pet?.name || 'Tu mascota'}</p>
        <p><strong>✂️ Servicio:</strong> ${service?.service_name || 'Servicio'}</p>
        <p><strong>📅 Fecha:</strong> ${format(nextDate, "EEEE dd 'de' MMMM, yyyy", { locale: es })}</p>
        <p><strong>🕐 Hora:</strong> ${format(nextDate, 'HH:mm')} hrs</p>
        <p><strong>📍 Lugar:</strong> ${business.business_name}</p>
      </div>
      
      <p>⏰ Recibirás recordatorios <strong>3 días</strong> y <strong>1 día</strong> antes de tu cita.</p>
    </div>
    <div class="footer">
      <p>Groomly 🐾</p>
    </div>
  </div>
</body>
</html>
            `
          });
        }
      }

      // Si se cancela la cita
      if (status === 'cancelled') {
        const pet = pets.find(p => p.id === appointment.pet_id);
        
        await base44.entities.PushNotification.create({
          title: "❌ Cita Cancelada",
          message: `Tu cita en ${business.business_name} para ${pet?.name || 'tu mascota'} ha sido cancelada`,
          target_type: "specific_user",
          target_email: appointment.user_email,
          notification_type: "appointment",
          link_url: "/MyAppointments"
        });
      }
    },
  });

  const handleStatusChange = (appointmentId, status, appointment) => {
    updateStatusMutation.mutate({ appointmentId, status, appointment });
  };

  if (!user || !business) return null;

  const pendingAppointments = appointments.filter(a => a.status === 'pending');
  const confirmedAppointments = appointments.filter(a => a.status === 'confirmed');
  const completedAppointments = appointments.filter(a => a.status === 'completed');
  const cancelledAppointments = appointments.filter(a => a.status === 'cancelled');

  const renderAppointmentCard = (appointment) => {
    const pet = pets.find(p => p.id === appointment.pet_id);
    const service = services.find(s => s.id === appointment.service_id);
    const customer = users.find(u => u.email === appointment.user_email);
    const appointmentDate = new Date(appointment.appointment_date);

    return (
      <Card key={appointment.id} className="clay-card border-0 mb-4">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-bold">{pet?.name || 'Mascota'}</h3>
              <p className="text-sm text-gray-600">{service?.service_name}</p>
            </div>
            <Badge className={`
              ${appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
              ${appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' : ''}
              ${appointment.status === 'completed' ? 'bg-blue-100 text-blue-800' : ''}
              ${appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
            `}>
              {appointment.status === 'pending' && '⏳ Pendiente'}
              {appointment.status === 'confirmed' && '✅ Confirmada'}
              {appointment.status === 'completed' && '✔️ Completada'}
              {appointment.status === 'cancelled' && '❌ Cancelada'}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-[#7B68BE]" />
              <span>{format(appointmentDate, 'dd MMM yyyy', { locale: es })}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-[#7B68BE]" />
              <span>{format(appointmentDate, 'HH:mm')} hrs</span>
            </div>
          </div>

          <div className="clay-inset rounded-[12px] p-3 bg-gray-50 mb-4">
            <div className="flex items-center gap-2 text-sm mb-1">
              <User className="w-4 h-4 text-gray-500" />
              <span className="font-medium">{appointment.user_name || customer?.display_name || customer?.full_name || appointment.user_email}</span>
            </div>
            {(appointment.user_phone || customer?.phone) && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-gray-500" />
                <a href={`tel:${appointment.user_phone || customer?.phone}`} className="text-[#7B68BE]">
                  {appointment.user_phone || customer?.phone}
                </a>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm mt-1">
              <Mail className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">{appointment.user_email}</span>
            </div>
          </div>

          {appointment.notes && (
            <div className="text-sm text-gray-600 mb-4">
              <strong>Notas:</strong> {appointment.notes}
            </div>
          )}

          {appointment.is_recurring && (
            <div className="flex items-center gap-2 text-sm text-[#7B68BE] clay-inset rounded-[12px] p-3 bg-purple-50 mb-4">
              <Repeat className="w-4 h-4" />
              <span>
                Cita recurrente: {
                  appointment.recurring_interval === '1_week' ? 'cada semana' :
                  appointment.recurring_interval === '15_days' ? 'cada 15 días' :
                  appointment.recurring_interval === '3_weeks' ? 'cada 3 semanas' :
                  appointment.recurring_interval === '1_month' ? 'cada mes' : ''
                }
              </span>
            </div>
          )}

          {appointment.status === 'pending' && (
            <div className="flex gap-2">
              <Button
                onClick={() => handleStatusChange(appointment.id, 'confirmed', appointment)}
                className="flex-1 clay-button rounded-[12px] bg-green-500 hover:bg-green-600 text-white"
                disabled={updateStatusMutation.isPending}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirmar
              </Button>
              <Button
                onClick={() => handleStatusChange(appointment.id, 'cancelled', appointment)}
                variant="outline"
                className="clay-button rounded-[12px] text-red-500"
                disabled={updateStatusMutation.isPending}
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
          )}

          {appointment.status === 'confirmed' && (
            <div className="flex gap-2">
              <Button
                onClick={() => handleStatusChange(appointment.id, 'completed', appointment)}
                className="flex-1 clay-button rounded-[12px] bg-blue-500 hover:bg-blue-600 text-white"
                disabled={updateStatusMutation.isPending}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Marcar Completada
              </Button>
            </div>
          )}

          {appointment.status === 'completed' && !appointment.review_sent && !appointment.review_submitted && (
            <Button
              onClick={() => sendReviewRequestMutation.mutate(appointment)}
              className="w-full clay-button rounded-[12px] bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-white"
              disabled={sendReviewRequestMutation.isPending}
            >
              <Send className="w-4 h-4 mr-2" />
              {sendReviewRequestMutation.isPending ? 'Enviando...' : 'Enviar Solicitud de Reseña'}
            </Button>
          )}

          {appointment.status === 'completed' && appointment.review_sent && !appointment.review_submitted && (
            <div className="flex items-center gap-2 text-sm text-yellow-600 clay-inset rounded-[12px] p-3 bg-yellow-50">
              <Star className="w-4 h-4" />
              <span>Solicitud de reseña enviada - esperando respuesta</span>
            </div>
          )}

          {appointment.status === 'completed' && appointment.review_submitted && (
            <div className="flex items-center gap-2 text-sm text-green-600 clay-inset rounded-[12px] p-3 bg-green-50">
              <CheckCircle className="w-4 h-4" />
              <span>Cliente ya dejó su reseña</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl("BusinessDashboard")}>
            <Button variant="outline" size="icon" className="clay-button rounded-[16px]">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold">
              <span className="bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] bg-clip-text text-transparent">
                Agenda de Citas
              </span>
            </h1>
            <p className="text-gray-600">Gestiona las citas de tu negocio</p>
          </div>
        </div>

        {/* Calendario */}
        <div className="mb-8">
          <AppointmentsCalendar appointments={appointments} />
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="clay-card rounded-[20px] p-2 flex-wrap h-auto gap-1">
            <TabsTrigger value="pending" className="rounded-[14px]">
              Pendientes ({pendingAppointments.length})
            </TabsTrigger>
            <TabsTrigger value="confirmed" className="rounded-[14px]">
              Confirmadas ({confirmedAppointments.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="rounded-[14px]">
              Completadas ({completedAppointments.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="rounded-[14px]">
              Canceladas ({cancelledAppointments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {pendingAppointments.length === 0 ? (
              <Card className="clay-card border-0">
                <CardContent className="p-12 text-center">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No hay citas pendientes</h3>
                </CardContent>
              </Card>
            ) : (
              pendingAppointments.map(renderAppointmentCard)
            )}
          </TabsContent>

          <TabsContent value="confirmed">
            {confirmedAppointments.length === 0 ? (
              <Card className="clay-card border-0">
                <CardContent className="p-12 text-center">
                  <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No hay citas confirmadas</h3>
                </CardContent>
              </Card>
            ) : (
              confirmedAppointments.map(renderAppointmentCard)
            )}
          </TabsContent>

          <TabsContent value="completed">
            {completedAppointments.length === 0 ? (
              <Card className="clay-card border-0">
                <CardContent className="p-12 text-center">
                  <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No hay citas completadas</h3>
                </CardContent>
              </Card>
            ) : (
              completedAppointments.map(renderAppointmentCard)
            )}
          </TabsContent>

          <TabsContent value="cancelled">
            {cancelledAppointments.length === 0 ? (
              <Card className="clay-card border-0">
                <CardContent className="p-12 text-center">
                  <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No hay citas canceladas</h3>
                </CardContent>
              </Card>
            ) : (
              cancelledAppointments.map(renderAppointmentCard)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}