import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Star, MapPin, Phone, Clock, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function BusinessCard({ business, userLocation }) {
    const categoryLabels = {
        veterinary: "Veterinaria",
        grooming: "Grooming",
        spa: "Spa",
        training: "Adiestramiento",
        daycare: "Guardería",
        pet_shop: "Tienda",
        agropecuaria: "Agropecuaria"
    };

    const categoryColors = {
        veterinary: "from-[#FFE5E5] to-[#FFD1D1]",
        grooming: "from-[#E6D9F5] to-[#D4C5E8]",
        spa: "from-[#C8F4DE] to-[#B0E7C9]",
        training: "from-[#C7E9F8] to-[#B0DCF0]",
        daycare: "from-[#FFF4D1] to-[#FFE8B0]",
        pet_shop: "from-[#FFE5F0] to-[#FFD1E3]",
        agropecuaria: "from-[#D4E8D1] to-[#B0D9A8]"
    };

    const amenityLabels = {
        parking: "Estacionamiento",
        wifi: "WiFi",
        air_conditioning: "Aire Acondicionado",
        outdoor_area: "Área Exterior",
        grooming_salon: "Salón de Grooming",
        surgery_room: "Sala de Cirugía",
        pharmacy: "Farmacia",
        pet_hotel: "Hotel de Mascotas",
        swimming_pool: "Piscina",
        training_area: "Área de Entrenamiento",
        isolation_area: "Área de Aislamiento",
        wheelchair_accessible: "Acceso Silla de Ruedas"
    };

    const openInMaps = (e) => {
        e.preventDefault();
        if (business.latitude && business.longitude) {
            const url = `https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`;
            window.open(url, '_blank');
        }
    };

    return (
        <Link
            to={createPageUrl("BusinessDetail") + `?id=${business.id}`}
            className="clay-card rounded-[24px] overflow-hidden bg-white hover:scale-102 transition-all group block"
        >
            {/* Image */}
            <div className="relative h-48 overflow-hidden">
                <img
                    src={business.main_photo_url || "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&q=80"}
                    alt={business.business_name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />

                {/* Category Badge */}
                <div className="absolute top-4 left-4">
                    <div className={`clay-card rounded-full px-3 py-1 bg-gradient-to-r ${categoryColors[business.category]} backdrop-blur-sm`}>
                        <span className="text-xs font-medium text-gray-700">
                            {categoryLabels[business.category]}
                        </span>
                    </div>
                </div>

                {/* Rating Badge */}
                <div className="absolute top-4 right-4 clay-card rounded-full px-3 py-1 bg-white/90 backdrop-blur-sm">
                    <div className="flex items-center gap-1 text-sm font-medium">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span>{(business.rating_average || 5.0).toFixed(1)}</span>
                        <span className="text-xs text-gray-500">({business.total_reviews || 0})</span>
                    </div>
                </div>

                {/* Distance */}
                {business.distance && (
                    <div className="absolute bottom-4 left-4 clay-card rounded-full px-3 py-1 bg-white/90 backdrop-blur-sm">
                        <span className="text-xs font-medium text-gray-700">
                            {business.distance.toFixed(1)} km
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-6">
                <h3 className="font-bold text-lg mb-2 text-gray-800 line-clamp-1">
                    {business.business_name}
                </h3>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {business.short_description || "Servicio de calidad para tu mascota"}
                </p>

                {/* Info Grid */}
                <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{business.address}</span>
                    </div>

                    {business.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Phone className="w-4 h-4 flex-shrink-0" />
                            <span>{business.phone}</span>
                        </div>
                    )}

                    {business.years_in_market && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock className="w-4 h-4 flex-shrink-0" />
                            <span>{business.years_in_market} años en el mercado</span>
                        </div>
                    )}
                </div>

                {/* Amenities */}
                {business.amenities && business.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {business.amenities.slice(0, 3).map((amenity, idx) => (
                            <Badge
                                key={idx}
                                variant="outline"
                                className="clay-button text-xs rounded-full"
                            >
                                {amenityLabels[amenity] || amenity.replace(/_/g, ' ')}
                            </Badge>
                        ))}
                        {business.amenities.length > 3 && (
                            <Badge variant="outline" className="clay-button text-xs rounded-full">
                                +{business.amenities.length - 3}
                            </Badge>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                    <Button
                        className="flex-1 clay-button rounded-[16px] bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] text-white"
                    >
                        Ver Detalles
                    </Button>

                    {business.latitude && business.longitude && (
                        <Button
                            onClick={openInMaps}
                            variant="outline"
                            className="clay-button rounded-[16px] px-3"
                        >
                            <Navigation className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>
        </Link>
    );
}