import { useEffect, useState } from 'react';
import { db } from '@/../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, BarChart2, Calendar } from 'lucide-react';

const EventosPorHora = ({ userId, darkMode = false }) => {
    const [eventos, setEventos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeRange, setTimeRange] = useState('all'); // 'all', 'morning', 'afternoon', 'night'

    useEffect(() => {
        const obtenerEventos = async () => {
            try {
                setLoading(true);

                // Consulta para obtener solo los eventos del usuario
                const eventosQuery = query(
                    collection(db, "eventos"),
                    where("djId", "==", userId),
                    where("estado", "==", "culminado")
                );

                const querySnapshot = await getDocs(eventosQuery);
                const eventosData = [];

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data.horaInicio) {
                        const horaInicio = new Date(data.horaInicio.seconds * 1000);
                        eventosData.push({
                            hora: horaInicio.getHours(),
                            fecha: horaInicio,
                            id: doc.id,
                            nombre: data.nombreEvento || `Evento ${doc.id.slice(0, 5)}`
                        });
                    }
                });

                if (eventosData.length === 0) {
                    setEventos([]);
                    setLoading(false);
                    return;
                }

                // Filtrar por rango horario seleccionado
                let eventosFiltrados = eventosData;
                if (timeRange === 'morning') {
                    eventosFiltrados = eventosData.filter(e => e.hora >= 6 && e.hora < 12);
                } else if (timeRange === 'afternoon') {
                    eventosFiltrados = eventosData.filter(e => e.hora >= 12 && e.hora < 18);
                } else if (timeRange === 'night') {
                    eventosFiltrados = eventosData.filter(e => e.hora >= 18 || e.hora < 6);
                }

                // Agrupar por hora y contar
                const eventosAgrupados = eventosFiltrados.reduce((acc, evento) => {
                    acc[evento.hora] = (acc[evento.hora] || { count: 0, eventos: [] });
                    acc[evento.hora].count += 1;
                    acc[evento.hora].eventos.push(evento);
                    return acc;
                }, {});

                // Convertir a array y ordenar
                const eventosPorHora = Object.entries(eventosAgrupados)
                    .map(([hora, data]) => ({
                        hora: parseInt(hora),
                        count: data.count,
                        eventos: data.eventos
                    }))
                    .sort((a, b) => a.hora - b.hora);

                setEventos(eventosPorHora);
            } catch (err) {
                console.error("Error al obtener eventos:", err);
                setError("Error al cargar los eventos");
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            obtenerEventos();
        }
    }, [userId, timeRange]);

    const formatHora = (hora) => {
        return new Date(0, 0, 0, hora).toLocaleTimeString([], { hour: '2-digit', hour12: true });
    };

    const getTimeRangeLabel = () => {
        switch (timeRange) {
            case 'morning': return 'Mañana (6am-12pm)';
            case 'afternoon': return 'Tarde (12pm-6pm)';
            case 'night': return 'Noche (6pm-6am)';
            default: return 'Todas las horas';
        }
    };

    return (
        <div>
            <div className="flex gap-2 justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        <span>Eventos por Hora</span>
                    </h3>
                    <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Distribución horaria de tus eventos
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setTimeRange('all')}
                        className={`px-3 py-1 rounded-full text-xs ${timeRange === 'all' ?
                            (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800') :
                            (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600')}`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setTimeRange('morning')}
                        className={`px-3 py-1 rounded-full text-xs ${timeRange === 'morning' ?
                            (darkMode ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-800') :
                            (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600')}`}
                    >
                        Mañana
                    </button>
                    <button
                        onClick={() => setTimeRange('afternoon')}
                        className={`px-3 py-1 rounded-full text-xs ${timeRange === 'afternoon' ?
                            (darkMode ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-800') :
                            (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600')}`}
                    >
                        Tarde
                    </button>
                    <button
                        onClick={() => setTimeRange('night')}
                        className={`px-3 py-1 rounded-full text-xs ${timeRange === 'night' ?
                            (darkMode ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-800') :
                            (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600')}`}
                    >
                        Noche
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
            ) : eventos.length === 0 ? (
                <div className={`p-4 rounded-lg text-center ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                    No hay eventos en este rango horario
                </div>
            ) : (
                <div className="space-y-4">
                    <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <p className="text-sm font-medium">
                            {getTimeRangeLabel()} • {eventos.reduce((sum, e) => sum + e.count, 0)} eventos
                        </p>
                    </div>

                    <div className="space-y-6">
                        {eventos.map((evento) => (
                            <div key={evento.hora} className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-medium flex items-center gap-2">
                                        <span className={`w-3 h-3 rounded-full ${evento.hora >= 6 && evento.hora < 12 ?
                                            darkMode ? 'bg-yellow-500' : 'bg-yellow-400' :
                                            evento.hora >= 12 && evento.hora < 18 ?
                                                darkMode ? 'bg-orange-500' : 'bg-orange-400' :
                                                darkMode ? 'bg-purple-500' : 'bg-purple-400'
                                            }`}></span>
                                        {formatHora(evento.hora)}
                                    </h4>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'
                                        }`}>
                                        {evento.count} evento{evento.count !== 1 ? 's' : ''}
                                    </span>
                                </div>

                                <div className={`w-full h-3 rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                    }`}>
                                    <div
                                        className={`h-full ${evento.hora >= 6 && evento.hora < 12 ?
                                            darkMode ? 'bg-yellow-600' : 'bg-yellow-400' :
                                            evento.hora >= 12 && evento.hora < 18 ?
                                                darkMode ? 'bg-orange-600' : 'bg-orange-400' :
                                                darkMode ? 'bg-purple-600' : 'bg-purple-400'
                                            }`}
                                        /* style={{ width: `${(evento.count / Math.max(...eventos.map(e => e.count)) * 100}%`}} */></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventosPorHora;