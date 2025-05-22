import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, User, Disc, Music, Mic, Headphones } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const HowItWorks = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [userType, setUserType] = useState("dj");
    const [direction, setDirection] = useState(1);
    const [autoPlay, setAutoPlay] = useState(true);
    const [containerHeight, setContainerHeight] = useState("auto");

    const djSteps = [
        {
            title: "Regístrate como DJ",
            description: "Crea tu cuenta y completa tu perfil con tu información y especialidad musical.",
            icon: <User className="h-8 w-8 text-indigo-600" />,
            image: "/images/dj-step1.png"
        },
        // ... otros pasos DJ
    ];

    const clientSteps = [
        {
            title: "Accede al evento",
            description: "Escanea el QR único y visualiza el evento actual del DJ.",
            icon: <User className="h-8 w-8 text-indigo-600" />,
            image: "/images/client-step1.png"
        },
        // ... otros pasos cliente
    ];

    const steps = userType === "dj" ? djSteps : clientSteps;

    // Auto-play y manejo de altura
    useEffect(() => {
        if (!autoPlay) return;

        const timer = setTimeout(() => {
            goToNextStep();
        }, 5000);

        return () => clearTimeout(timer);
    }, [currentStep, autoPlay]);

    const goToNextStep = () => {
        setDirection(1);
        setCurrentStep(prev => (prev < steps.length - 1 ? prev + 1 : 0));
    };

    const goToPreviousStep = () => {
        setDirection(-1);
        setCurrentStep(prev => (prev > 0 ? prev - 1 : steps.length - 1));
    };

    const goToStep = (index) => {
        setDirection(index > currentStep ? 1 : -1);
        setCurrentStep(index);
    };

    const changeUserType = (type) => {
        setUserType(type);
        setCurrentStep(0);
        setAutoPlay(false);
        setTimeout(() => setAutoPlay(true), 10000);
    };

    // Configuración de animaciones
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                when: "beforeChildren",
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: (direction) => ({
            x: direction > 0 ? 100 : -100,
            opacity: 0
        }),
        visible: {
            x: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 30
            }
        },
        exit: (direction) => ({
            x: direction < 0 ? 100 : -100,
            opacity: 0,
            transition: {
                duration: 0.2
            }
        })
    };

    return (
        <section className="py-16 bg-white" id="how-it-works">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
                    ¿Cómo funciona?
                </h2>

                {/* Selector de tipo de usuario */}
                <div className="flex justify-center mb-12">
                    <div className="inline-flex rounded-md shadow-sm bg-gray-100 p-1">
                        <button
                            onClick={() => changeUserType("dj")}
                            className={`px-6 py-3 text-sm font-medium rounded-md transition-colors ${userType === "dj" ? "bg-indigo-600 text-white shadow" : "bg-transparent text-gray-700 hover:bg-gray-200"}`}
                        >
                            <div className="flex items-center">
                                <Headphones className="h-4 w-4 mr-2" />
                                <span>Soy DJ</span>
                            </div>
                        </button>
                        <button
                            onClick={() => changeUserType("client")}
                            className={`px-6 py-3 text-sm font-medium rounded-md transition-colors ${userType === "client" ? "bg-indigo-600 text-white shadow" : "bg-transparent text-gray-700 hover:bg-gray-200"}`}
                        >
                            <div className="flex items-center">
                                <User className="h-4 w-4 mr-2" />
                                <span>Soy Cliente</span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Contenedor del carrusel con altura fija */}
                <div className="relative min-h-[400px] md:min-h-[450px]">
                    <AnimatePresence custom={direction} mode="wait">
                        <motion.div
                            key={`${userType}-${currentStep}`}
                            custom={direction}
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="absolute inset-0 flex flex-col md:flex-row gap-8 items-center"
                        >
                            {/* Imagen */}
                            <motion.div
                                custom={direction}
                                variants={itemVariants}
                                className="w-full md:w-1/2"
                            >
                                <div className="relative rounded-xl overflow-hidden aspect-video shadow-lg border border-gray-200">
                                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                        <Image
                                            alt={steps[currentStep].title}
                                            src={steps[currentStep].image}
                                            width={800}
                                            height={450}
                                            className="object-cover"
                                            priority={currentStep === 0}
                                        />
                                    </div>
                                </div>
                            </motion.div>

                            {/* Contenido */}
                            <motion.div
                                custom={direction}
                                variants={itemVariants}
                                className="w-full md:w-1/2"
                            >
                                <div className="flex items-center mb-4">
                                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 text-indigo-600 mr-4">
                                        {steps[currentStep].icon}
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900">
                                        Paso {currentStep + 1}: {steps[currentStep].title}
                                    </h3>
                                </div>
                                <p className="text-lg text-gray-600 mb-6">{steps[currentStep].description}</p>

                                {/* Indicadores */}
                                <div className="flex gap-2 mt-4">
                                    {steps.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => goToStep(index)}
                                            className={`h-2 rounded-full transition-all duration-300 ${currentStep === index ? 'bg-indigo-600 w-8' : 'bg-gray-300 w-4'}`}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Controles de navegación */}
                    <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between px-2 md:px-4">
                        <button
                            onClick={goToPreviousStep}
                            className="bg-white/90 text-indigo-600 rounded-full p-2 shadow-lg hover:bg-white focus:outline-none transition-all hover:scale-110"
                        >
                            <ArrowLeft className="h-6 w-6" />
                        </button>
                        <button
                            onClick={goToNextStep}
                            className="bg-white/90 text-indigo-600 rounded-full p-2 shadow-lg hover:bg-white focus:outline-none transition-all hover:scale-110"
                        >
                            <ArrowRight className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;