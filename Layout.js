import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
    Home, Search, BookOpen, User, LogIn,
    LogOut, Menu, X, PawPrint, Calendar, Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NotificationBell, { useUnreadNotifications } from "./components/notifications/NotificationBell";

function MobileProfileButton({ user }) {
    const unreadCount = useUnreadNotifications(user);

    return (
        <Link
            to={createPageUrl("Profile")}
            className="flex flex-col items-center justify-center flex-1 py-2 relative"
        >
            <div className="p-2 rounded-full relative">
                <User className="w-6 h-6 text-gray-500" />
                {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    </div>
                )}
            </div>
            <span className="text-xs mt-1 text-gray-500">Perfil</span>
        </Link>
    );
}

export default function Layout({ children, currentPageName }) {
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const currentUser = await base44.auth.me();
                setUser(currentUser);
            } catch (error) {
                console.log("Usuario no autenticado");
            }
        };
        loadUser();
    }, []);

    // Scroll to top on route change
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.pathname]);

    const mainNavigation = [
        { title: "Inicio", url: createPageUrl("Home"), icon: Home },
        { title: "Buscar", url: createPageUrl("Search"), icon: Search },
        { title: "Blog", url: createPageUrl("Blog"), icon: BookOpen },
    ];

    const getMobileBottomNav = () => {
        if (user?.user_type === 'business') {
            return [
                { title: "Inicio", url: createPageUrl("Home"), icon: Home },
                { title: "Agenda", url: createPageUrl("BusinessAppointments"), icon: Calendar },
                { title: "Negocio", url: createPageUrl("MyBusiness"), icon: Building2 },
            ];
        }
        return [
            { title: "Inicio", url: createPageUrl("Home"), icon: Home },
            { title: "Buscar", url: createPageUrl("Search"), icon: Search },
            { title: "Mascotas", url: createPageUrl("MyPets"), icon: PawPrint },
        ];
    };

    const mobileBottomNav = getMobileBottomNav();

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F5FF] via-[#FFF9F9] to-[#F0FAFF]">
            <style>{`
        :root {
          --clay-shadow: 8px 8px 16px rgba(163, 177, 198, 0.3), -8px -8px 16px rgba(255, 255, 255, 0.9);
          --clay-shadow-sm: 4px 4px 8px rgba(163, 177, 198, 0.2), -4px -4px 8px rgba(255, 255, 255, 0.8);
          --clay-inset: inset 4px 4px 8px rgba(163, 177, 198, 0.2), inset -4px -4px 8px rgba(255, 255, 255, 0.8);
        }
        
        .clay-card {
          box-shadow: var(--clay-shadow);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .clay-card:hover {
          box-shadow: 12px 12px 24px rgba(163, 177, 198, 0.4), -12px -12px 24px rgba(255, 255, 255, 0.95);
          transform: translateY(-2px);
        }
        
        .clay-button {
          box-shadow: var(--clay-shadow-sm);
          transition: all 0.2s ease;
        }
        
        .clay-button:active {
          box-shadow: var(--clay-inset);
          transform: scale(0.98);
        }
        
        .clay-inset {
          box-shadow: var(--clay-inset);
        }

        @media (max-width: 768px) {
          .mobile-bottom-nav {
            padding-bottom: env(safe-area-inset-bottom);
          }
        }
      `}</style>

            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-white/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        {/* Logo */}
                        <Link to={createPageUrl("Home")} className="flex items-center gap-3 group">
                            <div className="w-14 h-14 rounded-[20px] bg-gradient-to-br from-[#E6D9F5] to-[#C7E9F8] clay-card flex items-center justify-center group-hover:scale-105 transition-transform">
                                <PawPrint className="w-7 h-7 text-[#7B68BE]" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] bg-clip-text text-transparent">
                                    Groomly
                                </h1>
                                <p className="text-xs text-gray-500 hidden sm:block">Reserva, relaja y repite. ¡La experiencia de cuidado que tu mascota merece!</p>
                            </div>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-2">
                            {mainNavigation.map((item) => (
                                <Link
                                    key={item.title}
                                    to={item.url}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-[16px] transition-all ${location.pathname === item.url
                                        ? "clay-inset bg-gradient-to-br from-[#E6D9F5] to-[#C8F4DE] text-[#7B68BE]"
                                        : "clay-button bg-white/50 hover:bg-white/80 text-gray-700"
                                        }`}
                                >
                                    <item.icon className="w-4 h-4" />
                                    <span className="font-medium text-sm">{item.title}</span>
                                </Link>
                            ))}

                            {/* Notification Bell */}
                            {user && <NotificationBell user={user} />}

                            {/* Profile Dropdown */}
                            {user ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button className="clay-button rounded-[16px] bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] text-white">
                                            <User className="w-4 h-4 mr-2" />
                                            {user.full_name?.split(' ')[0] || 'Perfil'}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56 clay-card rounded-[16px]">
                                        <div className="px-3 py-2">
                                            <p className="font-medium">{user.full_name}</p>
                                            <p className="text-sm text-gray-500">{user.email}</p>
                                        </div>
                                        <DropdownMenuSeparator />

                                        {user.user_type === "business" ? (
                                            <>
                                                <DropdownMenuItem asChild>
                                                    <Link to={createPageUrl("MyBusiness")}>Mi Negocio</Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link to={createPageUrl("BusinessDashboard")}>Dashboard</Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link to={createPageUrl("BusinessAppointments")}>Agenda</Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link to={createPageUrl("BusinessHistory")}>Historial</Link>
                                                </DropdownMenuItem>
                                            </>
                                        ) : user.user_type === "admin" ? (
                                            <>
                                                <DropdownMenuItem asChild>
                                                    <Link to={createPageUrl("AdminDashboard")}>Dashboard Admin</Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link to={createPageUrl("AdminPlans")}>Gestionar Planes</Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link to={createPageUrl("AdminNotifications")}>Notificaciones Push</Link>
                                                </DropdownMenuItem>
                                            </>
                                        ) : (
                                            <>
                                                <DropdownMenuItem asChild>
                                                    <Link to={createPageUrl("MyPets")}>Mis Mascotas</Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link to={createPageUrl("MyAppointments")}>Mis Citas</Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link to={createPageUrl("Favorites")}>Favoritos</Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link to={createPageUrl("UserHistory")}>Historial</Link>
                                                </DropdownMenuItem>
                                            </>
                                        )}

                                        <DropdownMenuItem asChild>
                                            <Link to={createPageUrl("Profile")}>Configuración</Link>
                                        </DropdownMenuItem>

                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => base44.auth.logout()}>
                                            <LogOut className="w-4 h-4 mr-2" />
                                            Cerrar Sesión
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <Button
                                    onClick={() => base44.auth.redirectToLogin(createPageUrl("SelectUserType"))}
                                    className="clay-button rounded-[16px] bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9] text-white"
                                >
                                    Iniciar Sesión
                                </Button>
                            )}
                        </nav>

                        {/* Mobile - Solo logo y notificaciones */}
                        <div className="md:hidden flex items-center gap-2">
                            {user && <NotificationBell user={user} />}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="min-h-[calc(100vh-5rem)] pb-20 md:pb-0">
                {children}
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-gray-200 mobile-bottom-nav">
                <div className="flex justify-around items-center h-16">
                    {mobileBottomNav.map((item) => {
                        const isActive = location.pathname === item.url;
                        return (
                            <Link
                                key={item.title}
                                to={item.url}
                                className="flex flex-col items-center justify-center flex-1 py-2"
                            >
                                <div className={`p-2 rounded-full transition-all ${isActive ? 'bg-gradient-to-r from-[#7B68BE] to-[#5BA3C9]' : ''}`}>
                                    <item.icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                                </div>
                                <span className={`text-xs mt-1 ${isActive ? 'text-[#7B68BE] font-medium' : 'text-gray-500'}`}>
                                    {item.title}
                                </span>
                            </Link>
                        );
                    })}

                    {/* Login/Profile Button */}
                    {user ? (
                        <MobileProfileButton user={user} />
                    ) : (
                        <button
                            onClick={() => base44.auth.redirectToLogin(createPageUrl("SelectUserType"))}
                            className="flex flex-col items-center justify-center flex-1 py-2"
                        >
                            <div className="p-2 rounded-full">
                                <LogIn className="w-6 h-6 text-gray-500" />
                            </div>
                            <span className="text-xs mt-1 text-gray-500">Login</span>
                        </button>
                    )}
                </div>
            </nav>

            {/* Footer - Hidden on mobile */}
            <footer className="hidden md:block mt-16 border-t border-white/20 bg-white/50 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-10 h-10 rounded-[16px] bg-gradient-to-br from-[#E6D9F5] to-[#C7E9F8] clay-card flex items-center justify-center">
                                    <PawPrint className="w-5 h-5 text-[#7B68BE]" />
                                </div>
                                <h3 className="font-bold text-lg text-[#7B68BE]">Groomly</h3>
                            </div>
                            <p className="text-sm text-gray-600">
                                La plataforma más completa para el cuidado de tus mascotas.
                            </p>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-4 text-[#7B68BE]">Para Dueños de Mascotas</h4>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li><Link to={createPageUrl("Home")} className="hover:text-[#7B68BE]">Inicio</Link></li>
                                <li><Link to={createPageUrl("Search")} className="hover:text-[#7B68BE]">Buscar Servicios</Link></li>
                                <li><Link to={createPageUrl("HowItWorksUsers")} className="hover:text-[#7B68BE]">¿Cómo Funciona?</Link></li>
                                <li><Link to={createPageUrl("RewardsInfo")} className="hover:text-[#7B68BE]">Sistema de Recompensas</Link></li>
                                <li><Link to={createPageUrl("Blog")} className="hover:text-[#7B68BE]">Blog</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-4 text-[#7B68BE]">Para Empresas</h4>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li><Link to={createPageUrl("HowItWorks")} className="hover:text-[#7B68BE]">Cómo Funciona</Link></li>
                                <li><Link to={createPageUrl("PricingPlans")} className="hover:text-[#7B68BE]">Planes y Precios</Link></li>
                                <li><Link to={createPageUrl("MyBusiness")} className="hover:text-[#7B68BE]">Registra tu Empresa</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-4 text-[#7B68BE]">Contacto</h4>
                            <p className="text-sm text-gray-600">
                                ¿Tienes preguntas? Contáctanos
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-white/20 text-center text-sm text-gray-500">
                        © 2025 Groomly. Todos los derechos reservados.
                    </div>
                </div>
            </footer>
        </div>
    );
}