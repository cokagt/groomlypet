import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Building2, Users, Calendar, DollarSign, 
  TrendingUp, Award, BarChart3 
} from "lucide-react";

export default function AdminDashboardPage() {
  const [user, setUser] = useState(null);

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

  const { data: businesses } = useQuery({
    queryKey: ['all-businesses'],
    queryFn: () => base44.entities.Business.list(),
    initialData: [],
  });

  const { data: users } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const { data: appointments } = useQuery({
    queryKey: ['all-appointments'],
    queryFn: () => base44.entities.Appointment.list(),
    initialData: [],
  });

  const stats = [
    {
      title: "Total Negocios",
      value: businesses.length,
      icon: Building2,
      color: "from-[#7B68BE] to-[#5BA3C9]",
      detail: `${businesses.filter(b => b.is_active).length} activos`
    },
    {
      title: "Total Usuarios",
      value: users.length,
      icon: Users,
      color: "from-[#5BA3C9] to-[#6BBF98]",
      detail: `${users.filter(u => u.user_type === "user").length} usuarios regulares`
    },
    {
      title: "Citas Totales",
      value: appointments.length,
      icon: Calendar,
      color: "from-[#6BBF98] to-[#C8F4DE]",
      detail: `${appointments.filter(a => a.status === "completed").length} completadas`
    },
    {
      title: "Planes Premium",
      value: businesses.filter(b => b.subscription_plan === "premium").length,
      icon: Award,
      color: "from-[#FFE5E5] to-[#FFD1D1]",
      detail: `${businesses.filter(b => b.subscription_plan === "basic").length} básicos`
    },
  ];

  const planDistribution = {
    free: businesses.filter(b => b.subscription_plan === "free").length,
    basic: businesses.filter(b => b.subscription_plan === "basic").length,
    premium: businesses.filter(b => b.subscription_plan === "premium").length,
  };

  if (!user) return null;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] bg-clip-text text-transparent">
              Panel de Administración
            </span>
          </h1>
          <p className="text-gray-600">Gestiona la plataforma Groomly</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="clay-card border-0 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{stat.detail}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-[16px] bg-gradient-to-br ${stat.color} clay-card flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Plans Distribution */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="clay-card border-0">
            <CardHeader>
              <CardTitle>Distribución de Planes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Gratis</span>
                    <span className="text-sm text-gray-600">{planDistribution.free} negocios</span>
                  </div>
                  <div className="h-3 rounded-full clay-inset bg-gray-100 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-gray-400 to-gray-500"
                      style={{ width: `${(planDistribution.free / businesses.length) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Básico</span>
                    <span className="text-sm text-gray-600">{planDistribution.basic} negocios</span>
                  </div>
                  <div className="h-3 rounded-full clay-inset bg-gray-100 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9]"
                      style={{ width: `${(planDistribution.basic / businesses.length) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Premium</span>
                    <span className="text-sm text-gray-600">{planDistribution.premium} negocios</span>
                  </div>
                  <div className="h-3 rounded-full clay-inset bg-gray-100 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#FFD700] to-[#FFA500]"
                      style={{ width: `${(planDistribution.premium / businesses.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="clay-card border-0">
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 clay-inset rounded-[12px] p-3 bg-gray-50">
                  <Building2 className="w-5 h-5 text-[#7B68BE]" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Nuevos negocios hoy</p>
                    <p className="text-xs text-gray-500">En espera de verificación</p>
                  </div>
                  <span className="font-bold text-[#7B68BE]">0</span>
                </div>

                <div className="flex items-center gap-3 clay-inset rounded-[12px] p-3 bg-gray-50">
                  <Calendar className="w-5 h-5 text-[#5BA3C9]" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Citas esta semana</p>
                    <p className="text-xs text-gray-500">En todos los negocios</p>
                  </div>
                  <span className="font-bold text-[#5BA3C9]">
                    {appointments.filter(a => {
                      const date = new Date(a.appointment_date);
                      const now = new Date();
                      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                      return date >= now && date <= weekFromNow;
                    }).length}
                  </span>
                </div>

                <div className="flex items-center gap-3 clay-inset rounded-[12px] p-3 bg-gray-50">
                  <Users className="w-5 h-5 text-[#6BBF98]" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Nuevos usuarios</p>
                    <p className="text-xs text-gray-500">Este mes</p>
                  </div>
                  <span className="font-bold text-[#6BBF98]">
                    {users.filter(u => {
                      const created = new Date(u.created_date);
                      const now = new Date();
                      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
                    }).length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}