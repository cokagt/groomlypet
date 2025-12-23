import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Star, MapPin, Phone, Clock, Navigation, Heart,
  Calendar, CheckCircle, Award, Image as ImageIcon,
  Globe, MessageCircle, Facebook, Instagram, Twitter, Music,
  Tag, Lock, AlertCircle
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import BookingModal from "../components/booking/BookingModal";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export default function BusinessDetailPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const businessId = urlParams.get('id');
  const [user, setUser] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        checkFavorite(currentUser.email);
      } catch (error) {
        console.log("Usuario no autenticado");
      }
    };
    loadUser();
  }, []);

  const { data: business, isLoading } = useQuery({
    queryKey: ['business', businessId],
    queryFn: async () => {
      const businesses = await base44.entities.Business.filter({ id: businessId });
      return businesses[0];
    },
  });

  const { data: services } = useQuery({
    queryKey: ['services', businessId],
    queryFn: async () => {
      return await base44.entities.Service.filter({ business_id: businessId, is_active: true });
    },
    initialData: [],
  });

  const { data: reviews } = useQuery({
    queryKey: ['reviews', businessId],
    queryFn: async () => {
      return await base44.entities.Review.filter({ business_id: businessId });
    },
    initialData: [],
  });

  const { data: coupons } = useQuery({
    queryKey: ['business-coupons', businessId],
    queryFn: async () => {
      const allCoupons = await base44.entities.Coupon.filter({ business_id: businessId, is_active: true });
      return allCoupons.filter(c => new Date(c.valid_until) >= new Date());
    },
    initialData: [],
  });

  const { data: redeemableServices } = useQuery({
    queryKey: ['business-redeemables', businessId],
    queryFn: async () => {
      return await base44.entities.BusinessRedeemable.filter({ 
        business_id: businessId,
        is_active: true
      });
    },
    initialData: [],
  });

  const { data: branches } = useQuery({
    queryKey: ['business-branches', business?.id],
    queryFn: async () => {
      if (!business) return [];
      const parentId = business.is_branch ? business.parent_business_id : business.id;
      const allBranches = await base44.entities.Business.filter({ parent_business_id: parentId, is_branch: true });
      return allBranches.filter(b => b.id !== business.id);
    },
    enabled: !!business,
    initialData: [],
  });

  const checkFavorite = async (email) => {
    const favorites = await base44.entities.Favorite.filter({ 
      user_email: email, 
      business_id: businessId 
    });
    setIsFavorite(favorites.length > 0);
  };

  const toggleFavorite = async () => {
    if (!user) {
      base44.auth.redirectToLogin(window.location.pathname);
      return;
    }
    
    if (isFavorite) {
      const favorites = await base44.entities.Favorite.filter({ 
        user_email: user.email, 
        business_id: businessId 
      });
      if (favorites[0]) {
        await base44.entities.Favorite.delete(favorites[0].id);
        setIsFavorite(false);
      }
    } else {
      await base44.entities.Favorite.create({
        user_email: user.email,
        business_id: businessId,
        favorite_type: "business"
      });
      setIsFavorite(true);
    }
  };

  const openInMaps = (e) => {
    if (e) e.preventDefault();
    if (business?.latitude && business?.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      alert('Este negocio no tiene ubicación registrada en el mapa');
    }
  };

  const speciesLabels = {
    dog: "Perros",
    cat: "Gatos",
    bird: "Aves",
    rabbit: "Conejos",
    other: "Otros"
  };

  const amenityIcons = {
    parking: "🅿️",
    wifi: "📶",
    air_conditioning: "❄️",
    outdoor_area: "🌳",
    grooming_salon: "✂️",
    surgery_room: "🏥",
    pharmacy: "💊",
    pet_hotel: "🏨",
    swimming_pool: "🏊",
    training_area: "🎓",
    isolation_area: "🔒",
    wheelchair_accessible: "♿"
  };

  if (isLoading || !business) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="clay-card rounded-[24px] p-8 bg-white">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-48"></div>
            <div className="h-4 bg-gray-200 rounded w-64"></div>
          </div>
        </div>
      </div>
    );
  }

  const allPhotos = [business.main_photo_url, ...(business.photos || [])].filter(Boolean);

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Gallery */}
        <div className="clay-card rounded-[32px] overflow-hidden bg-white mb-8">
          <div className="relative h-[400px] overflow-hidden">
            <img
              src={allPhotos[selectedImage] || "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200&q=80"}
              alt={business.business_name}
              className="w-full h-full object-cover"
            />
            
            <div className="absolute bottom-4 left-4 right-4 flex gap-2 overflow-x-auto">
              {allPhotos.map((photo, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`flex-shrink-0 w-20 h-20 rounded-[16px] overflow-hidden ${
                    selectedImage === idx ? 'ring-4 ring-white clay-card' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="clay-card rounded-[24px] bg-white p-8">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-800">{business.business_name}</h1>
                    <Button
                      onClick={toggleFavorite}
                      variant="ghost"
                      size="icon"
                      className={`clay-button rounded-full ${isFavorite ? 'text-red-500' : 'text-gray-400'}`}
                    >
                      <Heart className={`w-6 h-6 ${isFavorite ? 'fill-red-500' : ''}`} />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      <span className="font-bold">{business.rating_average || 5.0}</span>
                      <span className="text-gray-500">({business.total_reviews || 0} reseñas)</span>
                    </div>
                    
                    {business.years_in_market && (
                      <Badge variant="outline" className="clay-button rounded-full">
                        <Award className="w-4 h-4 mr-1" />
                        {business.years_in_market} años
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-gray-600">{business.short_description}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mb-4">
                {!(business.business_type === 'store' || (business.categories || []).includes('agropecuaria')) && (
                  <Button
                    onClick={() => user ? setShowBooking(true) : base44.auth.redirectToLogin(window.location.pathname)}
                    className="clay-button rounded-[16px] bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] text-white"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Agendar Cita
                  </Button>
                )}
                
                <Button
                  onClick={openInMaps}
                  variant="outline"
                  className="clay-button rounded-[16px]"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Cómo Llegar
                </Button>
                
                {business.phone && (
                  <Button
                    onClick={() => window.open(`tel:${business.phone}`)}
                    variant="outline"
                    className="clay-button rounded-[16px]"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Llamar
                  </Button>
                )}
                
                {business.whatsapp && (
                  <Button
                    onClick={() => {
                      const baseMessage = business.whatsapp_message || "¡Hola! Me gustaría obtener más información.";
                      const fullMessage = `${baseMessage}\n\n_Mensaje generado desde GROOMLY PET_`;
                      const encodedMessage = encodeURIComponent(fullMessage);
                      const phone = business.whatsapp.replace(/\D/g, '');
                      window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
                    }}
                    variant="outline"
                    className="clay-button rounded-[16px] text-green-600 border-green-600 hover:bg-green-50"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    WhatsApp
                  </Button>
                )}
              </div>

              {/* Redes Sociales y Enlaces */}
              <div className="flex flex-wrap gap-2">
                {business.website && (
                  <Button
                    onClick={() => window.open(business.website, '_blank')}
                    variant="outline"
                    size="sm"
                    className="clay-button rounded-full"
                  >
                    <Globe className="w-4 h-4 mr-1" />
                    Sitio Web
                  </Button>
                )}

                {business.facebook && (
                  <Button
                    onClick={() => window.open(business.facebook, '_blank')}
                    variant="outline"
                    size="sm"
                    className="clay-button rounded-full text-blue-600"
                  >
                    <Facebook className="w-4 h-4" />
                  </Button>
                )}
                {business.instagram && (
                  <Button
                    onClick={() => window.open(`https://instagram.com/${business.instagram}`, '_blank')}
                    variant="outline"
                    size="sm"
                    className="clay-button rounded-full text-pink-600"
                  >
                    <Instagram className="w-4 h-4" />
                  </Button>
                )}
                {business.tiktok && (
                  <Button
                    onClick={() => window.open(`https://tiktok.com/@${business.tiktok}`, '_blank')}
                    variant="outline"
                    size="sm"
                    className="clay-button rounded-full"
                  >
                    <Music className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="about" className="clay-card rounded-[24px] bg-white p-6">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="about" className="rounded-[12px]">Sobre Nosotros</TabsTrigger>
                <TabsTrigger value="services" className="rounded-[12px]">
                  {business.business_type === 'store' || (business.categories || []).includes('agropecuaria') ? 'Productos' : 'Servicios'}
                </TabsTrigger>
                <TabsTrigger value="promotions" className="rounded-[12px]">Promociones</TabsTrigger>
                <TabsTrigger value="reviews" className="rounded-[12px]">Reseñas</TabsTrigger>
              </TabsList>
              
              <TabsContent value="about" className="space-y-6">
                <div>
                  <h3 className="font-bold text-lg mb-3">Descripción</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{business.long_description}</p>
                </div>
                
                {business.specialty && (
                  <div>
                    <h3 className="font-bold text-lg mb-3">Especialidad</h3>
                    <p className="text-gray-600">{business.specialty}</p>
                  </div>
                )}
                
                {((business.amenities && business.amenities.length > 0) || (business.custom_amenities && business.custom_amenities.length > 0)) && (
                  <div>
                    <h3 className="font-bold text-lg mb-3">Amenidades</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {(business.amenities || []).map((amenity, idx) => (
                        <div key={idx} className="flex items-center gap-2 clay-inset rounded-[12px] p-3 bg-gray-50">
                          <span className="text-2xl">{amenityIcons[amenity] || "✓"}</span>
                          <span className="text-sm text-gray-700">{amenity.replace(/_/g, ' ')}</span>
                        </div>
                      ))}
                      {(business.custom_amenities || []).map((amenity, idx) => (
                        <div key={`custom-${idx}`} className="flex items-center gap-2 clay-inset rounded-[12px] p-3 bg-gradient-to-r from-[#E6D9F5] to-[#C8F4DE]">
                          <span className="text-2xl">✨</span>
                          <span className="text-sm text-gray-700">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {business.offers_vaccination && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Ofrece servicio de vacunación</span>
                  </div>
                )}
                
                {business.emergency_service && (
                  <div className="flex items-center gap-2 text-red-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Atención de emergencias 24/7</span>
                  </div>
                )}

                {business.accepts_point_redemptions && (
                  <div className="clay-card rounded-[12px] p-4 bg-gradient-to-r from-[#FFF9E6] to-[#FFE5CC] mt-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] flex items-center justify-center">
                        <Star className="w-5 h-5 text-white fill-white" />
                      </div>
                      <div>
                        <div className="font-bold text-[#7B68BE]">⭐ Acepta Canjes por Puntos</div>
                        <p className="text-xs text-gray-600">Puedes canjear tus puntos de recompensas por servicios aquí</p>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="services">
                {services.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    {business.business_type === 'store' || (business.categories || []).includes('agropecuaria') 
                      ? 'No hay productos disponibles' 
                      : 'No hay servicios disponibles'}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {services.map((service) => (
                      <div key={service.id} className="clay-inset rounded-[16px] p-4 bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-bold text-lg mb-1">{service.service_name}</h4>
                            <p className="text-sm text-gray-600 mb-2">{service.description}</p>

                            {service.available_for_species && (
                              <div className="flex flex-wrap gap-2">
                                {service.available_for_species.map((species, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {speciesLabels[species] || species}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="text-right ml-4">
                            <div className="text-2xl font-bold text-[#7B68BE]">
                              ${service.price}
                            </div>
                            {service.duration_minutes && (
                              <div className="text-sm text-gray-500">
                                {service.duration_minutes} min
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="promotions">
                {coupons.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No hay promociones activas</p>
                ) : (
                  <div className="space-y-4">
                    {coupons.map((coupon) => (
                      <div key={coupon.id} className="clay-inset rounded-[16px] p-4 bg-gradient-to-r from-[#FFF5E6] to-[#FFE5CC]">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] flex items-center justify-center">
                            <Tag className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-lg">{coupon.title}</h4>
                            {user ? (
                              <div className="mt-2">
                                <p className="text-sm text-gray-600">{coupon.description}</p>
                                <div className="flex items-center gap-4 mt-2">
                                  <Badge className="bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] text-white">
                                    {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `$${coupon.discount_value} OFF`}
                                  </Badge>
                                  <span className="text-sm font-mono bg-white px-2 py-1 rounded">
                                    Código: {coupon.code}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <Alert className="mt-2 bg-white/50 border-[#7B68BE]">
                                <Lock className="h-4 w-4 text-[#7B68BE]" />
                                <AlertDescription className="text-sm">
                                  <button 
                                    onClick={() => base44.auth.redirectToLogin(window.location.href)}
                                    className="text-[#7B68BE] font-medium hover:underline"
                                  >
                                    Inicia sesión
                                  </button>
                                  {" "}para ver los detalles de esta promoción
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="reviews">
                {reviews.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Aún no hay reseñas</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="clay-inset rounded-[16px] p-4 bg-gray-50">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(review.created_date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-700">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <div className="clay-card rounded-[24px] bg-white p-6">
              <h3 className="font-bold text-lg mb-4">Información de Contacto</h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#7B68BE] flex-shrink-0 mt-1" />
                  <div>
                    <div className="font-medium text-gray-800">Dirección</div>
                    <div className="text-sm text-gray-600">{business.address}</div>
                  </div>
                </div>
                
                {business.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-[#7B68BE] flex-shrink-0 mt-1" />
                    <div>
                      <div className="font-medium text-gray-800">Teléfono</div>
                      <div className="text-sm text-gray-600">{business.phone}</div>
                    </div>
                  </div>
                )}
                
                {business.emergency_phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-red-500 flex-shrink-0 mt-1" />
                    <div>
                      <div className="font-medium text-gray-800">Emergencias</div>
                      <div className="text-sm text-gray-600">{business.emergency_phone}</div>
                    </div>
                  </div>
                )}
                
                {business.schedule && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-[#7B68BE] flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-800 mb-2">Horarios</div>
                      <div className="space-y-1 text-sm">
                        {Object.entries(business.schedule).map(([day, hours]) => (
                          <div key={day} className="flex justify-between">
                            <span className="text-gray-600 capitalize">{day}:</span>
                            <span className="text-gray-800 font-medium">{hours || 'Cerrado'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Otras Sucursales */}
            {branches.length > 0 && (
              <div className="clay-card rounded-[24px] bg-white p-6">
                <h3 className="font-bold text-lg mb-2">📍 Otras Sucursales</h3>
                <p className="text-sm text-gray-600 mb-4">
                  También tenemos estas ubicaciones:
                </p>
                
                <div className="space-y-3">
                  {branches.map((branch) => (
                    <a
                      key={branch.id}
                      href={createPageUrl("BusinessDetail") + `?id=${branch.id}`}
                      className="clay-inset rounded-[16px] p-3 bg-gray-50 hover:bg-gray-100 transition-all block"
                    >
                      <h4 className="font-bold text-sm mb-2">{branch.business_name}</h4>
                      <div className="space-y-1">
                        <div className="flex items-start gap-2 text-xs text-gray-600">
                          <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>{branch.address}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Phone className="w-3 h-3" />
                          <span>{branch.phone}</span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Servicios Canjeables por Puntos */}
            {redeemableServices.length > 0 && (
              <div className="clay-card rounded-[24px] bg-white p-6">
                <h3 className="font-bold text-lg mb-2">⭐ Canjes por Puntos</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Canjea tus puntos de Groomly por estos servicios:
                </p>
                
                <div className="space-y-3">
                  {redeemableServices.map((service) => {
                    const tierColors = {
                      bronze: 'from-orange-100 to-orange-200',
                      silver: 'from-gray-200 to-gray-300',
                      gold: 'from-yellow-200 to-yellow-300',
                      platinum: 'from-purple-200 to-purple-300'
                    };
                    
                    const tierIcons = {
                      bronze: '🥉',
                      silver: '🥈',
                      gold: '🥇',
                      platinum: '💎'
                    };
                    
                    const categoryLabels = {
                      basic: 'Básico',
                      express: 'Express',
                      premium: 'Premium',
                      complete: 'Completo'
                    };

                    return (
                      <div key={service.id} className={`clay-inset rounded-[16px] p-3 bg-gradient-to-br ${tierColors[service.min_tier]}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-bold text-sm">{service.service_name}</h4>
                            {service.category && (
                              <Badge className="bg-white/80 text-gray-700 mt-1 text-xs">
                                {categoryLabels[service.category]}
                              </Badge>
                            )}
                          </div>
                          <Badge className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-white font-bold text-xs">
                            {service.points_required} pts
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-700 mt-2">
                          <span>{tierIcons[service.min_tier]}</span>
                          <span className="capitalize">{service.min_tier}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Map */}
            {business.latitude && business.longitude && (
              <div className="clay-card rounded-[24px] overflow-hidden bg-white">
                <div className="h-[300px]">
                  <MapContainer
                    center={[business.latitude, business.longitude]}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={false}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[business.latitude, business.longitude]}>
                      <Popup>{business.business_name}</Popup>
                    </Marker>
                  </MapContainer>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showBooking && (
        <BookingModal
          business={business}
          services={services}
          onClose={() => setShowBooking(false)}
        />
      )}
    </div>
  );
}