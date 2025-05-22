"use client";
import { useState, useEffect } from "react";
import { db, auth, collection, query, where, getDocs } from "@/../lib/firebase";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Users, Clock, MapPin, Calendar } from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AudienceMetrics() {
    const [audienceStats, setAudienceStats] = useState({
        byAge: [],
        byGender: [],
        peakHours: [],
        repeatAttendees: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Datos de ejemplo - deberías reemplazar con llamadas a tu base de datos
        const fetchAudienceStats = async () => {
            try {
                // Simulando carga de datos
                await new Promise(resolve => setTimeout(resolve, 1000));

                setAudienceStats({
                    byAge: [
                        { name: '18-24', value: 35 },
                        { name: '25-34', value: 45 },
                        { name: '35-44', value: 15 },
                        { name: '45+', value: 5 }
                    ],
                    byGender: [
                        { name: 'Masculino', value: 60 },
                        { name: 'Femenino', value: 38 },
                        { name: 'Otro', value: 2 }
                    ],
                    peakHours: [
                        { name: '20:00', value: 15 },
                        { name: '21:00', value: 35 },
                        { name: '22:00', value: 50 },
                        { name: '23:00', value: 45 },
                        { name: '00:00', value: 30 }
                    ],
                    repeatAttendees: 25 // Porcentaje
                });
            } catch (error) {
                console.error("Error fetching audience stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAudienceStats();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-800"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <Users className="h-5 w-5 text-gray-700" />
                Métricas de Audiencia
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Por Edad */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-gray-700 mb-4 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Distribución por edad
                    </h4>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={audienceStats.byAge}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {audienceStats.byAge.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Por Género */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-gray-700 mb-4 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Distribución por género
                    </h4>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={audienceStats.byGender}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {audienceStats.byGender.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Horas Pico */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="text-md font-medium text-gray-700 mb-4 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Horas pico de participación
                </h4>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={audienceStats.peakHours}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar
                                dataKey="value"
                                fill="#8884d8"
                                radius={[4, 4, 0, 0]}
                                animationDuration={1500}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Estadísticas adicionales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-100 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Asistentes recurrentes</p>
                    <p className="text-2xl font-bold text-gray-800">{audienceStats.repeatAttendees}%</p>
                </div>
                <div className="bg-gray-100 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Ubicación principal</p>
                    <p className="text-xl font-bold text-gray-800">Discoteca La Kasa</p>
                </div>
                <div className="bg-gray-100 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Evento más popular</p>
                    <p className="text-xl font-bold text-gray-800">LA KASA DEL PERREO</p>
                </div>
            </div>
        </div>
    );
}