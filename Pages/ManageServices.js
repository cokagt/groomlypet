import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Edit2, Trash2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ServiceFormModal from "../components/services/ServiceFormModal";

export default function ManageServicesPage() {
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  const { data: myBusiness } = useQuery({
    queryKey: ['my-business-services', user?.email],
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

  const { data: services, isLoading } = useQuery({
    queryKey: ['services-manage', business?.id],
    queryFn: async () => {
      if (!business) return [];
      return await base44.entities.Service.filter({ business_id: business.id });
    },
    enabled: !!business,
    initialData: [],
  });

  const deleteMutation = useMutation({
    mutationFn: (serviceId) => base44.entities.Service.update(serviceId, { is_active: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services-manage'] });
    },
  });

  const handleEdit = (service) => {
    setEditingService(service);
    setShowForm(true);
  };

  const handleDelete = async (serviceId) => {
    if (confirm('¿Estás seguro de eliminar este servicio?')) {
      deleteMutation.mutate(serviceId);
    }
  };

  if (!user || !business) return null;

  const isAgropecuaria = (business.categories || []).includes('agropecuaria') || business.business_type === 'store';
  const itemLabel = isAgropecuaria ? 'Producto' : 'Servicio';
  const itemLabelPlural = isAgropecuaria ? 'Productos' : 'Servicios';

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl("BusinessDashboard")}>
            <Button variant="outline" size="icon" className="clay-button rounded-[16px]">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-4xl font-bold">
              <span className="bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] bg-clip-text text-transparent">
                Gestionar {itemLabelPlural}
              </span>
            </h1>
            <p className="text-gray-600">Administra {isAgropecuaria ? 'los productos que vendes' : 'los servicios que ofreces'}</p>
          </div>
          <Button
            onClick={() => {
              setEditingService(null);
              setShowForm(true);
            }}
            className="clay-button rounded-[16px] bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo {itemLabel}
          </Button>
        </div>

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
        ) : services.filter(s => s.is_active).length === 0 ? (
          <Card className="clay-card border-0">
            <CardContent className="p-12 text-center">
              <div className="text-6xl mb-4">{isAgropecuaria ? '📦' : '🛠️'}</div>
              <h3 className="text-xl font-bold mb-2">No tienes {itemLabelPlural.toLowerCase()} registrados</h3>
              <p className="text-gray-600 mb-6">Agrega tu primer {itemLabel.toLowerCase()} para comenzar</p>
              <Button
                onClick={() => setShowForm(true)}
                className="clay-button rounded-[16px] bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear {itemLabel}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {services.filter(s => s.is_active).map(service => (
              <Card key={service.id} className="clay-card border-0 hover:scale-[1.02] transition-all">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">{service.service_name}</h3>
                      <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                      
                      {service.duration_minutes && (
                        <p className="text-sm text-gray-500 mb-2">
                          ⏱️ Duración: {service.duration_minutes} minutos
                        </p>
                      )}
                      
                      {service.available_for_species && service.available_for_species.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {service.available_for_species.map(species => (
                            <span key={species} className="text-xs px-2 py-1 clay-inset rounded-full bg-gray-50">
                              {species === 'dog' ? '🐕' : species === 'cat' ? '🐈' : species === 'bird' ? '🦜' : species === 'rabbit' ? '🐰' : '🐾'} {species}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-[#7B68BE]">
                        ${service.price}
                      </div>
                      <div className="text-xs text-gray-500">{service.currency || 'USD'}</div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      onClick={() => handleEdit(service)}
                      variant="outline"
                      size="sm"
                      className="flex-1 clay-button rounded-[12px]"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      onClick={() => handleDelete(service.id)}
                      variant="outline"
                      size="sm"
                      className="clay-button rounded-[12px] text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <ServiceFormModal
          service={editingService}
          businessId={business.id}
          isProduct={isAgropecuaria}
          onClose={() => {
            setShowForm(false);
            setEditingService(null);
          }}
        />
      )}
    </div>
  );
}