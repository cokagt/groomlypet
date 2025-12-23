import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

export default function ServiceFormModal({ service, businessId, isProduct = false, onClose }) {
    const itemLabel = isProduct ? 'Producto' : 'Servicio';
    const [formData, setFormData] = useState({
        service_name: service?.service_name || "",
        description: service?.description || "",
        price: service?.price || "",
        currency: service?.currency || "USD",
        duration_minutes: service?.duration_minutes || "",
        available_for_species: service?.available_for_species || [],
    });

    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (data) => {
            if (service) {
                return await base44.entities.Service.update(service.id, data);
            } else {
                return await base44.entities.Service.create({
                    ...data,
                    business_id: businessId,
                    is_active: true
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['services-manage'] });
            queryClient.invalidateQueries({ queryKey: ['business-services'] });
            onClose();
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    const speciesOptions = [
        { value: "dog", label: "🐕 Perros" },
        { value: "cat", label: "🐈 Gatos" },
        { value: "bird", label: "🦜 Aves" },
        { value: "rabbit", label: "🐰 Conejos" },
        { value: "other", label: "🐾 Otros" },
    ];

    const toggleSpecies = (species) => {
        const current = formData.available_for_species || [];
        if (current.includes(species)) {
            setFormData({ ...formData, available_for_species: current.filter(s => s !== species) });
        } else {
            setFormData({ ...formData, available_for_species: [...current, species] });
        }
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">
                        {service ? `Editar ${itemLabel}` : `Nuevo ${itemLabel}`}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div>
                        <Label>Nombre del {itemLabel} *</Label>
                        <Input
                            value={formData.service_name}
                            onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                            required
                            className="clay-button rounded-[16px] mt-2"
                            placeholder={isProduct ? "Ej: Alimento Premium 20kg" : "Ej: Baño y Corte Premium"}
                        />
                    </div>

                    <div>
                        <Label>Descripción</Label>
                        <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="clay-inset rounded-[16px] mt-2"
                            placeholder="Describe el servicio..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Precio *</Label>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                required
                                className="clay-button rounded-[16px] mt-2"
                            />
                        </div>

                        {!isProduct && (
                            <div>
                                <Label>Duración (minutos)</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={formData.duration_minutes}
                                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                                    className="clay-button rounded-[16px] mt-2"
                                />
                            </div>
                        )}
                    </div>

                    <div>
                        <Label className="mb-3 block">{isProduct ? 'Para tipo de mascota:' : 'Disponible para:'}</Label>
                        <div className="grid grid-cols-2 gap-3">
                            {speciesOptions.map(option => (
                                <label
                                    key={option.value}
                                    className={`flex items-center gap-2 p-3 rounded-[12px] cursor-pointer transition-all ${(formData.available_for_species || []).includes(option.value)
                                            ? 'clay-inset bg-gradient-to-r from-[#E6D9F5] to-[#C8F4DE]'
                                            : 'clay-button bg-white'
                                        }`}
                                >
                                    <Checkbox
                                        checked={(formData.available_for_species || []).includes(option.value)}
                                        onCheckedChange={() => toggleSpecies(option.value)}
                                    />
                                    <span className="text-sm">{option.label}</span>
                                </label>
                            ))}
                        </div>
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
                            {mutation.isPending ? 'Guardando...' : service ? 'Actualizar' : `Crear ${itemLabel}`}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}