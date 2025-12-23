import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Upload, X, MapPin, Save, Globe, MessageCircle, Facebook, Instagram, Twitter, Music } from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MyBusinessPage() {
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [customAmenity, setCustomAmenity] = useState("");
  const queryClient = useQueryClient();

  // Obtener ubicación del usuario
  useEffect(() => {
    if (navigator.geolocation && !formData.latitude) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!formData.latitude && !formData.longitude) {
            setFormData(prev => ({
              ...prev,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            }));
          }
        },
        (error) => console.log("No se pudo obtener ubicación")
      );
    }
  }, [isEditing]);

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  const { data: myBusiness, isLoading } = useQuery({
    queryKey: ['my-business', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const businesses = await base44.entities.Business.filter({ owner_email: user.email });
      return businesses[0] || null;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (myBusiness) {
      setBusiness(myBusiness);
      setFormData(myBusiness);
    }
  }, [myBusiness]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      if (business) {
        return await base44.entities.Business.update(business.id, data);
      } else {
        const businessData = {
          ...data,
          owner_email: user.email,
          is_active: true,
          subscription_plan: "free",
          rating_average: 0,
          total_reviews: 0
        };
        
        const newBusiness = await base44.entities.Business.create(businessData);
        
        // Enviar notificación por email a Groomly
        try {
          await base44.integrations.Core.SendEmail({
            to: "groomlypetapp@gmail.com",
            subject: "🎉 Nueva Empresa Registrada en Groomly",
            body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f5ff; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #7B68BE 0%, #5BA3C9 100%); color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .detail-box { background: #f8f5ff; border-radius: 15px; padding: 20px; margin: 20px 0; }
    .footer { background: #f8f5ff; padding: 20px; text-align: center; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Nueva Empresa Registrada</h1>
    </div>
    <div class="content">
      <p>Se ha registrado una nueva empresa en la plataforma Groomly:</p>
      
      <div class="detail-box">
        <p><strong>🏢 Nombre del Negocio:</strong> ${businessData.business_name}</p>
        <p><strong>👤 Propietario:</strong> ${businessData.owner_email}</p>
        <p><strong>📱 Teléfono:</strong> ${businessData.phone || 'No proporcionado'}</p>
        <p><strong>📍 Dirección:</strong> ${businessData.address}</p>
        <p><strong>🏷️ Categorías:</strong> ${businessData.categories?.join(', ') || 'No especificado'}</p>
        <p><strong>📋 Plan:</strong> ${businessData.subscription_plan || 'free'}</p>
        <p><strong>📅 Fecha de Registro:</strong> ${new Date().toLocaleDateString('es-GT', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</p>
      </div>
      
      ${businessData.short_description ? `<p><strong>Descripción:</strong> ${businessData.short_description}</p>` : ''}
    </div>
    <div class="footer">
      <p>Groomly - Sistema de Gestión de Negocios para Mascotas 🐾</p>
    </div>
  </div>
</body>
</html>
            `
          });
        } catch (error) {
          console.error("Error enviando email de notificación:", error);
        }
        
        return newBusiness;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-business'] });
      setIsEditing(false);
      alert('¡Negocio actualizado exitosamente!');
    },
  });

  const handlePhotoUpload = async (e, isMain = false) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      if (isMain) {
        setFormData({ ...formData, main_photo_url: file_url });
      } else {
        const photos = formData.photos || [];
        setFormData({ ...formData, photos: [...photos, file_url] });
      }
    } catch (error) {
      alert("Error subiendo la foto");
    }
    setUploadingPhoto(false);
  };

  const removePhoto = (index) => {
    const photos = [...(formData.photos || [])];
    photos.splice(index, 1);
    setFormData({ ...formData, photos });
  };

  const handleAmenityToggle = (amenity) => {
    const amenities = formData.amenities || [];
    if (amenities.includes(amenity)) {
      setFormData({ ...formData, amenities: amenities.filter(a => a !== amenity) });
    } else {
      setFormData({ ...formData, amenities: [...amenities, amenity] });
    }
  };

  const handleCategoryToggle = (category) => {
    const categories = formData.categories || [];
    if (categories.includes(category)) {
      setFormData({ ...formData, categories: categories.filter(c => c !== category) });
    } else {
      setFormData({ ...formData, categories: [...categories, category] });
    }
  };

  function LocationPicker() {
    useMapEvents({
      click(e) {
        setFormData({ ...formData, latitude: e.latlng.lat, longitude: e.latlng.lng });
      },
    });
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const amenitiesListServices = [
    { value: "parking", label: "🅿️ Estacionamiento" },
    { value: "wifi", label: "📶 WiFi" },
    { value: "air_conditioning", label: "❄️ Aire Acondicionado" },
    { value: "outdoor_area", label: "🌳 Área al Aire Libre" },
    { value: "grooming_salon", label: "✂️ Salón de Grooming" },
    { value: "surgery_room", label: "🏥 Sala de Cirugía" },
    { value: "pharmacy", label: "💊 Farmacia" },
    { value: "pet_hotel", label: "🏨 Hotel para Mascotas" },
    { value: "training_area", label: "🎓 Área de Entrenamiento" },
    { value: "isolation_area", label: "🔒 Área de Aislamiento" },
    { value: "wheelchair_accessible", label: "♿ Accesible" },
    { value: "pet_playground", label: "🐕 Área de Juegos" },
    { value: "home_service", label: "🏠 Servicio a Domicilio" },
    { value: "emergency_24h", label: "🚨 Emergencias 24h" },
  ];

  const amenitiesListAgropecuaria = [
    { value: "parking", label: "🅿️ Estacionamiento" },
    { value: "air_conditioning", label: "❄️ Aire Acondicionado" },
    { value: "wheelchair_accessible", label: "♿ Accesible" },
    { value: "pet_store", label: "🛒 Tienda de Mascotas" },
    { value: "delivery", label: "🚚 Servicio a Domicilio" },
    { value: "premium_food", label: "🥩 Alimento Premium" },
    { value: "natural_products", label: "🌿 Productos Naturales" },
    { value: "toys_accessories", label: "🎾 Juguetes y Accesorios" },
    { value: "veterinary_products", label: "💊 Productos Veterinarios" },
    { value: "bulk_sales", label: "📦 Venta al por Mayor" },
  ];

  const isAgropecuaria = (formData.categories || []).includes('agropecuaria');
  const amenitiesList = isAgropecuaria ? amenitiesListAgropecuaria : amenitiesListServices;

  const planLimits = {
    free: { appointments: 15, newBusinessDays: 8, photos: 8 },
    basic: { appointments: 50, newBusinessDays: 15, photos: 10 },
    premium: { appointments: 999999, newBusinessDays: 30, photos: 999 }
  };

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Cargando...</div>
      </div>
    );
  }

  if (!business && !isEditing) {
    return (
      <div className="min-h-screen py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="clay-card rounded-[32px] bg-white p-12 text-center">
            <div className="w-24 h-24 rounded-[24px] bg-gradient-to-br from-[#E6D9F5] to-[#C8F4DE] clay-card flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-12 h-12 text-[#7B68BE]" />
            </div>
            <h1 className="text-3xl font-bold mb-4">
              <span className="bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] bg-clip-text text-transparent">
                Registra tu Negocio
              </span>
            </h1>
            <p className="text-gray-600 mb-8">
              Únete a Groomly y llega a más clientes que aman a sus mascotas
            </p>
            <Button
              onClick={() => setIsEditing(true)}
              className="clay-button rounded-[16px] bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Mi Negocio
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] bg-clip-text text-transparent">
                Mi Negocio
              </span>
            </h1>
            {business && (
              <div className="flex items-center gap-3">
                <Badge className={`
                  ${business.subscription_plan === 'premium' ? 'bg-gradient-to-r from-[#FFD700] to-[#FFA500]' : 
                    business.subscription_plan === 'basic' ? 'bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9]' : 
                    'bg-gray-400'} text-white
                `}>
                  Plan {business.subscription_plan.toUpperCase()}
                </Badge>
                <span className="text-sm text-gray-600">
                  {planLimits[business.subscription_plan].appointments === 999999 ? 'Citas ilimitadas' : 
                   `${planLimits[business.subscription_plan].appointments} citas/mes`}
                </span>
              </div>
            )}
          </div>

          {business && !isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              className="clay-button rounded-[16px] bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] text-white"
            >
              Editar Negocio
            </Button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="basic" className="space-y-6">
              <TabsList className="clay-card rounded-[20px] p-2">
                <TabsTrigger value="basic" className="rounded-[14px]">Información Básica</TabsTrigger>
                <TabsTrigger value="photos" className="rounded-[14px]">Fotos</TabsTrigger>
                <TabsTrigger value="services" className="rounded-[14px]">Servicios</TabsTrigger>
                <TabsTrigger value="amenities" className="rounded-[14px]">Amenidades</TabsTrigger>
              </TabsList>

              <TabsContent value="basic">
                <Card className="clay-card border-0">
                  <CardContent className="p-6 space-y-6">
                    <div>
                      <Label>Nombre del Negocio *</Label>
                      <Input
                        value={formData.business_name || ''}
                        onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                        required
                        className="clay-button rounded-[16px] mt-2"
                      />
                    </div>

                    <div>
                      <Label className="mb-3 block">Categorías * (Puedes seleccionar varias)</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                          { value: "veterinary", label: "🏥 Veterinaria" },
                          { value: "grooming", label: "✂️ Grooming" },
                          { value: "spa", label: "💆 Spa Canino" },
                          { value: "training", label: "🎓 Adiestramiento" },
                          { value: "daycare", label: "🏠 Guardería" },
                          { value: "pet_shop", label: "🛒 Tienda" },
                          { value: "agropecuaria", label: "🌾 Agropecuaria" },
                        ].map((cat) => (
                          <label
                            key={cat.value}
                            className={`clay-button rounded-[12px] p-3 cursor-pointer transition-all ${
                              (formData.categories || []).includes(cat.value)
                                ? 'ring-2 ring-[#7B68BE] bg-gradient-to-r from-[#E6D9F5] to-[#C8F4DE]'
                                : 'bg-white'
                            }`}
                          >
                            <Checkbox
                              checked={(formData.categories || []).includes(cat.value)}
                              onCheckedChange={() => handleCategoryToggle(cat.value)}
                              className="mr-2"
                            />
                            <span className="text-sm">{cat.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Descripción Corta *</Label>
                      <Input
                        value={formData.short_description || ''}
                        onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                        maxLength={150}
                        className="clay-button rounded-[16px] mt-2"
                        placeholder="Máx 150 caracteres"
                      />
                    </div>

                    <div>
                      <Label>Descripción Detallada</Label>
                      <Textarea
                        value={formData.long_description || ''}
                        onChange={(e) => setFormData({ ...formData, long_description: e.target.value })}
                        className="clay-inset rounded-[16px] mt-2 min-h-[150px]"
                        placeholder="Describe tu negocio en detalle..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Años en el Mercado</Label>
                        <Input
                          type="number"
                          min="0"
                          value={formData.years_in_market || ''}
                          onChange={(e) => setFormData({ ...formData, years_in_market: parseInt(e.target.value) })}
                          className="clay-button rounded-[16px] mt-2"
                        />
                      </div>

                      <div>
                        <Label>Especialidad (si es veterinario)</Label>
                        <Input
                          value={formData.specialty || ''}
                          onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                          className="clay-button rounded-[16px] mt-2"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Dirección *</Label>
                      <Input
                        value={formData.address || ''}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        required
                        className="clay-button rounded-[16px] mt-2"
                      />
                    </div>

                    <div>
                      <Label>Ubicación en Mapa (Haz click en el mapa para marcar tu ubicación)</Label>
                      <div className="mt-2 clay-card rounded-[20px] overflow-hidden" style={{ height: '300px' }}>
                        <MapContainer
                          center={[formData.latitude || 14.6349, formData.longitude || -90.5069]}
                          zoom={13}
                          style={{ height: '100%', width: '100%' }}
                        >
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          {formData.latitude && formData.longitude && (
                            <Marker position={[formData.latitude, formData.longitude]} />
                          )}
                          <LocationPicker />
                        </MapContainer>
                      </div>
                      {formData.latitude && formData.longitude && (
                        <p className="text-xs text-gray-500 mt-2">
                          📍 Coordenadas: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Teléfono Principal *</Label>
                        <Input
                          value={formData.phone || ''}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          required
                          className="clay-button rounded-[16px] mt-2"
                        />
                      </div>

                      <div>
                        <Label>Teléfono de Emergencias</Label>
                        <Input
                          value={formData.emergency_phone || ''}
                          onChange={(e) => setFormData({ ...formData, emergency_phone: e.target.value })}
                          className="clay-button rounded-[16px] mt-2"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Sitio Web</Label>
                      <div className="relative mt-2">
                        <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type="url"
                          value={formData.website || ''}
                          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                          className="clay-button rounded-[16px] pl-10"
                          placeholder="https://tusitio.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>WhatsApp (con código de país)</Label>
                        <div className="relative mt-2">
                          <MessageCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            value={formData.whatsapp || ''}
                            onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                            className="clay-button rounded-[16px] pl-10"
                            placeholder="+502 1234 5678"
                          />
                        </div>
                      </div>

                      {formData.whatsapp && (
                        <div className="md:col-span-2">
                          <Label>Mensaje predeterminado de WhatsApp</Label>
                          <Textarea
                            value={formData.whatsapp_message || ''}
                            onChange={(e) => setFormData({ ...formData, whatsapp_message: e.target.value })}
                            className="clay-inset rounded-[16px] mt-2"
                            placeholder="¡Hola! Me gustaría obtener más información sobre sus servicios..."
                            rows={3}
                          />
                          <p className="text-xs text-gray-500 mt-2">
                            💡 Este mensaje aparecerá cuando un cliente te contacte por WhatsApp. 
                            <br/>Al final se agregará automáticamente: <em>"Mensaje generado desde GROOMLY PET"</em>
                          </p>
                        </div>
                      )}

                      <div>
                        <Label>Facebook (URL completa)</Label>
                        <div className="relative mt-2">
                          <Facebook className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            value={formData.facebook || ''}
                            onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                            className="clay-button rounded-[16px] pl-10"
                            placeholder="https://facebook.com/..."
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Instagram (sin @)</Label>
                        <div className="relative mt-2">
                          <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            value={formData.instagram || ''}
                            onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                            className="clay-button rounded-[16px] pl-10"
                            placeholder="tunombre"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>TikTok (sin @)</Label>
                        <div className="relative mt-2">
                          <Music className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            value={formData.tiktok || ''}
                            onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
                            className="clay-button rounded-[16px] pl-10"
                            placeholder="tunombre"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-6 flex-wrap">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={formData.sells_products || false}
                            onCheckedChange={(checked) => setFormData({ ...formData, sells_products: checked })}
                          />
                          <span className="text-sm">Vende productos</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={formData.offers_vaccination || false}
                            onCheckedChange={(checked) => setFormData({ ...formData, offers_vaccination: checked })}
                          />
                          <span className="text-sm">Ofrece vacunación</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={formData.emergency_service || false}
                            onCheckedChange={(checked) => setFormData({ ...formData, emergency_service: checked })}
                          />
                          <span className="text-sm">Servicio de emergencias</span>
                        </label>
                      </div>

                      <div className="clay-card rounded-[16px] p-4 bg-gradient-to-br from-[#E6D9F5] to-[#C8F4DE]">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <Checkbox
                            checked={formData.accepts_point_redemptions || false}
                            onCheckedChange={(checked) => setFormData({ ...formData, accepts_point_redemptions: checked })}
                          />
                          <div>
                            <span className="text-sm font-bold text-[#7B68BE]">⭐ Aceptar canjes por puntos</span>
                            <p className="text-xs text-gray-600 mt-1">
                              Permite que usuarios canjeen puntos de recompensas por servicios en tu negocio
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="photos">
                <Card className="clay-card border-0">
                  <CardContent className="p-6 space-y-6">
                    <div>
                      <Label>Foto Principal (Fachada) *</Label>
                      <div className="mt-2">
                        {formData.main_photo_url ? (
                          <div className="relative">
                            <img
                              src={formData.main_photo_url}
                              alt="Main"
                              className="w-full h-64 object-cover rounded-[20px]"
                            />
                            <Button
                              type="button"
                              onClick={() => setFormData({ ...formData, main_photo_url: '' })}
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <label className="clay-inset rounded-[20px] h-64 flex flex-col items-center justify-center cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                            <span className="text-sm text-gray-600">
                              {uploadingPhoto ? 'Subiendo...' : 'Click para subir foto principal'}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handlePhotoUpload(e, true)}
                              className="hidden"
                              disabled={uploadingPhoto}
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label>Fotos de Instalaciones (mín 5, máx {planLimits[formData.subscription_plan || 'free'].photos})</Label>
                      <div className="grid grid-cols-3 gap-4 mt-2">
                        {(formData.photos || []).map((photo, idx) => (
                          <div key={idx} className="relative">
                            <img
                              src={photo}
                              alt={`Photo ${idx + 1}`}
                              className="w-full h-32 object-cover rounded-[16px]"
                            />
                            <Button
                              type="button"
                              onClick={() => removePhoto(idx)}
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                        
                        {(formData.photos || []).length < planLimits[formData.subscription_plan || 'free'].photos && (
                          <label className="clay-inset rounded-[16px] h-32 flex flex-col items-center justify-center cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                            <Upload className="w-6 h-6 text-gray-400 mb-1" />
                            <span className="text-xs text-gray-600">Agregar</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handlePhotoUpload(e, false)}
                              className="hidden"
                              disabled={uploadingPhoto}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="services">
                <Card className="clay-card border-0">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <p className="text-gray-600">
                        Los servicios se gestionan desde la sección de Dashboard → Servicios
                      </p>

                      {formData.accepts_point_redemptions && (
                        <div className="mt-6 pt-6 border-t">
                          <h4 className="font-bold mb-4 flex items-center gap-2">
                            <span>⭐</span> Configurar Servicios Canjeables por Puntos
                          </h4>
                          <p className="text-sm text-gray-600 mb-4">
                            Configura estos servicios especiales desde: <strong>Dashboard → Canjes por Puntos</strong>
                          </p>
                          <Badge className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-white">
                            Esta función se gestiona desde el dashboard
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="amenities">
                <Card className="clay-card border-0">
                  <CardContent className="p-6">
                    <Label className="mb-4 block">Selecciona las amenidades disponibles</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {amenitiesList.map((amenity) => (
                        <label
                          key={amenity.value}
                          className={`clay-button rounded-[16px] p-4 cursor-pointer transition-all ${
                            (formData.amenities || []).includes(amenity.value)
                              ? 'ring-2 ring-[#7B68BE] bg-gradient-to-r from-[#E6D9F5] to-[#C8F4DE]'
                              : 'bg-white'
                          }`}
                        >
                          <Checkbox
                            checked={(formData.amenities || []).includes(amenity.value)}
                            onCheckedChange={() => handleAmenityToggle(amenity.value)}
                            className="mr-2"
                          />
                          <span className="text-sm">{amenity.label}</span>
                        </label>
                      ))}
                    </div>

                    {/* Amenidades personalizadas */}
                    <div className="mt-6 pt-6 border-t">
                      <Label className="mb-3 block">Agregar amenidades personalizadas (máximo 5)</Label>
                      <div className="flex gap-2 mb-4">
                        <Input
                          value={customAmenity}
                          onChange={(e) => setCustomAmenity(e.target.value)}
                          placeholder="Ej: Área de espera climatizada"
                          className="clay-button rounded-[16px]"
                          maxLength={50}
                        />
                        <Button
                          type="button"
                          onClick={() => {
                            if (customAmenity.trim()) {
                              const customAmenities = (formData.custom_amenities || []);
                              if (customAmenities.length < 5) {
                                setFormData({
                                  ...formData,
                                  custom_amenities: [...customAmenities, customAmenity.trim()]
                                });
                                setCustomAmenity("");
                              }
                            }
                          }}
                          disabled={(formData.custom_amenities || []).length >= 5}
                          className="clay-button rounded-[16px] bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] text-white"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>

                      {(formData.custom_amenities || []).length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {formData.custom_amenities.map((amenity, idx) => (
                            <Badge
                              key={idx}
                              className="clay-button rounded-full px-4 py-2 bg-gradient-to-r from-[#E6D9F5] to-[#C8F4DE]"
                            >
                              ✨ {amenity}
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = formData.custom_amenities.filter((_, i) => i !== idx);
                                  setFormData({ ...formData, custom_amenities: updated });
                                }}
                                className="ml-2 text-red-500 hover:text-red-700"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {(formData.custom_amenities || []).length}/5 amenidades personalizadas
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex gap-4 mt-6">
              <Button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setFormData(business || {});
                }}
                variant="outline"
                className="flex-1 clay-button rounded-[16px]"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex-1 clay-button rounded-[16px] bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="clay-card rounded-[24px] bg-white p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-bold text-lg mb-4">Información General</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm text-gray-600">Nombre</dt>
                    <dd className="font-medium">{business.business_name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-600">Categoría</dt>
                    <dd className="font-medium capitalize">{business.category?.replace('_', ' ')}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-600">Teléfono</dt>
                    <dd className="font-medium">{business.phone}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-600">Dirección</dt>
                    <dd className="font-medium">{business.address}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-4">Estadísticas</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm text-gray-600">Calificación</dt>
                    <dd className="font-medium">⭐ {business.rating_average || 0} / 5.0</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-600">Total de Reseñas</dt>
                    <dd className="font-medium">{business.total_reviews || 0}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-600">Plan Actual</dt>
                    <dd className="font-medium capitalize">{business.subscription_plan}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}