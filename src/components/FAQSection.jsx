import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const FAQSection = () => {
    const faqs = [
        {
            question: "¿Cómo me registro?",
            answer: "Para registrarte solo es necesario seleccionar alguno de nuestros planes y llenar el formulario para que podamos contactarnos contigo."
        },
        {
            question: "¿Cómo funciona el Código QR?",
            answer: "El código QR permite que tus clientes soliciten las canciones que desean escuchar. Solo basta con activarlo en tu evento y compartirlo con los invitados. Ellos podrán escanearlo y enviar sus solicitudes directamente a ti."
        },
        {
            question: "¿Cómo veo las solicitudes del público?",
            answer: "Tan solo basta con iniciar sesión en tu cuenta, seleccionar el evento que tienes actualmente en vivo y esperar a que tu público solicite las canciones."
        },
        {
            question: "¿Hay una amplia variedad de canciones?",
            answer: "Por supuesto, contamos con un amplio y variado catálogo musical, desde lo más actual hasta lo más clásico. Además, puedes agregar mensajes a tus solicitudes."
        },
        {
            question: "¿Cómo evito que personas ajenas al evento soliciten canciones?",
            answer: "Es tan fácil como entrar a la vista de edición del evento, cambiar el estado a 'en vivo' y activar la solicitud de ubicación, así las personas que quieran solicitar una canción tendrán que validar que se encuentran en el evento."
        },
        {
            question: "¿Tengo que estar cambiando el Código QR por cada evento?",
            answer: "Puedes crear eventos que tengan Código QR único o simplemente asociar ese evento a tu Código QR de DJ (Así no tienes que imprimir un QR por cada evento)."
        },
        {
            question: "Justo por donde vivo no hay papelerías ¿Qué hago?",
            answer: "Eso no es problema, una vez que te registres, puedes solicitar que se te entregue tu código QR hasta donde estés. ¿Cómo? Averígualo registrándote ahora mismo."
        }
    ];

    const [activeIndex, setActiveIndex] = useState(null);

    const toggleFAQ = (index) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    return (
        <div className="relative bg-gradient-to-b from-gray-50 to-white py-20 overflow-hidden">
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-[url('/images/pattern.svg')] bg-center"></div>
            </div>

            <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">Preguntas Frecuentes</h2>
                    <p className="text-xl text-gray-600">Encuentra respuestas a las dudas más comunes sobre nuestra plataforma</p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className="border border-gray-200 rounded-xl overflow-hidden transition-all duration-300 hover:border-indigo-300"
                        >
                            <button
                                onClick={() => toggleFAQ(index)}
                                className="w-full flex justify-between items-center p-6 text-left bg-white hover:bg-gray-50 transition-colors"
                            >
                                <h3 className="text-lg font-semibold text-gray-900 md:text-xl">
                                    {faq.question}
                                </h3>
                                {activeIndex === index ? (
                                    <ChevronUp className="w-5 h-5 text-indigo-600" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-indigo-600" />
                                )}
                            </button>

                            <div
                                className={`px-6 pb-6 pt-0 bg-white transition-all duration-300 ease-in-out overflow-hidden ${activeIndex === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                                    }`}
                            >
                                <div className="prose prose-indigo text-gray-600">
                                    <p>{faq.answer}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 text-center">
                    <p className="text-gray-600 mb-6">¿No encontraste lo que buscabas?</p>
                    <button className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-md">
                        Contáctanos
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FAQSection;