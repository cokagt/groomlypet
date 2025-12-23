import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, PawPrint, CheckCircle, Plus, X, Repeat } from "lucide-react";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";

export default function BookingModal({ business, services, onClose }) {
    const [user, setUser] = useState(null);
    const [step, setStep] = useState(1);
    const [bookingData, setBookingData] = useState({
        pet_id: "",
        service_ids: [],
        appointment_date: "",
        appointment_time: "",
        notes: "",
        is_recurring: false,
        recurring_interval: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const queryClient = useQueryClient();

    useEffect(() => {
        const loadUser = async () => {
            const currentUser = await base44.auth.me();
            setUser(currentUser);
        };
        loadUser();
    }, []);

    useEffect(() => {
        if (branches.length > 1) {
            setStep(0);
        }
    }, [branches]);

    const { data: pets } = useQuery({
        queryKey: ['my-pets'],
        queryFn: async () => {
            if (!user) return [];
            return await base44.entities.Pet.filter({ owner_email: user.email, is_active: true });
        },
        enabled: !!user,
        initialData: [],
    });

    // Generar opciones de fecha (próximos 30 días)
    const dateOptions = [];
    for (let i = 0; i < 30; i++) {
        const date = addDays(new Date(), i);
        dateOptions.push({
            value: format(date, 'yyyy-MM-dd'),
            label: format(date, "EEEE dd 'de' MMMM", { locale: es }),
            short: format(date, 'dd MMM', { locale: es })
        });
    }

    // Generar opciones de hora (8:00 - 20:00, cada 15 min)
    const timeOptions = [];
    for (let hour = 8; hour <= 19; hour++) {
        for (let min = 0; min < 60; min += 15) {
            const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
            timeOptions.push({
                value: timeStr,
                label: timeStr
            });
        }
    }

    const toggleService = (serviceId) => {
        const current = bookingData.service_ids;
        if (current.includes(serviceId)) {
            setBookingData({ ...bookingData, service_ids: current.filter(id => id !== serviceId) });
        } else {
            setBookingData({ ...bookingData, service_ids: [...current, serviceId] });
        }
    };

    const selectedServices = services.filter(s => bookingData.service_ids.includes(s.id));
    const totalPrice = selectedServices.reduce((sum, s) => sum + (s.price || 0), 0);
    const totalDuration = selectedServices.reduce((sum, s) => sum + (s.duration_minutes || 30), 0);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const dateTime = `${bookingData.appointment_date}T${bookingData.appointment_time}:00`;
            const pet = pets.find(p => p.id === bookingData.pet_id);

            // Crear una cita por cada servicio seleccionado
            for (const serviceId of bookingData.service_ids) {
                const service = services.find(s => s.id === serviceId);
                await base44.entities.Appointment.create({
                    user_email: user.email,
                    user_name: user.display_name || user.full_name,
                    user_phone: user.phone || "",
                    business_id: business.id,
                    pet_id: bookingData.pet_id,
                    pet_name: pet?.name || "",
                    service_id: serviceId,
                    service_name: service?.service_name || "",
                    appointment_date: dateTime,
                    status: "pending",
                    notes: bookingData.notes,
                    is_recurring: bookingData.is_recurring,
                    recurring_interval: bookingData.is_recurring ? bookingData.recurring_interval : null,
                    reminder_sent_24h: false,
                    reminder_sent_1h: false,
                    reminder_sent_3d: false,
                    reminder_sent_1d: false
                });
            }

            // Enviar notificación al negocio
            const serviceNames = selectedServices.map(s => s.service_name).join(', ');
            const clientName = user.display_name || user.full_name || user.email;
            const clientPhone = user.phone || 'No proporcionado';

            const recurringLabels = {
                '1_week': 'cada semana',
                '15_days': 'cada 15 días',
                '3_weeks': 'cada 3 semanas',
                '1_month': 'cada mes'
            };
            const recurringText = bookingData.is_recurring ? ` (Recurrente: ${recurringLabels[bookingData.recurring_interval]})` : '';

            // Crear notificación para el negocio
            try {
                await base44.entities.PushNotification.create({
                    title: bookingData.is_recurring ? "🔄 Nueva Cita Recurrente" : "📋 Nueva Solicitud de Cita",
                    message: `${clientName} ha solicitado una cita para ${pet?.name} el ${format(new Date(dateTime), "dd MMM", { locale: es })} a las ${bookingData.appointment_time}${recurringText}`,
                    target_type: "specific_user",
                    target_email: business.owner_email,
                    notification_type: "appointment",
                    link_url: "/BusinessAppointments"
                });
            } catch (notifError) {
                console.error("Error creando notificación:", notifError);
            }

            try {
                await base44.integrations.Core.SendEmail({
                    to: business.owner_email,
                    subject: `📋 Nueva Solicitud de Cita - ${business.business_name}`,
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
    .pending-badge { display: inline-block; background: linear-gradient(135deg, #FFF3CD 0%, #FFE69C 100%); color: #856404; padding: 10px 20px; border-radius: 20px; font-weight: bold; margin: 15px 0; }
    .detail-box { background: #f8f5ff; border-radius: 15px; padding: 20px; margin: 20px 0; }
    .footer { background: #f8f5ff; padding: 20px; text-align: center; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Nueva Solicitud de Cita</h1>
    </div>
    <div class="content">
      <p>Tienes una nueva solicitud de cita que requiere tu confirmación:</p>
      
      <div class="pending-badge">⏳ Pendiente de Confirmación</div>
      
      <div class="detail-box">
        <p><strong>👤 Cliente:</strong> ${clientName}</p>
        <p><strong>📧 Email:</strong> ${user.email}</p>
        <p><strong>📱 Teléfono:</strong> ${clientPhone}</p>
        <p><strong>🐾 Mascota:</strong> ${pet?.name} (${pet?.species})</p>
        <p><strong>✂️ Servicios:</strong> ${serviceNames}</p>
        <p><strong>📅 Fecha:</strong> ${format(new Date(dateTime), "EEEE dd 'de' MMMM, yyyy", { locale: es })}</p>
        <p><strong>🕐 Hora:</strong> ${bookingData.appointment_time} hrs</p>
        <p><strong>💰 Total:</strong> $${totalPrice}</p>
                ${bookingData.is_recurring ? `<p><strong>🔄 Cita Recurrente:</strong> ${recurringLabels[bookingData.recurring_interval]}</p>` : ''}
                ${bookingData.notes ? `<p><strong>📝 Notas:</strong> ${bookingData.notes}</p>` : ''}
              </div>
      
      <p>Ingresa a tu panel de Groomly para confirmar o rechazar esta cita.</p>
    </div>
    <div class="footer">
      <p>Groomly 🐾</p>
    </div>
  </div>
</body>
</html>
          `
                });
            } catch (emailError) {
                console.error("Error enviando email al negocio:", emailError);
            }

            // Dar puntos por reservar cita
            const pointsToAdd = 30;
            const currentUser = await base44.auth.me();
            await base44.auth.updateMe({
                reward_points: (currentUser.reward_points || 0) + pointsToAdd,
                total_lifetime_points: (currentUser.total_lifetime_points || 0) + pointsToAdd
            });

            await base44.entities.RewardAction.create({
                user_email: user.email,
                action_type: 'book_appointment',
                points_earned: pointsToAdd,
                description: `Reservaste una cita en ${business.business_name}`
            });

            queryClient.invalidateQueries({ queryKey: ['my-appointments'] });
            setSuccess(true);

            setTimeout(() => {
                onClose();
                window.location.reload(); // Recargar para actualizar puntos
            }, 3000);
        } catch (error) {
            console.error("Error creando cita:", error);
            alert("Hubo un error al crear la cita. Por favor intenta de nuevo.");
        }
        setIsSubmitting(false);
    };

    if (success) {
        return (
            <Dialog open= { true} onOpenChange = { onClose } >
                <DialogContent className="sm:max-w-md" >
                    <div className="text-center py-8" >
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#C8F4DE] to-[#B0E7C9] clay-card flex items-center justify-center mx-auto mb-4" >
                            <CheckCircle className="w-10 h-10 text-green-600" />
                                </div>
                                < h3 className = "text-2xl font-bold mb-2" >¡Solicitud Enviada! </h3>
                                    < p className = "text-gray-600" >
                                        Tu solicitud de cita ha sido enviada.Recibirás un correo de confirmación cuando el negocio la apruebe.
            </p>
                                            </div>
                                            </DialogContent>
                                            </Dialog>
    );
    }

    return (
        <Dialog open= { true} onOpenChange = { onClose } >
            <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto z-[9999]" >
                <DialogHeader>
                <DialogTitle className="text-2xl" >
                    Agendar Cita en { business.business_name }
    </DialogTitle>
        </DialogHeader>

        < div className = "py-4" >
            {/* Progress Steps */ }
            < div className = "flex items-center justify-center mb-6" >
                <div className="flex items-center gap-2" >
                {
                    [1, 2, 3].map((s) => (
                        <React.Fragment key= { s } >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? 'bg-[#7B68BE] text-white' : 'bg-gray-200 text-gray-500'
                            }`} >
                    { s }
                    </div>
    { s < 3 && <div className={ `w-12 h-1 ${step > s ? 'bg-[#7B68BE]' : 'bg-gray-200'}` }> </div> }
    </React.Fragment>
              ))
}
</div>
    </div>

{/* Step 0: Select Branch (if multiple) */ }
{
    step === 0 && branches.length > 1 && (
        <div className="space-y-4" >
            <h3 className="text-lg font-bold mb-4" > Selecciona la Sucursal </h3>
                < div className = "space-y-3 max-h-[400px] overflow-y-auto" >
                {
                    branches.map((branch) => (
                        <button
                    key= { branch.id }
                    onClick = {() => {
                        setSelectedBranch(branch);
                      setStep(1);
                    }}
    className = {`w-full text-left clay-card rounded-[16px] p-4 transition-all ${selectedBranch?.id === branch.id ? 'ring-2 ring-[#7B68BE] bg-gradient-to-r from-[#E6D9F5] to-[#C8F4DE]' : 'bg-white hover:scale-[1.02]'
        }`
}
                  >
    <div className="flex items-start justify-between" >
        <div className="flex-1" >
            <h4 className="font-bold" > { branch.business_name } </h4>
{
    branch.is_branch && (
        <Badge className="bg-[#7B68BE] text-white text-xs mt-1" > Sucursal </Badge>
                        )
}
<p className="text-sm text-gray-600 mt-2 flex items-start gap-2" >
    <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
        { branch.address }
        </p>
        < p className = "text-sm text-gray-600 mt-1 flex items-center gap-2" >
            <Phone className="w-4 h-4" />
                { branch.phone }
                </p>
                </div>
                </div>
                </button>
                ))}
</div>
    </div>
          )}

{/* Step 1: Select Pet */ }
{
    step === 1 && (
        <div className="space-y-4" >
            <h3 className="font-bold text-lg flex items-center gap-2" >
                <PawPrint className="w-5 h-5 text-[#7B68BE]" />
                    Selecciona tu Mascota
                        </h3>

    {
        pets.length === 0 ? (
            <div className= "text-center py-8" >
            <p className="text-gray-600 mb-4" > No tienes mascotas registradas </p>
                < Button
        onClick = {() => window.location.href = '/MyPets'
    }
    className = "clay-button rounded-[16px]"
        >
        Registrar Mascota
            </Button>
            </div>
              ) : (
        <div className= "grid grid-cols-2 gap-4" >
        {
            pets.map(pet => (
                <button
                      key= { pet.id }
                      onClick = {() => {
                setBookingData({ ...bookingData, pet_id: pet.id
            });
            setStep(2);
        }
}
className = {`clay-card rounded-[20px] p-4 text-left transition-all ${bookingData.pet_id === pet.id ? 'ring-2 ring-[#7B68BE]' : ''
    }`}
                    >
{
    pet.photo_url && (
        <img
                          src={ pet.photo_url }
alt = { pet.name }
className = "w-full h-24 object-cover rounded-[16px] mb-3"
    />
                      )}
<div className="font-bold" > { pet.name } </div>
    < div className = "text-sm text-gray-600" > { pet.breed } </div>
        </button>
                  ))}
</div>
              )}
</div>
          )}

{/* Step 2: Select Services, Date & Time */ }
{
    step === 2 && (
        <div className="space-y-6" >
            {/* Services Selection */ }
            < div >
            <Label className="flex items-center gap-2 mb-3" >
                <Plus className="w-4 h-4" />
                    Selecciona los Servicios(puedes elegir varios)
                        </Label>
                        < div className = "grid gap-2" >
                        {
                            services.map(service => (
                                <button
                      key= { service.id }
                      type = "button"
                      onClick = {() => toggleService(service.id)}
    className = {`w-full text-left p-4 rounded-[16px] transition-all ${bookingData.service_ids.includes(service.id)
            ? 'clay-inset bg-gradient-to-r from-[#E6D9F5] to-[#C8F4DE] ring-2 ring-[#7B68BE]'
            : 'clay-button bg-white'
        }`
}
                    >
    <div className="flex justify-between items-center" >
        <div>
        <div className="font-medium" > { service.service_name } </div>
            < div className = "text-sm text-gray-500" >
                { service.duration_minutes && `${service.duration_minutes} min` }
                </div>
                </div>
                < div className = "text-lg font-bold text-[#7B68BE]" > ${ service.price } </div>
                    </div>
                    </button>
                  ))}
</div>

{
    bookingData.service_ids.length > 0 && (
        <div className="mt-3 p-3 rounded-[12px] bg-gradient-to-r from-[#E6D9F5] to-[#C8F4DE]" >
            <div className="flex justify-between text-sm" >
                <span>{ bookingData.service_ids.length } servicio(s) seleccionado(s) </span>
                    < span className = "font-bold" > Total: ${ totalPrice } </span>
                        </div>
                        </div>
                )
}
</div>

{/* Date Selection */ }
<div>
    <Label className="flex items-center gap-2 mb-3" >
        <Calendar className="w-4 h-4" />
            Fecha
            </Label>
            < Select
value = { bookingData.appointment_date }
onValueChange = {(value) => setBookingData({ ...bookingData, appointment_date: value })}
                >
    <SelectTrigger className="clay-button rounded-[12px]" >
        <SelectValue placeholder="Selecciona una fecha" />
            </SelectTrigger>
            < SelectContent className = "max-h-[250px] z-[10000]" >
            {
                dateOptions.slice(0, 30).map(date => (
                    <SelectItem key= { date.value } value = { date.value } >
                    { date.label }
                    </SelectItem>
                ))
            }
                </SelectContent>
                </Select>
                </div>

{/* Time Selection */ }
<div>
    <Label className="flex items-center gap-2 mb-3" >
        <Clock className="w-4 h-4" />
            Hora
            </Label>
            < Select
value = { bookingData.appointment_time }
onValueChange = {(value) => setBookingData({ ...bookingData, appointment_time: value })}
                >
    <SelectTrigger className="clay-button rounded-[12px]" >
        <SelectValue placeholder="Selecciona una hora" />
            </SelectTrigger>
            < SelectContent className = "max-h-[250px] z-[10000]" >
            {
                timeOptions.map(time => (
                    <SelectItem key= { time.value } value = { time.value } >
                    { time.label } hrs
                </SelectItem>
                ))
            }
                </SelectContent>
                </Select>
                </div>

                < div className = "flex gap-3 pt-4" >
                    <Button
                  onClick={ () => setStep(1) }
variant = "outline"
className = "clay-button rounded-[16px]"
    >
    Atrás
    </Button>
    < Button
onClick = {() => setStep(3)}
disabled = { bookingData.service_ids.length === 0 || !bookingData.appointment_date || !bookingData.appointment_time }
className = "flex-1 clay-button rounded-[16px] bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] text-white"
    >
    Continuar
    </Button>
    </div>
    </div>
          )}

{/* Step 3: Notes & Confirm */ }
{
    step === 3 && (
        <div className="space-y-6" >
            <div>
            <Label>Notas Adicionales(Opcional) </Label>
                < Textarea
    value = { bookingData.notes }
    onChange = {(e) => setBookingData({ ...bookingData, notes: e.target.value })
}
placeholder = "Información adicional sobre tu mascota o requerimientos especiales..."
className = "clay-inset rounded-[16px] mt-2 min-h-[80px]"
    />
    </div>

    < div className = "clay-inset rounded-[16px] p-4 bg-gray-50" >
        <h4 className="font-bold mb-3" >📋 Resumen de la Cita </h4>
            < div className = "space-y-2 text-sm" >
                <div className="flex justify-between" >
                    <span className="text-gray-600" >🐾 Mascota: </span>
                        < span className = "font-medium" > { pets.find(p => p.id === bookingData.pet_id)?.name } </span>
                            </div>

                            < div >
                            <span className="text-gray-600" >✂️ Servicios: </span>
                                < div className = "mt-1 flex flex-wrap gap-1" >
                                {
                                    selectedServices.map(s => (
                                        <Badge key= { s.id } variant = "secondary" className = "text-xs" >
                                        { s.service_name } - ${ s.price }
                                    </Badge>
                                    ))
                                }
                                    </div>
                                    </div>

                                    < div className = "flex justify-between" >
                                        <span className="text-gray-600" >📅 Fecha: </span>
                                            < span className = "font-medium" >
                                                { format(new Date(bookingData.appointment_date), "EEEE dd 'de' MMMM", { locale: es })}
</span>
    </div>
    < div className = "flex justify-between" >
        <span className="text-gray-600" >🕐 Hora: </span>
            < span className = "font-medium" > { bookingData.appointment_time } hrs </span>
                </div>
                < div className = "flex justify-between" >
                    <span className="text-gray-600" >⏱️ Duración aprox: </span>
                        < span className = "font-medium" > { totalDuration } min </span>
                            </div>
                            < div className = "flex justify-between pt-2 border-t" >
                                <span className="text-gray-600" >💰 Total: </span>
                                    < span className = "font-bold text-lg text-[#7B68BE]" >
                                        ${ totalPrice }
</span>
    </div>
{
    bookingData.is_recurring && (
        <div className="flex justify-between pt-2 border-t" >
            <span className="text-gray-600" >🔄 Recurrencia: </span>
                < span className = "font-medium text-[#7B68BE]" >
                    { bookingData.recurring_interval === '1_week' && 'Cada semana' }
    { bookingData.recurring_interval === '15_days' && 'Cada 15 días' }
    { bookingData.recurring_interval === '3_weeks' && 'Cada 3 semanas' }
    { bookingData.recurring_interval === '1_month' && 'Cada mes' }
    </span>
        </div>
                  )
}
</div>
    </div>

{/* Opción de Cita Recurrente */ }
<div className="clay-card rounded-[16px] p-4 bg-gradient-to-r from-[#E6D9F5]/30 to-[#C8F4DE]/30" >
    <div className="flex items-center gap-3 mb-3" >
        <Checkbox
                    id="recurring"
checked = { bookingData.is_recurring }
onCheckedChange = {(checked) => setBookingData({
    ...bookingData,
    is_recurring: checked,
    recurring_interval: checked ? '1_month' : ''
})}
                  />
    < label htmlFor = "recurring" className = "flex items-center gap-2 cursor-pointer font-medium" >
        <Repeat className="w-4 h-4 text-[#7B68BE]" />
            Hacer esta cita recurrente
                </label>
                </div>

{
    bookingData.is_recurring && (
        <div className="ml-7 space-y-2" >
            <Label className="text-sm text-gray-600" >¿Cada cuánto repetir ? </Label>
                < Select
                      value = { bookingData.recurring_interval }
    onValueChange = {(value) => setBookingData({ ...bookingData, recurring_interval: value })
}
                    >
    <SelectTrigger className="clay-button rounded-[12px]" >
        <SelectValue placeholder="Selecciona frecuencia" />
            </SelectTrigger>
            < SelectContent >
            <SelectItem value="1_week" > Cada semana </SelectItem>
                < SelectItem value = "15_days" > Cada 15 días </SelectItem>
                    < SelectItem value = "3_weeks" > Cada 3 semanas </SelectItem>
                        < SelectItem value = "1_month" > Cada mes </SelectItem>
                            </SelectContent>
                            </Select>
                            < p className = "text-xs text-gray-500" >
                                Al confirmar, se agendará automáticamente la siguiente cita según este intervalo.
                      Recibirás recordatorios 3 días y 1 día antes.
                    </p>
    </div>
                )}
</div>

    < div className = "p-3 rounded-[12px] bg-yellow-50 border border-yellow-200" >
        <p className="text-sm text-yellow-800" >
                  ⏳ Tu cita quedará pendiente de confirmación.Recibirás un correo cuando el negocio la apruebe.
                </p>
    </div>

    < div className = "flex gap-3" >
        <Button
                  onClick={ () => setStep(2) }
variant = "outline"
className = "clay-button rounded-[16px]"
    >
    Atrás
    </Button>
    < Button
onClick = { handleSubmit }
disabled = { isSubmitting }
className = "flex-1 clay-button rounded-[16px] bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] text-white"
    >
    { isSubmitting? 'Enviando...': 'Solicitar Cita' }
    </Button>
    </div>
    </div>
          )}
</div>
    </DialogContent>
    </Dialog>
  );
}