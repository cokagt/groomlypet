import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function MyReviews({ userEmail }) {
    const { data: reviews, isLoading } = useQuery({
        queryKey: ['my-reviews', userEmail],
        queryFn: async () => {
            return await base44.entities.Review.filter({ user_email: userEmail }, '-created_date');
        },
        enabled: !!userEmail,
        initialData: [],
    });

    const { data: businesses } = useQuery({
        queryKey: ['businesses-for-reviews'],
        queryFn: async () => {
            return await base44.entities.Business.list();
        },
        initialData: [],
    });

    const getBusinessName = (businessId) => {
        const business = businesses.find(b => b.id === businessId);
        return business?.business_name || "Negocio";
    };

    if (isLoading) {
        return (
            <Card className="clay-card border-0">
                <CardContent className="p-6">
                    <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="clay-card border-0">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Mis Reseñas ({reviews.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                {reviews.length === 0 ? (
                    <div className="text-center py-8">
                        <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No has dejado reseñas aún</p>
                        <p className="text-sm text-gray-400 mt-1">
                            Después de completar una cita, recibirás una invitación para calificar
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reviews.map((review) => (
                            <div key={review.id} className="clay-inset rounded-[16px] p-4 bg-gray-50">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-medium">{getBusinessName(review.business_id)}</h4>
                                    <span className="text-xs text-gray-500">
                                        {format(new Date(review.created_date), 'dd MMM yyyy', { locale: es })}
                                    </span>
                                </div>

                                <div className="flex items-center gap-1 mb-2">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`w-4 h-4 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                                        />
                                    ))}
                                    <span className="text-sm text-gray-600 ml-1">{review.rating}/5</span>
                                </div>

                                {review.comment && (
                                    <p className="text-sm text-gray-600">{review.comment}</p>
                                )}

                                <div className="grid grid-cols-5 gap-2 mt-3 text-xs">
                                    <div className="text-center">
                                        <div className="text-gray-500">Limpieza</div>
                                        <div className="font-medium">{review.cleanliness || '-'}/5</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-gray-500">Puntualidad</div>
                                        <div className="font-medium">{review.punctuality || '-'}/5</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-gray-500">Orden</div>
                                        <div className="font-medium">{review.order || '-'}/5</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-gray-500">Calidad</div>
                                        <div className="font-medium">{review.service_quality || '-'}/5</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-gray-500">Amabilidad</div>
                                        <div className="font-medium">{review.staff_friendliness || '-'}/5</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}