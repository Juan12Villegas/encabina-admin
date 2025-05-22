"use client";
import { useSidebar } from '@/../context/SidebarContext';
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, doc, getDoc, updateDoc, collection, query, where, getDocs } from "@/../lib/firebase";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { ChevronDown, MapPin, Calendar, Clock, Check, X, Disc3, ArrowLeft, Disc, Home, List } from "lucide-react";

// Configuración de iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Función para convertir Timestamp a formato datetime-local
const timestampToDatetimeLocal = (timestamp) => {
    if (!timestamp?.seconds) return "";
    const date = new Date(timestamp.seconds * 1000);
    const offset = date.getTimezoneOffset() * 60000; // offset en milisegundos
    const localDate = new Date(date.getTime() - offset);
    return localDate.toISOString().slice(0, 16);
};

// Función para convertir datetime-local a Timestamp
const datetimeLocalToTimestamp = (datetimeString) => {
    if (!datetimeString) return null;
    const date = new Date(datetimeString);
    return { seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0 };
};

export default function EditEvent() {
    const { id } = useParams();
    const router = useRouter();
    const { isCollapsed } = useSidebar();

    const [plan, setPlan] = useState("");
    const [evento, setEvento] = useState(null);
    const [estado, setEstado] = useState("");
    const [ubicacion, setUbicacion] = useState(null);
    const [nombreLugar, setNombreLugar] = useState("");
    const [habilitarUbicacion, setHabilitarUbicacion] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [showMapModal, setShowMapModal] = useState(false);
    const [currentPeriod, setCurrentPeriod] = useState({ start: null, end: null });

    // Cargar datos del evento
    useEffect(() => {
        const fetchEvento = async () => {
            if (!id) return;

            try {
                setLoading(true);
                const eventoRef = doc(db, "eventos", id);
                const eventoSnap = await getDoc(eventoRef);

                if (eventoSnap.exists()) {
                    const data = eventoSnap.data();
                    const djId = data.djId || null;

                    // Establecer datos del evento
                    setEvento({
                        ...data,
                        horaInicio: timestampToDatetimeLocal(data.horaInicio),
                        horaFin: timestampToDatetimeLocal(data.horaFin),
                        pais: data.pais || "",
                        idDj: djId,
                    });
                    setEstado(data.estado);
                    setUbicacion(data.ubicacion || null);

                    // Obtener nombre de lugar si existe la ubicación
                    if (data.ubicacion) {
                        obtenerNombreLugar(data.ubicacion.latitud, data.ubicacion.longitud);
                    }

                    // Obtener plan del DJ
                    if (djId) {
                        const djRef = doc(db, "users", djId);
                        const djSnap = await getDoc(djRef);

                        if (djSnap.exists()) {
                            const djData = djSnap.data();
                            setPlan(djData.plan);
                            const period = getCurrentPeriod(djData.payments);
                            setCurrentPeriod(period);
                        }
                    }
                } else {
                    router.push("/user/eventos");
                }
            } catch (error) {
                console.error("Error al cargar evento:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvento();
    }, [id, router]);

    const getCurrentPeriod = (payments) => {
        const now = new Date();

        if (payments?.monthly) {
            const monthlyPayments = Object.values(payments.monthly);
            for (const payment of monthlyPayments) {
                if (payment.paid && payment.dueDate) {
                    const dueDate = new Date(payment.dueDate);
                    const paymentDate = new Date(payment.date);

                    if (now >= paymentDate && now <= dueDate) {
                        return {
                            start: payment.date,
                            end: payment.dueDate
                        };
                    }
                }
            }
        }

        if (payments?.initial?.date) {
            const initialDate = new Date(payments.initial.date);
            const dueDate = new Date(initialDate);
            dueDate.setMonth(dueDate.getMonth() + 1);

            if (now >= initialDate && now <= dueDate) {
                return {
                    start: payments.initial.date,
                    end: dueDate.toISOString()
                };
            }
        }

        return { start: null, end: null };
    };

    const getMinMaxDates = () => {
        if (plan === "mainstage" || !currentPeriod.start || !currentPeriod.end) {
            return { min: null, max: null };
        }

        const minDate = new Date(currentPeriod.start);
        const maxDate = new Date(currentPeriod.end);

        const formatForInput = (date) => {
            return date.toISOString().slice(0, 16);
        };

        return {
            min: formatForInput(minDate),
            max: formatForInput(maxDate)
        };
    };

    const { min, max } = getMinMaxDates();

    const obtenerUbicacionActual = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const nuevaUbicacion = {
                        latitud: position.coords.latitude,
                        longitud: position.coords.longitude
                    };
                    setUbicacion(nuevaUbicacion);
                    obtenerNombreLugar(nuevaUbicacion.latitud, nuevaUbicacion.longitud);
                },
                (error) => {
                    console.error("Error obteniendo ubicación:", error);
                    alert("No se pudo obtener la ubicación automáticamente.");
                }
            );
        } else {
            alert("Tu navegador no soporta geolocalización.");
        }
    };

    const obtenerNombreLugar = async (lat, lng) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            );
            const data = await response.json();
            setNombreLugar(data?.display_name || "Ubicación no disponible");
        } catch (error) {
            console.error("Error obteniendo nombre del lugar:", error);
            setNombreLugar("Error al obtener el nombre");
        }
    };

    const verificarEventoEnVivo = async () => {
        if (!evento?.djId) return false;

        const eventosRef = collection(db, "eventos");
        const q = query(
            eventosRef,
            where("estado", "==", "en vivo"),
            where("djId", "==", evento.djId),
            where("__name__", "!=", id)
        );
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    };

    const validateForm = () => {
        const newErrors = {};
        if (!evento?.nombre) newErrors.nombre = "El nombre es requerido";
        if (!evento?.lugar) newErrors.lugar = "El lugar es requerido";
        if (!evento?.direccion) newErrors.direccion = "La dirección es requerida";
        if (!evento?.horaInicio) newErrors.horaInicio = "La hora de inicio es requerida";
        if (!evento?.horaFin) newErrors.horaFin = "La hora de fin es requerida";
        if (!evento?.departamento) newErrors.departamento = "El departamento es requerido";
        if (!evento?.provincia) newErrors.provincia = "La provincia es requerida";
        if (!evento?.distrito) newErrors.distrito = "El distrito es requerido";
        if (!evento?.pais) newErrors.pais = "El país es requerido";

        if (evento?.horaInicio && evento?.horaFin) {
            const inicio = new Date(evento.horaInicio);
            const fin = new Date(evento.horaFin);
            if (fin <= inicio) {
                newErrors.horaFin = "La hora de fin debe ser posterior a la de inicio";
            }

            if (plan !== "mainstage" && currentPeriod.start && currentPeriod.end) {
                const periodStart = new Date(currentPeriod.start);
                const periodEnd = new Date(currentPeriod.end);

                if (inicio < periodStart || inicio > periodEnd) {
                    newErrors.horaInicio = `La fecha debe estar entre ${periodStart.toLocaleDateString()} y ${periodEnd.toLocaleDateString()}`;
                }

                if (fin < periodStart || fin > periodEnd) {
                    newErrors.horaFin = `La fecha debe estar entre ${periodStart.toLocaleDateString()} y ${periodEnd.toLocaleDateString()}`;
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEvento(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        if (estado === "en vivo") {
            const hayOtroEventoEnVivo = await verificarEventoEnVivo();
            if (hayOtroEventoEnVivo) {
                alert("Ya tienes un evento en vivo. Solo se permite uno a la vez.");
                return;
            }

            if (habilitarUbicacion && !ubicacion) {
                alert("Debes registrar una ubicación para eventos en vivo.");
                setShowMapModal(true);
                return;
            }
        }

        try {
            setSaving(true);
            await updateDoc(doc(db, "eventos", id), {
                ...evento,
                estado,
                horaInicio: datetimeLocalToTimestamp(evento.horaInicio),
                horaFin: datetimeLocalToTimestamp(evento.horaFin),
                ubicacion: estado === "en vivo" && habilitarUbicacion ? ubicacion : null,
                ubicacionCompleta: `${evento.distrito}, ${evento.provincia}, ${evento.departamento}, ${evento.pais}`
            });
            router.push("/user/eventos");
        } catch (error) {
            console.error("Error al actualizar evento:", error);
            alert("Error al guardar los cambios");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center">
                    <Disc3 className="h-12 w-12 text-gray-600 animate-spin" />
                    <p className="mt-4 text-gray-700">Cargando evento...</p>
                </div>
            </div>
        );
    }

    if (!evento) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <p className="text-gray-600">Evento no encontrado</p>
                    <button
                        onClick={() => router.push("/user/eventos")}
                        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        Volver a eventos
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-0 lg:ml-16' : 'ml-0 lg:ml-64'}`}>
                {/* Cabecera con breadcrumbs y título */}
                <div className="bg-white border border-gray-200 p-4 lg:p-6">
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                        <a href="/dashboard" className="flex items-center hover:text-indigo-600">
                            <Home className="h-4 w-4 mr-1" />
                            Inicio
                        </a>
                        <ChevronDown className="h-4 w-4 mx-1 transform -rotate-90" />
                        <a href="/user/eventos" className="flex items-center hover:text-indigo-600">
                            <List className="h-4 w-4 mr-1" />
                            Mis Eventos
                        </a>
                        <ChevronDown className="h-4 w-4 mx-1 transform -rotate-90" />
                        <span className="text-indigo-600 font-medium">Editar Evento</span>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Editar Evento</h1>
                            <p className="text-gray-600 mt-1">Modifica los detalles de tu evento y actualiza su información.</p>
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

                {/* Contenido principal */}
                <div className="mx-auto">
                    {/* Formulario */}
                    <div className="bg-white border border-gray-200 overflow-hidden">
                        <div className="p-6 md:p-8 space-y-6">
                            {/* Sección Información Básica */}
                            <div className="border-gray-200 pb-6">
                                <h2 className="text-lg font-medium text-gray-900 mb-4">Información Básica</h2>

                                {/* Nombre del evento */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nombre del evento <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="nombre"
                                        value={evento.nombre.toUpperCase()}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg font-medium ${errors.nombre ? 'border-red-500' : 'border-gray-300'}`}
                                        placeholder="Nombre del evento"
                                    />
                                    {errors.nombre && <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>}
                                </div>

                                {/* Lugar y dirección */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Lugar <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="lugar"
                                            value={evento.lugar}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.lugar ? 'border-red-500' : 'border-gray-300'}`}
                                            placeholder="Lugar del evento"
                                        />
                                        {errors.lugar && <p className="mt-1 text-sm text-red-600">{errors.lugar}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Dirección <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="direccion"
                                            value={evento.direccion}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.direccion ? 'border-red-500' : 'border-gray-300'}`}
                                            placeholder="Dirección exacta"
                                        />
                                        {errors.direccion && <p className="mt-1 text-sm text-red-600">{errors.direccion}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Sección Ubicación */}
                            <div className="border-b border-gray-200 pb-6">
                                <h2 className="text-lg font-medium text-gray-900 mb-4">Ubicación</h2>

                                {/* País */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        País <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="pais"
                                        value={evento.pais || ""}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.pais ? 'border-red-500' : 'border-gray-300'}`}
                                        placeholder="Ej: Perú"
                                    />
                                    {errors.pais && <p className="mt-1 text-sm text-red-600">{errors.pais}</p>}
                                </div>

                                {/* Departamentos, Provincias, Distritos */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Departamento <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="departamento"
                                            value={evento.departamento || ""}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.departamento ? 'border-red-500' : 'border-gray-300'}`}
                                            placeholder="Ej: Lima"
                                        />
                                        {errors.departamento && <p className="mt-1 text-sm text-red-600">{errors.departamento}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Provincia <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="provincia"
                                            value={evento.provincia || ""}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.provincia ? 'border-red-500' : 'border-gray-300'}`}
                                            placeholder="Ej: Lima"
                                        />
                                        {errors.provincia && <p className="mt-1 text-sm text-red-600">{errors.provincia}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Distrito <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="distrito"
                                            value={evento.distrito || ""}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.distrito ? 'border-red-500' : 'border-gray-300'}`}
                                            placeholder="Ej: Miraflores"
                                        />
                                        {errors.distrito && <p className="mt-1 text-sm text-red-600">{errors.distrito}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Sección Fechas y Horas */}
                            <div className="border-b border-gray-200 pb-6">
                                <h2 className="text-lg font-medium text-gray-900 mb-4">Fecha y Hora</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Fecha y hora de inicio <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="datetime-local"
                                                name="horaInicio"
                                                value={evento.horaInicio}
                                                onChange={handleChange}
                                                min={min}
                                                max={max}
                                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.horaInicio ? 'border-red-500' : 'border-gray-300'}`}
                                            />
                                            <Calendar className="absolute right-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
                                            {errors.horaInicio && <p className="mt-1 text-sm text-red-600">{errors.horaInicio}</p>}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Fecha y hora de fin <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="datetime-local"
                                                name="horaFin"
                                                value={evento.horaFin}
                                                onChange={handleChange}
                                                min={min}
                                                max={max}
                                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.horaFin ? 'border-red-500' : 'border-gray-300'}`}
                                            />
                                            <Clock className="absolute right-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
                                            {errors.horaFin && <p className="mt-1 text-sm text-red-600">{errors.horaFin}</p>}
                                        </div>
                                    </div>
                                </div>

                                {plan !== "mainstage" && currentPeriod.start && currentPeriod.end && (
                                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                        <p className="text-sm text-blue-700">
                                            Tu plan actual permite eventos entre el {new Date(currentPeriod.start).toLocaleDateString()} y el {new Date(currentPeriod.end).toLocaleDateString()}.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Sección Estado y Ubicación */}
                            <div>
                                <h2 className="text-lg font-medium text-gray-900 mb-4">Estado del Evento</h2>

                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Estado <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex flex-wrap gap-4">
                                        {["pendiente", "en vivo", "culminado"].map((option) => (
                                            <label key={option} className="inline-flex items-center">
                                                <input
                                                    type="radio"
                                                    checked={estado === option}
                                                    onChange={() => setEstado(option)}
                                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                                />
                                                <span className="ml-2 text-sm text-gray-700 capitalize">
                                                    {option}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Ubicación en vivo */}
                                {estado === "en vivo" && (
                                    <div className="space-y-4">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="habilitarUbicacion"
                                                checked={habilitarUbicacion}
                                                onChange={(e) => setHabilitarUbicacion(e.target.checked)}
                                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor="habilitarUbicacion" className="ml-2 text-sm text-gray-700">
                                                Habilitar ubicación en tiempo real
                                            </label>
                                        </div>

                                        {habilitarUbicacion && (
                                            <div className="space-y-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowMapModal(true)}
                                                    className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                                                >
                                                    <MapPin className="h-5 w-5 mr-2 text-gray-500" />
                                                    {ubicacion ? "Actualizar ubicación" : "Seleccionar ubicación"}
                                                </button>

                                                {ubicacion && (
                                                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                        <p className="text-sm text-gray-700">
                                                            <span className="font-medium">Ubicación actual:</span> {nombreLugar}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Lat: {ubicacion.latitud.toFixed(6)}, Lng: {ubicacion.longitud.toFixed(6)}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer del formulario */}
                        <div className="bg-white px-6 py-4 border-t border-gray-200 flex gap-4 justify-end">
                            <button
                                onClick={() => router.push("/user/eventos")}
                                className="flex items-center px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
                            >
                                <X className="h-5 w-5 mr-2" />
                                Cancelar
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={saving}
                                className="flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {saving ? (
                                    <>
                                        <Disc3 className="h-5 w-5 mr-2 animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-5 w-5 mr-2" />
                                        Guardar cambios
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Modal de ubicación */}
            {showMapModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" onClick={() => setShowMapModal(false)}>
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    Seleccionar ubicación
                                </h3>

                                <div className="space-y-4">
                                    <button
                                        onClick={obtenerUbicacionActual}
                                        className="flex items-center justify-center w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                    >
                                        <MapPin className="h-5 w-5 mr-2" />
                                        Usar mi ubicación actual
                                    </button>

                                    {ubicacion && (
                                        <>
                                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                <p className="text-sm text-gray-700">
                                                    <span className="font-medium">Ubicación actual:</span> {nombreLugar}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Lat: {ubicacion.latitud.toFixed(6)}, Lng: {ubicacion.longitud.toFixed(6)}
                                                </p>
                                            </div>

                                            <div className="h-64 rounded-lg overflow-hidden border border-gray-200">
                                                <MapContainer
                                                    center={[ubicacion.latitud, ubicacion.longitud]}
                                                    zoom={15}
                                                    style={{ height: "100%", width: "100%" }}
                                                >
                                                    <TileLayer
                                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                    />
                                                    <Marker position={[ubicacion.latitud, ubicacion.longitud]}>
                                                        <Popup>{nombreLugar}</Popup>
                                                    </Marker>
                                                </MapContainer>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!ubicacion) {
                                            alert("Por favor selecciona una ubicación primero");
                                            return;
                                        }
                                        setShowMapModal(false);
                                    }}
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    Confirmar ubicación
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowMapModal(false)}
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}