import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload } from "lucide-react";

export default function PetFormModal({ pet, onClose, userEmail }) {
    const [formData, setFormData] = useState({
        name: pet?.name || "",
        species: pet?.species || "dog",
        breed: pet?.breed || "",
        age_years: pet?.age_years || "",
        weight_kg: pet?.weight_kg || "",
        allergies: pet?.allergies || "",
        observations: pet?.observations || "",
        photo_url: pet?.photo_url || "",
    });
    const [isUploading, setIsUploading] = useState(false);
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (data) => {
            if (pet) {
                // Actualizar mascota - dar puntos si cambió la info
                const updated = await base44.entities.Pet.update(pet.id, data);

                const currentUser = await base44.auth.me();
                const pointsToAdd = 10; // Actualizar info de mascota

                await base44.auth.updateMe({
                    reward_points: (currentUser.reward_points || 0) + pointsToAdd,
                    total_lifetime_points: (currentUser.total_lifetime_points || 0) + pointsToAdd
                });

                await base44.entities.RewardAction.create({
                    user_email: userEmail,
                    action_type: 'complete_profile',
                    points_earned: pointsToAdd,
                    description: `Actualizaste la información de ${data.name}`
                });

                return updated;
            } else {
                // Crear la mascota
                const newPet = await base44.entities.Pet.create({
                    ...data,
                    owner_email: userEmail,
                    is_active: true
                });

                // Obtener usuario actual
                const currentUser = await base44.auth.me();
                const currentPoints = currentUser.reward_points || 0;
                const lifetimePoints = currentUser.total_lifetime_points || 0;
                const pointsToAdd = 40;

                // Calcular nuevo tier basado en puntos totales
                const newLifetimePoints = lifetimePoints + pointsToAdd;
                let newTier = 'bronze';
                if (newLifetimePoints >= 2000) newTier = 'platinum';
                else if (newLifetimePoints >= 1000) newTier = 'gold';
                else if (newLifetimePoints >= 500) newTier = 'silver';

                // Actualizar puntos y tier del usuario
                await base44.auth.updateMe({
                    reward_points: currentPoints + pointsToAdd,
                    total_lifetime_points: newLifetimePoints,
                    reward_tier: newTier
                });

                // Registrar acción de recompensa
                await base44.entities.RewardAction.create({
                    user_email: userEmail,
                    action_type: 'add_pet',
                    points_earned: pointsToAdd,
                    description: `Agregaste a ${data.name} a tu perfil`,
                    metadata: { pet_id: newPet.id }
                });

                return newPet;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-pets'] });
            onClose();
            window.location.reload(); // Recargar para actualizar puntos en el layout
        },
    });

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const { file_url } = await base44.integrations.Core.UploadFile({ file });

            // Si es una nueva foto (no tenía antes), dar 15 puntos
            if (!pet?.photo_url && !formData.photo_url) {
                const currentUser = await base44.auth.me();
                const pointsToAdd = 15;

                await base44.auth.updateMe({
                    reward_points: (currentUser.reward_points || 0) + pointsToAdd,
                    total_lifetime_points: (currentUser.total_lifetime_points || 0) + pointsToAdd
                });

                await base44.entities.RewardAction.create({
                    user_email: userEmail,
                    action_type: 'complete_profile',
                    points_earned: pointsToAdd,
                    description: 'Subiste foto de tu mascota'
                });
            }

            setFormData({ ...formData, photo_url: file_url });
        } catch (error) {
            alert("Error subiendo la imagen");
        }
        setIsUploading(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">
                        {pet ? 'Editar Mascota' : 'Agregar Nueva Mascota'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    {/* Photo Upload */}
                    <div>
                        <Label>Foto de tu mascota</Label>
                        <div className="mt-2">
                            {formData.photo_url ? (
                                <div className="relative">
                                    <img
                                        src={formData.photo_url}
                                        alt="Pet"
                                        className="w-full h-48 object-cover rounded-[20px]"
                                    />
                                    <Button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, photo_url: "" })}
                                        variant="destructive"
                                        size="sm"
                                        className="absolute top-2 right-2"
                                    >
                                        Eliminar
                                    </Button>
                                </div>
                            ) : (
                                <label className="clay-inset rounded-[20px] h-48 flex flex-col items-center justify-center cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                    <span className="text-sm text-gray-600">
                                        {isUploading ? 'Subiendo...' : 'Click para subir foto'}
                                    </span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                        disabled={isUploading}
                                    />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Name */}
                    <div>
                        <Label htmlFor="name">Nombre *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            className="clay-button rounded-[16px] mt-2"
                            placeholder="Nombre de tu mascota"
                        />
                    </div>

                    {/* Species */}
                    <div>
                        <Label htmlFor="species">Tipo *</Label>
                        <Select
                            value={formData.species}
                            onValueChange={(value) => setFormData({ ...formData, species: value })}
                        >
                            <SelectTrigger className="clay-button rounded-[16px] mt-2">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="dog">🐕 Perro</SelectItem>
                                <SelectItem value="cat">🐈 Gato</SelectItem>
                                <SelectItem value="bird">🦜 Ave</SelectItem>
                                <SelectItem value="rabbit">🐰 Conejo</SelectItem>
                                <SelectItem value="other">🐾 Otro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Breed */}
                    <div>
                        <Label htmlFor="breed">Raza</Label>
                        <Input
                            id="breed"
                            value={formData.breed}
                            onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                            className="clay-button rounded-[16px] mt-2"
                            placeholder="Ej: Labrador, Persa, etc."
                        />
                    </div>

                    {/* Age and Weight */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="age_years">Edad (años)</Label>
                            <Input
                                id="age_years"
                                type="number"
                                min="0"
                                step="0.5"
                                value={formData.age_years}
                                onChange={(e) => setFormData({ ...formData, age_years: parseFloat(e.target.value) })}
                                className="clay-button rounded-[16px] mt-2"
                                placeholder="0"
                            />
                        </div>

                        <div>
                            <Label htmlFor="weight_kg">Peso (kg)</Label>
                            <Input
                                id="weight_kg"
                                type="number"
                                min="0"
                                step="0.1"
                                value={formData.weight_kg}
                                onChange={(e) => setFormData({ ...formData, weight_kg: parseFloat(e.target.value) })}
                                className="clay-button rounded-[16px] mt-2"
                                placeholder="0"
                            />
                        </div>
                    </div>

                    {/* Allergies */}
                    <div>
                        <Label htmlFor="allergies">Alergias</Label>
                        <Input
                            id="allergies"
                            value={formData.allergies}
                            onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                            className="clay-button rounded-[16px] mt-2"
                            placeholder="Alergias o sensibilidades alimentarias"
                        />
                    </div>

                    {/* Observations */}
                    <div>
                        <Label htmlFor="observations">Observaciones</Label>
                        <Textarea
                            id="observations"
                            value={formData.observations}
                            onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                            className="clay-inset rounded-[16px] mt-2 min-h-[100px]"
                            placeholder="Comportamiento, medicamentos, condiciones especiales, etc."
                        />
                    </div>

                    {/* Buttons */}
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
                            disabled={mutation.isPending || isUploading}
                            className="flex-1 clay-button rounded-[16px] bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] text-white"
                        >
                            {mutation.isPending ? 'Guardando...' : pet ? 'Actualizar' : 'Agregar'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}