import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, MapPin, Star, Sparkles, 
  Scissors, Stethoscope, GraduationCap, Home as HomeIcon,
  Award, Shield, Heart, TrendingUp, Zap
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import UserSteps from "../components/home/UserSteps";

export default function HomePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.log("Usuario no autenticado");
      }
    };
    loadUser();
  }, []);

  // Featured businesses (premium con mejor rating)
  const { data: featuredBusinesses } = useQuery({
    queryKey: ['featured-businesses'],
    queryFn: async () => {
      const businesses = await base44.entities.Business.filter({ 
        is_active: true,
        subscription_plan: "premium"
      }, '-rating_average', 6);
      return businesses;
    },
    initialData: [],
  });

  // New businesses (creados en los últimos X días según su plan)
  const { data: newBusinesses } = useQuery({
    queryKey: ['new-businesses'],
    queryFn: async () => {
      const allBusinesses = await base44.entities.Business.filter({ is_active: true }, '-created_date');
      
      const now = new Date();
      return allBusinesses.filter(business => {
        const created = new Date(business.created_date);
        const daysSinceCreation = Math.floor((now - created) / (1000 * 60 * 60 * 24));
        
        const maxDays = {
          free: 8,
          basic: 15,
          premium: 30
        }[business.subscription_plan] || 8;
        
        return daysSinceCreation <= maxDays;
      }).slice(0, 6);
    },
    initialData: [],
  });

  const categories = [
    { 
      name: "Veterinarias", 
      icon: Stethoscope, 
      color: "from-[#FFE5E5] to-[#FFD1D1]",
      value: "veterinary",
      description: "Cuidado médico profesional"
    },
    { 
      name: "Grooming", 
      icon: Scissors, 
      color: "from-[#E6D9F5] to-[#D4C5E8]",
      value: "grooming",
      description: "Belleza y estilo"
    },
    { 
      name: "Spa Canino", 
      icon: Sparkles, 
      color: "from-[#C8F4DE] to-[#B0E7C9]",
      value: "spa",
      description: "Relajación y bienestar"
    },
    { 
      name: "Adiestramiento", 
      icon: GraduationCap, 
      color: "from-[#C7E9F8] to-[#B0DCF0]",
      value: "training",
      description: "Educación y comportamiento"
    },
    { 
      name: "Guardería", 
      icon: HomeIcon, 
      color: "from-[#FFF4D1] to-[#FFE8B0]",
      value: "daycare",
      description: "Cuidado diario"
    },
    { 
      name: "Agropecuaria", 
      icon: HomeIcon, 
      color: "from-[#D4E8D1] to-[#B0D9A8]",
      value: "agropecuaria",
      description: "Productos y alimentos"
    },
  ];

  const features = [
    {
      icon: Shield,
      title: "Negocios Verificados",
      description: "Todos los servicios son verificados por nuestro equipo"
    },
    {
      icon: Heart,
      title: "Cuidado con Amor",
      description: "Los mejores profesionales para tu mascota"
    },
    {
      icon: Award,
      title: "Calidad Garantizada",
      description: "Servicios con las mejores calificaciones"
    },
    {
      icon: TrendingUp,
      title: "Siempre Mejorando",
      description: "Actualizamos constantemente nuestros estándares"
    }
  ];

  return (
    <div className="pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-block">
                <span className="px-6 py-2 rounded-full clay-card bg-gradient-to-r from-[#E6D9F5] to-[#C8F4DE] text-[#7B68BE] text-sm font-medium">
                  🐾 La mejor plataforma para mascotas
                </span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-[#7B68BE] via-[#5BA3C9] to-[#6BBF98] bg-clip-text text-transparent">
                  Todo lo que tu mascota
                </span>
                <br />
                <span className="text-gray-800">necesita en un solo lugar</span>
              </h1>
              
              <p className="text-xl text-gray-600 leading-relaxed">
                Encuentra veterinarias, grooming, spa, escuelas de adiestramiento y más. 
                Tu compañero peludo merece lo mejor.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Button
                  onClick={() => navigate(createPageUrl("Search"))}
                  className="clay-button px-8 py-6 text-lg rounded-[20px] bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] text-white hover:shadow-2xl"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Explorar Servicios
                </Button>
                
                {!user && (
                  <Button
                    onClick={() => base44.auth.redirectToLogin(window.location.pathname)}
                    variant="outline"
                    className="clay-button px-8 py-6 text-lg rounded-[20px] border-2 border-[#7B68BE] text-[#7B68BE]"
                  >
                    Crear Cuenta
                  </Button>
                )}
              </div>
            </div>
            
            <div className="relative">
              <div className="clay-card rounded-[32px] overflow-hidden bg-gradient-to-br from-[#E6D9F5] to-[#C7E9F8] p-8">
                <img
                  src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80"
                  alt="Happy pets"
                  className="rounded-[24px] w-full h-auto object-cover shadow-2xl"
                />
              </div>
              
              <div className="absolute -bottom-6 -left-6 clay-card rounded-[20px] bg-white p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FFE5E5] to-[#FFD1D1] flex items-center justify-center">
                    <Star className="w-6 h-6 text-[#FF6B6B]" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800">4.9★</div>
                    <div className="text-sm text-gray-500">Calificación</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* User Steps - Solo para usuarios no registrados, pantalla completa en móvil */}
      {!user && (
        <section className="md:max-w-7xl md:mx-auto md:px-4 sm:px-6 lg:px-8 md:py-12">
          <UserSteps />
        </section>
      )}

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] bg-clip-text text-transparent">
              Servicios Disponibles
            </span>
          </h2>
          <p className="text-lg text-gray-600">
            Elige el servicio perfecto para tu mascota
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => navigate(createPageUrl("Search") + `?category=${category.value}`)}
              className="clay-card rounded-[24px] p-6 bg-white hover:scale-105 transition-all group"
            >
              <div className={`w-16 h-16 rounded-[20px] bg-gradient-to-br ${category.color} clay-card flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform`}>
                <category.icon className="w-8 h-8 text-gray-700" />
              </div>
              <h3 className="font-bold text-gray-800 mb-1">{category.name}</h3>
              <p className="text-xs text-gray-500">{category.description}</p>
            </button>
          ))}
        </div>
      </section>

      {/* New Businesses */}
      {newBusinesses.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex justify-between items-center mb-12">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Zap className="w-8 h-8 text-[#FFD700]" />
                <h2 className="text-4xl font-bold">
                  <span className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
                    Empresas Nuevas
                  </span>
                </h2>
              </div>
              <p className="text-gray-600">Descubre los negocios recién llegados a Groomly</p>
            </div>
            <Button
              onClick={() => navigate(createPageUrl("Search"))}
              variant="outline"
              className="clay-button rounded-[16px] hidden md:flex"
            >
              Ver Todos
            </Button>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {newBusinesses.slice(0, 3).map((business) => (
              <Link
                key={business.id}
                to={createPageUrl("BusinessDetail") + `?id=${business.id}`}
                className="clay-card rounded-[24px] overflow-hidden bg-white hover:scale-102 transition-all group"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={business.main_photo_url || "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&q=80"}
                    alt={business.business_name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-white">
                      <Zap className="w-3 h-3 mr-1" />
                      NUEVO
                    </Badge>
                  </div>
                  <div className="absolute top-4 right-4 clay-card rounded-full px-3 py-1 bg-white/90 backdrop-blur-sm">
                    <div className="flex items-center gap-1 text-sm font-medium">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      {business.rating_average || 5.0}
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="font-bold text-lg mb-2 text-gray-800">{business.business_name}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{business.short_description}</p>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{business.address}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Businesses (Premium) */}
      {featuredBusinesses.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-4xl font-bold mb-2">
                <span className="bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] bg-clip-text text-transparent">
                  Servicios Destacados
                </span>
              </h2>
              <p className="text-gray-600">Los mejores servicios premium de Groomly</p>
            </div>
            <Button
              onClick={() => navigate(createPageUrl("Search"))}
              variant="outline"
              className="clay-button rounded-[16px] hidden md:flex"
            >
              Ver Todos
            </Button>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredBusinesses.slice(0, 3).map((business) => (
              <Link
                key={business.id}
                to={createPageUrl("BusinessDetail") + `?id=${business.id}`}
                className="clay-card rounded-[24px] overflow-hidden bg-white hover:scale-102 transition-all group relative"
              >
                <div className="absolute top-4 left-4 z-10">
                  <Badge className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-white shadow-lg">
                    ⭐ PREMIUM
                  </Badge>
                </div>
                
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={business.main_photo_url || "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&q=80"}
                    alt={business.business_name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 clay-card rounded-full px-3 py-1 bg-white/90 backdrop-blur-sm">
                    <div className="flex items-center gap-1 text-sm font-medium">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      {business.rating_average || 5.0}
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="font-bold text-lg mb-2 text-gray-800">{business.business_name}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{business.short_description}</p>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{business.address}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="clay-card rounded-[32px] bg-gradient-to-br from-white to-[#F8F5FF] p-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] bg-clip-text text-transparent">
                ¿Por qué elegirnos?
              </span>
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-[#E6D9F5] to-[#C8F4DE] clay-card flex items-center justify-center mb-4 mx-auto">
                  <feature.icon className="w-8 h-8 text-[#7B68BE]" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-gray-800">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Solo para usuarios no registrados */}
      {!user && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="clay-card rounded-[32px] bg-gradient-to-br from-[#7B68BE] to-[#5BA3C9] p-12 text-center text-white">
            <h2 className="text-4xl font-bold mb-4">
              ¿Tienes un negocio de mascotas?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Únete a nuestra plataforma y llega a más clientes
            </p>
            <Link to={createPageUrl("HowItWorks")}>
              <Button
                className="clay-button px-8 py-6 text-lg rounded-[20px] bg-white text-[#7B68BE] hover:shadow-2xl"
              >
                Registrar Mi Negocio
              </Button>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}