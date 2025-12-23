import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CouponFormModal({ coupon, businessId, onClose }) {
    const [formData, setFormData] = useState({
        code: coupon?.code || "",
        title: coupon?.title || "",
        description: coupon?.description || "",
        discount_type: coupon?.discount_type || "percentage",
        discount_value: coupon?.discount_value || "",
        valid_from: coupon?.valid_from || new Date().toISOString().split('T')[0],
        valid_until: coupon?.valid_until || "",
        usage_limit: coupon?.usage_limit || "",
    });

    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (data) => {
            if (coupon) {
                return await base44.entities.Coupon.update(coupon.id, data);
            } else {
                return await base44.entities.Coupon.create({
                    ...data,
                    business_id: businessId,
                    is_active: true,
                    usage_count: 0
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['coupons-manage'] });
            queryClient.invalidateQueries({ queryKey: ['business-coupons'] });
        },
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await mutation.mutateAsync(formData);
            onClose();
        } catch (error) {
            console.error("Error guardando cupón:", error);
            alert("Error al guardar la promoción");
        }
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">
                        {coupon ? 'Editar Promoción' : 'Nueva Promoción'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div>
                        <Label>Título de la Promoción *</Label>
                        <Input
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                            className="clay-button rounded-[16px] mt-2"
                            placeholder="Ej: 20% de descuento en primera visita"
                        />
                    </div>

                    <div>
                        <Label>Código del Cupón *</Label>
                        <Input
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                            required
                            className="clay-button rounded-[16px] mt-2"
                            placeholder="Ej: BIENVENIDA20"
                            maxLength={20}
                        />
                        <p className="text-xs text-gray-500 mt-1">Este código lo usarán los clientes para aplicar el descuento</p>
                    </div>

                    <div>
                        <Label>Descripción</Label>
                        <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="clay-inset rounded-[16px] mt-2"
                            placeholder="Describe los detalles de la promoción..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Tipo de Descuento *</Label>
                            <Select
                                value={formData.discount_type}
                                onValueChange={(value) => setFormData({ ...formData, discount_type: value })}
                            >
                                <SelectTrigger className="clay-button rounded-[16px] mt-2">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                                    <SelectItem value="fixed">Monto Fijo ($)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Valor del Descuento *</Label>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.discount_value}
                                onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) })}
                                required
                                className="clay-button rounded-[16px] mt-2"
                                placeholder={formData.discount_type === 'percentage' ? '20' : '100'}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Válido Desde *</Label>
                            <Input
                                type="date"
                                value={formData.valid_from}
                                onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                                required
                                className="clay-button rounded-[16px] mt-2"
                            />
                        </div>

                        <div>
                            <Label>Válido Hasta *</Label>
                            <Input
                                type="date"
                                value={formData.valid_until}
                                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                                required
                                className="clay-button rounded-[16px] mt-2"
                            />
                        </div>
                    </div>

                    <div>
                        <Label>Límite de Usos (opcional)</Label>
                        <Input
                            type="number"
                            min="0"
                            value={formData.usage_limit}
                            onChange={(e) => setFormData({ ...formData, usage_limit: parseInt(e.target.value) })}
                            className="clay-button rounded-[16px] mt-2"
                            placeholder="Dejar vacío para usos ilimitados"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            onClick={onClose}
                            variant="outline"
                            className="flex-1 clay-button rounded-[16px]"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={mutation.isPending}
                            className="flex-1 clay-button rounded-[16px] bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] text-white"
                        >
                            {mutation.isPending ? 'Guardando...' : coupon ? 'Actualizar' : 'Crear Promoción'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}