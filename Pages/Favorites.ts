import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Heart, Building2 } from "lucide-react";
import BusinessCard from "../components/search/BusinessCard";

export default function FavoritesPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  const { data: favorites, isLoading } = useQuery({
    queryKey: ['my-favorites', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.Favorite.filter({ user_email: user.email });
    },
    enabled: !!user,
    initialData: [],
  });

  const { data: businesses } = useQuery({
    queryKey: ['favorite-businesses'],
    queryFn: async () => {
      const businessIds = favorites
        .filter(f => f.favorite_type === "business")
        .map(f => f.business_id);
      
      if (businessIds.length === 0) return [];
      
      const allBusinesses = await base44.entities.Business.list();
      return allBusinesses.filter(b => businessIds.includes(b.id));
    },
    enabled: favorites.length > 0,
    initialData: [],
  });

  if (!user) return null;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] bg-clip-text text-transparent">
              Mis Favoritos
            </span>
          </h1>
          <p className="text-gray-600">Negocios y servicios que te gustan</p>
        </div>

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
        ) : businesses.length === 0 ? (
          <div className="clay-card rounded-[24px] bg-white p-12 text-center">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2 text-gray-800">No tienes favoritos</h3>
            <p className="text-gray-600">
              Explora servicios y marca tus negocios favoritos para encontrarlos fácilmente
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businesses.map((business) => (
              <BusinessCard key={business.id} business={business} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}