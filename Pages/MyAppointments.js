import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, PawPrint, Building2, Repeat } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function MyAppointmentsPage() {
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState("upcoming");

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['my-appointments', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.Appointment.filter({ user_email: user.email }, '-appointment_date');
    },
    enabled: !!user,
    initialData: [],
  });

  const { data: pets } = useQuery({
    queryKey: ['pets-lookup'],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.Pet.filter({ owner_email: user.email });
    },
    enabled: !!user,
    initialData: [],
  });

  const { data: businesses } = useQuery({
    queryKey: ['businesses-lookup'],
    queryFn: async () => {
      const businessIds = [...new Set(appointments.map(a => a.business_id))];
      if (businessIds.length === 0) return [];
      const allBusinesses = await base44.entities.Business.list();
      return allBusinesses.filter(b => businessIds.includes(b.id));
    },
    enabled: appointments.length > 0,
    initialData: [],
  });

  const { data: services } = useQuery({
    queryKey: ['services-lookup'],
    queryFn: async () => {
      const serviceIds = [...new Set(appointments.map(a => a.service_id))];
      if (serviceIds.length === 0) return [];
      const allServices = await base44.entities.Service.list();
      return allServices.filter(s => serviceIds.includes(s.id));
    },
    enabled: appointments.length > 0,
    initialData: [],
  });

  const getPet = (petId) => pets.find(p => p.id === petId);
  const getBusiness = (businessId) => businesses.find(b => b.id === businessId);
  const getService = (serviceId) => services.find(s => s.id === serviceId);

  const filteredAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.appointment_date);
    const now = new Date();
    
    if (filter === "upcoming") {
      return aptDate >= now && apt.status !== "cancelled";
    } else if (filter === "past") {
      return aptDate < now || apt.status === "completed";
    } else if (filter === "cancelled") {
      return apt.status === "cancelled";
    }
    return true;
  });

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800"
  };

  const statusLabels = {
    pending: "Pendiente",
    confirmed: "Confirmada",
    completed: "Completada",
    cancelled: "Cancelada"
  };

  if (!user) return null;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] bg-clip-text text-transparent">
              Mis Citas
            </span>
          </h1>
          <p className="text-gray-600">Gestiona tus próximas citas y revisa tu historial</p>
        </div>

        {/* Filters */}
        <div className="clay-card rounded-[20px] bg-white p-2 mb-8 inline-flex gap-2">
          <button
            onClick={() => setFilter("upcoming")}
            className={`px-6 py-2 rounded-[14px] font-medium transition-all ${
              filter === "upcoming"
                ? "clay-inset bg-gradient-to-r from-[#E6D9F5] to-[#C8F4DE] text-[#7B68BE]"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Próximas
          </button>
          <button
            onClick={() => setFilter("past")}
            className={`px-6 py-2 rounded-[14px] font-medium transition-all ${
              filter === "past"
                ? "clay-inset bg-gradient-to-r from-[#E6D9F5] to-[#C8F4DE] text-[#7B68BE]"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Pasadas
          </button>
          <button
            onClick={() => setFilter("cancelled")}
            className={`px-6 py-2 rounded-[14px] font-medium transition-all ${
              filter === "cancelled"
                ? "clay-inset bg-gradient-to-r from-[#E6D9F5] to-[#C8F4DE] text-[#7B68BE]"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Canceladas
          </button>
        </div>

        {/* Appointments List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="clay-card rounded-[24px] bg-white p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="clay-card rounded-[24px] bg-white p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2 text-gray-800">No tienes citas {filter === "upcoming" ? "próximas" : filter === "past" ? "pasadas" : "canceladas"}</h3>
            <p className="text-gray-600 mb-6">
              {filter === "upcoming" && "Busca servicios y agenda tu primera cita"}
            </p>
            {filter === "upcoming" && (
              <Button
                onClick={() => window.location.href = createPageUrl("Search")}
                className="clay-button rounded-[16px] bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] text-white"
              >
                Buscar Servicios
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => {
              const pet = getPet(appointment.pet_id);
              const business = getBusiness(appointment.business_id);
              const service = getService(appointment.service_id);
              
              return (
                <div key={appointment.id} className="clay-card rounded-[24px] bg-white p-6 hover:scale-[1.01] transition-all">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Business Image */}
                    <div className="w-full md:w-48 h-32 rounded-[20px] overflow-hidden bg-gradient-to-br from-[#E6D9F5] to-[#C7E9F8] flex-shrink-0">
                      {business?.main_photo_url ? (
                        <img
                          src={business.main_photo_url}
                          alt={business.business_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 className="w-12 h-12 text-[#7B68BE]" />
                        </div>
                      )}
                    </div>

                    {/* Appointment Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-800 mb-1">
                            {business?.business_name || 'Cargando...'}
                          </h3>
                          <p className="text-gray-600">{service?.service_name || 'Servicio'}</p>
                        </div>
                        <Badge className={`${statusColors[appointment.status]} rounded-full px-3 py-1`}>
                          {statusLabels[appointment.status]}
                        </Badge>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Calendar className="w-4 h-4 text-[#7B68BE]" />
                          <span className="text-sm">
                            {format(new Date(appointment.appointment_date), "dd 'de' MMMM, yyyy", { locale: es })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-700">
                          <Clock className="w-4 h-4 text-[#7B68BE]" />
                          <span className="text-sm">
                            {format(new Date(appointment.appointment_date), "HH:mm")}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-700">
                          <PawPrint className="w-4 h-4 text-[#7B68BE]" />
                          <span className="text-sm">{pet?.name || 'Mascota'}</span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-700">
                          <MapPin className="w-4 h-4 text-[#7B68BE]" />
                          <span className="text-sm truncate">{business?.address || 'Dirección'}</span>
                        </div>
                      </div>

                      {appointment.is_recurring && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-[#7B68BE]">
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

                      {appointment.notes && (
                        <div className="mt-4 p-3 clay-inset rounded-[12px] bg-gray-50">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Notas:</span> {appointment.notes}
                          </p>
                        </div>
                      )}

                      <div className="mt-4 flex gap-3">
                        <Link to={createPageUrl("BusinessDetail") + `?id=${business?.id}`}>
                          <Button variant="outline" className="clay-button rounded-[12px]">
                            Ver Negocio
                          </Button>
                        </Link>
                        {filter === "upcoming" && appointment.status === "pending" && (
                          <Button
                            onClick={async () => {
                              if (confirm('¿Deseas cancelar esta cita?')) {
                                const appointmentDate = new Date(appointment.appointment_date);
                                const now = new Date();
                                const hoursDiff = (appointmentDate - now) / (1000 * 60 * 60);
                                
                                // Dar 10 puntos si cancela con 24h+ de anticipación
                                if (hoursDiff >= 24) {
                                  const pointsToAdd = 10;
                                  await base44.auth.updateMe({
                                    reward_points: (user.reward_points || 0) + pointsToAdd,
                                    total_lifetime_points: (user.total_lifetime_points || 0) + pointsToAdd
                                  });
                                  
                                  await base44.entities.RewardAction.create({
                                    user_email: user.email,
                                    action_type: 'complete_profile',
                                    points_earned: pointsToAdd,
                                    description: 'Cancelaste con anticipación (+24h)'
                                  });
                                }
                                
                                await base44.entities.Appointment.update(appointment.id, { status: "cancelled" });
                                window.location.reload();
                              }
                            }}
                            variant="destructive"
                            className="clay-button rounded-[12px]"
                          >
                            Cancelar Cita
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}