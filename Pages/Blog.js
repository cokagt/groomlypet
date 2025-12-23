import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { BookOpen, Calendar, Eye, Tag, ArrowRight, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import ReactMarkdown from "react-markdown";

export default function BlogPage() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get('id');

  const { data: posts, isLoading } = useQuery({
    queryKey: ['blog-posts-public'],
    queryFn: async () => {
      const allPosts = await base44.entities.BlogPost.list('-created_date');
      return allPosts.filter(p => p.is_published);
    },
    initialData: [],
  });

  const { data: singlePost, isLoading: isLoadingSinglePost } = useQuery({
    queryKey: ['blog-post-public', postId],
    queryFn: async () => {
      if (!postId) return null;
      const allPosts = await base44.entities.BlogPost.list();
      return allPosts.find(p => p.id === postId) || null;
    },
    enabled: !!postId,
  });

  const categoryLabels = {
    cuidados: "Cuidados",
    nutricion: "Nutrición",
    salud: "Salud",
    entrenamiento: "Entrenamiento",
    grooming: "Grooming",
    noticias: "Noticias"
  };

  const categoryColors = {
    cuidados: "bg-blue-100 text-blue-800",
    nutricion: "bg-green-100 text-green-800",
    salud: "bg-red-100 text-red-800",
    entrenamiento: "bg-purple-100 text-purple-800",
    grooming: "bg-pink-100 text-pink-800",
    noticias: "bg-yellow-100 text-yellow-800"
  };

  // Loading state for single post
  if (postId && isLoadingSinglePost) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 w-32 bg-gray-200 rounded mb-6"></div>
            <div className="h-64 bg-gray-200 rounded-[24px] mb-8"></div>
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-10 bg-gray-200 rounded w-3/4 mb-8"></div>
            <div className="clay-card rounded-[24px] bg-white p-8">
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Post not found
  if (postId && !isLoadingSinglePost && !singlePost) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("Blog"))}
            className="mb-6 text-[#7B68BE] hover:text-[#5BA3C9]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al blog
          </Button>
          <div className="clay-card rounded-[24px] bg-white p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Artículo no encontrado</h3>
            <p className="text-gray-600">El artículo que buscas no existe o no está publicado.</p>
          </div>
        </div>
      </div>
    );
  }

  // Single Post View
  if (postId && singlePost) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("Blog"))}
            className="mb-6 text-[#7B68BE] hover:text-[#5BA3C9]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al blog
          </Button>

          {singlePost.cover_image && (
            <img
              src={singlePost.cover_image}
              alt={singlePost.title}
              className="w-full h-64 md:h-96 object-cover rounded-[24px] mb-8"
            />
          )}

          <div className="flex items-center gap-3 mb-4 flex-wrap">
            {singlePost.category && (
              <Badge className={categoryColors[singlePost.category]}>
                {categoryLabels[singlePost.category]}
              </Badge>
            )}
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {singlePost.created_date && format(new Date(singlePost.created_date), "dd MMMM yyyy", { locale: es })}
            </span>
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {singlePost.views || 0} vistas
            </span>
          </div>

          <h1 className="text-4xl font-bold mb-4 text-gray-800">{singlePost.title}</h1>
          
          {singlePost.author_name && (
            <p className="text-gray-600 mb-8">Por <strong>{singlePost.author_name}</strong></p>
          )}

          <div className="clay-card rounded-[24px] bg-white p-8 mb-8">
            <ReactMarkdown 
              className="prose prose-lg max-w-none prose-headings:text-[#7B68BE] prose-h1:text-3xl prose-h2:text-2xl prose-h2:border-b prose-h2:border-gray-200 prose-h2:pb-2 prose-h2:mb-4 prose-h3:text-xl prose-a:text-[#5BA3C9] prose-strong:text-gray-800 prose-ul:list-disc prose-ol:list-decimal prose-li:marker:text-[#7B68BE]"
              components={{
                h1: ({children}) => <h1 className="text-3xl font-bold text-[#7B68BE] mb-4 mt-6">{children}</h1>,
                h2: ({children}) => <h2 className="text-2xl font-bold text-[#7B68BE] mb-3 mt-8 pb-2 border-b border-gray-200">{children}</h2>,
                h3: ({children}) => <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-6">{children}</h3>,
                p: ({children}) => <p className="text-gray-700 leading-relaxed mb-4">{children}</p>,
                ul: ({children}) => <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>,
                ol: ({children}) => <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>,
                li: ({children}) => <li className="text-gray-700">{children}</li>,
                strong: ({children}) => <strong className="font-bold text-gray-900">{children}</strong>,
                blockquote: ({children}) => <blockquote className="border-l-4 border-[#7B68BE] pl-4 italic text-gray-600 my-4">{children}</blockquote>,
                hr: () => <hr className="my-8 border-gray-200" />,
              }}
            >
              {singlePost.content}
            </ReactMarkdown>
          </div>

          {singlePost.tags && singlePost.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="w-4 h-4 text-gray-500" />
              {singlePost.tags.map(tag => (
                <Badge key={tag} variant="outline">{tag}</Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Blog List View
  return (
    <div className="min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 rounded-[20px] bg-gradient-to-br from-[#C7E9F8] to-[#B0DCF0] clay-card flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-[#5BA3C9]" />
          </div>
          <h1 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] bg-clip-text text-transparent">
              Blog
            </span>
          </h1>
          <p className="text-xl text-gray-600">
            Consejos y artículos sobre el cuidado de mascotas
          </p>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="clay-card rounded-[24px] bg-white p-6 animate-pulse">
                <div className="h-48 bg-gray-200 rounded-[16px] mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="clay-card rounded-[32px] bg-white p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Próximamente</h3>
            <p className="text-gray-500">
              Pronto tendremos contenido educativo para ayudarte a cuidar mejor de tu mascota
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(post => (
              <Link
                key={post.id}
                to={createPageUrl("Blog") + `?id=${post.id}`}
                className="clay-card rounded-[24px] bg-white overflow-hidden hover:scale-[1.02] transition-all group"
              >
                {post.cover_image ? (
                  <img
                    src={post.cover_image}
                    alt={post.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-[#E6D9F5] to-[#C7E9F8] flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-[#7B68BE] opacity-50" />
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    {post.category && (
                      <Badge className={categoryColors[post.category]}>
                        {categoryLabels[post.category]}
                      </Badge>
                    )}
                    <span className="text-xs text-gray-500">
                      {post.created_date && format(new Date(post.created_date), "dd MMM", { locale: es })}
                    </span>
                  </div>

                  <h3 className="font-bold text-lg mb-2 text-gray-800 group-hover:text-[#7B68BE] transition-colors">
                    {post.title}
                  </h3>
                  
                  {post.excerpt && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{post.excerpt}</p>
                  )}

                  <div className="flex items-center text-[#7B68BE] text-sm font-medium">
                    Leer más <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}