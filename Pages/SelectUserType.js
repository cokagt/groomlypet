import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PawPrint, Building2, ArrowRight } from "lucide-react";

export default function SelectUserTypePage() {
  const [user, setUser] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        // Si ya tiene tipo de usuario, redirigir
        if (currentUser.user_type) {
          if (currentUser.user_type === 'business') {
            navigate(createPageUrl("MyBusiness"));
          } else {
            navigate(createPageUrl("Home"));
          }
        }
      } catch (error) {
        base44.auth.redirectToLogin(createPageUrl("SelectUserType"));
      }
    };
    loadUser();
  }, [navigate]);

  const handleSelectType = async (type) => {
    setIsUpdating(true);
    try {
      await base44.auth.updateMe({ user_type: type });
      
      if (type === 'business') {
        navigate(createPageUrl("MyBusiness"));
      } else {
        navigate(createPageUrl("CompleteProfile"));
      }
    } catch (error) {
      console.error("Error actualizando tipo de usuario:", error);
      alert("Error al guardar tu selección. Por favor intenta de nuevo.");
    }
    setIsUpdating(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 rounded-[24px] bg-gradient-to-br from-[#E6D9F5] to-[#C7E9F8] clay-card flex items-center justify-center mx-auto mb-6">
            <PawPrint className="w-10 h-10 text-[#7B68BE]" />
          </div>
          <h1 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] bg-clip-text text-transparent">
              ¡Bienvenido a Groomly, {user.full_name?.split(' ')[0]}! 🎉
            </span>
          </h1>
          <p className="text-xl text-gray-600">
            ¿Cómo te gustaría usar la plataforma?
          </p>
        </div>

        {/* Options */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Pet Owner Option */}
          <Card 
            className="clay-card border-0 cursor-pointer hover:scale-[1.02] transition-all"
            onClick={() => !isUpdating && handleSelectType('pet_owner')}
          >
            <CardContent className="p-8 text-center">
              <div className="w-24 h-24 rounded-[28px] bg-gradient-to-br from-[#C8F4DE] to-[#B0E7C9] clay-card flex items-center justify-center mx-auto mb-6">
                <span className="text-5xl">🐾</span>
              </div>
              <h2 className="text-2xl font-bold mb-3 text-gray-800">Dueño de Mascota</h2>
              <p className="text-gray-600 mb-6">
                Busco servicios para el cuidado de mis mascotas: veterinarias, grooming, spa, guardería y más.
              </p>
              
              <ul className="text-left space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500">✓</span> Registra tus mascotas
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500">✓</span> Agenda citas fácilmente
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500">✓</span> Encuentra negocios cerca de ti
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500">✓</span> Accede a promociones exclusivas
                </li>
              </ul>
              
              <Button 
                disabled={isUpdating}
                className="w-full clay-button rounded-[16px] bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] text-white"
              >
                {isUpdating ? 'Guardando...' : 'Soy Dueño de Mascota'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Business Option */}
          <Card 
            className="clay-card border-0 cursor-pointer hover:scale-[1.02] transition-all"
            onClick={() => !isUpdating && handleSelectType('business')}
          >
            <CardContent className="p-8 text-center">
              <div className="w-24 h-24 rounded-[28px] bg-gradient-to-br from-[#E6D9F5] to-[#C7E9F8] clay-card flex items-center justify-center mx-auto mb-6">
                <Building2 className="w-12 h-12 text-[#7B68BE]" />
              </div>
              <h2 className="text-2xl font-bold mb-3 text-gray-800">Tengo un Negocio</h2>
              <p className="text-gray-600 mb-6">
                Ofrezco servicios para mascotas y quiero registrar mi negocio para llegar a más clientes.
              </p>
              
              <ul className="text-left space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500">✓</span> Crea tu perfil de negocio
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500">✓</span> Recibe reservas de clientes
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500">✓</span> Gestiona tu agenda
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500">✓</span> Publica promociones
                </li>
              </ul>
              
              <Button 
                disabled={isUpdating}
                className="w-full clay-button rounded-[16px] bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] text-white"
              >
                {isUpdating ? 'Guardando...' : 'Tengo un Negocio'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-sm text-gray-500 mt-8">
          Podrás cambiar esta configuración más adelante desde tu perfil
        </p>
      </div>
    </div>
  );
}