import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BusinessCard from "../components/search/BusinessCard";
import { Search as SearchIcon, MapPin, SlidersHorizontal, Navigation, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [userLocation, setUserLocation] = useState(null);
  const [sortBy, setSortBy] = useState("distance");
  const [distanceFilter, setDistanceFilter] = useState(null); // null, 5, 10, 15 (millas)
  const [showDistanceMenu, setShowDistanceMenu] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    if (category) {
      setSelectedCategory(category);
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.log("Error obteniendo ubicación:", error)
      );
    }
  }, []);

  const { data: businesses, isLoading } = useQuery({
    queryKey: ['businesses-all'],
    queryFn: async () => {
      return await base44.entities.Business.filter({ is_active: true });
    },
    initialData: [],
  });

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Convertir millas a kilómetros (1 milla = 1.60934 km)
  const milesToKm = (miles) => miles * 1.60934;

  const filteredBusinesses = businesses
    .filter(b => {
      // Filtrar por término de búsqueda
      const matchesSearch = 
        b.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.short_description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtrar por categoría (categories es un array)
      const matchesCategory = selectedCategory === "all" || 
        (b.categories && b.categories.includes(selectedCategory));
      
      return matchesSearch && matchesCategory;
    })
    .map(b => {
      if (userLocation && b.latitude && b.longitude) {
        return {
          ...b,
          distance: calculateDistance(userLocation.lat, userLocation.lng, b.latitude, b.longitude)
        };
      }
      return { ...b, distance: 999999 }; // Distancia muy alta si no hay ubicación
    })
    .filter(b => {
      // Filtrar por distancia si está activo
      if (distanceFilter && userLocation) {
        const maxDistanceKm = milesToKm(distanceFilter);
        return b.distance !== 999999 && b.distance <= maxDistanceKm;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "distance") {
        // Si ambos tienen distancia válida, ordenar por distancia
        if (a.distance !== 999999 && b.distance !== 999999) {
          return a.distance - b.distance;
        }
        // Si solo uno tiene distancia, ponerlo primero
        if (a.distance !== 999999) return -1;
        if (b.distance !== 999999) return 1;
        // Si ninguno tiene distancia, ordenar por rating
        return (b.rating_average || 0) - (a.rating_average || 0);
      }
      if (sortBy === "rating") {
        return (b.rating_average || 0) - (a.rating_average || 0);
      }
      return 0;
    });

  const categories = [
    { value: "all", label: "Todos" },
    { value: "veterinary", label: "Veterinarias" },
    { value: "grooming", label: "Grooming" },
    { value: "spa", label: "Spa Canino" },
    { value: "training", label: "Adiestramiento" },
    { value: "daycare", label: "Guardería" },
    { value: "pet_shop", label: "Tiendas" },
    { value: "agropecuaria", label: "Agropecuarias" },
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] bg-clip-text text-transparent">
              Encuentra el Mejor Servicio
            </span>
          </h1>
          <p className="text-gray-600">para tu compañero peludo</p>
        </div>

        {/* Search and Filters */}
        <div className="clay-card rounded-[24px] bg-white p-6 mb-8">
          <div className="grid md:grid-cols-12 gap-4">
            {/* Search Input */}
            <div className="md:col-span-5 relative">
              <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Buscar por nombre o servicio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 rounded-[16px] clay-inset border-0 bg-gray-50"
              />
            </div>

            {/* Category Filter */}
            <div className="md:col-span-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-12 rounded-[16px] clay-button border-0">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div className="md:col-span-3">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-12 rounded-[16px] clay-button border-0">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="distance">Más Cerca</SelectItem>
                  <SelectItem value="rating">Mejor Calificados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location Filter Button */}
          <div className="mt-4 flex items-center gap-3">
            <div className="relative">
              <Button
                onClick={() => setShowDistanceMenu(!showDistanceMenu)}
                variant={distanceFilter ? "default" : "outline"}
                className={`clay-button rounded-[16px] ${
                  distanceFilter 
                    ? 'bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] text-white' 
                    : ''
                }`}
              >
                <Navigation className="w-4 h-4 mr-2" />
                {distanceFilter ? `Cerca (${distanceFilter} mi)` : 'Más Cercanos'}
              </Button>
              
              {showDistanceMenu && (
                <div className="absolute top-full mt-2 clay-card rounded-[16px] bg-white p-3 shadow-xl z-50 min-w-[200px]">
                  <p className="text-sm font-medium mb-2 text-gray-700">Distancia máxima:</p>
                  {[5, 10, 15].map(miles => (
                    <button
                      key={miles}
                      onClick={() => {
                        setDistanceFilter(miles);
                        setShowDistanceMenu(false);
                        setSortBy("distance");
                      }}
                      className={`w-full text-left px-3 py-2 rounded-[12px] mb-1 transition-colors ${
                        distanceFilter === miles
                          ? 'bg-gradient-to-r from-[#E6D9F5] to-[#C8F4DE] text-[#7B68BE] font-medium'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {miles} millas ({(miles * 1.60934).toFixed(1)} km)
                    </button>
                  ))}
                </div>
              )}
            </div>

            {distanceFilter && (
              <Button
                onClick={() => {
                  setDistanceFilter(null);
                  setShowDistanceMenu(false);
                }}
                variant="outline"
                className="clay-button rounded-[16px]"
              >
                <X className="w-4 h-4 mr-2" />
                Limpiar Filtro
              </Button>
            )}
          </div>

          {/* Active Filters */}
          {selectedCategory !== "all" && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-gray-500">Filtros activos:</span>
              <Badge 
                variant="secondary" 
                className="clay-button rounded-full px-4 py-1 cursor-pointer"
                onClick={() => setSelectedCategory("all")}
              >
                {categories.find(c => c.value === selectedCategory)?.label}
                <button className="ml-2">×</button>
              </Badge>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="mb-6">
          <p className="text-gray-600">
            {filteredBusinesses.length} resultado{filteredBusinesses.length !== 1 ? 's' : ''} encontrado{filteredBusinesses.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Business Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="clay-card rounded-[24px] bg-white p-6 animate-pulse">
                <div className="h-48 bg-gray-200 rounded-[20px] mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : filteredBusinesses.length === 0 ? (
          <div className="clay-card rounded-[24px] bg-white p-12 text-center">
            <div className="w-24 h-24 rounded-[20px] bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <SearchIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-800">No se encontraron resultados</h3>
            <p className="text-gray-600">Intenta con otros filtros o búsqueda</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBusinesses.map((business) => (
              <BusinessCard 
                key={business.id} 
                business={business}
                userLocation={userLocation}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}