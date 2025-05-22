"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, doc, getDoc, updateDoc, collection, query, where, onSnapshot } from "@/../lib/firebase";
import { motion } from "framer-motion";
import { RotateCcw, Disc, Music, X, Check, Disc3, Ban, MessageSquareDot, Loader2, Lock, Edit, Eye } from "lucide-react";
import { Input } from "@/components/input";
import { Button } from "@/components/button";
import toast from "react-hot-toast";

export default function SharedEventView() {
    const { id } = useParams();
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [error, setError] = useState("");
    const [permission, setPermission] = useState("view"); // 'view' o 'edit'

    // Estados para los datos del evento
    const [evento, setEvento] = useState(null);
    const [canciones, setCanciones] = useState([]);
    const [descartados, setDescartados] = useState([]);
    const [colocadas, setColocadas] = useState([]);
    const [mostrarLista, setMostrarLista] = useState("solicitadas");

    // Verificar la contraseña (modificada)
    const checkPassword = async () => {
        if (!password) {
            setError("Debes ingresar una contraseña");
            return;
        }

        setIsLoading(true);
        try {
            const sharedEventRef = doc(db, "shared_events", id);
            const docSnap = await getDoc(sharedEventRef);

            if (docSnap.exists() && docSnap.data().password === password) {
                setIsAuthenticated(true);
                setPermission(docSnap.data().permission || "view"); // Establecer el permiso
                setError("");
            } else {
                setError("Contraseña incorrecta");
            }
        } catch (err) {
            console.error("Error al verificar contraseña:", err);
            setError("Error al verificar contraseña");
        } finally {
            setIsLoading(false);
        }
    };

    // Funciones para manejar acciones (solo si tiene permiso de edición)
    const descartarCancion = async (cancionId) => {
        if (permission !== "edit") return;

        try {
            const cancionRef = doc(db, "event_requests", cancionId);
            await updateDoc(cancionRef, {
                descartado: true,
                descartadoTimestamp: new Date(),
                colocada: false
            });
            toast.success("Canción descartada");
        } catch (error) {
            console.error("Error al descartar la canción:", error);
            toast.error("Error al descartar canción");
        }
    };

    const restaurarCancion = async (cancionId) => {
        if (permission !== "edit") return;

        try {
            const cancionRef = doc(db, "event_requests", cancionId);
            await updateDoc(cancionRef, {
                descartado: false,
                descartadoTimestamp: null
            });
            toast.success("Canción restaurada");
        } catch (error) {
            console.error("Error al restaurar la canción:", error);
            toast.error("Error al restaurar canción");
        }
    };

    const marcarComoColocada = async (cancionId) => {
        if (permission !== "edit") return;

        try {
            const cancionRef = doc(db, "event_requests", cancionId);
            await updateDoc(cancionRef, {
                colocada: true,
                colocadaTimestamp: new Date(),
                descartado: false
            });
            toast.success("Canción marcada como colocada");
        } catch (error) {
            console.error("Error al marcar la canción como colocada:", error);
            toast.error("Error al marcar canción");
        }
    };

    const desmarcarComoColocada = async (cancionId) => {
        if (permission !== "edit") return;

        try {
            const cancionRef = doc(db, "event_requests", cancionId);
            await updateDoc(cancionRef, {
                colocada: false,
                colocadaTimestamp: null
            });
            toast.success("Canción desmarcada");
        } catch (error) {
            console.error("Error al desmarcar la canción como colocada:", error);
            toast.error("Error al desmarcar canción");
        }
    };

    // Cargar datos del evento si está autenticado
    useEffect(() => {
        if (!isAuthenticated || !id) return;

        const fetchEventData = async () => {
            const eventoRef = doc(db, "eventos", id);
            const eventoSnap = await getDoc(eventoRef);

            if (eventoSnap.exists()) {
                setEvento(eventoSnap.data());
            } else {
                router.push("/");
            }
        };

        const fetchSongs = () => {
            const cancionesRef = collection(db, "event_requests");
            const q = query(cancionesRef, where("eventId", "==", id));

            return onSnapshot(q, (snapshot) => {
                const cancionesList = [];
                const descartadosList = [];
                const colocadasList = [];

                snapshot.docs.forEach(doc => {
                    const cancionData = {
                        id: doc.id,
                        ...doc.data(),
                        timestamp: doc.data().createdAt || doc.data().timestamp || { seconds: Date.now() / 1000 }
                    };

                    if (cancionData.colocada) {
                        colocadasList.push(cancionData);
                    } else if (cancionData.descartado) {
                        descartadosList.push(cancionData);
                    } else {
                        cancionesList.push(cancionData);
                    }
                });

                cancionesList.sort((a, b) => b.count - a.count || b.timestamp.seconds - a.timestamp.seconds);
                descartadosList.sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);
                colocadasList.sort((a, b) => (b.colocadaTimestamp?.seconds || 0) - (a.colocadaTimestamp?.seconds || 0));

                setCanciones(cancionesList);
                setDescartados(descartadosList);
                setColocadas(colocadasList);
            });
        };

        fetchEventData();
        const unsubscribe = fetchSongs();
        return () => unsubscribe();
    }, [id, isAuthenticated, router]);

    // Formatear fecha de Firebase
    const formatFirebaseTimestamp = (timestamp) => {
        if (!timestamp || !timestamp.seconds) return "Fecha no disponible";
        const date = new Date(timestamp.seconds * 1000);
        return date.toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
                    <div className="flex flex-col items-center mb-6">
                        <Lock className="h-12 w-12 text-indigo-600 mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900">Acceso al evento</h2>
                        <p className="text-gray-600 mt-2 text-center">
                            Ingresa la contraseña proporcionada por el organizador para ver este evento.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Contraseña
                            </label>
                            <Input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Ingresa la contraseña"
                                className="w-full"
                                onKeyPress={(e) => e.key === 'Enter' && checkPassword()}
                            />
                        </div>

                        <Button
                            onClick={checkPassword}
                            disabled={isLoading}
                            className="w-full"
                        >
                            {isLoading ? (
                                <>
                                    <div className="flex items-center justify-center">
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        <span>Verificando...</span>
                                    </div>
                                </>
                            ) : (
                                "Acceder al evento"
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (!evento) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="flex flex-col items-center">
                    <Disc3 className="h-12 w-12 text-gray-600 animate-spin" />
                    <p className="mt-4 text-gray-700">Cargando evento...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {/* Encabezado del evento */}
                    <div className="bg-indigo-600 px-6 py-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-white">{evento.nombre}</h1>
                                <p className="text-indigo-100 mt-1 flex items-center">
                                    {permission === "edit" ? (
                                        <>
                                            <Edit className="h-4 w-4 mr-1" />
                                            Evento compartido - Permiso de edición
                                        </>
                                    ) : (
                                        <>
                                            <Eye className="h-4 w-4 mr-1" />
                                            Evento compartido - Solo lectura
                                        </>
                                    )}
                                </p>
                            </div>

                            <div className="mt-4 md:mt-0 flex items-center space-x-2">
                                <span className={`px-3 py-1 text-sm font-semibold rounded-full bg-white ${evento.estado === "pendiente" ? "text-yellow-600" :
                                    evento.estado === "en vivo" ? "text-green-600" :
                                        "text-red-600"
                                    }`}>
                                    {evento.estado.toUpperCase()}
                                </span>
                                <span className="px-3 py-1 text-sm font-semibold rounded-full bg-white text-indigo-600">
                                    {canciones.length + colocadas.length + descartados.length} canciones
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Contenido del evento */}
                    <div className="p-6">
                        {/* Filtros */}
                        <div className="flex flex-wrap gap-2 mb-6">
                            <button
                                onClick={() => setMostrarLista("solicitadas")}
                                className={`px-4 py-2 rounded-lg font-medium flex items-center ${mostrarLista === "solicitadas" ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                <Music className="h-4 w-4 mr-2" />
                                Solicitadas ({canciones.length})
                            </button>

                            {colocadas.length > 0 && (
                                <button
                                    onClick={() => setMostrarLista("colocadas")}
                                    className={`px-4 py-2 rounded-lg font-medium flex items-center ${mostrarLista === "colocadas" ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                    <Check className="h-4 w-4 mr-2" />
                                    Colocadas ({colocadas.length})
                                </button>
                            )}

                            {descartados.length > 0 && (
                                <button
                                    onClick={() => setMostrarLista("descartadas")}
                                    className={`px-4 py-2 rounded-lg font-medium flex items-center ${mostrarLista === "descartadas" ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                    <Ban className="h-4 w-4 mr-2" />
                                    Descartadas ({descartados.length})
                                </button>
                            )}
                        </div>

                        {/* Lista de canciones */}
                        <div className="space-y-4">
                            {mostrarLista === "solicitadas" && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {canciones.map((cancion, index) => (
                                        <motion.div
                                            key={cancion.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.2, delay: index * 0.05 }}
                                            className={`bg-gray-50 rounded-lg p-4 border ${index === 0 ? 'border-l-4 border-indigo-500' : 'border-gray-200'}`}
                                        >
                                            <div className="flex items-start">
                                                <img
                                                    src={cancion.albumCover}
                                                    alt={cancion.title}
                                                    className="w-16 h-16 rounded-md object-cover flex-shrink-0"
                                                />
                                                <div className="ml-3 flex-1 min-w-0">
                                                    <h3 className="text-sm font-medium text-gray-900 truncate">{cancion.title}</h3>
                                                    <p className="text-xs text-gray-500 truncate">{cancion.artist}</p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {formatFirebaseTimestamp(cancion.timestamp)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mt-3">
                                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${cancion.count > 5 ? 'bg-green-100 text-green-800' :
                                                    cancion.count > 3 ? 'bg-blue-100 text-blue-800' :
                                                        'bg-indigo-100 text-indigo-800'
                                                    }`}>
                                                    {cancion.count} votos
                                                </span>

                                                {permission === "edit" && (
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => marcarComoColocada(cancion.id)}
                                                            className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-full transition-colors"
                                                            title="Marcar como colocada"
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => descartarCancion(cancion.id)}
                                                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full transition-colors"
                                                            title="Descartar canción"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            {cancion.message && (
                                                <div className="mt-2 bg-gray-100 p-2 rounded-md text-sm text-gray-700 flex items-center">
                                                    <MessageSquareDot className="h-4 w-4 mr-1" />
                                                    {cancion.message}
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                            {mostrarLista === "colocadas" && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {colocadas.map((cancion) => (
                                        <motion.div
                                            key={cancion.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="bg-gray-50 rounded-lg p-4 border-l-4 border-green-500 border"
                                        >
                                            <div className="flex items-start">
                                                <img
                                                    src={cancion.albumCover}
                                                    alt={cancion.title}
                                                    className="w-16 h-16 rounded-md object-cover flex-shrink-0"
                                                />
                                                <div className="ml-3 flex-1 min-w-0">
                                                    <h3 className="text-sm font-medium text-gray-900 truncate">{cancion.title}</h3>
                                                    <p className="text-xs text-gray-500 truncate">{cancion.artist}</p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        Colocada: {formatFirebaseTimestamp(cancion.colocadaTimestamp)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mt-3">
                                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${cancion.count > 5 ? 'bg-green-100 text-green-800' :
                                                    cancion.count > 3 ? 'bg-blue-100 text-blue-800' :
                                                        'bg-indigo-100 text-indigo-800'
                                                    }`}>
                                                    {cancion.count} votos
                                                </span>
                                            </div>
                                            {permission === "edit" && (
                                                <button
                                                    onClick={() => desmarcarComoColocada(cancion.id)}
                                                    className="flex items-center text-sm text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 px-3 py-1 rounded-full transition-colors"
                                                >
                                                    <RotateCcw className="h-4 w-4 mr-1" />
                                                    Desmarcar
                                                </button>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                            {mostrarLista === "descartadas" && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {descartados.map((cancion) => (
                                        <motion.div
                                            key={cancion.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="bg-gray-50 rounded-lg p-4 border-l-4 border-red-500 border"
                                        >
                                            <div className="flex items-start">
                                                <img
                                                    src={cancion.albumCover}
                                                    alt={cancion.title}
                                                    className="w-16 h-16 rounded-md object-cover flex-shrink-0"
                                                />
                                                <div className="ml-3 flex-1 min-w-0">
                                                    <h3 className="text-sm font-medium text-gray-900 truncate">{cancion.title}</h3>
                                                    <p className="text-xs text-gray-500 truncate">{cancion.artist}</p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        Descartada: {formatFirebaseTimestamp(cancion.descartadoTimestamp)}
                                                    </p>
                                                </div>
                                                {permission === "edit" && (
                                                    <button
                                                        onClick={() => restaurarCancion(cancion.id)}
                                                        className="flex items-center text-sm text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-3 py-1 rounded-full transition-colors"
                                                    >
                                                        <RotateCcw className="h-4 w-4 mr-1" />
                                                        Restaurar
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                            {/* Mensajes cuando no hay canciones */}
                            {mostrarLista === "solicitadas" && canciones.length === 0 && (
                                <div className="text-center py-8">
                                    <Music className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No hay canciones solicitadas</h3>
                                    <p className="mt-1 text-sm text-gray-500">Todavía no se han solicitado canciones para este evento.</p>
                                </div>
                            )}

                            {mostrarLista === "colocadas" && colocadas.length === 0 && (
                                <div className="text-center py-8">
                                    <Check className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No hay canciones colocadas</h3>
                                    <p className="mt-1 text-sm text-gray-500">Todavía no se han marcado canciones como ya colocadas.</p>
                                </div>
                            )}

                            {mostrarLista === "descartadas" && descartados.length === 0 && (
                                <div className="text-center py-8">
                                    <Ban className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No hay canciones descartadas</h3>
                                    <p className="mt-1 text-sm text-gray-500">Todavía no se han descartado canciones para este evento.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}