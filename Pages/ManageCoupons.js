import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, ArrowLeft, Percent, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import CouponFormModal from "../components/coupons/CouponFormModal";

export default function ManageCouponsPage() {
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  const { data: myBusiness } = useQuery({
    queryKey: ['my-business-coupons', user?.email],
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

  const { data: coupons, isLoading } = useQuery({
    queryKey: ['coupons-manage', business?.id],
    queryFn: async () => {
      if (!business) return [];
      return await base44.entities.Coupon.filter({ business_id: business.id }, '-created_date');
    },
    enabled: !!business,
    initialData: [],
  });

  const deleteMutation = useMutation({
    mutationFn: (couponId) => base44.entities.Coupon.update(couponId, { is_active: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons-manage'] });
    },
  });

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setShowForm(true);
  };

  const handleDelete = async (couponId) => {
    if (confirm('¿Estás seguro de desactivar esta promoción?')) {
      deleteMutation.mutate(couponId);
    }
  };

  const planLimits = {
    free: 0,
    basic: 2,
    premium: 5
  };

  if (!user || !business) return null;

  const activeCoupons = coupons.filter(c => c.is_active && new Date(c.valid_until) >= new Date());
  const maxCoupons = planLimits[business.subscription_plan];
  const canCreateMore = activeCoupons.length < maxCoupons;

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
                Gestionar Promociones
              </span>
            </h1>
            <p className="text-gray-600">
              {activeCoupons.length} de {maxCoupons} promociones activas
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingCoupon(null);
              setShowForm(true);
            }}
            disabled={!canCreateMore}
            className="clay-button rounded-[16px] bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Promoción
          </Button>
        </div>

        {business.subscription_plan === 'free' && (
          <Card className="clay-card border-0 bg-gradient-to-r from-[#FFE5E5] to-[#FFD1D1] mb-6">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="text-4xl">🔒</div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Promociones no disponibles en plan Gratis</h3>
                  <p className="text-sm text-gray-700 mb-3">
                    Actualiza a plan Básico o Premium para crear promociones y atraer más clientes
                  </p>
                  <Link to={createPageUrl("PricingPlans")}>
                    <Button size="sm" className="clay-button rounded-[12px]">
                      Ver Planes
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
        ) : coupons.length === 0 ? (
          <Card className="clay-card border-0">
            <CardContent className="p-12 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-bold mb-2">No tienes promociones creadas</h3>
              <p className="text-gray-600 mb-6">Crea promociones para atraer nuevos clientes</p>
              {canCreateMore && (
                <Button
                  onClick={() => setShowForm(true)}
                  className="clay-button rounded-[16px] bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Promoción
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {coupons.map(coupon => {
              const isExpired = new Date(coupon.valid_until) < new Date();
              const isActive = coupon.is_active && !isExpired;
              
              return (
                <Card key={coupon.id} className={`clay-card border-0 hover:scale-[1.02] transition-all ${!isActive && 'opacity-60'}`}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-bold">{coupon.title}</h3>
                          {isActive ? (
                            <Badge className="bg-green-100 text-green-800">Activa</Badge>
                          ) : isExpired ? (
                            <Badge className="bg-gray-100 text-gray-800">Expirada</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">Inactiva</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{coupon.description}</p>
                        
                        <div className="flex items-center gap-4 mb-3">
                          <div className="flex items-center gap-2">
                            {coupon.discount_type === 'percentage' ? (
                              <Percent className="w-4 h-4 text-[#7B68BE]" />
                            ) : (
                              <DollarSign className="w-4 h-4 text-[#7B68BE]" />
                            )}
                            <span className="font-bold text-[#7B68BE] text-xl">
                              {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `$${coupon.discount_value}`}
                            </span>
                          </div>
                          
                          <div className="text-sm text-gray-500">
                            Código: <span className="font-mono font-bold">{coupon.code}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-500">
                          <p>📅 Válido hasta: {format(new Date(coupon.valid_until), "dd MMM yyyy", { locale: es })}</p>
                          <p>🎫 Usos: {coupon.usage_count} {coupon.usage_limit ? `de ${coupon.usage_limit}` : ''}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        onClick={() => handleEdit(coupon)}
                        variant="outline"
                        size="sm"
                        className="flex-1 clay-button rounded-[12px]"
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                      {isActive && (
                        <Button
                          onClick={() => handleDelete(coupon.id)}
                          variant="outline"
                          size="sm"
                          className="clay-button rounded-[12px] text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {showForm && (
        <CouponFormModal
          coupon={editingCoupon}
          businessId={business.id}
          onClose={() => {
            setShowForm(false);
            setEditingCoupon(null);
          }}
        />
      )}
    </div>
  );
}