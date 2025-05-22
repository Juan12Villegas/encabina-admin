import { useEffect, useState } from 'react';
import { db } from '@/../lib/firebase';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { Music2, Flame, TrendingUp, Clock, Trophy, Album } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';

const CancionesSolicitadasGeneral = ({ userId, darkMode = false, maxItems = 10 }) => {
    const [canciones, setCanciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState('count'); // 'count' o 'recent'
    const [error, setError] = useState(null);
    const [eventosCulminados, setEventosCulminados] = useState([]);

    useEffect(() => {
        setLoading(true);

        const obtenerDatos = async () => {
            console.log("ID: " + userId);
            try {
                // 1. Obtener todos los eventos culminados del usuario
                const eventosQuery = query(
                    collection(db, "eventos"),
                    where("djId", "==", userId),
                    where("estado", "==", "culminado")
                );

                const eventosSnapshot = await getDocs(eventosQuery);
                const eventosIds = eventosSnapshot.docs.map(doc => doc.id);

                console.log("eventos: " + eventosIds);
                setEventosCulminados(eventosIds);

                if (eventosIds.length === 0) {
                    setLoading(false);
                    return;
                }

                // 2. Obtener todas las solicitudes de estos eventos
                const solicitudesQuery = query(
                    collection(db, "event_requests"),
                    where("eventId", "in", eventosIds),
                    sortBy === 'count'
                        ? orderBy("count", "desc")
                        : orderBy("timestamp", "desc"),
                    limit(maxItems)
                );

                const querySnapshot = await getDocs(solicitudesQuery);
                const cancionesData = [];

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    cancionesData.push({
                        id: doc.id,
                        title: data.title,
                        artist: data.artist || 'Artista desconocido',
                        count: data.count || 1,
                        timestamp: data.timestamp?.toDate() || new Date(),
                        albumCover: data.albumCover || '/default-album.png',
                        eventId: data.eventId
                    });
                });

                // Procesamiento de datos
                let cancionesProcesadas;

                if (sortBy === 'count') {
                    // Agrupar por canción y sumar counts
                    const cancionesAgrupadas = cancionesData.reduce((acc, cancion) => {
                        const existente = acc.find(c =>
                            c.title === cancion.title &&
                            c.artist === cancion.artist
                        );

                        if (existente) {
                            existente.count += cancion.count;
                            // Mantener el timestamp más reciente
                            if (cancion.timestamp > existente.timestamp) {
                                existente.timestamp = cancion.timestamp;
                            }
                        } else {
                            acc.push({ ...cancion });
                        }
                        return acc;
                    }, []);

                    cancionesProcesadas = cancionesAgrupadas
                        .sort((a, b) => b.count - a.count)
                        .slice(0, maxItems);
                } else {
                    cancionesProcesadas = cancionesData
                        .sort((a, b) => b.timestamp - a.timestamp)
                        .slice(0, maxItems);
                }

                setCanciones(cancionesProcesadas);
                setLoading(false);

            } catch (err) {
                console.error("Error al obtener datos:", err);
                setError("Error al cargar el historial de canciones");
                setLoading(false);
            }
        };

        obtenerDatos();
    }, [userId, sortBy, maxItems]);

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getEventoNombre = (eventId) => {
        // En una implementación real, podrías tener un mapa de nombres de eventos
        /* return `Evento ${eventId.slice(0, 4)}...`; */
        return (
            <a href={`/user/eventos/view/${eventId}`}>
                Evento {eventId.slice(0, 4)}...
            </a>


        )
    };

    return (
        <div className={`p-6 rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-2xl font-bold flex items-center gap-2">
                        <Trophy className="w-6 h-6" />
                        <span>Historial Musical</span>
                    </h3>
                    <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Canciones más solicitadas en todos tus eventos
                    </p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setSortBy('count')}
                        className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${sortBy === 'count'
                            ? (darkMode ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-800')
                            : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600')
                            }`}
                    >
                        <Flame className="w-4 h-4" />
                        <span>Top</span>
                    </button>
                    <button
                        onClick={() => setSortBy('recent')}
                        className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${sortBy === 'recent'
                            ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800')
                            : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600')
                            }`}
                    >
                        <Clock className="w-4 h-4" />
                        <span>Recientes</span>
                    </button>
                </div>
            </div>

            {error && (
                <div className={`p-3 rounded-lg mb-4 ${darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'}`}>
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div>
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Analizando tus eventos...</p>
                </div>
            ) : eventosCulminados.length === 0 ? (
                <div className={`p-6 text-center rounded-lg ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                    <Album className="w-10 h-10 mx-auto mb-3" />
                    <p className="font-medium">No hay eventos culminados</p>
                    <p className="text-sm mt-1">Tus estadísticas aparecerán cuando tengas eventos completados</p>
                </div>
            ) : canciones.length === 0 ? (
                <div className={`p-6 text-center rounded-lg ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                    <Music2 className="w-10 h-10 mx-auto mb-3" />
                    <p className="font-medium">No hay canciones solicitadas</p>
                    <p className="text-sm mt-1">Las canciones que solicites aparecerán aquí</p>
                </div>
            ) : (
                <>
                    <div className={`p-3 rounded-lg mb-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <p className="text-sm font-medium">
                            Mostrando datos de <span className="font-bold">{eventosCulminados.length}</span> evento{eventosCulminados.length !== 1 ? 's' : ''} culminado{eventosCulminados.length !== 1 ? 's' : ''}
                        </p>
                    </div>

                    <ul className="space-y-3">
                        <AnimatePresence>
                            {canciones.map((cancion, index) => (
                                <motion.li
                                    key={`${cancion.id}-${index}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'} transition-colors border ${darkMode ? 'border-gray-600' : 'border-gray-200'
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="relative flex-shrink-0">
                                            <img
                                                src={cancion.albumCover}
                                                alt={cancion.title}
                                                className="w-14 h-14 rounded-lg object-cover shadow"
                                                onError={(e) => {
                                                    e.target.src = '/default-album.png';
                                                }}
                                            />
                                            {sortBy === 'count' && index < 3 && (
                                                <div className={`absolute -top-2 -right-2 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold ${darkMode ? 'bg-yellow-500 text-gray-900' : 'bg-yellow-400 text-white'
                                                    }`}>
                                                    {index + 1}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold truncate">{cancion.title}</p>
                                            <p className={`text-sm truncate ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {cancion.artist}
                                            </p>

                                            <div className="mt-2 flex flex-wrap gap-2">
                                                <span className={`text-xs px-2 py-1 rounded-full ${darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                                                    }`}>
                                                    {getEventoNombre(cancion.eventId)}
                                                </span>

                                                {sortBy === 'recent' && (
                                                    <span className={`text-xs px-2 py-1 rounded-full ${darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                                                        }`}>
                                                        {formatDate(cancion.timestamp)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className={`flex flex-col items-center justify-center px-3 py-1 rounded-lg ${darkMode ? 'bg-gray-600' : 'bg-gray-200'
                                            }`}>
                                            {sortBy === 'count' ? (
                                                <>
                                                    <TrendingUp className="w-5 h-5" />
                                                    <span className="font-bold mt-1">{cancion.count}</span>
                                                    <span className="text-xs">solicitudes</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Clock className="w-5 h-5" />
                                                    <span className="text-xs mt-1">última</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </motion.li>
                            ))}
                        </AnimatePresence>
                    </ul>
                </>
            )}
        </div>
    );
};

export default CancionesSolicitadasGeneral;