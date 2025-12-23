import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, Camera } from "lucide-react";
import PetFormModal from "../components/pets/PetFormModal";

export default function MyPetsPage() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPet, setEditingPet] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  const { data: pets, isLoading } = useQuery({
    queryKey: ['my-pets', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.Pet.filter({ owner_email: user.email, is_active: true });
    },
    enabled: !!user,
    initialData: [],
  });

  const deleteMutation = useMutation({
    mutationFn: (petId) => base44.entities.Pet.update(petId, { is_active: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-pets'] });
    },
  });

  const handleEdit = (pet) => {
    setEditingPet(pet);
    setShowForm(true);
  };

  const handleDelete = async (petId) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta mascota?')) {
      deleteMutation.mutate(petId);
    }
  };

  const speciesEmoji = {
    dog: "🐕",
    cat: "🐈",
    bird: "🦜",
    rabbit: "🐰",
    other: "🐾"
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] bg-clip-text text-transparent">
                Mis Mascotas
              </span>
            </h1>
            <p className="text-gray-600">Puedes registrar hasta 5 mascotas</p>
          </div>
          
          <Button
            onClick={() => {
              setEditingPet(null);
              setShowForm(true);
            }}
            disabled={pets.length >= 5}
            className="clay-button rounded-[16px] bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Mascota
          </Button>
        </div>

        {/* Pets Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="clay-card rounded-[24px] bg-white p-6 animate-pulse">
                <div className="h-48 bg-gray-200 rounded-[20px] mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : pets.length === 0 ? (
          <div className="clay-card rounded-[24px] bg-white p-12 text-center">
            <div className="text-6xl mb-4">🐾</div>
            <h3 className="text-xl font-bold mb-2 text-gray-800">No tienes mascotas registradas</h3>
            <p className="text-gray-600 mb-6">Agrega tu primera mascota para comenzar</p>
            <Button
              onClick={() => setShowForm(true)}
              className="clay-button rounded-[16px] bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Mascota
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pets.map((pet) => (
              <div key={pet.id} className="clay-card rounded-[24px] bg-white overflow-hidden group">
                {/* Pet Image */}
                <div className="relative h-56 overflow-hidden bg-gradient-to-br from-[#E6D9F5] to-[#C7E9F8]">
                  {pet.photo_url ? (
                    <img
                      src={pet.photo_url}
                      alt={pet.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">
                      {speciesEmoji[pet.species]}
                    </div>
                  )}
                  
                  {/* Actions Overlay */}
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      onClick={() => handleEdit(pet)}
                      size="icon"
                      className="clay-button rounded-full bg-white/90 backdrop-blur-sm hover:bg-white"
                    >
                      <Edit2 className="w-4 h-4 text-[#7B68BE]" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(pet.id)}
                      size="icon"
                      className="clay-button rounded-full bg-white/90 backdrop-blur-sm hover:bg-white"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>

                {/* Pet Info */}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{speciesEmoji[pet.species]}</span>
                    <h3 className="text-xl font-bold text-gray-800">{pet.name}</h3>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Raza:</span>
                      <span className="font-medium">{pet.breed || 'No especificada'}</span>
                    </div>
                    
                    {pet.age_years && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Edad:</span>
                        <span className="font-medium">{pet.age_years} años</span>
                      </div>
                    )}
                    
                    {pet.weight_kg && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Peso:</span>
                        <span className="font-medium">{pet.weight_kg} kg</span>
                      </div>
                    )}
                    
                    {pet.allergies && (
                      <div className="pt-2 border-t">
                        <span className="text-gray-600">Alergias:</span>
                        <p className="text-xs text-gray-700 mt-1">{pet.allergies}</p>
                      </div>
                    )}
                    
                    {pet.observations && (
                      <div className="pt-2 border-t">
                        <span className="text-gray-600">Observaciones:</span>
                        <p className="text-xs text-gray-700 mt-1 line-clamp-2">{pet.observations}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Card */}
        {pets.length > 0 && pets.length < 5 && (
          <div className="mt-8 clay-card rounded-[24px] bg-gradient-to-r from-[#E6D9F5] to-[#C8F4DE] p-6">
            <div className="flex items-center gap-4">
              <div className="text-4xl">💡</div>
              <div>
                <h4 className="font-bold text-gray-800 mb-1">
                  Tienes {pets.length} de 5 mascotas registradas
                </h4>
                <p className="text-sm text-gray-600">
                  Puedes agregar {5 - pets.length} mascota{5 - pets.length !== 1 ? 's' : ''} más
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <PetFormModal
          pet={editingPet}
          onClose={() => {
            setShowForm(false);
            setEditingPet(null);
          }}
          userEmail={user.email}
        />
      )}
    </div>
  );
}