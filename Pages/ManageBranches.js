import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, MapPin, Phone, Edit, Trash2, Building2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ManageBranchesPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [mainBusiness, setMainBusiness] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  const { data: business } = useQuery({
    queryKey: ['main-business', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const businesses = await base44.entities.Business.filter({ 
        owner_email: user.email,
        is_branch: false
      });
      return businesses[0];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (business) setMainBusiness(business);
  }, [business]);

  const { data: branches } = useQuery({
    queryKey: ['branches', mainBusiness?.id],
    queryFn: async () => {
      if (!mainBusiness) return [];
      return await base44.entities.Business.filter({ 
        parent_business_id: mainBusiness.id,
        is_branch: true
      });
    },
    enabled: !!mainBusiness,
    initialData: [],
  });

  const deleteBranchMutation = useMutation({
    mutationFn: async (branchId) => {
      await base44.entities.Business.delete(branchId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
  });

  const queryClient = useQueryClient();

  const handleDelete = (branchId) => {
    if (confirm('¿Estás seguro de eliminar esta sucursal?')) {
      deleteBranchMutation.mutate(branchId);
    }
  };

  if (!user || !mainBusiness) return null;

  const planLimits = {
    free: 1,
    basic: 3,
    premium: 3,
    enterprise: 999,
    store: 5
  };

  const maxBranches = planLimits[mainBusiness.subscription_plan] || 1;
  const canAddMore = branches.length < maxBranches;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl("BusinessDashboard")}>
            <Button variant="outline" size="icon" className="clay-button rounded-[16px]">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold">
              <span className="bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] bg-clip-text text-transparent">
                Gestionar Sucursales
              </span>
            </h1>
            <p className="text-gray-600">Administra las ubicaciones de tu negocio</p>
          </div>
        </div>

        {/* Plan Info */}
        <Card className="clay-card border-0 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg mb-2">Tu Plan: {mainBusiness.subscription_plan.toUpperCase()}</h3>
                <p className="text-gray-600">
                  {branches.length} de {maxBranches === 999 ? 'ilimitadas' : maxBranches} sucursales utilizadas
                </p>
              </div>
              {!canAddMore && maxBranches !== 999 && (
                <Link to={createPageUrl("PricingPlans")}>
                  <Button className="clay-button rounded-[16px] bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] text-white">
                    Mejorar Plan
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Business */}
        <Card className="clay-card border-0 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#7B68BE]" />
              Ubicación Principal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="clay-inset rounded-[16px] p-4 bg-gradient-to-r from-[#E6D9F5] to-[#C8F4DE]">
              <h4 className="font-bold text-lg mb-2">{mainBusiness.business_name}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#7B68BE]" />
                  <span>{mainBusiness.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#7B68BE]" />
                  <span>{mainBusiness.phone}</span>
                </div>
              </div>
              <div className="mt-4">
                <Link to={createPageUrl("MyBusiness")}>
                  <Button variant="outline" className="clay-button rounded-[12px] w-full">
                    <Edit className="w-4 h-4 mr-2" />
                    Editar Ubicación Principal
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Branches List */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Sucursales ({branches.length})</h2>
          {canAddMore && (
            <Link to={createPageUrl("MyBusiness") + "?new_branch=true"}>
              <Button className="clay-button rounded-[16px] bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Agregar Sucursal
              </Button>
            </Link>
          )}
        </div>

        {branches.length === 0 ? (
          <Card className="clay-card border-0">
            <CardContent className="p-12 text-center">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">No tienes sucursales</h3>
              <p className="text-gray-600 mb-6">
                Agrega sucursales para expandir tu presencia
              </p>
              {canAddMore && (
                <Link to={createPageUrl("MyBusiness") + "?new_branch=true"}>
                  <Button className="clay-button rounded-[16px] bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Primera Sucursal
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {branches.map((branch) => (
              <Card key={branch.id} className="clay-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{branch.business_name}</span>
                    <Badge className="bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] text-white">
                      Sucursal
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-[#7B68BE] mt-1" />
                      <span className="text-gray-700">{branch.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-[#7B68BE]" />
                      <span className="text-gray-700">{branch.phone}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => navigate(createPageUrl("MyBusiness") + `?branch_id=${branch.id}`)}
                      variant="outline"
                      className="flex-1 clay-button rounded-[12px]"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar Completo
                    </Button>
                    <Button
                      onClick={() => handleDelete(branch.id)}
                      variant="outline"
                      className="clay-button rounded-[12px] text-red-500 border-red-200 hover:bg-red-50"
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
    </div>
  );
}