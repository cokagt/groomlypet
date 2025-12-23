import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Calendar, Clock, User, PawPrint, Search, 
  CheckCircle, XCircle, Filter, Download, Star
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function BusinessHistoryPage() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  // Obtener el negocio del usuario
  const { data: business } = useQuery({
    queryKey: ['my-business', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const businesses = await base44.entities.Business.filter({ owner_email: user.email });
      return businesses[0] || null;
    },
    enabled: !!user,
  });

  // Obtener todas las citas del negocio
  const { data: appointments, isLoading } = useQuery({
    queryKey: ['business-history', business?.id],
    queryFn: async () => {
      if (!business) return [];
      return await base44.entities.Appointment.filter(
        { business_id: business.id },
        '-appointment_date'
      );
    },
    enabled: !!business,
    initialData: [],
  });

  // Obtener reseñas del negocio
  const { data: reviews } = useQuery({
    queryKey: ['business-reviews', business?.id],
    queryFn: async () => {
      if (!business) return [];
      return await base44.entities.Review.filter({ business_id: business.id });
    },
    enabled: !!business,
    initialData: [],
  });

  // Filtrar citas
  const filteredAppointments = appointments.filter(apt => {
    // Filtro por búsqueda
    const matchesSearch = 
      apt.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.pet_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.service_name?.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtro por estado
    const matchesStatus = statusFilter === "all" || apt.status === statusFilter;

    // Filtro por fecha
    let matchesDate = true;
    if (dateFilter !== "all") {
      const aptDate = new Date(apt.appointment_date);
      const now = new Date();
      const daysDiff = Math.floor((now - aptDate) / (1000 * 60 * 60 * 24));
      
      if (dateFilter === "week") matchesDate = daysDiff <= 7;
      else if (dateFilter === "month") matchesDate = daysDiff <= 30;
      else if (dateFilter === "3months") matchesDate = daysDiff <= 90;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Estadísticas
  const stats = {
    total: appointments.length,
    completed: appointments.filter(a => a.status === "completed").length,
    cancelled: appointments.filter(a => a.status === "cancelled").length,
    avgRating: reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) 
      : 0
  };

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
              Historial de Citas
            </span>
          </h1>
          <p className="text-gray-600">
            Consulta el historial completo de citas de tu negocio
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="clay-card border-0">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-[#7B68BE]">{stats.total}</div>
              <p className="text-sm text-gray-600">Total Citas</p>
            </CardContent>
          </Card>
          <Card className="clay-card border-0">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
              <p className="text-sm text-gray-600">Completadas</p>
            </CardContent>
          </Card>
          <Card className="clay-card border-0">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-red-500">{stats.cancelled}</div>
              <p className="text-sm text-gray-600">Canceladas</p>
            </CardContent>
          </Card>
          <Card className="clay-card border-0">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-yellow-500 flex items-center justify-center gap-1">
                <Star className="w-6 h-6 fill-yellow-500" />
                {stats.avgRating}
              </div>
              <p className="text-sm text-gray-600">Calificación</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="clay-card border-0 mb-8">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar cliente, mascota..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 clay-inset rounded-[12px]"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="clay-button rounded-[12px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="completed">Completadas</SelectItem>
                  <SelectItem value="cancelled">Canceladas</SelectItem>
                  <SelectItem value="confirmed">Confirmadas</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="clay-button rounded-[12px]">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo el tiempo</SelectItem>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="month">Último mes</SelectItem>
                  <SelectItem value="3months">Últimos 3 meses</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="clay-button rounded-[12px]">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results count */}
        <p className="text-gray-600 mb-4">
          {filteredAppointments.length} cita{filteredAppointments.length !== 1 ? 's' : ''} encontrada{filteredAppointments.length !== 1 ? 's' : ''}
        </p>

        {/* Appointments List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="clay-card border-0 animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredAppointments.length === 0 ? (
          <Card className="clay-card border-0">
            <CardContent className="p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">No hay citas</h3>
              <p className="text-gray-600">No se encontraron citas con los filtros seleccionados</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map(apt => (
              <Card key={apt.id} className="clay-card border-0 hover:scale-[1.01] transition-all">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={statusColors[apt.status]}>
                          {statusLabels[apt.status]}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {apt.appointment_date && format(new Date(apt.appointment_date), "EEEE dd MMM yyyy", { locale: es })}
                        </span>
                        <span className="text-sm text-gray-500">
                          {apt.appointment_date && format(new Date(apt.appointment_date), "HH:mm")} hrs
                        </span>
                      </div>
                      
                      <div className="grid md:grid-cols-3 gap-4 mt-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{apt.user_name || apt.user_email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <PawPrint className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{apt.pet_name || 'Sin nombre'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{apt.service_name}</span>
                        </div>
                      </div>

                      {apt.notes && (
                        <p className="text-sm text-gray-500 mt-2 italic">"{apt.notes}"</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {apt.status === "completed" && (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                      )}
                      {apt.status === "cancelled" && (
                        <div className="flex items-center gap-1 text-red-500">
                          <XCircle className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}