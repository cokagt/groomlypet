import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Plus, Edit2, Trash2, Eye, Save, ArrowLeft, 
  BookOpen, Image, Tag, Calendar 
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function ManageBlogPage() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    cover_image: "",
    category: "",
    tags: [],
    is_published: false
  });
  const [tagInput, setTagInput] = useState("");

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      if (currentUser.user_type !== "admin") {
        window.location.href = "/";
        return;
      }
      setUser(currentUser);
    };
    loadUser();
  }, []);

  const { data: posts, isLoading } = useQuery({
    queryKey: ['blog-posts-admin'],
    queryFn: () => base44.entities.BlogPost.list('-created_date'),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.BlogPost.create({
      ...data,
      author_name: user.full_name,
      author_email: user.email
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts-admin'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BlogPost.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts-admin'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.BlogPost.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts-admin'] });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      cover_image: "",
      category: "",
      tags: [],
      is_published: false
    });
    setEditingPost(null);
    setShowForm(false);
    setTagInput("");
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setFormData({
      title: post.title || "",
      slug: post.slug || "",
      excerpt: post.excerpt || "",
      content: post.content || "",
      cover_image: post.cover_image || "",
      category: post.category || "",
      tags: post.tags || [],
      is_published: post.is_published || false
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    const slug = formData.slug || formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const dataToSave = { ...formData, slug };

    if (editingPost) {
      updateMutation.mutate({ id: editingPost.id, data: dataToSave });
    } else {
      createMutation.mutate(dataToSave);
    }
  };

  const handleDelete = (id) => {
    if (confirm('¿Estás seguro de eliminar este artículo?')) {
      deleteMutation.mutate(id);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput("");
    }
  };

  const removeTag = (tag) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

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

  if (!user) return null;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("Profile")}>
              <Button variant="outline" size="icon" className="clay-button rounded-[16px]">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">
                <span className="bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] bg-clip-text text-transparent">
                  Gestionar Blog
                </span>
              </h1>
              <p className="text-gray-600">Crea y administra artículos del blog</p>
            </div>
          </div>

          <Button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="clay-button rounded-[16px] bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Artículo
          </Button>
        </div>

        {/* Posts List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="clay-card border-0 animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <Card className="clay-card border-0">
            <CardContent className="p-12 text-center">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">No hay artículos</h3>
              <p className="text-gray-600 mb-4">Crea tu primer artículo del blog</p>
              <Button
                onClick={() => setShowForm(true)}
                className="clay-button rounded-[16px] bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Artículo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <Card key={post.id} className="clay-card border-0 hover:scale-[1.01] transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {post.cover_image && (
                      <img
                        src={post.cover_image}
                        alt={post.title}
                        className="w-24 h-24 object-cover rounded-[12px] flex-shrink-0"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-lg">{post.title}</h3>
                          <p className="text-sm text-gray-500">
                            {post.created_date && format(new Date(post.created_date), "dd MMM yyyy", { locale: es })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={post.is_published ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                            {post.is_published ? "Publicado" : "Borrador"}
                          </Badge>
                          {post.category && (
                            <Badge className={categoryColors[post.category]}>
                              {categoryLabels[post.category]}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{post.excerpt}</p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(post)}
                          className="clay-button rounded-[12px]"
                        >
                          <Edit2 className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                        <Link to={createPageUrl("Blog") + `?id=${post.id}`} target="_blank">
                          <Button
                            variant="outline"
                            size="sm"
                            className="clay-button rounded-[12px]"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(post.id)}
                          className="clay-button rounded-[12px] text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Form Modal */}
        <Dialog open={showForm} onOpenChange={() => resetForm()}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPost ? "Editar Artículo" : "Nuevo Artículo"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label>Título *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="clay-button rounded-[12px] mt-2"
                  placeholder="Título del artículo"
                />
              </div>

              <div>
                <Label>URL Amigable (slug)</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="clay-button rounded-[12px] mt-2"
                  placeholder="mi-articulo (se genera automáticamente)"
                />
              </div>

              <div>
                <Label>Resumen</Label>
                <Textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="clay-inset rounded-[12px] mt-2"
                  placeholder="Un resumen corto del artículo..."
                  rows={2}
                />
              </div>

              <div>
                <Label>Contenido *</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="clay-inset rounded-[12px] mt-2 min-h-[200px]"
                  placeholder="Escribe el contenido del artículo (soporta Markdown)..."
                />
              </div>

              <div>
                <Label className="flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  URL de Imagen de Portada
                </Label>
                <Input
                  value={formData.cover_image}
                  onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                  className="clay-button rounded-[12px] mt-2"
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label>Categoría</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="clay-button rounded-[12px] mt-2">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cuidados">Cuidados</SelectItem>
                    <SelectItem value="nutricion">Nutrición</SelectItem>
                    <SelectItem value="salud">Salud</SelectItem>
                    <SelectItem value="entrenamiento">Entrenamiento</SelectItem>
                    <SelectItem value="grooming">Grooming</SelectItem>
                    <SelectItem value="noticias">Noticias</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Etiquetas
                </Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="clay-button rounded-[12px]"
                    placeholder="Agregar etiqueta..."
                  />
                  <Button type="button" onClick={addTag} variant="outline" className="clay-button rounded-[12px]">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between clay-inset rounded-[12px] p-4 bg-gray-50">
                <div>
                  <Label>Publicar artículo</Label>
                  <p className="text-xs text-gray-500">El artículo será visible en el blog</p>
                </div>
                <Switch
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="clay-button rounded-[16px]"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!formData.title || !formData.content || createMutation.isPending || updateMutation.isPending}
                  className="flex-1 clay-button rounded-[16px] bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingPost ? 'Guardar Cambios' : 'Crear Artículo'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}