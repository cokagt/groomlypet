import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, Crown, Zap, Store, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ContactSalesModal from "../components/contact/ContactSalesModal";

export default function PricingPlansPage() {
  const navigate = useNavigate();
  const [showContactModal, setShowContactModal] = useState(false);

  const plans = [
    {
      name: "Gratis / Prueba",
      price: "0",
      period: "Siempre gratis",
      description: "Perfecto para comenzar y probar la plataforma",
      color: "from-gray-400 to-gray-500",
      features: [
        { text: "15 citas por mes", included: true },
        { text: "8 días como empresa nueva", included: true },
        { text: "Hasta 8 fotos", included: true },
        { text: "Perfil básico", included: true },
        { text: "1 sucursal", included: true },
        { text: "Sin promociones", included: false },
        { text: "No aparece en destacados", included: false },
        { text: "Estadísticas básicas", included: true },
        { text: "Soporte por email", included: true },
      ]
    },
    {
      name: "Básico",
      price: "31.99",
      period: "por mes",
      description: "Ideal para negocios en crecimiento",
      color: "from-[#7B68BE] to-[#5BA3C9]",
      popular: true,
      features: [
        { text: "50 citas por mes", included: true },
        { text: "15 días como empresa nueva", included: true },
        { text: "Hasta 10 fotos", included: true },
        { text: "Perfil completo", included: true },
        { text: "Hasta 3 sucursales", included: true },
        { text: "2 promociones por mes", included: true },
        { text: "No aparece en destacados", included: false },
        { text: "Estadísticas avanzadas", included: true },
        { text: "Soporte prioritario", included: true },
      ]
    },
    {
      name: "Premium",
      price: "54.99",
      period: "por mes",
      description: "Para negocios establecidos con múltiples ubicaciones",
      color: "from-[#FFD700] to-[#FFA500]",
      premium: true,
      features: [
        { text: "150 citas por mes (entre todas las sucursales)", included: true },
        { text: "30 días como empresa nueva", included: true },
        { text: "Fotos ilimitadas", included: true },
        { text: "Perfil destacado", included: true },
        { text: "Hasta 3 sucursales", included: true },
        { text: "5 promociones por mes", included: true },
        { text: "Aparece en sección destacados", included: true },
        { text: "Estadísticas premium", included: true },
        { text: "Soporte 24/7", included: true },
        { text: "Badge Premium ⭐", included: true },
        { text: "Prioridad en búsquedas", included: true },
      ]
    },
    {
      name: "Enterprise",
      price: "79.99",
      period: "por mes",
      description: "Máxima expansión sin límites",
      color: "from-[#9333EA] to-[#C026D3]",
      enterprise: true,
      features: [
        { text: "Citas ilimitadas", included: true },
        { text: "60 días como empresa nueva", included: true },
        { text: "Fotos ilimitadas", included: true },
        { text: "Perfil destacado premium", included: true },
        { text: "Sucursales ilimitadas", included: true },
        { text: "Promociones ilimitadas", included: true },
        { text: "Aparece en sección destacados", included: true },
        { text: "Estadísticas avanzadas", included: true },
        { text: "Soporte prioritario 24/7", included: true },
        { text: "Badge Enterprise 👑", included: true },
        { text: "Máxima prioridad en búsquedas", included: true },
        { text: "Gestor de cuenta dedicado", included: true },
      ]
    },
    {
      name: "Agropecuaria / Tienda",
      price: "45.00",
      period: "por mes",
      description: "Para tiendas de productos, accesorios y alimentos",
      color: "from-[#6BBF98] to-[#C8F4DE]",
      store: true,
      features: [
        { text: "Catálogo de hasta 15 productos", included: true },
        { text: "Perfil de tienda especializado", included: true },
        { text: "Ubicación en mapa", included: true },
        { text: "Redes sociales y contacto", included: true },
        { text: "Fotos de productos", included: true },
        { text: "Sin sistema de citas", included: false },
        { text: "Sin amenidades", included: false },
        { text: "Visible en búsquedas", included: true },
        { text: "Soporte por email", included: true },
      ]
    },
  ];

  return (
    <div className="min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] bg-clip-text text-transparent">
              Planes y Precios
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Elige el plan perfecto para hacer crecer tu negocio
          </p>
          <div className="inline-flex items-center gap-2 px-6 py-3 clay-card rounded-full bg-gradient-to-r from-[#E6D9F5] to-[#C8F4DE]">
            <Zap className="w-5 h-5 text-[#7B68BE]" />
            <span className="font-medium text-[#7B68BE]">Todos los planes incluyen 14 días de prueba gratis</span>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-6 mb-16">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`clay-card border-0 relative overflow-hidden ${
                plan.popular ? 'ring-2 ring-[#7B68BE] scale-105' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] text-white px-4 py-1 text-xs font-bold">
                  MÁS POPULAR
                </div>
              )}
              
              {plan.premium && (
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#FFD700] to-[#FFA500]" />
              )}

              {plan.enterprise && (
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#9333EA] to-[#C026D3]" />
              )}

              {plan.store && (
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#6BBF98] to-[#C8F4DE]" />
              )}

              <CardHeader className="pt-8">
                <div className={`w-14 h-14 rounded-[16px] bg-gradient-to-br ${plan.color} clay-card flex items-center justify-center mb-4`}>
                  {plan.premium ? (
                    <Crown className="w-7 h-7 text-white" />
                  ) : plan.store ? (
                    <Store className="w-7 h-7 text-white" />
                  ) : (
                    <Building2 className="w-7 h-7 text-white" />
                  )}
                </div>
                
                <CardTitle className="text-xl mb-2">{plan.name}</CardTitle>
                <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                
                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-gray-500 text-sm">{plan.period}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <Button 
                  onClick={() => navigate(createPageUrl("MyBusiness"))}
                  className={`w-full clay-button rounded-[16px] mb-6 ${
                    plan.enterprise
                      ? 'bg-gradient-to-r from-[#9333EA] to-[#C026D3] text-white hover:shadow-2xl'
                      : plan.premium 
                      ? 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-white hover:shadow-2xl' 
                      : plan.popular
                      ? 'bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] text-white'
                      : plan.store
                      ? 'bg-gradient-to-r from-[#6BBF98] to-[#C8F4DE] text-white'
                      : 'bg-white'
                  }`}
                >
                  {plan.price === "0" ? "Comenzar Gratis" : "Elegir Plan"}
                </Button>

                <div className="space-y-2">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      {feature.included ? (
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-gray-300 flex-shrink-0" />
                      )}
                      <span className={`text-xs ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="clay-card rounded-[32px] bg-white p-12">
          <h2 className="text-3xl font-bold text-center mb-8">
            Preguntas Frecuentes
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-2">¿Puedo cambiar de plan en cualquier momento?</h3>
              <p className="text-gray-600">Sí, puedes actualizar o degradar tu plan en cualquier momento desde tu panel de control.</p>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-2">¿Hay costos ocultos?</h3>
              <p className="text-gray-600">No, el precio que ves es el precio que pagas. Sin cargos adicionales ni sorpresas.</p>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-2">¿Qué pasa si excedo mi límite de citas?</h3>
              <p className="text-gray-600">Te notificaremos cuando estés cerca del límite. Puedes actualizar tu plan o esperar al próximo mes.</p>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-2">¿El plan Agropecuaria es para mí?</h3>
              <p className="text-gray-600">Es ideal si vendes productos, alimentos o accesorios para mascotas y no necesitas sistema de citas.</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <h3 className="text-2xl font-bold mb-4">¿Aún tienes dudas?</h3>
          <p className="text-gray-600 mb-6">Contáctanos y te ayudaremos a elegir el mejor plan para tu negocio</p>
          <Button 
            onClick={() => setShowContactModal(true)}
            className="clay-button rounded-[16px] bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] text-white px-8 py-6"
          >
            Contactar Ventas
          </Button>
        </div>

        <ContactSalesModal 
          isOpen={showContactModal} 
          onClose={() => setShowContactModal(false)} 
        />
      </div>
    </div>
  );
}