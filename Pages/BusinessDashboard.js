import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Calendar, Users, DollarSign, Star, TrendingUp,
  Clock, CheckCircle, XCircle, Plus, Settings
} from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";

export default function BusinessDashboardPage() {
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      if (currentUser.user_type !== "business") {
        window.location.href = "/";
        return;
      }
      setUser(currentUser);
    };
    loadUser();
  }, []);

  const { data: myBusiness } = useQuery({
    queryKey: ['my-business-dashboard', user?.email],
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

  const { data: appointments } = useQuery({
    queryKey: ['business-appointments', business?.id],
    queryFn: async () => {
      if (!business) return [];
      return await base44.entities.Appointment.filter({ business_id: business.id }, '-appointment_date');
    },
    enabled: !!business,
    initialData: [],
  });

  const { data: services } = useQuery({
    queryKey: ['business-services', business?.id],
    queryFn: async () => {
      if (!business) return [];
      return await base44.entities.Service.filter({ business_id: business.id });
    },
    enabled: !!business,
    initialData: [],
  });

  const { data: coupons } = useQuery({
    queryKey: ['business-coupons', business?.id],
    queryFn: async () => {
      if (!business) return [];
      return await base44.entities.Coupon.filter({ business_id: business.id });
    },
    enabled: !!business,
    initialData: [],
  });

  const { data: reviews } = useQuery({
    queryKey: ['business-reviews', business?.id],
    queryFn: async () => {
      if (!business) return [];
      return await base44.entities.Review.filter({ business_id: business.id });
    },
    enabled: !!business,
    initialData: [],
  });

  if (!user || !business) return null;

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const thisMonthAppointments = appointments.filter(apt => {
    const date = new Date(apt.appointment_date);
    return date >= monthStart && date <= monthEnd;
  });

  const completedAppointments = appointments.filter(a => a.status === "completed");
  const thisMonthRevenue = completedAppointments
    .filter(apt => {
      const date = new Date(apt.appointment_date);
      return date >= monthStart && date <= monthEnd;
    })
    .reduce((sum, apt) => {
      const service = services.find(s => s.id === apt.service_id);
      return sum + (service?.price || 0);
    }, 0);

  const planLimits = {
    free: { appointments: 15, coupons: 0 },
    basic: { appointments: 50, coupons: 2 },
    premium: { appointments: 150, coupons: 5 },
    enterprise: { appointments: 999999, coupons: 999 },
    store: { appointments: 0, coupons: 3 }
  };

  const activeCoupons = coupons.filter(c => c.is_active && new Date(c.valid_until) >= now).length;
  const currentLimit = planLimits[business.subscription_plan];

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] bg-clip-text text-transparent">
                Dashboard
              </span>
            </h1>
            <p className="text-gray-600">{business.business_name}</p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Link to={createPageUrl("ManageServices")}>
              <Button className="clay-button rounded-[16px] bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] text-white">
                <Settings className="w-4 h-4 mr-2" />
                Gestionar Servicios
              </Button>
            </Link>
            <Link to={createPageUrl("ManageBranches")}>
              <Button variant="outline" className="clay-button rounded-[16px]">
                <Plus className="w-4 h-4 mr-2" />
                Sucursales
              </Button>
            </Link>
            <Link to={createPageUrl("ManageCoupons")}>
              <Button variant="outline" className="clay-button rounded-[16px]">
                <Plus className="w-4 h-4 mr-2" />
                Promociones
              </Button>
            </Link>
            {business?.accepts_point_redemptions && (
              <Link to={createPageUrl("ManageRedeemables")}>
                <Button variant="outline" className="clay-button rounded-[16px] border-2 border-[#FFD700] text-[#FFA500] hover:bg-[#FFF9E6]">
                  <Star className="w-4 h-4 mr-2" />
                  Canjes por Puntos
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="clay-card border-0">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Citas Este Mes</p>
                  <p className="text-3xl font-bold text-gray-800">{thisMonthAppointments.length}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {currentLimit.appointments === 999999 ? 'Ilimitadas' : `de ${currentLimit.appointments} máx`}
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
                  <p className="text-sm text-gray-600 mb-1">Ingresos del Mes</p>
                  <p className="text-3xl font-bold text-gray-800">${thisMonthRevenue.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 mt-1">en servicios</p>
                </div>
                <div className="w-12 h-12 rounded-[16px] bg-gradient-to-br from-[#6BBF98] to-[#C8F4DE] clay-card flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="clay-card border-0">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Calificación</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {business.rating_average?.toFixed(1) || "5.0"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{business.total_reviews || 0} reseñas</p>
                </div>
                <div className="w-12 h-12 rounded-[16px] bg-gradient-to-br from-[#FFD700] to-[#FFA500] clay-card flex items-center justify-center">
                  <Star className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="clay-card border-0">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Promociones Activas</p>
                  <p className="text-3xl font-bold text-gray-800">{activeCoupons}</p>
                  <p className="text-xs text-gray-500 mt-1">de {currentLimit.coupons} máx</p>
                </div>
                <div className="w-12 h-12 rounded-[16px] bg-gradient-to-br from-[#FF6B6B] to-[#FFD1D1] clay-card flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Appointments */}
          <Card className="clay-card border-0">
            <CardHeader>
              <CardTitle>Próximas Citas</CardTitle>
            </CardHeader>
            <CardContent>
              {appointments.filter(a => new Date(a.appointment_date) >= now && a.status !== "cancelled").slice(0, 5).length === 0 ? (
                <p className="text-center text-gray-500 py-8">No hay citas próximas</p>
              ) : (
                <div className="space-y-3">
                  {appointments.filter(a => new Date(a.appointment_date) >= now && a.status !== "cancelled").slice(0, 5).map(apt => (
                    <div key={apt.id} className="flex items-center justify-between clay-inset rounded-[12px] p-3 bg-gray-50">
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-[#7B68BE]" />
                        <div>
                          <p className="font-medium text-sm">{format(new Date(apt.appointment_date), "dd MMM, HH:mm", { locale: es })}</p>
                          <p className="text-xs text-gray-500">Cliente: {apt.user_email}</p>
                        </div>
                      </div>
                      {apt.status === "confirmed" ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <Clock className="w-5 h-5 text-yellow-500" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Reviews */}
          <Card className="clay-card border-0">
            <CardHeader>
              <CardTitle>Reseñas Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              {reviews.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Aún no hay reseñas</p>
              ) : (
                <div className="space-y-3">
                  {reviews.slice(0, 5).map(review => (
                    <div key={review.id} className="clay-inset rounded-[12px] p-3 bg-gray-50">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">
                          {format(new Date(review.created_date), "dd MMM", { locale: es })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}