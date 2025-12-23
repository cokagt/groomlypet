import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { PawPrint, User, Phone, ArrowRight } from "lucide-react";

export default function CompleteProfilePage() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    display_name: "",
    phone: ""
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        // Si ya tiene perfil completo, redirigir
        if (currentUser.display_name && currentUser.phone) {
          navigate(createPageUrl("MyPets"));
        }
        
        // Pre-llenar datos si existen
        setFormData({
          display_name: currentUser.display_name || currentUser.full_name?.split(' ')[0] || "",
          phone: currentUser.phone || ""
        });
      } catch (error) {
        base44.auth.redirectToLogin(createPageUrl("SelectUserType"));
      }
    };
    loadUser();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.display_name.trim()) {
      alert("Por favor ingresa tu nombre");
      return;
    }

    setIsUpdating(true);
    try {
      await base44.auth.updateMe({
        display_name: formData.display_name.trim(),
        phone: formData.phone.trim()
      });
      
      navigate(createPageUrl("MyPets"));
    } catch (error) {
      console.error("Error actualizando perfil:", error);
      alert("Error al guardar. Por favor intenta de nuevo.");
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
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-[24px] bg-gradient-to-br from-[#E6D9F5] to-[#C7E9F8] clay-card flex items-center justify-center mx-auto mb-6">
            <PawPrint className="w-10 h-10 text-[#7B68BE]" />
          </div>
          <h1 className="text-3xl font-bold mb-2">
            <span className="bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] bg-clip-text text-transparent">
              ¡Casi listo! 🎉
            </span>
          </h1>
          <p className="text-gray-600">
            Completa tu perfil para una experiencia personalizada
          </p>
        </div>

        <Card className="clay-card border-0">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-[#7B68BE]" />
                  ¿Cómo te gustaría que te llamemos? *
                </Label>
                <Input
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="Tu nombre"
                  className="clay-button rounded-[16px]"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Este nombre aparecerá en tus reservaciones
                </p>
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4 text-[#7B68BE]" />
                  Teléfono de contacto
                </Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+502 1234 5678"
                  className="clay-button rounded-[16px]"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Para que los negocios puedan contactarte si es necesario
                </p>
              </div>

              <Button
                type="submit"
                disabled={isUpdating}
                className="w-full clay-button rounded-[16px] bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] text-white"
              >
                {isUpdating ? 'Guardando...' : 'Continuar'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}