"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Check, Star, Headphones, Music, Mic, User, Disc } from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";
import NavbarGeneral from "@/components/NavbarGeneral";

import WhatMakesUsDifferent from '@/components/WhatMakesUsDifferent';
import FAQSection from "@/components/FAQSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import PricingComparison from "@/components/PricingComparison";
import HowItWorks from "@/components/HowItWorks";

export default function PlansPage() {
  const router = useRouter();
  const [currentDJIndex, setCurrentDJIndex] = useState(0);
  const [userType, setUserType] = useState("dj"); // 'dj' or 'client'

  const [showAnswer1, setShowAnswer1] = useState(false);
  const [showAnswer2, setShowAnswer2] = useState(false);
  const [showAnswer3, setShowAnswer3] = useState(false);
  const [showAnswer4, setShowAnswer4] = useState(false);
  const [showAnswer5, setShowAnswer5] = useState(false);
  const [showAnswer6, setShowAnswer6] = useState(false);
  const [showAnswer7, setShowAnswer7] = useState(false);


  const djs = [
    { name: "DJ ElectroBeat", genre: "House/Techno", rating: 4.9 },
    { name: "DJ BassMaster", genre: "Hip-Hop/Trap", rating: 4.8 },
    { name: "DJ TropicalMix", genre: "Reggaeton/Latin", rating: 4.7 },
    { name: "DJ VinylVibes", genre: "Funk/Disco", rating: 4.9 },
    { name: "DJ FutureSound", genre: "EDM/Dubstep", rating: 4.6 },
  ];

  const features = [
    { icon: <Music className="h-6 w-6 text-indigo-600" />, text: "Gestión de eventos" },
    { icon: <Mic className="h-6 w-6 text-indigo-600" />, text: "Solicitudes en vivo" },
    { icon: <Headphones className="h-6 w-6 text-indigo-600" />, text: "Analíticas" },
    { icon: <Star className="h-6 w-6 text-indigo-600" />, text: "Promoción" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDJIndex((prev) => (prev + 1) % djs.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectPlan = (plan) => {
    router.push(`/plan-form?plan=${plan.toLowerCase()}`);
  };

  return (
    <div className="bg-gray-50">
      <NavbarGeneral
        className="" />

      {/* Hero Section */}
      <div className="relative min-h-[70vh] py-16 flex items-center justify-center overflow-hidden bg-gray-900">
        {/* Fondo con efecto blur */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900/90 to-gray-900/50"></div>
          {/* <Image
            src="/images/dj-hero-bg.jpg"
            alt="DJ en acción"
            fill
            className="object-cover"
            priority
          /> */}
        </div>

        {/* Contenido Hero */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white tracking-tight">
            EN CABINA
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-gray-300">
            La plataforma profesional para DJs que buscan destacar
          </p>

          {/* Features Tags */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 hover:bg-indigo-600/20 hover:border-indigo-400 transition-colors">
                {feature.icon}
                <span className="ml-2 text-white">{feature.text}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => document.getElementById("plans").scrollIntoView({ behavior: "smooth" })}
            className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-lg shadow-lg hover:bg-indigo-700 transition-all duration-300 flex items-center mx-auto group"
          >
            Ver Planes <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* DJs Section */}
      <TestimonialsSection />

      {/* Cómo funciona Section */}
      {/* <div className="bg-white">
        <HowItWorks />
      </div> */}

      {/* What Makes Us Different Section */}
      <div>
        <WhatMakesUsDifferent />
      </div>

      {/* Plans Section */}
      <div id="plans" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4 text-gray-900">
            Elige tu plan ideal
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-3xl mx-auto">
            Soluciones diseñadas para cada etapa de tu carrera como DJ
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {/* Plan Bassline */}
            <div className="bg-white p-8 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2 text-gray-900">Bassline</h3>
                <p className="text-gray-600">Ideal para DJs que están comenzando</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">S/ 19.90</span>
                <span className="text-gray-500">/mes</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">10 eventos mensuales</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">100 solicitudes por evento</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Solicitudes en vivo</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Parte del Team En Cabina</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Acceso básico</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Soporte por WhatsApp</span>
                </li>
              </ul>
              <button
                onClick={() => handleSelectPlan("bassline")}
                className="w-full py-3 bg-gray-100 text-gray-800 font-medium rounded-lg hover:bg-gray-200 transition-colors border border-gray-300 hover:border-gray-400"
              >
                Elegir Bassline
              </button>
            </div>

            {/* Plan Drop Pro - Destacado */}
            <div className="relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-md">
                MÁS POPULAR
              </div>
              <div className="bg-white p-8 rounded-xl shadow-xl border-2 border-indigo-500 h-full flex flex-col">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2 text-gray-900">Drop Pro</h3>
                  <p className="text-gray-600">Para DJs que buscan destacar</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">S/ 34.90</span>
                  <span className="text-gray-500">/mes</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">30 eventos mensuales</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">300 solicitudes por evento</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Solicitudes en vivo</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Parte del Team En Cabina</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Herramientas avanzadas</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Soporte prioritario 24/7</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Analíticas de audiencia</span>
                  </li>
                </ul>
                <button
                  onClick={() => handleSelectPlan("drop pro")}
                  className="w-full py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors mt-auto"
                >
                  Elegir Drop Pro
                </button>
              </div>
            </div>

            {/* Plan MainStage */}
            <div className="bg-white p-8 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2 text-gray-900">MainStage</h3>
                <p className="text-gray-600">Para DJs profesionales</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">S/ 159.90</span>
                <span className="text-gray-500">/mes</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Eventos ilimitados*</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Solicitudes ilimitadas*</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Solicitudes en vivo</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Parte del Team En Cabina</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Todas las herramientas</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Soporte VIP 24/7</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Analíticas avanzadas</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Perfil destacado</span>
                </li>
              </ul>
              <button
                onClick={() => handleSelectPlan("mainstage")}
                className="w-full py-3 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-900 transition-colors"
              >
                Elegir MainStage
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Comparison Section */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PricingComparison />
      </div>

      {/* FAQ Section */}
      <div>
        <FAQSection />
      </div>


      {/* CTA Section */}
      <div className="relative py-20 bg-gray-900 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('/images/pattern.svg')] bg-center"></div>
        </div>

        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-6 text-white">¿Listo para llevar tus eventos al siguiente nivel?</h2>
          <p className="text-xl mb-8 text-gray-300">Regístrate hoy y comienza a conectar con tu audiencia como nunca antes</p>
          <button
            onClick={() => handleSelectPlan("pro")}
            className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-lg shadow-lg hover:bg-indigo-700 transition-all duration-300 inline-flex items-center group"
          >
            Comenzar ahora <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>


      <style jsx>{`
        @keyframes scroll-horizontal {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll-horizontal {
          animation: scroll-horizontal 20s linear infinite;
          display: flex;
          width: max-content;
        }
        .animate-scroll-horizontal:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}