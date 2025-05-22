import { useEffect, useState } from 'react';
import { db } from '@/../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Globe, Flag, ChevronDown, ChevronUp, TrendingUp, Calendar } from 'lucide-react';

const UbicacionesEventos = ({ userId, darkMode = false }) => {
    const [ubicaciones, setUbicaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedProvince, setExpandedProvince] = useState(null);
    const [sortBy, setSortBy] = useState('count'); // 'count' o 'name'

    useEffect(() => {
        const obtenerUbicaciones = async () => {
            try {
                setLoading(true);

                // Consulta para obtener solo los eventos del usuario completados
                const eventosQuery = query(
                    collection(db, "eventos"),
                    where("djId", "==", userId)
                    /* where("estado", "==", "culminado") */
                );

                const querySnapshot = await getDocs(eventosQuery);
                const eventosData = [];

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data.provincia) {
                        eventosData.push({
                            provincia: data.provincia,
                            ciudad: data.distrito || 'Distrito no especificado',
                            nombreEvento: data.nombre || `Evento ${doc.id.slice(0, 5)}`,
                            lugar: data.lugar || 'Lugar no especificado',
                            fecha: data.fecha?.toDate() || new Date(),
                            id: doc.id
                        });
                    }
                });

                if (eventosData.length === 0) {
                    setUbicaciones([]);
                    setLoading(false);
                    return;
                }

                // Agrupar por provincia
                const provinciasAgrupadas = eventosData.reduce((acc, evento) => {
                    if (!acc[evento.provincia]) {
                        acc[evento.provincia] = {
                            count: 0,
                            ciudades: {},
                            eventos: []
                        };
                    }

                    acc[evento.provincia].count += 1;

                    // Agrupar por ciudad
                    if (!acc[evento.provincia].ciudades[evento.ciudad]) {
                        acc[evento.provincia].ciudades[evento.ciudad] = 0;
                    }
                    acc[evento.provincia].ciudades[evento.ciudad] += 1;

                    // Guardar eventos para el detalle
                    acc[evento.provincia].eventos.push(evento);

                    return acc;
                }, {});

                // Convertir a array y ordenar
                let ubicacionesOrdenadas = Object.entries(provinciasAgrupadas)
                    .map(([provincia, data]) => ({
                        provincia,
                        count: data.count,
                        ciudades: Object.entries(data.ciudades)
                            .map(([ciudad, count]) => ({ ciudad, count }))
                            .sort((a, b) => b.count - a.count),
                        eventos: data.eventos
                            .sort((a, b) => b.fecha - a.fecha)
                    }));

                // Aplicar ordenamiento
                if (sortBy === 'count') {
                    ubicacionesOrdenadas = ubicacionesOrdenadas.sort((a, b) => b.count - a.count);
                } else {
                    ubicacionesOrdenadas = ubicacionesOrdenadas.sort((a, b) =>
                        a.provincia.localeCompare(b.provincia)
                    );
                }

                setUbicaciones(ubicacionesOrdenadas);
            } catch (err) {
                console.error("Error al obtener ubicaciones:", err);
                setError("Error al cargar las ubicaciones de eventos");
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            obtenerUbicaciones();
        }
    }, [userId, sortBy]);

    const formatFecha = (fecha) => {
        return fecha.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const toggleExpandProvince = (provincia) => {
        setExpandedProvince(expandedProvince === provincia ? null : provincia);
    };

    return (
        <div>
            <div className="flex gap-2 justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        <span>Ubicaciones de Eventos</span>
                    </h3>
                    <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Distribución geográfica de tus eventos
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-2">
                    <button
                        onClick={() => setSortBy('count')}
                        className={`px-3 py-1 rounded-full text-xs flex items-center gap-1 ${sortBy === 'count' ?
                            (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800') :
                            (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600')
                            }`}
                    >
                        <TrendingUp className="w-4 h-4" />
                        <span>Por cantidad</span>
                    </button>
                    <button
                        onClick={() => setSortBy('name')}
                        className={`px-3 py-1 rounded-full text-xs flex items-center gap-1 ${sortBy === 'name' ?
                            (darkMode ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800') :
                            (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600')
                            }`}
                    >
                        <Globe className="w-4 h-4" />
                        <span>Por nombre</span>
                    </button>
                </div>
            </div>

            {error && (
                <div className={`p-3 rounded-lg mb-4 ${darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'}`}>
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : ubicaciones.length === 0 ? (
                <div className={`p-4 rounded-lg text-center ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                    <Globe className="w-8 h-8 mx-auto mb-2" />
                    <p>No hay eventos con ubicación registrada</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <p className="text-sm font-medium">
                            {ubicaciones.length} provincia{ubicaciones.length !== 1 ? 's' : ''} •
                            {' '}{ubicaciones.reduce((sum, u) => sum + u.count, 0)} eventos
                        </p>
                    </div>

                    <ul className="space-y-3">
                        <AnimatePresence>
                            {ubicaciones.map((ubicacion) => (
                                <motion.li
                                    key={ubicacion.provincia}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className={`rounded-lg overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-50'
                                        }`}
                                >
                                    <button
                                        onClick={() => toggleExpandProvince(ubicacion.provincia)}
                                        className={`w-full p-4 flex justify-between items-center ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                                            } transition-colors`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Flag className="w-5 h-5 flex-shrink-0" />
                                            <div className="text-left">
                                                <h4 className="font-medium">{ubicacion.provincia}</h4>
                                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    {ubicacion.count} evento{ubicacion.count !== 1 ? 's' : ''} •
                                                    {' '}{ubicacion.ciudades.length} distrito{ubicacion.ciudades.length !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                        </div>
                                        {expandedProvince === ubicacion.provincia ? (
                                            <ChevronUp className="w-5 h-5" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5" />
                                        )}
                                    </button>

                                    <AnimatePresence>
                                        {expandedProvince === ubicacion.provincia && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className={`${darkMode ? 'bg-gray-600' : 'bg-gray-100'}`}
                                            >
                                                <div className="p-4 pt-2 space-y-4">
                                                    <div>
                                                        <h5 className="font-medium mb-2 flex items-center gap-2">
                                                            <MapPin className="w-4 h-4" />
                                                            <span>Distritos</span>
                                                        </h5>
                                                        <div className="flex flex-wrap gap-2">
                                                            {ubicacion.ciudades.map((ciudad, index) => (
                                                                <span
                                                                    key={index}
                                                                    className={`px-3 py-1 rounded-full text-sm ${darkMode ? 'bg-gray-500 text-white' : 'bg-gray-200 text-gray-800'
                                                                        }`}
                                                                >
                                                                    {ciudad.ciudad} ({ciudad.count})
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <h5 className="font-medium mb-2 flex items-center gap-2">
                                                            <Calendar className="w-4 h-4" />
                                                            <span>Últimos eventos</span>
                                                        </h5>
                                                        <ul className="space-y-2">
                                                            {ubicacion.eventos.map((evento) => (
                                                                <li
                                                                    key={evento.id}
                                                                    className={`text-sm p-2 rounded ${darkMode ? 'bg-gray-500' : 'bg-gray-200'
                                                                        }`}
                                                                >
                                                                    <p className="font-medium">{evento.nombreEvento}</p>
                                                                    <p className="font-medium">{evento.lugar}</p>
                                                                    <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                                        {evento.ciudad} • {formatFecha(evento.fecha)}
                                                                    </p>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.li>
                            ))}
                        </AnimatePresence>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default UbicacionesEventos;