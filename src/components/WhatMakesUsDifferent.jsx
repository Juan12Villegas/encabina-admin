import React from "react";
import { Globe, DollarSign, BarChart2, TrendingUp, Zap, Music } from "lucide-react";

const WhatMakesUsDifferent = () => {
    const features = [
        {
            icon: <Globe className="w-10 h-10 text-indigo-600" />,
            title: "Visibilidad Global",
            description: "Cada uno de nuestros clientes tiene presencia en nuestra sección Nuestro Team, donde personas de todas partes podrán visualizar su perfil de Dj."
        },
        {
            icon: <DollarSign className="w-10 h-10 text-indigo-600" />,
            title: "Precios Justos",
            description: "Transparencia total con planes sin sorpresas. Sabrás exactamente lo que pagas con opciones flexibles que se adaptan a tu crecimiento."
        },
        {
            icon: <BarChart2 className="w-10 h-10 text-indigo-600" />,
            title: "Analíticas Avanzadas",
            description: "Dashboard completo con estadísticas en tiempo real para optimizar tus eventos, entender a tu audiencia y tomar decisiones basadas en datos."
        },
        {
            icon: <Zap className="w-10 h-10 text-indigo-600" />,
            title: "Tecnología Innovadora",
            description: "Plataforma en constante evolución con las últimas herramientas para interacción con fans y gestión de eventos."
        },
        {
            icon: <TrendingUp className="w-10 h-10 text-indigo-600" />,
            title: "Crecimiento de Audiencia",
            description: "Estrategias probadas para aumentar tu base de seguidores y herramientas para fidelizar a tu comunidad."
        },
        {
            icon: <Music className="w-10 h-10 text-indigo-600" />,
            title: "Para Artistas, por Artistas",
            description: "Creado por DJs profesionales que entienden tus necesidades reales. Más que una plataforma, un partner en tu carrera musical."
        }
    ];

    return (
        <section className="bg-gradient-to-b from-gray-50 to-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">
                        ¿Qué nos hace diferentes?
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Descubre las ventajas exclusivas que ofrecemos para potenciar tu carrera como DJ profesional
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="group relative bg-white rounded-xl shadow-lg p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border border-gray-100"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-white opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-300"></div>
                            <div className="relative z-10">
                                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-6 mx-auto group-hover:bg-indigo-200 transition-colors">
                                    {feature.icon}
                                </div>
                                <h3 className="text-2xl font-semibold text-gray-900 mb-4 text-center">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600 text-center">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* <div className="mt-16 text-center">
                    <button className="px-8 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl">
                        Comienza ahora
                    </button>
                </div> */}
            </div>
        </section>
    );
};

export default WhatMakesUsDifferent;