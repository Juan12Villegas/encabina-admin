"use client";
import { useSidebar } from '@/../context/SidebarContext';

import { useState, useEffect } from "react";
import { db, auth, doc, setDoc, getDoc } from "@/../lib/firebase";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Loader2, Edit, X, Disc3, Home, List, ChevronDown } from "lucide-react";
import ubigeoData from "@/../data/ubigeo.json";

export default function EditProfile() {
    const { isCollapsed } = useSidebar();

    const [formData, setFormData] = useState({
        nombres: "",
        apellidos: "",
        departamento: "",
        provincia: "",
        distrito: "",
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
    const [originalData, setOriginalData] = useState(null);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [departamentos, setDepartamentos] = useState([]);
    const [provincias, setProvincias] = useState([]);
    const [distritos, setDistritos] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const router = useRouter();

    // Cargar departamentos al iniciar
    useEffect(() => {
        setDepartamentos(ubigeoData.departamentos);
    }, []);

    // Cargar provincias cuando se selecciona un departamento
    useEffect(() => {
        if (formData.departamento) {
            const provinciasFiltradas = ubigeoData.provincias.filter(
                (provincia) => provincia.departamento_id === formData.departamento
            );
            setProvincias(provinciasFiltradas);
        } else {
            setProvincias([]);
        }
    }, [formData.departamento]);

    // Cargar distritos cuando se selecciona una provincia
    useEffect(() => {
        if (formData.provincia) {
            const distritosFiltrados = ubigeoData.distritos.filter(
                (distrito) => distrito.provincia_id === formData.provincia
            );
            setDistritos(distritosFiltrados);
        } else {
            setDistritos([]);
        }
    }, [formData.provincia]);

    // Cargar datos del perfil al montar el componente
    useEffect(() => {
        const loadProfile = async () => {
            const user = auth.currentUser;
            if (!user) return;

            try {
                setLoading(true);
                const djRef = doc(db, "djs", user.uid);
                const djSnap = await getDoc(djRef);

                if (djSnap.exists()) {
                    const data = djSnap.data();
                    setFormData({
                        nombres: data.nombres || "",
                        apellidos: data.apellidos || "",
                        departamento: data.departamento || "",
                        provincia: data.provincia || "",
                        distrito: data.distrito || "",
                        fechaNacimiento: data.fechaNacimiento || "",
                        telefono: data.telefono || "",
                        direccion: data.direccion || "",
                        nombreDJ: data.nombreDJ || "",
                        instagram: data.instagram || "",
                        facebook: data.facebook || "",
                        tiktok: data.tiktok || "",
                        whatsapp: data.whatsapp || "",
                        numeroContratos: data.numeroContratos || "",
                        precioPorHora: data.precioPorHora || "",
                        experiencia: data.experiencia || "",
                        especialidad: data.especialidad || "",
                        descripcion: data.descripcion || "",
                        localesTrabajados: data.localesTrabajados?.join(", ") || "",
                    });
                    setOriginalData(data);
                }
            } catch (error) {
                console.error("Error cargando perfil:", error);
                alert("Hubo un error al cargar tu perfil. Por favor intenta nuevamente.");
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        setErrors({ ...errors, [name]: "" });
    };

    const validateForm = () => {
        const newErrors = {};

        // Validación de información personal
        if (!formData.nombres) newErrors.nombres = "Este campo es obligatorio";
        if (!formData.apellidos) newErrors.apellidos = "Este campo es obligatorio";
        if (!formData.departamento) newErrors.departamento = "Selecciona un departamento";
        if (!formData.provincia) newErrors.provincia = "Selecciona una provincia";
        if (!formData.distrito) newErrors.distrito = "Selecciona un distrito";
        if (!formData.fechaNacimiento) newErrors.fechaNacimiento = "Este campo es obligatorio";
        if (!formData.telefono) {
            newErrors.telefono = "Este campo es obligatorio";
        } else if (!/^\d{9}$/.test(formData.telefono)) {
            newErrors.telefono = "El teléfono debe tener 9 dígitos";
        }
        if (!formData.direccion) newErrors.direccion = "Este campo es obligatorio";

        // Validación de información profesional
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

    const handleSave = async () => {
        if (!validateForm()) return;

        const user = auth.currentUser;
        if (!user) return;

        try {
            setLoading(true);
            const djRef = doc(db, "djs", user.uid);
            await setDoc(
                djRef,
                {
                    ...formData,
                    precioPorHora: Number(formData.precioPorHora),
                    localesTrabajados: formData.localesTrabajados
                        .split(",")
                        .map((local) => local.trim()),
                    updatedAt: new Date(),
                },
                { merge: true }
            );

            // Actualizar datos originales
            setOriginalData({
                ...originalData,
                ...formData,
                precioPorHora: Number(formData.precioPorHora),
                localesTrabajados: formData.localesTrabajados
                    .split(",")
                    .map((local) => local.trim()),
            });

            setIsEditing(false);
            alert("Perfil actualizado correctamente");
        } catch (error) {
            console.error("Error actualizando perfil:", error);
            alert("Hubo un error al actualizar tu perfil. Por favor intenta nuevamente.");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (originalData) {
            setFormData({
                ...originalData,
                localesTrabajados: originalData.localesTrabajados?.join(", ") || "",
            });
        }
        setIsEditing(false);
        setErrors({});
    };

    const getDepartamentoName = (id) => {
        return departamentos.find(d => d.id === id)?.nombre || id;
    };

    const getProvinciaName = (id) => {
        return provincias.find(p => p.id === id)?.nombre || id;
    };

    const getDistritoName = (id) => {
        return distritos.find(d => d.id === id)?.nombre || id;
    };

    if (loading && !originalData) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <Disc3 className="h-12 w-12 animate-spin mx-auto" />
                    <p className="mt-4 text-lg">Cargando tu perfil...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-0 lg:ml-16' : 'ml-0 lg:ml-64'}`}>
                <div className="bg-white border border-gray-200 p-4 lg:p-6">
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                        <a href="/user/eventos" className="flex items-center hover:text-indigo-600">
                            <Home className="h-4 w-4 mr-1" />
                            Inicio
                        </a>
                        {/* <ChevronDown className="h-4 w-4 mx-1 transform -rotate-90" />
                        <a href="/user/eventos" className="flex items-center hover:text-indigo-600">
                            <List className="h-4 w-4 mr-1" />
                            Mis Eventos
                        </a> */}
                        <ChevronDown className="h-4 w-4 mx-1 transform -rotate-90" />
                        <span className="text-indigo-600 font-medium">Mi Perfil</span>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
                            <p className="text-gray-600 mt-1">Visualiza y modifica la información de tu perfil.</p>
                        </div>
                        <button
                            onClick={() => router.push("/user/eventos")}
                            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver a eventos
                        </button>
                    </div>
                </div>

                <div className="mx-auto p-4 lg:p-6 border border-gray-200">
                    <div className="mx-auto">
                        <div className="overflow-hidden">
                            {/* Encabezado */}
                            <div className=" text-black">
                                <div className="flex justify-end gap-4 mb-2">
                                    {!isEditing ? (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-700 font-semibold rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md"
                                        >
                                            <Edit className="h-5 w-5" />
                                            Editar Perfil
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleCancel}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-all duration-200 shadow-sm hover:shadow-md"
                                        >
                                            <X className="h-5 w-5" />
                                            Cancelar
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Contenido del perfil */}
                            <div className="">
                                {/* Sección de Información Personal */}
                                <div className="mb-12">
                                    <div className="flex items-center mb-6">
                                        <div className="h-10 w-1 bg-indigo-600 rounded-full mr-4"></div>
                                        <h2 className="text-xl font-bold text-gray-800">Información Personal</h2>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Nombres */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Nombres <span className="text-red-500">*</span>
                                            </label>
                                            {isEditing ? (
                                                <>
                                                    <input
                                                        type="text"
                                                        name="nombres"
                                                        value={formData.nombres}
                                                        onChange={handleChange}
                                                        className={`w-full px-4 py-3 border ${errors.nombres ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200`}
                                                        placeholder="Ej: Juan Carlos"
                                                    />
                                                    {errors.nombres && <p className="text-sm text-red-600 mt-1">{errors.nombres}</p>}
                                                </>
                                            ) : (
                                                <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                                                    <p className="text-gray-800">{formData.nombres}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Apellidos */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Apellidos <span className="text-red-500">*</span>
                                            </label>
                                            {isEditing ? (
                                                <>
                                                    <input
                                                        type="text"
                                                        name="apellidos"
                                                        value={formData.apellidos}
                                                        onChange={handleChange}
                                                        className={`w-full px-4 py-3 border ${errors.apellidos ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200`}
                                                        placeholder="Ej: Pérez García"
                                                    />
                                                    {errors.apellidos && <p className="text-sm text-red-600 mt-1">{errors.apellidos}</p>}
                                                </>
                                            ) : (
                                                <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                                                    <p className="text-gray-800">{formData.apellidos}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Fecha de Nacimiento */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Fecha de nacimiento <span className="text-red-500">*</span>
                                            </label>
                                            {isEditing ? (
                                                <>
                                                    <input
                                                        type="date"
                                                        name="fechaNacimiento"
                                                        value={formData.fechaNacimiento}
                                                        onChange={handleChange}
                                                        className={`w-full px-4 py-3 border ${errors.fechaNacimiento ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200`}
                                                    />
                                                    {errors.fechaNacimiento && <p className="text-sm text-red-600 mt-1">{errors.fechaNacimiento}</p>}
                                                </>
                                            ) : (
                                                <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                                                    <p className="text-gray-800">{formData.fechaNacimiento}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Teléfono */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Teléfono <span className="text-red-500">*</span>
                                            </label>
                                            {isEditing ? (
                                                <>
                                                    <input
                                                        type="text"
                                                        name="telefono"
                                                        value={formData.telefono}
                                                        onChange={handleChange}
                                                        className={`w-full px-4 py-3 border ${errors.telefono ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200`}
                                                        placeholder="Ej: 987654321"
                                                    />
                                                    {errors.telefono && <p className="text-sm text-red-600 mt-1">{errors.telefono}</p>}
                                                </>
                                            ) : (
                                                <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                                                    <p className="text-gray-800">{formData.telefono}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Departamento */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Departamento <span className="text-red-500">*</span>
                                            </label>
                                            {isEditing ? (
                                                <>
                                                    <select
                                                        name="departamento"
                                                        value={formData.departamento}
                                                        onChange={handleChange}
                                                        className={`w-full px-4 py-3 border ${errors.departamento ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200`}
                                                    >
                                                        <option value="">Selecciona un departamento</option>
                                                        {departamentos.map((departamento) => (
                                                            <option key={departamento.id} value={departamento.id}>
                                                                {departamento.nombre}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {errors.departamento && <p className="text-sm text-red-600 mt-1">{errors.departamento}</p>}
                                                </>
                                            ) : (
                                                <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                                                    <p className="text-gray-800">{getDepartamentoName(formData.departamento)}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Provincia */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Provincia <span className="text-red-500">*</span>
                                            </label>
                                            {isEditing ? (
                                                <>
                                                    <select
                                                        name="provincia"
                                                        value={formData.provincia}
                                                        onChange={handleChange}
                                                        disabled={!formData.departamento}
                                                        className={`w-full px-4 py-3 border ${errors.provincia ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-500`}
                                                    >
                                                        <option value="">Selecciona una provincia</option>
                                                        {provincias.map((provincia) => (
                                                            <option key={provincia.id} value={provincia.id}>
                                                                {provincia.nombre}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {errors.provincia && <p className="text-sm text-red-600 mt-1">{errors.provincia}</p>}
                                                </>
                                            ) : (
                                                <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                                                    <p className="text-gray-800">{getProvinciaName(formData.provincia)}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Distrito */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Distrito <span className="text-red-500">*</span>
                                            </label>
                                            {isEditing ? (
                                                <>
                                                    <select
                                                        name="distrito"
                                                        value={formData.distrito}
                                                        onChange={handleChange}
                                                        disabled={!formData.provincia}
                                                        className={`w-full px-4 py-3 border ${errors.distrito ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-500`}
                                                    >
                                                        <option value="">Selecciona un distrito</option>
                                                        {distritos.map((distrito) => (
                                                            <option key={distrito.id} value={distrito.id}>
                                                                {distrito.nombre}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {errors.distrito && <p className="text-sm text-red-600 mt-1">{errors.distrito}</p>}
                                                </>
                                            ) : (
                                                <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                                                    <p className="text-gray-800">{getDistritoName(formData.distrito)}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Dirección */}
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Dirección completa <span className="text-red-500">*</span>
                                            </label>
                                            {isEditing ? (
                                                <>
                                                    <input
                                                        type="text"
                                                        name="direccion"
                                                        value={formData.direccion}
                                                        onChange={handleChange}
                                                        className={`w-full px-4 py-3 border ${errors.direccion ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200`}
                                                        placeholder="Ej: Av. Principal 123, Urb. Las Flores"
                                                    />
                                                    {errors.direccion && <p className="text-sm text-red-600 mt-1">{errors.direccion}</p>}
                                                </>
                                            ) : (
                                                <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                                                    <p className="text-gray-800">{formData.direccion}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Sección de Información Profesional */}
                                <div className="mb-12">
                                    <div className="flex items-center mb-6">
                                        <div className="h-10 w-1 bg-blue-600 rounded-full mr-4"></div>
                                        <h2 className="text-xl font-bold text-gray-800">Información Profesional</h2>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Nombre DJ */}
                                        <div className="space-y-2 md:col-span-3">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Nombre artístico (DJ) <span className="text-red-500">*</span>
                                            </label>
                                            {isEditing ? (
                                                <>
                                                    <input
                                                        type="text"
                                                        name="nombreDJ"
                                                        value={formData.nombreDJ}
                                                        onChange={handleChange}
                                                        className={`w-full px-4 py-3 border ${errors.nombreDJ ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200`}
                                                        placeholder="Ej: DJ ProMix"
                                                    />
                                                    {errors.nombreDJ && <p className="text-sm text-red-600 mt-1">{errors.nombreDJ}</p>}
                                                </>
                                            ) : (
                                                <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                                                    <p className="text-gray-800 font-medium">{formData.nombreDJ}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Instagram */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Instagram <span className="text-red-500">*</span>
                                            </label>
                                            {isEditing ? (
                                                <>
                                                    <input
                                                        type="text"
                                                        name="instagram"
                                                        value={formData.instagram}
                                                        onChange={handleChange}
                                                        className={`w-full px-4 py-3 border ${errors.instagram ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200`}
                                                        placeholder="Ej: https://instagram.com/tu_usuario"
                                                    />
                                                    {errors.instagram && <p className="text-sm text-red-600 mt-1 min-w-xl truncate">{errors.instagram}</p>}
                                                </>
                                            ) : (
                                                <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                                                    <p className="text-gray-800">{formData.instagram}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Facebook */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Facebook
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    name="facebook"
                                                    value={formData.facebook}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                                    placeholder="Ej: https://facebook.com/tu_pagina"
                                                />
                                            ) : (
                                                <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                                                    <p className="text-gray-800">{formData.facebook || "No especificado"}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* TikTok */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                TikTok
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    name="tiktok"
                                                    value={formData.tiktok}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                                    placeholder="Ej: https://tiktok.com/@tu_usuario"
                                                />
                                            ) : (
                                                <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                                                    <p className="text-gray-800">{formData.tiktok || "No especificado"}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* WhatsApp */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                WhatsApp
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    name="whatsapp"
                                                    value={formData.whatsapp}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                                    placeholder="Ej: https://whatsapp.com/tu_numero"
                                                />
                                            ) : (
                                                <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                                                    <p className="text-gray-800">{formData.whatsapp || "No especificado"}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Número para contratos */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Número para contratos <span className="text-red-500">*</span>
                                            </label>
                                            {isEditing ? (
                                                <>
                                                    <input
                                                        type="text"
                                                        name="numeroContratos"
                                                        value={formData.numeroContratos}
                                                        onChange={handleChange}
                                                        className={`w-full px-4 py-3 border ${errors.numeroContratos ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200`}
                                                        placeholder="Ej: 987654321"
                                                    />
                                                    {errors.numeroContratos && <p className="text-sm text-red-600 mt-1">{errors.numeroContratos}</p>}
                                                </>
                                            ) : (
                                                <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                                                    <p className="text-gray-800">{formData.numeroContratos}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Precio por hora */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Precio por hora (S/) <span className="text-red-500">*</span>
                                            </label>
                                            {isEditing ? (
                                                <>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-3 text-gray-500">S/</span>
                                                        <input
                                                            type="text"
                                                            name="precioPorHora"
                                                            value={formData.precioPorHora}
                                                            onChange={handleChange}
                                                            className={`w-full pl-10 pr-4 py-3 border ${errors.precioPorHora ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200`}
                                                            placeholder="Ej: 150"
                                                        />
                                                    </div>
                                                    {errors.precioPorHora && <p className="text-sm text-red-600 mt-1">{errors.precioPorHora}</p>}
                                                </>
                                            ) : (
                                                <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                                                    <p className="text-gray-800">S/ {formData.precioPorHora}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Experiencia */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Años de experiencia
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    name="experiencia"
                                                    value={formData.experiencia}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                                    placeholder="Ej: 5 años"
                                                />
                                            ) : (
                                                <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                                                    <p className="text-gray-800">{formData.experiencia || "No especificado"}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Especialidad */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Especialidad <span className="text-red-500">*</span>
                                            </label>
                                            {isEditing ? (
                                                <>
                                                    <input
                                                        type="text"
                                                        name="especialidad"
                                                        value={formData.especialidad}
                                                        onChange={handleChange}
                                                        className={`w-full px-4 py-3 border ${errors.especialidad ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200`}
                                                        placeholder="Ej: Música electrónica, reggaetón, etc."
                                                    />
                                                    {errors.especialidad && <p className="text-sm text-red-600 mt-1">{errors.especialidad}</p>}
                                                </>
                                            ) : (
                                                <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                                                    <p className="text-gray-800">{formData.especialidad}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Descripción */}
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Descripción <span className="text-red-500">*</span>
                                            </label>
                                            {isEditing ? (
                                                <>
                                                    <textarea
                                                        name="descripcion"
                                                        rows={4}
                                                        value={formData.descripcion}
                                                        onChange={handleChange}
                                                        className={`w-full px-4 py-3 border ${errors.descripcion ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200`}
                                                        placeholder="Cuéntanos sobre tu estilo, equipos que usas, etc."
                                                    />
                                                    {errors.descripcion && <p className="text-sm text-red-600 mt-1">{errors.descripcion}</p>}
                                                </>
                                            ) : (
                                                <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 whitespace-pre-line">
                                                    <p className="text-gray-800">{formData.descripcion}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Locales trabajados */}
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Locales en los que has trabajado
                                            </label>
                                            {isEditing ? (
                                                <textarea
                                                    name="localesTrabajados"
                                                    rows={2}
                                                    value={formData.localesTrabajados}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                                    placeholder="Separa cada local con una coma (Ej: Bar XYZ, Club ABC, Disco 123)"
                                                />
                                            ) : (
                                                <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                                                    <p className="text-gray-800">{formData.localesTrabajados || "No especificado"}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {isEditing && (
                                    <div className="flex justify-end gap-4 mt-8">
                                        <button
                                            onClick={handleCancel}
                                            className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={loading}
                                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-70"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="h-5 w-5 animate-spin" />
                                                    Guardando...
                                                </>
                                            ) : (
                                                <>
                                                    <Check className="h-5 w-5" />
                                                    Guardar Cambios
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}