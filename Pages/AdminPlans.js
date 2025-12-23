import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Building2, Crown, CheckCircle } from "lucide-react";

export default function AdminPlansPage() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
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

  const { data: businesses, isLoading } = useQuery({
    queryKey: ['all-businesses-admin'],
    queryFn: () => base44.entities.Business.list('-created_date'),
    initialData: [],
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({ businessId, plan }) => 
      base44.entities.Business.update(businessId, { subscription_plan: plan }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-businesses-admin'] });
    },
  });

  const filteredBusinesses = businesses.filter(b =>
    b.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.owner_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const planColors = {
    free: "bg-gray-100 text-gray-800",
    basic: "bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] text-white",
    premium: "bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-white",
    store: "bg-gradient-to-r from-[#6BBF98] to-[#2E7D32] text-white"
  };

  const planLimits = {
    free: {
      name: "Gratis / Prueba",
      appointments: 15,
      newBusinessDays: 8,
      photos: 8,
      featured: false,
      description: "Perfecto para empezar"
    },
    basic: {
      name: "Básico",
      appointments: 50,
      newBusinessDays: 15,
      photos: 10,
      featured: false,
      description: "Para negocios en crecimiento"
    },
    premium: {
      name: "Premium",
      appointments: "Ilimitadas",
      newBusinessDays: 30,
      photos: "Ilimitadas",
      featured: true,
      description: "Máxima visibilidad y beneficios"
    },
    store: {
      name: "Agropecuaria / Tienda",
      appointments: "N/A",
      newBusinessDays: 15,
      photos: 15,
      featured: false,
      description: "Para tiendas y agropecuarias"
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] bg-clip-text text-transparent">
              Gestión de Planes
            </span>
          </h1>
          <p className="text-gray-600">Administra los planes de suscripción de los negocios</p>
        </div>

        {/* Plans Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Object.entries(planLimits).map(([key, plan]) => (
            <Card key={key} className="clay-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{plan.name}</span>
                  {key === 'premium' && <Crown className="w-5 h-5 text-yellow-500" />}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>{plan.appointments} citas/mes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>{plan.newBusinessDays} días como nuevo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>{plan.photos} fotos</span>
                  </li>
                  {plan.featured && (
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Aparece en destacados</span>
                    </li>
                  )}
                </ul>
                <div className="mt-4 pt-4 border-t">
                  <Badge className={planColors[key]}>
                    {businesses.filter(b => b.subscription_plan === key).length} negocios
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <Card className="clay-card border-0 mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Buscar por nombre de negocio o email del dueño..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 clay-button rounded-[16px] border-0"
              />
            </div>
          </CardContent>
        </Card>

        {/* Business List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="clay-card border-0 animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBusinesses.map((business) => (
              <Card key={business.id} className="clay-card border-0 hover:scale-[1.01] transition-all">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-16 h-16 rounded-[16px] bg-gradient-to-br from-[#E6D9F5] to-[#C7E9F8] clay-card flex items-center justify-center flex-shrink-0">
                        {business.main_photo_url ? (
                          <img
                            src={business.main_photo_url}
                            alt={business.business_name}
                            className="w-full h-full object-cover rounded-[16px]"
                          />
                        ) : (
                          <Building2 className="w-8 h-8 text-[#7B68BE]" />
                        )}
                      </div>

                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">{business.business_name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{business.owner_email}</p>
                        
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-xs">
                            {business.category?.replace('_', ' ')}
                          </Badge>
                          <Badge className={planColors[business.subscription_plan]}>
                            {planLimits[business.subscription_plan].name}
                          </Badge>
                          {business.is_active ? (
                            <Badge className="bg-green-100 text-green-800">Activo</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">Inactivo</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 w-full md:w-48">
                      <Select
                        value={business.subscription_plan}
                        onValueChange={(value) => {
                          if (confirm(`¿Cambiar plan de ${business.business_name} a ${planLimits[value].name}?`)) {
                            updatePlanMutation.mutate({ 
                              businessId: business.id, 
                              plan: value 
                            });
                          }
                        }}
                      >
                        <SelectTrigger className="clay-button rounded-[12px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Gratis</SelectItem>
                          <SelectItem value="basic">Básico</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="store">Agropecuaria / Tienda</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/BusinessDetail?id=${business.id}`, '_blank')}
                        className="clay-button rounded-[12px]"
                      >
                        Ver Perfil
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredBusinesses.length === 0 && !isLoading && (
          <Card className="clay-card border-0">
            <CardContent className="p-12 text-center">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No se encontraron negocios</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}