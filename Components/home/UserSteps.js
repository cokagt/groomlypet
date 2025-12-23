import React from "react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { UserPlus, PawPrint, MapPin, ArrowRight } from "lucide-react";

export default function UserSteps() {
    const steps = [
        {
            number: "1",
            icon: UserPlus,
            title: "Regístrate Gratis",
            description: "Crea tu cuenta con tu correo o conecta tus redes sociales",
            color: "from-[#7B68BE] to-[#5BA3C9]"
        },
        {
            number: "2",
            icon: PawPrint,
            title: "Registra tus Mascotas",
            description: "Agrega hasta 5 mascotas con su información y fotos",
            color: "from-[#6BBF98] to-[#C8F4DE]"
        },
        {
            number: "3",
            icon: MapPin,
            title: "Encuentra Servicios",
            description: "Busca veterinarias, grooming y más cerca de ti",
            color: "from-[#FFD700] to-[#FFA500]"
        }
    ];

    return (
        <div className="w-full bg-gradient-to-br from-[#7B68BE] via-[#5BA3C9] to-[#6BBF98] py-10 md:py-12 px-4 md:rounded-[32px]">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                        Comienza en 3 Simples Pasos
                    </h2>
                    <p className="text-white/80 text-base">
                        Tu mascota merece lo mejor
                    </p>
                </div>

                <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-3 md:gap-6">
                    {steps.map((step, index) => (
                        <div
                            key={index}
                            className="bg-white/95 backdrop-blur-sm rounded-[20px] p-5 text-center relative"
                        >
                            <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto mb-3 shadow-lg`}>
                                <step.icon className="w-7 h-7 text-white" />
                            </div>

                            <div className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-white shadow-lg flex items-center justify-center">
                                <span className="font-bold text-sm text-[#7B68BE]">{step.number}</span>
                            </div>

                            <h3 className="font-bold text-base text-gray-800 mb-1">
                                {step.title}
                            </h3>
                            <p className="text-xs text-gray-600">
                                {step.description}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="mt-8 text-center">
                    <Button
                        onClick={() => base44.auth.redirectToLogin(window.location.pathname)}
                        className="px-6 py-5 text-base rounded-[16px] bg-white text-[#7B68BE] hover:bg-gray-50 shadow-lg"
                    >
                        Crear Cuenta Gratis
                        <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                </div>
            </div>
        </div>
    );
}