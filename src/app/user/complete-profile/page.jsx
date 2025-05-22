"use client";

import { useState, useEffect, useCallback } from "react";
import { db, auth, doc, setDoc, getDoc } from "@/../lib/firebase";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import UbigeoSelector from "@/components/UbigeoSelector";

export default function CompleteProfile() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        nombres: "",
        apellidos: "",
        departamento: "",
        provincia: "",
        distrito: "",
        pais: "Perú", // Valor por defecto
        ciudadExtranjera: "",
        fechaNacimiento: "",
        telefono: "",
        direccion: "",
        nombreDJ: "",
        instagram: "",
        facebook: "",
        tiktok: "",
        whatsapp: "",
        numeroContratos: "",
        precioPorHora: "",
        experiencia: "",
        especialidad: "",
        descripcion: "",
        localesTrabajados: "",
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Verificar si el perfil ya está completado
    useEffect(() => {
        let isMounted = true;

        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (!user || !isMounted) return;

            try {
                const userRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userRef);
                if (isMounted && userSnap.exists() && userSnap.data().completedProfile) {
                    router.push("/user/eventos");
                }
            } catch (error) {
                if (isMounted) {
                    console.error("Error verificando perfil:", error);
                }
            }
        });

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, [router]);

    // Manejar cambio de ubicación desde UbigeoSelector
    const handleLocationChange = useCallback((ubicacion) => {
        setFormData(prev => ({
            ...prev,
            pais: ubicacion.pais || "Perú",
            departamento: ubicacion.departamento || "",
            provincia: ubicacion.provincia || "",
            distrito: ubicacion.distrito || "",
            ciudadExtranjera: ubicacion.ciudadExtranjera || ""
        }));
    }, []); // Sin dependencias porque no usa ningún estado externo

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        setErrors({ ...errors, [name]: "" });
    };

    const validateStep1 = () => {
        const newErrors = {};
        if (!formData.nombres) newErrors.nombres = "Este campo es obligatorio";
        if (!formData.apellidos) newErrors.apellidos = "Este campo es obligatorio";
        if (!formData.pais) newErrors.pais = "Selecciona un país";

        if (formData.pais === "Perú") {
            if (!formData.departamento) newErrors.departamento = "Selecciona un departamento";
            if (!formData.provincia) newErrors.provincia = "Selecciona una provincia";
            if (!formData.distrito) newErrors.distrito = "Selecciona un distrito";
        } else if (!formData.ciudadExtranjera) {
            newErrors.ciudadExtranjera = "Ingresa una ciudad o localidad";
        }

        if (!formData.fechaNacimiento) newErrors.fechaNacimiento = "Este campo es obligatorio";
        if (!formData.telefono) {
            newErrors.telefono = "Este campo es obligatorio";
        } else if (!/^\d{9}$/.test(formData.telefono)) {
            newErrors.telefono = "El teléfono debe tener 9 dígitos";
        }
        if (!formData.direccion) newErrors.direccion = "Este campo es obligatorio";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep2 = () => {
        const newErrors = {};
        if (!formData.nombreDJ) newErrors.nombreDJ = "Este campo es obligatorio";
        if (!formData.instagram) newErrors.instagram = "Este campo es obligatorio";
        if (!formData.numeroContratos) newErrors.numeroContratos = "Este campo es obligatorio";
        if (!formData.precioPorHora) {
            newErrors.precioPorHora = "Este campo es obligatorio";
        } else if (isNaN(formData.precioPorHora)) {
            newErrors.precioPorHora = "Debe ser un número válido";
        }
        if (!formData.especialidad) newErrors.especialidad = "Este campo es obligatorio";
        if (!formData.descripcion) newErrors.descripcion = "Este campo es obligatorio";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep1()) {
            setStep(2);
        }
    };

    const handleBack = () => {
        setStep(1);
    };

    const handleSubmit = async () => {
        if (!validateStep2()) return;

        const user = auth.currentUser;
        if (!user) return;

        try {
            setLoading(true);
            const djRef = doc(db, "djs", user.uid);
            await setDoc(
                djRef,
                {
                    ...formData,
                    estado: "activo",
                    uid: user.uid,
                    precioPorHora: Number(formData.precioPorHora),
                    localesTrabajados: formData.localesTrabajados
                        .split(",")
                        .map((local) => local.trim()),
                    createdAt: new Date(),
                },
                { merge: true }
            );

            // Marcar perfil como completado en users
            const userRef = doc(db, "users", user.uid);
            await setDoc(userRef, { completedProfile: true }, { merge: true });

            router.push("/user/eventos");
        } catch (error) {
            console.error("Error guardando perfil:", error);
            alert("Hubo un error al guardar tu perfil. Por favor intenta nuevamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="py-8 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Encabezado */}
                    <div className="bg-gradient-to-r from-indigo-600 to-blue-500 p-6 text-white">
                        <h1 className="text-2xl font-bold">Completa tu perfil de DJ</h1>
                        <p className="mt-1 text-indigo-100">
                            Paso {step} de 2 - {step === 1 ? "Información personal" : "Información profesional"}
                        </p>
                    </div>

                    {/* Barra de progreso */}
                    <div className="px-6 pt-4">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                                className="bg-indigo-600 h-2.5 rounded-full"
                                style={{ width: `${step === 1 ? '50%' : '100%'}` }}
                            ></div>
                        </div>
                    </div>

                    {/* Contenido del formulario */}
                    <div className="p-6 md:p-8">
                        {step === 1 ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nombres <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="nombres"
                                            placeholder="Ej: Juan Carlos"
                                            value={formData.nombres}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-2 border ${errors.nombres ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                                        />
                                        {errors.nombres && <p className="mt-1 text-sm text-red-600">{errors.nombres}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Apellidos <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="apellidos"
                                            placeholder="Ej: Pérez García"
                                            value={formData.apellidos}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-2 border ${errors.apellidos ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                                        />
                                        {errors.apellidos && <p className="mt-1 text-sm text-red-600">{errors.apellidos}</p>}
                                    </div>
                                </div>

                                {/* Componente UbigeoSelector */}
                                <div className="w-full">
                                    <UbigeoSelector onLocationChange={handleLocationChange} className="w-full" />
                                    {errors.pais && <p className="mt-1 text-sm text-red-600">{errors.pais}</p>}
                                    {errors.departamento && <p className="mt-1 text-sm text-red-600">{errors.departamento}</p>}
                                    {errors.provincia && <p className="mt-1 text-sm text-red-600">{errors.provincia}</p>}
                                    {errors.distrito && <p className="mt-1 text-sm text-red-600">{errors.distrito}</p>}
                                    {errors.ciudadExtranjera && <p className="mt-1 text-sm text-red-600">{errors.ciudadExtranjera}</p>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Fecha de nacimiento <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            name="fechaNacimiento"
                                            value={formData.fechaNacimiento}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-2 border ${errors.fechaNacimiento ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                                        />
                                        {errors.fechaNacimiento && <p className="mt-1 text-sm text-red-600">{errors.fechaNacimiento}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Teléfono <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="telefono"
                                            placeholder="Ej: 987654321"
                                            value={formData.telefono}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-2 border ${errors.telefono ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                                        />
                                        {errors.telefono && <p className="mt-1 text-sm text-red-600">{errors.telefono}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Dirección completa <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="direccion"
                                        placeholder="Ej: Av. Principal 123, Urb. Las Flores"
                                        value={formData.direccion}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-2 border ${errors.direccion ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                                    />
                                    {errors.direccion && <p className="mt-1 text-sm text-red-600">{errors.direccion}</p>}
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        onClick={handleNext}
                                        className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nombre artístico (DJ) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="nombreDJ"
                                        placeholder="Ej: DJ ProMix"
                                        value={formData.nombreDJ}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-2 border ${errors.nombreDJ ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                                    />
                                    {errors.nombreDJ && <p className="mt-1 text-sm text-red-600">{errors.nombreDJ}</p>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Instagram <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="instagram"
                                            placeholder="Ej: https://instagram.com/tu_usuario"
                                            value={formData.instagram}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-2 border ${errors.instagram ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                                        />
                                        {errors.instagram && <p className="mt-1 text-sm text-red-600">{errors.instagram}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Facebook
                                        </label>
                                        <input
                                            type="text"
                                            name="facebook"
                                            placeholder="Ej: https://facebook.com/tu_pagina"
                                            value={formData.facebook}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            TikTok
                                        </label>
                                        <input
                                            type="text"
                                            name="tiktok"
                                            placeholder="Ej: https://tiktok.com/@tu_usuario"
                                            value={formData.tiktok}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            WhatsApp
                                        </label>
                                        <input
                                            type="text"
                                            name="whatsapp"
                                            placeholder="Ej: https://wa.me/(código_postal)(número)"
                                            value={formData.whatsapp}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Número para contratos <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="numeroContratos"
                                            placeholder="Ej: 987654321"
                                            value={formData.numeroContratos}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-2 border ${errors.numeroContratos ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                                        />
                                        {errors.numeroContratos && <p className="mt-1 text-sm text-red-600">{errors.numeroContratos}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Precio por hora (S/) <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="precioPorHora"
                                            placeholder="Ej: 150"
                                            value={formData.precioPorHora}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-2 border ${errors.precioPorHora ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                                        />
                                        {errors.precioPorHora && <p className="mt-1 text-sm text-red-600">{errors.precioPorHora}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Años de experiencia
                                    </label>
                                    <input
                                        type="text"
                                        name="experiencia"
                                        placeholder="Ej: 5 años"
                                        value={formData.experiencia}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Especialidad <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="especialidad"
                                        placeholder="Ej: Música electrónica, reggaetón, etc."
                                        value={formData.especialidad}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-2 border ${errors.especialidad ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                                    />
                                    {errors.especialidad && <p className="mt-1 text-sm text-red-600">{errors.especialidad}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Descripción <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        name="descripcion"
                                        rows={4}
                                        placeholder="Cuéntanos sobre tu estilo, equipos que usas, etc."
                                        value={formData.descripcion}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-2 border ${errors.descripcion ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                                    />
                                    {errors.descripcion && <p className="mt-1 text-sm text-red-600">{errors.descripcion}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Locales en los que has trabajado
                                    </label>
                                    <textarea
                                        name="localesTrabajados"
                                        rows={2}
                                        placeholder="Separa cada local con una coma (Ej: Bar XYZ, Club ABC, Disco 123)"
                                        value={formData.localesTrabajados}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>

                                <div className="flex justify-between">
                                    <button
                                        onClick={handleBack}
                                        className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        <ArrowLeft className="h-5 w-5 mr-2" />
                                        Anterior
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={loading}
                                        className="flex items-center px-6 py-3 border border-transparent text-white font-medium rounded-lg shadow-sm bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                                Guardando...
                                            </>
                                        ) : (
                                            <>
                                                <Check className="h-5 w-5 mr-2" />
                                                Guardar y Finalizar
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}