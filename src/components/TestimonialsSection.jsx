"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

const TestimonialsSection = () => {
    const testimonials = [
        {
            name: "DJ Juan Villegas",
            role: "Cumbia, Merengue, Salsa",
            content: "Desde que uso esta plataforma, la interacción con mi audiencia se ha triplicado. Las herramientas de análisis son increíbles.",
            avatar: "/images/djs/juanvillegas.png",
            rating: 5
        }
        /* {
            name: "DJ ElectroBeat",
            role: "House, Techno",
            content: "La mejor manera de gestionar mis eventos y conectar con fans. ¡Las solicitudes en vivo son un éxito total!",
            avatar: "/images/djs/electrobeat.png",
            rating: 5
        },
        {
            name: "DJ BassMaster",
            role: "Hip-Hop, Trap",
            content: "He conseguido más eventos en un mes que en todo el año pasado gracias a la visibilidad que me da En Cabina.",
            avatar: "/images/djs/bassmaster.png",
            rating: 4
        },
        {
            name: "DJ TropicalMix",
            role: "Reggaeton, Latin",
            content: "Mis seguidores están encantados con la posibilidad de pedir canciones en vivo. ¡La plataforma es super intuitiva!",
            avatar: "/images/djs/tropicalmix.png",
            rating: 5
        },
        {
            name: "DJ VinylVibes",
            role: "Funk, Disco",
            content: "Las analíticas me han ayudado a entender mejor a mi audiencia y ajustar mis sets para cada evento.",
            avatar: "/images/djs/vinylvibes.png",
            rating: 5
        } */
    ];

    const [currentIndex, setCurrentIndex] = useState(0);
    const [paused, setPaused] = useState(false);

    // Configuración del carrusel automático
    useEffect(() => {
        const interval = setInterval(() => {
            if (!paused) {
                nextTestimonial();
            }
        }, 5000); // Cambia cada 5 segundos

        return () => clearInterval(interval);
    }, [currentIndex, paused]);

    const nextTestimonial = () => {
        setCurrentIndex((prevIndex) =>
            prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
        );
    };

    const prevTestimonial = () => {
        setCurrentIndex((prevIndex) =>
            prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1
        );
    };

    const goToTestimonial = (index) => {
        setCurrentIndex(index);
    };

    return (
        <div className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
                    Lo que dicen nuestros DJs
                </h2>

                {/* Contenedor del carrusel */}
                <div
                    className="relative overflow-hidden"
                    onMouseEnter={() => setPaused(true)}
                    onMouseLeave={() => setPaused(false)}
                >
                    {/* Testimonio activo */}
                    <div className="bg-white p-8 rounded-xl shadow-md max-w-3xl mx-auto transition-all duration-500">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="flex-shrink-0">
                                <img
                                    src={testimonials[currentIndex].avatar}
                                    alt={testimonials[currentIndex].name}
                                    className="w-24 h-24 rounded-full object-cover border-4 border-indigo-100"
                                />
                            </div>
                            <div>
                                <div className="flex items-center mb-2">
                                    <h4 className="text-xl font-bold text-gray-900 mr-3">
                                        {testimonials[currentIndex].name}
                                    </h4>
                                    <div className="flex">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`h-5 w-5 ${i < testimonials[currentIndex].rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <p className="text-sm text-indigo-600 mb-4">
                                    {testimonials[currentIndex].role}
                                </p>
                                <p className="text-gray-600 italic text-lg">
                                    "{testimonials[currentIndex].content}"
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Controles de navegación */}
                    <button
                        onClick={prevTestimonial}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-md hover:bg-indigo-50 transition-colors"
                    >
                        <ChevronLeft className="h-6 w-6 text-indigo-600" />
                    </button>
                    <button
                        onClick={nextTestimonial}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-md hover:bg-indigo-50 transition-colors"
                    >
                        <ChevronRight className="h-6 w-6 text-indigo-600" />
                    </button>

                    {/* Indicadores */}
                    <div className="flex justify-center mt-8 space-x-2">
                        {testimonials.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToTestimonial(index)}
                                className={`h-3 w-3 rounded-full transition-all ${index === currentIndex ? 'bg-indigo-600 w-6' : 'bg-gray-300'}`}
                                aria-label={`Ir al testimonio ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestimonialsSection;