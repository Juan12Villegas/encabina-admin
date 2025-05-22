import { useEffect, useState, useCallback } from 'react';
import { db } from '@/../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Music2, Flame, TrendingUp, Clock, Trophy, Album, Search } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import UbigeoSelector from '@/components/UbigeoSelector';

const CancionesSolicitadasGeneral = ({ userId, darkMode = false, maxItems = 10 }) => {
    const [canciones, setCanciones] = useState([]);
    const [allCanciones, setAllCanciones] = useState([]);
    const [cancionesTotales, setCancionesTotales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState('count');
    const [error, setError] = useState(null);
    const [eventosCulminados, setEventosCulminados] = useState([]);
    const [filtroUbicacion, setFiltroUbicacion] = useState({
        pais: '',
        departamento: '',
        provincia: '',
        distrito: ''
    });
    const [viewMode, setViewMode] = useState('event');

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
                const eventosData = eventosSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setEventosCulminados(eventosData.map(e => e.id));

                console.log("eventos: ", eventosData);

                if (eventosData.length === 0) {
                    setLoading(false);
                    return;
                }

                // 2. Obtener todas las solicitudes de estos eventos
                const eventosIds = eventosData.map(evento => evento.id);
                console.log("ID EVENTOS: " + eventosIds);
                const solicitudesQuery = query(
                    collection(db, "event_requests"),
                    where("eventId", "in", eventosIds)
                );

                const querySnapshot = await getDocs(solicitudesQuery);
                const cancionesData = [];
                const cancionesAcumuladas = {};

                // Crear un mapa de eventos para fácil acceso
                const eventosMap = {};
                eventosData.forEach(evento => {
                    eventosMap[evento.id] = evento;
                });

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    const evento = eventosMap[data.eventId] || {};

                    // Datos para la vista por evento
                    const cancionEvento = {
                        id: doc.id,
                        title: data.title,
                        artist: data.artist || 'Artista desconocido',
                        count: data.count || 1,
                        timestamp: data.timestamp?.toDate() || new Date(),
                        albumCover: data.albumCover || '/default-album.png',
                        eventId: data.eventId,
                        pais: evento.pais,
                        departamento: evento.departamento,
                        provincia: evento.provincia,
                        distrito: evento.distrito,
                        direccion: evento.direccion,
                        lugar: evento.lugar
                    };

                    cancionesData.push(cancionEvento);

                    // Acumular datos para la vista total
                    const claveCancion = `${data.title.toLowerCase()}_${(data.artist || '').toLowerCase()}`;
                    if (cancionesAcumuladas[claveCancion]) {
                        cancionesAcumuladas[claveCancion].count += data.count || 1;
                        cancionesAcumuladas[claveCancion].eventos.push(data.eventId);
                        if (cancionesAcumuladas[claveCancion].ubicaciones) {
                            cancionesAcumuladas[claveCancion].ubicaciones.push({
                                pais: evento.pais,
                                departamento: evento.departamento,
                                provincia: evento.provincia,
                                distrito: evento.distrito
                            });
                        }
                        if (data.timestamp?.toDate() > cancionesAcumuladas[claveCancion].timestamp) {
                            cancionesAcumuladas[claveCancion].timestamp = data.timestamp.toDate();
                        }
                    } else {
                        cancionesAcumuladas[claveCancion] = {
                            id: doc.id,
                            title: data.title,
                            artist: data.artist || 'Artista desconocido',
                            count: data.count || 1,
                            timestamp: data.timestamp?.toDate() || new Date(),
                            albumCover: data.albumCover || '/default-album.png',
                            eventos: [data.eventId],
                            ubicaciones: [{
                                pais: evento.pais,
                                departamento: evento.departamento,
                                provincia: evento.provincia,
                                distrito: evento.distrito
                            }]
                        };
                    }
                });

                console.log("data de canciones: ", cancionesData);
                console.log("canciones acumuladas: ", cancionesAcumuladas);

                // Convertir el objeto de canciones acumuladas a array y ordenar
                const cancionesTotalesArray = Object.values(cancionesAcumuladas)
                    .map(cancion => ({
                        ...cancion,
                        eventosCount: cancion.eventos.length,
                        // Para mantener compatibilidad con el filtrado
                        pais: cancion.ubicaciones[0].pais,
                        departamento: cancion.ubicaciones[0].departamento,
                        provincia: cancion.ubicaciones[0].provincia,
                        distrito: cancion.ubicaciones[0].distrito
                    }))
                    .sort((a, b) => b.count - a.count);

                setCancionesTotales(cancionesTotalesArray);
                setAllCanciones(cancionesData);
                setCanciones(cancionesData);
                setLoading(false);

            } catch (err) {
                console.error("Error al obtener datos:", err);
                setError("Error al cargar el historial de canciones");
                setLoading(false);
            }
        };

        obtenerDatos();
    }, [userId]);

    const handleLocationChange = useCallback((ubicacion) => {
        const { pais, departamento, provincia, distrito } = ubicacion;
        setFiltroUbicacion({
            pais: pais || '',
            departamento: departamento || '',
            provincia: provincia || '',
            distrito: distrito || ''
        });
    }, []);

    // Función para verificar si una canción coincide con el filtro de ubicación
    const matchesLocationFilter = (cancion) => {
        const { pais, departamento, provincia, distrito } = filtroUbicacion;

        // Si no hay filtros aplicados, mostrar todas las canciones
        if (!pais && !departamento && !provincia && !distrito) return true;

        // Verificar cada campo individualmente
        const paisMatch = !pais || (cancion.pais && cancion.pais.toLowerCase() === pais.toLowerCase());
        const departamentoMatch = !departamento || (cancion.departamento && cancion.departamento.toLowerCase() === departamento.toLowerCase());
        const provinciaMatch = !provincia || (cancion.provincia && cancion.provincia.toLowerCase() === provincia.toLowerCase());
        const distritoMatch = !distrito || (cancion.distrito && cancion.distrito.toLowerCase() === distrito.toLowerCase());

        return paisMatch && departamentoMatch && provinciaMatch && distritoMatch;
    };

    // useEffect para manejar el filtrado y ordenamiento
    useEffect(() => {
        const baseCanciones = viewMode === 'event' ? allCanciones : cancionesTotales;

        const aplicarFiltros = () => {
            // 1. Aplicar filtro de ubicación
            let cancionesFiltradas = baseCanciones.filter(matchesLocationFilter);

            // 2. Aplicar ordenamiento
            return [...cancionesFiltradas].sort((a, b) => {
                return sortBy === 'count' ? b.count - a.count : b.timestamp - a.timestamp;
            });
        };

        setCanciones(aplicarFiltros());
    }, [sortBy, viewMode, allCanciones, cancionesTotales, filtroUbicacion]);

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Generar texto de ubicación para mostrar
    const getUbicacionText = () => {
        const { pais, departamento, provincia, distrito } = filtroUbicacion;
        const partes = [];

        if (pais) partes.push(pais);
        if (departamento) partes.push(departamento);
        if (provincia) partes.push(provincia);
        if (distrito) partes.push(distrito);

        return partes.join(', ');
    };

    return (
        <div className="">
            <UbigeoSelector onLocationChange={handleLocationChange} />
            <div className="flex gap-2 justify-between items-center mb-6">
                <div>
                    <h3 className="text-2xl font-bold flex items-center gap-2">
                        <Trophy className="w-6 h-6 hidden lg:block" />
                        <span>Historial Musical</span>
                    </h3>
                    <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {viewMode === 'event' ?
                            'Canciones más solicitadas en tus eventos' :
                            'Total de solicitudes de canciones en todos tus eventos'}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setViewMode(viewMode === 'event' ? 'total' : 'event')}
                        className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {viewMode === 'event' ? (
                            <>
                                <TrendingUp className="w-4 h-4" />
                                <span>Ver total</span>
                            </>
                        ) : (
                            <>
                                <Album className="w-4 h-4" />
                                <span>Ver por evento</span>
                            </>
                        )}
                    </button>
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

            {/* Mostrar filtros aplicados */}
            {filtroUbicacion.pais && (
                <div className={`p-3 rounded-lg mb-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <p className="text-sm font-medium">
                        Filtrado por ubicación: <span className="font-bold">{getUbicacionText()}</span>
                    </p>
                </div>
            )}

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
                    <p className="font-medium">No hay canciones encontradas</p>
                    <p className="text-sm mt-1">Intenta con otros filtros de ubicación</p>
                </div>
            ) : (
                <>
                    <div className='flex flex-wrap gap-2 justify-between items-center mb-4'>
                        <div className={`p-3 rounded-lg mb-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <p className="text-sm font-medium">
                                {viewMode === 'event' ? (
                                    <>
                                        Mostrando datos de <span className="font-bold">{eventosCulminados.length}</span> evento{eventosCulminados.length !== 1 ? 's' : ''} culminado{eventosCulminados.length !== 1 ? 's' : ''}
                                        {filtroUbicacion.pais && (
                                            <span> en <span className="font-bold">{getUbicacionText()}</span></span>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        Mostrando total acumulado de <span className="font-bold">{cancionesTotales.length}</span> canción{cancionesTotales.length !== 1 ? 'es' : ''} únicas
                                        {filtroUbicacion.pais && (
                                            <span> en <span className="font-bold">{getUbicacionText()}</span></span>
                                        )}
                                    </>
                                )}
                            </p>
                        </div>
                    </div>

                    <ul className="space-y-3">
                        <AnimatePresence>
                            {canciones.map((cancion, index) => (
                                <motion.li
                                    key={`${cancion.id}-${index}-${viewMode}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'} transition-colors border ${darkMode ? 'border-gray-600' : 'border-gray-200'
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="relative flex-shrink-0 hidden md:block">
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
                                                {viewMode === 'event' ? (
                                                    <>
                                                        {sortBy === 'recent' && (
                                                            <span className={`text-xs px-2 py-1 rounded-full ${darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                                                                }`}>
                                                                {formatDate(cancion.timestamp)}
                                                            </span>
                                                        )}
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className={`text-xs px-2 py-1 rounded-full ${darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                                                            }`}>
                                                            {cancion.eventosCount} evento{cancion.eventosCount !== 1 ? 's' : ''}
                                                        </span>
                                                        {sortBy === 'recent' && (
                                                            <span className={`text-xs px-2 py-1 rounded-full ${darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                                                                }`}>
                                                                Última: {formatDate(cancion.timestamp)}
                                                            </span>
                                                        )}
                                                    </>
                                                )}

                                                {cancion.pais && (
                                                    <div className='flex gap-2 flex-wrap'>
                                                        {cancion.eventId && (
                                                            <a href={`eventos/view/${cancion.eventId}`} className={`text-xs px-2 py-1 truncate rounded-full ${darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                                                                }`}>
                                                                {[cancion.eventId || " "].filter(Boolean).join(', ')}
                                                            </a>
                                                        )}
                                                        <span className={`text-xs px-2 py-1 rounded-full ${darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                                                            }`}>
                                                            {[cancion.pais || " ", cancion.departamento || " ", cancion.provincia || " ", cancion.distrito || " "].filter(Boolean).join(', ')}
                                                        </span>
                                                        {cancion.direccion && (
                                                            <span className={`text-xs px-2 py-1 truncate rounded-full ${darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                                                                }`}>
                                                                {[cancion.direccion || " "].filter(Boolean).join(', ')}
                                                            </span>
                                                        )}
                                                        {cancion.lugar && (
                                                            <span className={`text-xs px-2 py-1 truncate rounded-full ${darkMode ? 'bg-gray-600 text-gray-500' : 'bg-gray-500 text-white font-semibold'
                                                                }`}>
                                                                {[cancion.lugar || " "].filter(Boolean).join(', ')}
                                                            </span>
                                                        )}
                                                    </div>
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
                                                    <span className="text-xs mt-1">{viewMode === 'event' ? 'última' : 'último'}</span>
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