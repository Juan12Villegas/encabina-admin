"use client";
import { useState, useEffect } from "react";
import { db, auth, collection, query, where, getDocs } from "@/../lib/firebase";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CalendarDays, Clock, MapPin, TrendingUp } from "lucide-react";

export default function EventStats() {
    const [stats, setStats] = useState({
        totalEvents: 0,
        todayEvents: 0,
        upcomingEvents: 0,
        completedEvents: 0,
        byStatus: [],
        byLocation: []
    });
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('week'); // week, month, year

    useEffect(() => {
        const fetchEventStats = async () => {
            const user = auth.currentUser;
            if (!user) return;

            try {
                const eventsRef = collection(db, "eventos");
                const q = query(eventsRef, where("djId", "==", user.uid));
                const querySnapshot = await getDocs(q);

                const now = new Date();
                const todayStart = new Date(now);
                todayStart.setHours(0, 0, 0, 0);

                const todayEnd = new Date(now);
                todayEnd.setHours(23, 59, 59, 999);

                const eventsData = [];
                let todayCount = 0;
                let upcomingCount = 0;
                let completedCount = 0;
                const statusCount = {
                    'pendiente': 0,
                    'en vivo': 0,
                    'culminado': 0,
                    'cancelado': 0
                };
                const locationCount = {};

                querySnapshot.forEach((doc) => {
                    const event = doc.data();
                    eventsData.push(event);

                    // Obtener la fecha del evento (manejar tanto timestamp como Date)
                    let eventDate;
                    if (event.horaInicio && typeof event.horaInicio.toDate === 'function') {
                        eventDate = event.horaInicio.toDate();
                    } else if (event.fecha && typeof event.fecha.toDate === 'function') {
                        eventDate = event.fecha.toDate();
                    } else {
                        // Si no hay fecha válida, saltar este evento
                        return;
                    }

                    console.log("EVENT DATE: " + eventDate);
                    console.log("NOW: " + now);

                    // Contar eventos de hoy
                    if (eventDate >= todayStart && eventDate <= todayEnd) {
                        todayCount++;
                    }

                    // Contar eventos futuros
                    if (eventDate > now) {
                        console.log(now)
                        upcomingCount++;
                    } else if (eventDate < now) {
                        completedCount++;
                    }

                    // Contar por estado
                    if (event.estado) {
                        statusCount[event.estado] = (statusCount[event.estado] || 0) + 1;
                    }

                    // Contar por ubicación
                    if (event.lugar) {
                        locationCount[event.lugar] = (locationCount[event.lugar] || 0) + 1;
                    }
                });

                // Preparar datos para gráficos
                const statusData = Object.keys(statusCount).map(key => ({
                    name: key,
                    count: statusCount[key]
                }));

                const locationData = Object.keys(locationCount).map(key => ({
                    name: key,
                    count: locationCount[key]
                })).sort((a, b) => b.count - a.count).slice(0, 5);

                setStats({
                    totalEvents: eventsData.length,
                    todayEvents: todayCount,
                    upcomingEvents: upcomingCount,
                    completedEvents: completedCount,
                    byStatus: statusData,
                    byLocation: locationData
                });

            } catch (error) {
                console.error("Error fetching event stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEventStats();
    }, [timeRange]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm p-6 w-full">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800">Estadísticas de Eventos</h3>
                {/* <div className="flex space-x-2">
                    <button
                        onClick={() => setTimeRange('week')}
                        className={`px-3 py-1 text-sm rounded-md ${timeRange === 'week' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                    >
                        Semana
                    </button>
                    <button
                        onClick={() => setTimeRange('month')}
                        className={`px-3 py-1 text-sm rounded-md ${timeRange === 'month' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                    >
                        Mes
                    </button>
                    <button
                        onClick={() => setTimeRange('year')}
                        className={`px-3 py-1 text-sm rounded-md ${timeRange === 'year' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                    >
                        Año
                    </button>
                </div> */}
            </div>

            {/* Cards de resumen */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.totalEvents}</p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-full">
                            <CalendarDays className="text-purple-600" size={20} />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Todos tus eventos</p>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Hoy</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.todayEvents}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-full">
                            <Clock className="text-blue-600" size={20} />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Eventos programados hoy</p>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-teal-50 p-4 rounded-lg border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Próximos</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.upcomingEvents}</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-full">
                            <TrendingUp className="text-green-600" size={20} />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Eventos futuros</p>
                </div>

                {/* <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Completados</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.completedEvents}</p>
                        </div>
                        <div className="p-3 bg-orange-100 rounded-full">
                            <MapPin className="text-orange-600" size={20} />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Eventos realizados</p>
                </div> */}
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="text-md font-medium text-gray-700 mb-4">Eventos por Estado</h4>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.byStatus}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar
                                    dataKey="count"
                                    fill="#8884d8"
                                    radius={[4, 4, 0, 0]}
                                    animationDuration={1500}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="text-md font-medium text-gray-700 mb-4">Ubicaciones Populares</h4>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.byLocation}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar
                                    dataKey="count"
                                    fill="#82ca9d"
                                    radius={[4, 4, 0, 0]}
                                    animationDuration={1500}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}