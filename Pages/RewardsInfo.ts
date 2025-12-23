import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Gift, Users, TrendingUp, Zap, Award, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function RewardsInfoPage() {
  const baseActions = [
    { icon: "✅", action: "Completar perfil", points: 50 },
    { icon: "🐾", action: "Registrar mascota", points: 40 },
    { icon: "📅", action: "Reservar cita", points: 30 },
    { icon: "✨", action: "Completar cita", points: 40 },
    { icon: "⭐", action: "Enviar reseña", points: 30 },
    { icon: "📅", action: "Reagendar desde la app", points: 15 },
    { icon: "🔔", action: "Cancelar con anticipación", points: 10 },
  ];

  const frequencyActions = [
    { icon: "🔥", action: "2 citas en un mes", points: 50 },
    { icon: "💪", action: "4 citas acumuladas", points: 100 },
    { icon: "🏆", action: "6 citas acumuladas", points: 150 },
  ];

  const engagementActions = [
    { icon: "📸", action: "Subir foto de mascota", points: 15 },
    { icon: "✏️", action: "Actualizar info de mascota", points: 10 },
    { icon: "⭐", action: "Calificar servicio", points: 15 },
    { icon: "💡", action: "Completar tips/recomendaciones", points: 10 },
  ];

  const referralActions = [
    { icon: "👤", action: "Referir usuario", points: 150, desc: "que complete su primera cita" },
    { icon: "🏢", action: "Referir empresa activa", points: 250, desc: "que complete su perfil" },
  ];

  const milestoneActions = [
    { icon: "🌟", action: "Primer mes activo", points: 100 },
    { icon: "🎯", action: "3 meses usando la app", points: 200 },
    { icon: "💎", action: "6 meses activo", points: 400 },
    { icon: "👑", action: "12 meses activo", points: 600 },
  ];

  const rewardTiers = [
    {
      name: "Bronce",
      icon: "🥉",
      minPoints: 0,
      color: "from-orange-200 to-orange-300",
      benefits: ["Acceso a canjes básicos", "Perfil destacado", "Acceso a promociones"]
    },
    {
      name: "Plata",
      icon: "🥈",
      minPoints: 500,
      color: "from-gray-300 to-gray-400",
      benefits: ["Canjes nivel Plata", "Prioridad en reservas", "Beneficios exclusivos", "Cancelación flexible"]
    },
    {
      name: "Oro",
      icon: "🥇",
      minPoints: 1500,
      color: "from-yellow-300 to-yellow-400",
      benefits: ["Canjes nivel Oro", "Servicio prioritario", "Acceso VIP temporal", "Upgrades gratuitos"]
    },
    {
      name: "Platino",
      icon: "💎",
      minPoints: 3000,
      color: "from-purple-300 to-purple-400",
      benefits: ["Todos los canjes", "Status Platino destacado", "Concierge para mascotas", "Experiencia Elite"]
    }
  ];

  const redeemableRewards = [
    { emoji: "🌟", name: "Badge Cliente Activo", desc: "Visible en perfil y empresas", points: 100, tier: "Bronce" },
    { emoji: "📸", name: "Destacar Mascota 7 días", desc: "Tu mascota aparece destacada", points: 120, tier: "Bronce" },
    { emoji: "🎁", name: "Acceso Anticipado Promos", desc: "Notificaciones antes que otros", points: 150, tier: "Bronce" },
    { emoji: "📅", name: "Reagendado Sin Penalización", desc: "1 uso sin perder puntos", points: 200, tier: "Bronce" },
    { emoji: "❌", name: "Cancelación Flexible", desc: "Sin penalización (1 vez)", points: 220, tier: "Bronce" },
    { emoji: "⚡", name: "Reserva Prioritaria 15 días", desc: "Prioridad en todas las reservas", points: 250, tier: "Plata" },
    { emoji: "✨", name: "Upgrade Cortesía", desc: "Uñas, perfume o accesorio", points: 300, tier: "Plata" },
    { emoji: "⚡", name: "Servicio Express", desc: "Si la empresa lo habilita", points: 300, tier: "Plata" },
    { emoji: "🕐", name: "Horario Preferente", desc: "Horas valle definidas", points: 320, tier: "Plata" },
    { emoji: "⚡", name: "Reserva Prioritaria 30 días", desc: "Un mes de prioridad", points: 400, tier: "Oro" },
    { emoji: "👑", name: "Cliente VIP 15 días", desc: "Etiqueta + prioridad visible", points: 450, tier: "Oro" },
    { emoji: "💎", name: "Upgrade Doble", desc: "Uñas + perfume", points: 550, tier: "Oro" },
    { emoji: "👑", name: "Cliente VIP 30 días", desc: "Un mes completo VIP", points: 650, tier: "Oro" },
    { emoji: "💎", name: "Status Platino Destacado", desc: "Perfil especial platino", points: 1200, tier: "Platino" },
    { emoji: "👑", name: "Experiencia Groomly Elite", desc: "VIP + concierge + prioridad", points: 1500, tier: "Platino" },
  ];

  return (
    <div className="min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="w-24 h-24 rounded-[24px] bg-gradient-to-br from-[#FFD700] to-[#FFA500] clay-card flex items-center justify-center mx-auto mb-6">
            <Gift className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
              Sistema de Recompensas
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Gana puntos por cada acción y canjéalos por increíbles beneficios para tu mascota
          </p>
        </div>

        {/* Cómo Ganar Puntos */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">
            <Star className="w-8 h-8 inline-block mr-2 text-yellow-500" />
            Cómo Ganar Puntos
          </h2>

          {/* Acciones Base */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-center text-gray-700">Acciones Base</h3>
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
              {baseActions.map((item, idx) => (
                <Card key={idx} className="clay-card border-0 text-center hover:scale-105 transition-all">
                  <CardContent className="p-6">
                    <div className="text-4xl mb-3">{item.icon}</div>
                    <h4 className="font-bold mb-2 text-sm">{item.action}</h4>
                    <Badge className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-white font-bold">
                      +{item.points}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Frecuencia */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-center text-gray-700">Frecuencia Inteligente</h3>
            <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {frequencyActions.map((item, idx) => (
                <Card key={idx} className="clay-card border-0 text-center hover:scale-105 transition-all bg-gradient-to-br from-blue-50 to-blue-100">
                  <CardContent className="p-6">
                    <div className="text-4xl mb-3">{item.icon}</div>
                    <h4 className="font-bold mb-2 text-sm">{item.action}</h4>
                    <Badge className="bg-blue-600 text-white font-bold">
                      +{item.points}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Engagement */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-center text-gray-700">Engagement Real</h3>
            <div className="grid md:grid-cols-4 gap-4">
              {engagementActions.map((item, idx) => (
                <Card key={idx} className="clay-card border-0 text-center hover:scale-105 transition-all">
                  <CardContent className="p-6">
                    <div className="text-4xl mb-3">{item.icon}</div>
                    <h4 className="font-bold mb-2 text-sm">{item.action}</h4>
                    <Badge className="bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] text-white">
                      +{item.points}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Referidos */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-center text-gray-700">Crecimiento (Aceleradores)</h3>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {referralActions.map((item, idx) => (
                <Card key={idx} className="clay-card border-0 hover:scale-105 transition-all">
                  <CardContent className="p-8 text-center">
                    <div className="text-5xl mb-3">{item.icon}</div>
                    <h4 className="font-bold mb-2">{item.action}</h4>
                    <p className="text-xs text-gray-600 mb-3">{item.desc}</p>
                    <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white text-lg px-4 py-1">
                      +{item.points}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Hitos */}
          <div>
            <h3 className="text-xl font-semibold mb-4 text-center text-gray-700">Bonos Estratégicos</h3>
            <div className="grid md:grid-cols-4 gap-4">
              {milestoneActions.map((item, idx) => (
                <Card key={idx} className="clay-card border-0 text-center hover:scale-105 transition-all bg-gradient-to-br from-purple-50 to-purple-100">
                  <CardContent className="p-6">
                    <div className="text-4xl mb-3">{item.icon}</div>
                    <h4 className="font-bold mb-2 text-sm">{item.action}</h4>
                    <Badge className="bg-purple-600 text-white font-bold">
                      +{item.points}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Niveles */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">
            <TrendingUp className="w-8 h-8 inline-block mr-2 text-[#7B68BE]" />
            Niveles de Usuario
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {rewardTiers.map((tier, idx) => (
              <Card key={idx} className={`clay-card border-0 overflow-hidden`}>
                <div className={`bg-gradient-to-br ${tier.color} p-6 text-center`}>
                  <div className="text-6xl mb-2">{tier.icon}</div>
                  <h3 className="text-2xl font-bold text-white">{tier.name}</h3>
                  <p className="text-white text-sm mt-1">Desde {tier.minPoints} pts</p>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-2">
                    {tier.benefits.map((benefit, bidx) => (
                      <div key={bidx} className="flex items-start gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#7B68BE] mt-1.5" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Premios Canjeables */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">
            <Award className="w-8 h-8 inline-block mr-2 text-[#5BA3C9]" />
            Premios Canjeables
          </h2>
          <p className="text-center text-gray-600 mb-8">Ordenados de menor a mayor valor percibido</p>
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
            {redeemableRewards.map((prize, idx) => (
              <Card key={idx} className="clay-card border-0 hover:scale-105 transition-all relative">
                <CardContent className="p-6 text-center">
                  <div className="text-5xl mb-3">{prize.emoji}</div>
                  <h4 className="font-bold text-sm mb-1">{prize.name}</h4>
                  <p className="text-xs text-gray-600 mb-3">{prize.desc}</p>
                  <Badge className="bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] text-white px-3 py-1 mb-2">
                    {prize.points} pts
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {prize.tier}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="clay-card rounded-[32px] bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] p-12 text-center text-white">
          <Crown className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">¿Listo para Empezar a Ganar Puntos?</h2>
          <p className="text-xl mb-8 opacity-90">
            Completa tu perfil y empieza a acumular puntos hoy mismo
          </p>
          <Link to={createPageUrl("Profile")}>
            <Button className="clay-button rounded-[16px] bg-white text-[#7B68BE] px-8 py-6 text-lg hover:shadow-2xl">
              Ir a Mi Perfil
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}