"use client";

import { useState, useEffect } from "react";
import { db, collection, getDocs, query, where } from "@/../lib/firebase";
import { Search, SlidersHorizontal, X, Star, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import ubigeoData from "@/../data/ubigeo.json";
import NavbarGeneral from "@/components/NavbarGeneral";

export default function NuestroTeamPage() {
    const [djs, setDjs] = useState([]);
    const [filteredDjs, setFilteredDjs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        minPrice: "",
        maxPrice: "",
        departamento: "",
        provincia: "",
        distrito: ""
    });
    const [departamentos, setDepartamentos] = useState([]);
    const [provincias, setProvincias] = useState([]);
    const [distritos, setDistritos] = useState([]);
    const [expandedDJ, setExpandedDJ] = useState(null);

    // Cargar departamentos al iniciar
    useEffect(() => {
        setDepartamentos(ubigeoData.departamentos);
    }, []);

    // Cargar provincias cuando se selecciona un departamento
    useEffect(() => {
        if (filters.departamento) {
            const provinciasFiltradas = ubigeoData.provincias.filter(
                (provincia) => provincia.departamento_id === filters.departamento
            );
            setProvincias(provinciasFiltradas);
            setFilters(prev => ({ ...prev, provincia: "", distrito: "" }));
        } else {
            setProvincias([]);
        }
    }, [filters.departamento]);

    // Cargar distritos cuando se selecciona una provincia
    useEffect(() => {
        if (filters.provincia) {
            const distritosFiltrados = ubigeoData.distritos.filter(
                (distrito) => distrito.provincia_id === filters.provincia
            );
            setDistritos(distritosFiltrados);
            setFilters(prev => ({ ...prev, distrito: "" }));
        } else {
            setDistritos([]);
        }
    }, [filters.provincia]);

    // Obtener DJs de Firestore
    useEffect(() => {
        const fetchDJs = async () => {
            try {
                setLoading(true);
                const djsRef = collection(db, "djs");
                const q = query(djsRef, where("estado", "==", "activo"));
                const querySnapshot = await getDocs(q);

                const djsList = [];
                querySnapshot.forEach((doc) => {
                    djsList.push({ id: doc.id, ...doc.data() });
                });

                setDjs(djsList);
                setFilteredDjs(djsList);
            } catch (error) {
                console.error("Error fetching DJs:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDJs();
    }, []);

    // Aplicar filtros
    useEffect(() => {
        let result = [...djs];

        // Filtro por búsqueda
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(dj =>
                dj.nombreDJ.toLowerCase().includes(term) ||
                dj.especialidad?.toLowerCase().includes(term) ||
                dj.descripcion?.toLowerCase().includes(term)
            );
        }

        // Filtro por rango de precios
        if (filters.minPrice) {
            result = result.filter(dj => dj.precioPorHora >= Number(filters.minPrice));
        }
        if (filters.maxPrice) {
            result = result.filter(dj => dj.precioPorHora <= Number(filters.maxPrice));
        }

        // Filtro por ubicación
        if (filters.departamento) {
            result = result.filter(dj => dj.departamento === filters.departamento);
        }
        if (filters.provincia) {
            result = result.filter(dj => dj.provincia === filters.provincia);
        }
        if (filters.distrito) {
            result = result.filter(dj => dj.distrito === filters.distrito);
        }

        setFilteredDjs(result);
    }, [djs, searchTerm, filters]);

    const resetFilters = () => {
        setFilters({
            minPrice: "",
            maxPrice: "",
            departamento: "",
            provincia: "",
            distrito: ""
        });
        setSearchTerm("");
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

    const toggleExpandDJ = (djId) => {
        setExpandedDJ(expandedDJ === djId ? null : djId);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
                    <p className="mt-4 text-gray-600">Cargando DJs...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50">
            <NavbarGeneral />

            {/* Hero Section */}
            <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0 bg-[url('/images/pattern.svg')] bg-center"></div>
                </div>

                <div className="max-w-7xl mx-auto py-24 px-4 sm:px-6 lg:px-8 relative">
                    <div className="text-center">
                        <h1 className="text-4xl font-extrabold text-white sm:text-5xl sm:tracking-tight lg:text-6xl">
                            Nuestro Team de DJs
                        </h1>
                        <p className="mt-6 max-w-lg mx-auto text-xl text-gray-300">
                            Conoce a los profesionales que hacen que cada evento sea único
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Search and Filters */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">DJs Profesionales</h1>
                            <p className="text-gray-600 mt-1">
                                {filteredDjs.length} {filteredDjs.length === 1 ? "DJ encontrado" : "DJs encontrados"}
                            </p>
                        </div>

                        <div className="flex gap-3 w-full md:w-auto">
                            <div className="relative flex-grow md:flex-grow-0">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Buscar DJs por nombre, especialidad..."
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${showFilters ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                            >
                                <SlidersHorizontal className="h-5 w-5" />
                                <span className="hidden sm:inline">Filtros</span>
                                {showFilters ? (
                                    <ChevronUp className="h-4 w-4" />
                                ) : (
                                    <ChevronDown className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Filters Panel */}
                    {showFilters && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Price Range */}
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700 mb-2">Rango de precios por hora</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Mínimo (S/)</label>
                                            <input
                                                type="number"
                                                placeholder="Desde"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                                value={filters.minPrice}
                                                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Máximo (S/)</label>
                                            <input
                                                type="number"
                                                placeholder="Hasta"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                                value={filters.maxPrice}
                                                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Location - Department */}
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700 mb-2">Departamento</h3>
                                    <select
                                        value={filters.departamento}
                                        onChange={(e) => setFilters({ ...filters, departamento: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="">Todos los departamentos</option>
                                        {departamentos.map((departamento) => (
                                            <option key={departamento.id} value={departamento.id}>
                                                {departamento.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Location - Province */}
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700 mb-2">Provincia</h3>
                                    <select
                                        value={filters.provincia}
                                        onChange={(e) => setFilters({ ...filters, provincia: e.target.value })}
                                        disabled={!filters.departamento}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
                                    >
                                        <option value="">Todas las provincias</option>
                                        {provincias.map((provincia) => (
                                            <option key={provincia.id} value={provincia.id}>
                                                {provincia.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Location - District */}
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700 mb-2">Distrito</h3>
                                    <select
                                        value={filters.distrito}
                                        onChange={(e) => setFilters({ ...filters, distrito: e.target.value })}
                                        disabled={!filters.provincia}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
                                    >
                                        <option value="">Todos los distritos</option>
                                        {distritos.map((distrito) => (
                                            <option key={distrito.id} value={distrito.id}>
                                                {distrito.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end mt-4 gap-3">
                                <button
                                    onClick={resetFilters}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Limpiar filtros
                                </button>
                                <button
                                    onClick={() => setShowFilters(false)}
                                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                                >
                                    Aplicar filtros
                                </button>
                            </div>
                        </div>
                    )}

                    {/* DJs List */}
                    {filteredDjs.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredDjs.map((dj) => (
                                <div
                                    key={dj.id}
                                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300"
                                >
                                    <div className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">{dj.nombreDJ}</h3>
                                                <p className="text-sm text-gray-500">{dj.especialidad || "DJ Profesional"}</p>
                                            </div>
                                            {dj.calificacion && (
                                                <div className="flex items-center bg-indigo-50 px-2 py-1 rounded-full">
                                                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                                    <span className="ml-1 text-sm font-medium text-indigo-800">
                                                        {dj.calificacion.toFixed(1)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-4">
                                            <p className={`text-gray-600 text-sm ${expandedDJ === dj.id ? '' : 'line-clamp-3'}`}>
                                                {dj.descripcion || "Sin descripción disponible"}
                                            </p>
                                            {dj.descripcion && dj.descripcion.length > 150 && (
                                                <button
                                                    onClick={() => toggleExpandDJ(dj.id)}
                                                    className="text-indigo-600 text-sm mt-1 hover:underline"
                                                >
                                                    {expandedDJ === dj.id ? 'Mostrar menos' : 'Mostrar más'}
                                                </button>
                                            )}
                                        </div>

                                        <div className="mt-4 flex items-center text-sm text-gray-500">
                                            <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                                            <span className="truncate">
                                                {dj.distrito ? getDistritoName(dj.distrito) + ', ' : ''}
                                                {dj.provincia ? getProvinciaName(dj.provincia) + ', ' : ''}
                                                {dj.departamento ? getDepartamentoName(dj.departamento) : 'Ubicación no especificada'}
                                            </span>
                                        </div>

                                        <div className="mt-4 flex items-center justify-between">
                                            <div className="text-lg font-bold text-gray-800">
                                                S/ {dj.precioPorHora?.toFixed(2) || "0.00"} x hora
                                            </div>
                                        </div>

                                        <div className="mt-6 grid grid-cols-2 gap-3">
                                            <button className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors border border-gray-200">
                                                Ver perfil
                                            </button>
                                            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                                                Contactar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                            <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <X className="h-12 w-12 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">No se encontraron DJs</h3>
                            <p className="mt-1 text-gray-500">Prueba ajustando tus filtros de búsqueda</p>
                            <button
                                onClick={resetFilters}
                                className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                            >
                                Limpiar filtros
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}