import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, PawPrint, Building2, DollarSign, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function UserHistoryPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  const { data: appointments } = useQuery({
    queryKey: ['user-history-appointments', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.Appointment.filter({ user_email: user.email }, '-appointment_date');
    },
    enabled: !!user,
    initialData: [],
  });

  const { data: pets } = useQuery({
    queryKey: ['user-pets-history'],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.Pet.filter({ owner_email: user.email });
    },
    enabled: !!user,
    initialData: [],
  });

  const { data: businesses } = useQuery({
    queryKey: ['user-businesses-history'],
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
    queryKey: ['user-services-history'],
    queryFn: async () => {
      const serviceIds = [...new Set(appointments.map(a => a.service_id))];
      if (serviceIds.length === 0) return [];
      const allServices = await base44.entities.Service.list();
      return allServices.filter(s => serviceIds.includes(s.id));
    },
    enabled: appointments.length > 0,
    initialData: [],
  });

  const completedAppointments = appointments.filter(a => a.status === "completed");
  
  const totalSpent = completedAppointments.reduce((sum, apt) => {
    const service = services.find(s => s.id === apt.service_id);
    return sum + (service?.price || 0);
  }, 0);

  const businessVisitCounts = {};
  completedAppointments.forEach(apt => {
    businessVisitCounts[apt.business_id] = (businessVisitCounts[apt.business_id] || 0) + 1;
  });

  const favoriteBusinessId = Object.keys(businessVisitCounts).reduce((a, b) => 
    businessVisitCounts[a] > businessVisitCounts[b] ? a : b, null
  );

  const favoriteBusiness = businesses.find(b => b.id === favoriteBusinessId);

  const petUsageCounts = {};
  completedAppointments.forEach(apt => {
    petUsageCounts[apt.pet_id] = (petUsageCounts[apt.pet_id] || 0) + 1;
  });

  if (!user) return null;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] bg-clip-text text-transparent">
              Mi Historial
            </span>
          </h1>
          <p className="text-gray-600">Revisa tu actividad y estadísticas</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="clay-card border-0">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total de Citas</p>
                  <p className="text-3xl font-bold text-gray-800">{appointments.length}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {completedAppointments.length} completadas
                  </p>
                </div>
                <div className="w-12 h-12 rounded-[16px] bg-gradient-to-br from-[#7B68BE] to-[#5BA3C9] clay-card flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="clay-card border-0">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Mis Mascotas</p>
                  <p className="text-3xl font-bold text-gray-800">{pets.length}</p>
                  <p className="text-xs text-gray-500 mt-1">registradas</p>
                </div>
                <div className="w-12 h-12 rounded-[16px] bg-gradient-to-br from-[#C8F4DE] to-[#B0E7C9] clay-card flex items-center justify-center">
                  <PawPrint className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="clay-card border-0">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Negocios Visitados</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {Object.keys(businessVisitCounts).length}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">diferentes</p>
                </div>
                <div className="w-12 h-12 rounded-[16px] bg-gradient-to-br from-[#C7E9F8] to-[#B0DCF0] clay-card flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="clay-card border-0">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Gastado</p>
                  <p className="text-3xl font-bold text-gray-800">${totalSpent.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 mt-1">en servicios</p>
                </div>
                <div className="w-12 h-12 rounded-[16px] bg-gradient-to-br from-[#FFE5E5] to-[#FFD1D1] clay-card flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Favorite Business */}
          {favoriteBusiness && (
            <Card className="clay-card border-0">
              <CardHeader>
                <CardTitle>Tu Negocio Favorito</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-[16px] overflow-hidden bg-gradient-to-br from-[#E6D9F5] to-[#C7E9F8] flex-shrink-0">
                    {favoriteBusiness.main_photo_url ? (
                      <img
                        src={favoriteBusiness.main_photo_url}
                        alt={favoriteBusiness.business_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-[#7B68BE]" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{favoriteBusiness.business_name}</h4>
                    <p className="text-sm text-gray-600">
                      Has visitado {businessVisitCounts[favoriteBusinessId]} veces
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pet Usage */}
          <Card className="clay-card border-0">
            <CardHeader>
              <CardTitle>Uso por Mascota</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pets.map(pet => {
                  const count = petUsageCounts[pet.id] || 0;
                  const percentage = appointments.length > 0 ? (count / completedAppointments.length) * 100 : 0;
                  
                  return (
                    <div key={pet.id}>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">{pet.name}</span>
                        <span className="text-sm text-gray-600">{count} citas</span>
                      </div>
                      <div className="h-2 rounded-full clay-inset bg-gray-100 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9]"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="clay-card border-0 mt-6">
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {completedAppointments.slice(0, 10).map(apt => {
                const pet = pets.find(p => p.id === apt.pet_id);
                const business = businesses.find(b => b.id === apt.business_id);
                const service = services.find(s => s.id === apt.service_id);
                
                return (
                  <div key={apt.id} className="flex items-center gap-4 clay-inset rounded-[12px] p-4 bg-gray-50">
                    <div className="flex-1">
                      <p className="font-medium">{business?.business_name}</p>
                      <p className="text-sm text-gray-600">
                        {service?.service_name} • {pet?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {format(new Date(apt.appointment_date), "dd MMM yyyy", { locale: es })}
                      </p>
                      <p className="text-xs text-gray-500">
                        ${service?.price || 0}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}