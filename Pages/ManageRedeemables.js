import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit, Save, X, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ManageRedeemablesPage() {
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    service_name: "",
    points_required: "",
    min_tier: "silver",
    category: "basic",
    is_active: true
  });
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      if (currentUser.user_type !== 'business') {
        navigate(createPageUrl("Home"));
      }
    };
    loadUser();
  }, [navigate]);

  const { data: myBusiness } = useQuery({
    queryKey: ['my-business', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const businesses = await base44.entities.Business.filter({ owner_email: user.email });
      return businesses[0] || null;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (myBusiness) {
      setBusiness(myBusiness);
      if (!myBusiness.accepts_point_redemptions) {
        alert("Primero debes habilitar 'Aceptar canjes por puntos' en tu perfil de negocio");
        navigate(createPageUrl("MyBusiness"));
      }
    }
  }, [myBusiness, navigate]);

  const { data: redeemables } = useQuery({
    queryKey: ['business-redeemables', business?.id],
    queryFn: async () => {
      if (!business) return [];
      return await base44.entities.BusinessRedeemable.filter({ business_id: business.id });
    },
    enabled: !!business,
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.BusinessRedeemable.create({
        ...data,
        business_id: business.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-redeemables'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await base44.entities.BusinessRedeemable.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-redeemables'] });
      setEditingId(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return await base44.entities.BusinessRedeemable.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-redeemables'] });
    },
  });

  const resetForm = () => {
    setFormData({
      service_name: "",
      points_required: "",
      min_tier: "silver",
      category: "basic",
      is_active: true
    });
    setEditingId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      points_required: parseInt(formData.points_required)
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (redeemable) => {
    setFormData({
      service_name: redeemable.service_name,
      points_required: redeemable.points_required.toString(),
      min_tier: redeemable.min_tier,
      category: redeemable.category,
      is_active: redeemable.is_active
    });
    setEditingId(redeemable.id);
  };

  const predefinedServices = [
    { name: "Limado de uñas", points: 250, tier: "silver", category: "basic" },
    { name: "Cepillado de dientes", points: 300, tier: "silver", category: "basic" },
    { name: "Perfume o colonia premium", points: 300, tier: "silver", category: "basic" },
    { name: "Cepillado extra de pelaje", points: 350, tier: "silver", category: "basic" },
    { name: "Limpieza básica de oídos", points: 400, tier: "gold", category: "basic" },
    { name: "Desenredado leve / brushing especial", points: 450, tier: "gold", category: "basic" },
    { name: "Tratamiento básico (hidratante o brillo)", points: 500, tier: "gold", category: "basic" },
    { name: "Baño Express", points: 650, tier: "gold", category: "express" },
    { name: "Grooming Express", points: 900, tier: "platinum", category: "express" },
    { name: "Grooming Básico", points: 1200, tier: "platinum", category: "premium" },
    { name: "Grooming Básico con upgrade", points: 1500, tier: "platinum", category: "premium" },
    { name: "Servicio completo en horario específico", points: 2000, tier: "platinum", category: "complete" },
  ];

  const quickAdd = (service) => {
    setFormData({
      service_name: service.name,
      points_required: service.points.toString(),
      min_tier: service.tier,
      category: service.category,
      is_active: true
    });
  };

  const tierLabels = {
    bronze: "🥉 Bronce",
    silver: "🥈 Plata",
    gold: "🥇 Oro",
    platinum: "💎 Platino"
  };

  const categoryLabels = {
    basic: "Básico",
    express: "Express",
    premium: "Premium",
    complete: "Completo"
  };

  if (!user || !business) return null;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => navigate(createPageUrl("BusinessDashboard"))}
            className="mb-4 clay-button rounded-[12px]"
          >
            ← Volver al Dashboard
          </Button>
          <h1 className="text-4xl font-bold">
            <span className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
              Canjes por Puntos
            </span>
          </h1>
          <p className="text-gray-600 mt-2">
            Configura los servicios que los clientes pueden canjear con sus puntos de recompensas
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Formulario */}
          <Card className="clay-card border-0">
            <CardHeader>
              <CardTitle>{editingId ? 'Editar' : 'Agregar'} Servicio Canjeable</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Nombre del Servicio *</Label>
                  <Input
                    value={formData.service_name}
                    onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                    required
                    className="clay-button rounded-[12px] mt-2"
                    placeholder="Ej: Limado de uñas"
                  />
                </div>

                <div>
                  <Label>Puntos Requeridos *</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.points_required}
                    onChange={(e) => setFormData({ ...formData, points_required: e.target.value })}
                    required
                    className="clay-button rounded-[12px] mt-2"
                    placeholder="250"
                  />
                </div>

                <div>
                  <Label>Nivel Mínimo Requerido</Label>
                  <Select
                    value={formData.min_tier}
                    onValueChange={(value) => setFormData({ ...formData, min_tier: value })}
                  >
                    <SelectTrigger className="clay-button rounded-[12px] mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(tierLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Categoría</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className="clay-button rounded-[12px] mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>Servicio activo</Label>
                </div>

                <div className="flex gap-2">
                  {editingId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                      className="flex-1 clay-button rounded-[12px]"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1 clay-button rounded-[12px] bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingId ? 'Actualizar' : 'Agregar'}
                  </Button>
                </div>
              </form>

              {/* Servicios Sugeridos */}
              <div className="mt-6 pt-6 border-t">
                <Label className="mb-3 block">Servicios Sugeridos (Click para agregar rápido)</Label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {predefinedServices.map((service, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => quickAdd(service)}
                      className="w-full text-left clay-card rounded-[12px] p-3 hover:bg-gradient-to-r hover:from-[#E6D9F5] hover:to-[#C8F4DE] transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{service.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-white text-xs">
                            {service.points} pts
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {tierLabels[service.tier]}
                          </Badge>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Canjes */}
          <Card className="clay-card border-0">
            <CardHeader>
              <CardTitle>Servicios Configurados ({redeemables.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {redeemables.length === 0 ? (
                <div className="text-center py-12">
                  <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Aún no has configurado servicios canjeables</p>
                  <p className="text-sm text-gray-500 mt-2">Agrega servicios para que los clientes puedan canjear sus puntos</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {redeemables.map((redeemable) => (
                    <div
                      key={redeemable.id}
                      className={`clay-card rounded-[12px] p-4 ${!redeemable.is_active ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-bold">{redeemable.service_name}</h4>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-white">
                              {redeemable.points_required} pts
                            </Badge>
                            <Badge variant="outline">
                              {tierLabels[redeemable.min_tier]}
                            </Badge>
                            <Badge variant="outline">
                              {categoryLabels[redeemable.category]}
                            </Badge>
                            {!redeemable.is_active && (
                              <Badge variant="secondary">Inactivo</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleEdit(redeemable)}
                            className="h-8 w-8 clay-button rounded-[8px]"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="destructive"
                            onClick={() => {
                              if (confirm('¿Eliminar este servicio canjeable?')) {
                                deleteMutation.mutate(redeemable.id);
                              }
                            }}
                            className="h-8 w-8"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
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
  );
}