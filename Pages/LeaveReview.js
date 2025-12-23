import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Star, CheckCircle, PawPrint } from "lucide-react";

export default function LeaveReviewPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const appointmentId = urlParams.get('appointment');
  const token = urlParams.get('token');
  
  const [user, setUser] = useState(null);
  const [ratings, setRatings] = useState({
    cleanliness: 0,
    punctuality: 0,
    order: 0,
    service_quality: 0,
    staff_friendliness: 0
  });
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        // Usuario no autenticado, redirigir a login
        base44.auth.redirectToLogin(window.location.href);
      }
    };
    loadUser();
  }, []);

  const { data: appointment } = useQuery({
    queryKey: ['appointment-review', appointmentId],
    queryFn: async () => {
      const appointments = await base44.entities.Appointment.filter({ id: appointmentId });
      return appointments[0];
    },
    enabled: !!appointmentId,
  });

  const { data: business } = useQuery({
    queryKey: ['business-review', appointment?.business_id],
    queryFn: async () => {
      const businesses = await base44.entities.Business.filter({ id: appointment.business_id });
      return businesses[0];
    },
    enabled: !!appointment?.business_id,
  });

  const { data: existingReview } = useQuery({
    queryKey: ['existing-review', appointmentId],
    queryFn: async () => {
      const reviews = await base44.entities.Review.filter({ appointment_id: appointmentId });
      return reviews[0];
    },
    enabled: !!appointmentId,
  });

  const ratingCategories = [
    { key: 'cleanliness', label: '🧹 Limpieza', description: '¿El lugar estaba limpio?' },
    { key: 'punctuality', label: '⏰ Puntualidad', description: '¿Te atendieron a tiempo?' },
    { key: 'order', label: '📋 Orden', description: '¿El proceso fue organizado?' },
    { key: 'service_quality', label: '✨ Calidad del Servicio', description: '¿Quedaste satisfecho con el resultado?' },
    { key: 'staff_friendliness', label: '😊 Amabilidad', description: '¿El personal fue amable?' }
  ];

  const handleSubmit = async () => {
    if (Object.values(ratings).some(r => r === 0)) {
      setError("Por favor califica todas las categorías");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const overallRating = Math.round(Object.values(ratings).reduce((a, b) => a + b, 0) / 5);

      // Crear la reseña
      const newReview = await base44.entities.Review.create({
        user_email: user.email,
        business_id: appointment.business_id,
        appointment_id: appointmentId,
        rating: overallRating,
        comment: comment,
        service_quality: ratings.service_quality,
        cleanliness: ratings.cleanliness,
        staff_friendliness: ratings.staff_friendliness,
        punctuality: ratings.punctuality,
        order: ratings.order
      });

      // Actualizar estrellas del usuario
      const currentStars = user.loyalty_stars || 0;
      const currentPoints = user.reward_points || 0;
      const lifetimePoints = user.total_lifetime_points || 0;
      const pointsToAdd = 30;

      // Calcular nuevo tier basado en puntos totales
      const newLifetimePoints = lifetimePoints + pointsToAdd;
      let newTier = 'bronze';
      if (newLifetimePoints >= 2000) newTier = 'platinum';
      else if (newLifetimePoints >= 1000) newTier = 'gold';
      else if (newLifetimePoints >= 500) newTier = 'silver';

      await base44.auth.updateMe({ 
        loyalty_stars: currentStars + 1,
        reward_points: currentPoints + pointsToAdd,
        total_lifetime_points: newLifetimePoints,
        reward_tier: newTier
      });

      // Registrar acción de recompensa
      await base44.entities.RewardAction.create({
        user_email: user.email,
        action_type: 'leave_review',
        points_earned: pointsToAdd,
        description: `Dejaste una reseña en ${business.business_name}`,
        metadata: { review_id: newReview.id, business_id: business.id }
      });

      // Actualizar rating del negocio
      const allReviews = await base44.entities.Review.filter({ business_id: appointment.business_id });
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      await base44.entities.Business.update(appointment.business_id, {
        rating_average: avgRating,
        total_reviews: allReviews.length
      });

      // Marcar cita como revisada
      await base44.entities.Appointment.update(appointmentId, { review_submitted: true });

      setSubmitted(true);
    } catch (err) {
      setError("Error al enviar la reseña. Intenta de nuevo.");
    }
    setIsSubmitting(false);
  };

  if (existingReview) {
    return (
      <div className="min-h-screen py-16 px-4">
        <div className="max-w-lg mx-auto">
          <Card className="clay-card border-0">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#C8F4DE] to-[#B0E7C9] clay-card flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Ya dejaste tu reseña</h2>
              <p className="text-gray-600">Gracias por compartir tu experiencia</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen py-16 px-4">
        <div className="max-w-lg mx-auto">
          <Card className="clay-card border-0">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#C8F4DE] to-[#B0E7C9] clay-card flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">¡Gracias por tu reseña!</h2>
              <p className="text-gray-600 mb-4">Tu opinión es muy valiosa</p>
              
              <div className="space-y-3">
                <div className="clay-inset rounded-[16px] p-4 bg-gradient-to-r from-[#FFD700]/20 to-[#FFA500]/20">
                  <div className="flex items-center justify-center gap-2">
                    <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                    <span className="font-bold text-lg">+30 Puntos de Recompensas</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">¡Úsalos para canjear premios increíbles!</p>
                </div>
                <div className="clay-inset rounded-[16px] p-4 bg-gradient-to-r from-yellow-100 to-yellow-200">
                  <div className="flex items-center justify-center gap-2">
                    <Star className="w-6 h-6 text-yellow-600 fill-yellow-600" />
                    <span className="font-bold text-lg">+1 Estrella de Lealtad</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">¡Los negocios valoran tu lealtad!</p>
                </div>
              </div>

              <Button
                onClick={() => window.location.href = '/'}
                className="clay-button rounded-[16px] bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] text-white"
              >
                Volver al Inicio
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!appointment || !business) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-[24px] bg-gradient-to-br from-[#E6D9F5] to-[#C7E9F8] clay-card flex items-center justify-center mx-auto mb-4">
            <PawPrint className="w-10 h-10 text-[#7B68BE]" />
          </div>
          <h1 className="text-3xl font-bold mb-2">
            <span className="bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] bg-clip-text text-transparent">
              Califica tu Experiencia
            </span>
          </h1>
          <p className="text-gray-600">en {business.business_name}</p>
        </div>

        <Card className="clay-card border-0">
          <CardContent className="p-6 space-y-6">
            {/* Rating Categories */}
            {ratingCategories.map((category) => (
              <div key={category.key} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{category.label}</div>
                    <div className="text-xs text-gray-500">{category.description}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatings({ ...ratings, [category.key]: star })}
                      className="p-2 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= ratings[category.key]
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Comment */}
            <div>
              <label className="font-medium mb-2 block">Comentario (opcional)</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Cuéntanos más sobre tu experiencia..."
                className="clay-inset rounded-[16px] min-h-[100px]"
              />
            </div>

            {error && (
              <div className="p-3 rounded-[12px] bg-red-50 text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* Info about rewards */}
            <div className="clay-inset rounded-[12px] p-3 bg-gradient-to-r from-[#FFD700]/10 to-[#FFA500]/10">
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span><strong>+30 puntos</strong> de recompensas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-600 fill-yellow-600" />
                  <span><strong>+1 estrella</strong> de lealtad</span>
                </div>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full clay-button rounded-[16px] bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] text-white"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Reseña'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}