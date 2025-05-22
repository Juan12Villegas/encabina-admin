"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Check, ArrowRight } from "lucide-react";
import { useState, Suspense } from "react";
import NavbarGeneral from "@/components/NavbarGeneral";

// Mueve todo el contenido del componente a esta función
function PlanFormComponent() {
    const searchParams = useSearchParams();
    const planParam = searchParams.get("plan")?.toLowerCase() ?? "bassline";

    const [formData, setFormData] = useState({
        email: "",
        phone: "",
        firstName: "",
        lastName: ""
    });

    const [error, setError] = useState("");

    const plansData = {
        bassline: {
            name: "Bassline",
            price: "S/ 19.90",
            description: "Ideal para DJs que están comenzando",
            features: [
                "10 eventos mensuales",
                "100 solicitudes por evento",
                "Solicitudes en vivo",
                "Parte del Team En Cabina",
                "Acceso básico",
                "Soporte por WhatsApp"
            ]
        },
        "drop pro": {
            name: "Drop Pro",
            price: "S/ 34.90",
            description: "Para DJs que buscan destacar",
            features: [
                "30 eventos mensuales",
                "300 solicitudes por evento",
                "Solicitudes en vivo",
                "Parte del Team En Cabina",
                "Herramientas avanzadas",
                "Soporte prioritario 24/7",
                "Analíticas de audiencia"
            ]
        },
        mainstage: {
            name: "MainStage",
            price: "S/ 159.90",
            description: "Para DJs profesionales",
            features: [
                "Eventos ilimitados",
                "Solicitudes ilimitadas",
                "Solicitudes en vivo",
                "Parte del Team En Cabina",
                "Todas las herramientas",
                "Soporte VIP 24/7",
                "Analíticas avanzadas",
                "Perfil destacado"
            ]
        }
    };

    const selectedPlan = plansData[planParam] || plansData.bassline;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError("");
    };

    const isValidPhone = (phone) => {
        const phoneRegex = /^(\+51)?\s?9\d{8}$/;
        return phoneRegex.test(phone);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!isValidPhone(formData.phone)) {
            setError("El número de WhatsApp debe comenzar con 9 y tener 9 dígitos (Ej: 987654321)");
            return;
        }

        const message = `¡Hola! Estoy interesado en el plan ${selectedPlan.name}.\n\nMis datos:\n- Nombre: ${formData.firstName} ${formData.lastName}\n- Email: ${formData.email}\n- Teléfono: ${formData.phone}\n\nPor favor, contáctenme para completar mi suscripción.`;
        const encodedMessage = encodeURIComponent(message);
        const whatsappNumber = "51923829148";

        window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, "_blank");
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <NavbarGeneral />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Completa tus datos</h1>
                    <p className="text-xl text-gray-600">Estás a un paso de adquirir el plan <strong>{selectedPlan.name}</strong></p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Formulario */}
                    <div className="bg-white p-8 rounded-xl shadow-md border border-gray-200">
                        <h2 className="text-2xl font-bold mb-6 text-gray-900">Información de contacto</h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* ... resto de tu formulario ... */}
                        </form>
                    </div>

                    {/* Resumen del Plan */}
                    <div className="bg-white p-8 rounded-xl shadow-md border border-gray-200">
                        {/* ... resto de tu resumen del plan ... */}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Este es el componente principal que exportamos
export default function PlanFormPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando plan...</div>}>
            <PlanFormComponent />
        </Suspense>
    );
}