"use client";

import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LineChart, Area, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Disc, Music, Check, Ban, ListMusic, Disc3, Users, MessageSquare, Star, Clock, TrendingUp, Album, Mic2, Heart } from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#A4DE6C', '#D0ED57', '#FFC658'];

const EventStats = ({
    totalCanciones,
    cantidadSolicitadas,
    cantidadColocadas,
    cantidadDescartadas,
    canciones,
    colocadas,
    descartados,
    timelineData = []
}) => {
    // Datos para el gráfico de pie
    const pieData = [
        { name: 'Solicitadas', value: cantidadSolicitadas, icon: <Music size={14} /> },
        { name: 'Colocadas', value: cantidadColocadas, icon: <Check size={14} /> },
        { name: 'Descartadas', value: cantidadDescartadas, icon: <Ban size={14} /> },
    ];

    // Datos para el gráfico de barras (top 10 canciones más votadas)
    const topCanciones = [...canciones, ...colocadas]
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map(cancion => ({
            name: `${cancion.title.slice(0, 15)}${cancion.title.length > 15 ? '...' : ''}`,
            artist: cancion.artist,
            votos: cancion.count,
            fullName: `${cancion.title} - ${cancion.artist}`,
            duration: cancion.duration || '3:30' // Valor por defecto si no hay duración
        }));

    // Top artistas más solicitados
    const artistasCount = [...canciones, ...colocadas, ...descartados].reduce((acc, curr) => {
        acc[curr.artist] = (acc[curr.artist] || 0) + curr.count;
        return acc;
    }, {});

    const topArtistas = Object.entries(artistasCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([artist, count]) => ({
            artist,
            count,
            songs: [...canciones, ...colocadas, ...descartados].filter(c => c.artist === artist).length
        }));

    // Estadísticas adicionales
    const artistasUnicos = [...new Set([...canciones, ...colocadas, ...descartados].map(c => c.artist))].length;
    const promedioVotos = (canciones.reduce((sum, cancion) => sum + cancion.count, 0) / (canciones.length || 1));
    const cancionesConMensaje = [...canciones, ...colocadas, ...descartados].filter(c => c.message).length;
    const totalVotos = canciones.reduce((sum, cancion) => sum + cancion.count, 0);
    const porcentajeColocadas = totalCanciones > 0 ? (cantidadColocadas / totalCanciones * 100).toFixed(1) : 0;

    // Duración total de canciones colocadas (asumiendo formato "mm:ss")
    const duracionTotal = colocadas.reduce((total, cancion) => {
        if (cancion.duration) {
            const [mins, secs] = cancion.duration.split(':').map(Number);
            return total + mins * 60 + secs;
        }
        return total + 180; // 3 minutos por defecto
    }, 0);

    const horasTotal = Math.floor(duracionTotal / 3600);
    const minutosTotal = Math.floor((duracionTotal % 3600) / 60);

    // Datos para gráfico de radar (artistas más populares)
    const radarData = topArtistas.map(artista => ({
        subject: artista.artist.length > 10 ? `${artista.artist.substring(0, 8)}...` : artista.artist,
        A: artista.count,
        B: artista.songs,
        fullName: artista.artist
    }));

    const calculatePeakActivity = (data) => {
        if (!data || data.length === 0) return { peakTime: 'N/A', maxCount: 0 };

        const intervalCounts = data.reduce((acc, d) => {
            const date = new Date(d.time);
            const interval = new Date(date);
            interval.setMinutes(Math.floor(date.getMinutes() / 30) * 30, 0, 0);
            const key = interval.toISOString();
            acc[key] = (acc[key] || 0) + (d.count || 1);
            return acc;
        }, {});

        const peakInterval = Object.entries(intervalCounts).reduce((max, [time, count]) => {
            return count > max.count ? { time, count } : max;
        }, { time: null, count: 0 });

        return {
            peakTime: new Date(peakInterval.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            maxCount: peakInterval.count
        };
    };

    const prepareTimelineData = (data) => {
        if (!data || data.length === 0) return [];

        // Agrupar por intervalos de 30 minutos sumando los counts
        const intervalCounts = data.reduce((acc, d) => {
            const date = new Date(d.time);
            const interval = new Date(date);
            // En la función prepareTimelineData:
            interval.setMinutes(Math.floor(date.getMinutes() / 15) * 15);
            interval.setSeconds(0);
            interval.setMilliseconds(0);

            const key = interval.toISOString();
            acc[key] = (acc[key] || 0) + (d.count || 1);
            return acc;
        }, {});

        // Convertir a array y ordenar por tiempo
        return Object.entries(intervalCounts)
            .map(([time, count]) => ({
                time: new Date(time),
                count
            }))
            .sort((a, b) => a.time - b.time);
    };

    // En tu componente:
    const { peakTime, maxCount } = calculatePeakActivity(timelineData);

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <Disc3 className="h-5 w-5 mr-2 text-indigo-600" />
                Estadísticas Detalladas del Evento
            </h2>

            {/* Resumen rápido */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <StatCard
                    icon={<ListMusic className="h-6 w-6 text-white" />}
                    title="Total Canciones"
                    value={totalCanciones}
                    color="bg-indigo-500"
                    trend={totalCanciones > 0 ? 'up' : 'neutral'}
                />
                <StatCard
                    icon={<Users className="h-6 w-6 text-white" />}
                    title="Artistas Únicos"
                    value={artistasUnicos}
                    color="bg-purple-500"
                    description={`en ${totalCanciones} canciones`}
                />
                <StatCard
                    icon={<Heart className="h-6 w-6 text-white" />}
                    title="Total Votos"
                    value={totalVotos}
                    color="bg-red-500"
                    trend="up"
                />
                <StatCard
                    icon={<Check className="h-6 w-6 text-white" />}
                    title="Tasa de Éxito"
                    value={`${porcentajeColocadas}%`}
                    color="bg-green-500"
                    description={`${cantidadColocadas} de ${totalCanciones}`}
                />
            </div>

            {/* Segunda fila de estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <StatCard
                    icon={<MessageSquare className="h-6 w-6 text-white" />}
                    title="Con Mensajes"
                    value={cancionesConMensaje}
                    color="bg-blue-500"
                    description={`${((cancionesConMensaje / totalCanciones) * 100 || 0).toFixed(1)}% del total`}
                />
                <StatCard
                    icon={<Star className="h-6 w-6 text-white" />}
                    title="Votos Promedio"
                    value={promedioVotos.toFixed(1)}
                    color="bg-amber-500"
                    trend={promedioVotos > 3 ? 'up' : promedioVotos < 2 ? 'down' : 'neutral'}
                />
                <StatCard
                    icon={<Clock className="h-6 w-6 text-white" />}
                    title="Duración Total"
                    value={`${horasTotal > 0 ? `${horasTotal}h ` : ''}${minutosTotal}m`}
                    color="bg-cyan-500"
                    description={`${colocadas.length} canciones`}
                />
                <StatCard
                    icon={<TrendingUp className="h-6 w-6 text-white" />}
                    title="Pico de Solicitudes"
                    value={peakTime}
                    color="bg-pink-500"
                    description={timelineData.length > 0 ? `${maxCount} solicitudes en 30 min` : ''}
                />
            </div>

            {/* Gráficos principales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 text-center">Distribución de Canciones</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value, name, props) => [
                                        `${value} canciones (${(props.payload.percent * 100).toFixed(1)}%)`,
                                        name
                                    ]}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 text-center">Top 10 Canciones Más Votadas</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={topCanciones}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    width={80}
                                    tickFormatter={(value) => value}
                                />
                                <Tooltip
                                    formatter={(value, name, props) => [
                                        value,
                                        name === 'votos' ? 'Votos' : 'Duración'
                                    ]}
                                    labelFormatter={(value) => {
                                        const item = topCanciones.find(item => item.name === value);
                                        return item ? item.fullName : value;
                                    }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
                                />
                                <Legend />
                                <Bar dataKey="votos" fill="#8884d8" name="Votos" radius={[0, 4, 4, 0]}>
                                    {topCanciones.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Gráficos secundarios */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

                {timelineData.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-4 text-center">Actividad Durante el Evento</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={prepareTimelineData(timelineData)}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="time"
                                        tickFormatter={(time) =>
                                            new Date(time).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })
                                        }
                                    />
                                    <YAxis />
                                    <Tooltip
                                        labelFormatter={(time) =>
                                            `Hora: ${new Date(time).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}`
                                        }
                                        formatter={(count) => [count, 'Solicitudes']}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="count"
                                        name="Solicitudes"
                                        stroke="#8884d8"
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                        activeDot={{ r: 6 }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="count"
                                        name="Solicitudes"
                                        stroke="#8884d8"
                                        fill="#8884d8"
                                        fillOpacity={0.1}
                                    />
                                </LineChart>

                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 text-center">Top 5 Artistas Populares</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="subject" />
                                <PolarRadiusAxis angle={30} domain={[0, 'dataMax + 10']} />
                                <Tooltip
                                    formatter={(value, name, props) => [
                                        value,
                                        name === 'A' ? 'Votos totales' : 'Canciones distintas'
                                    ]}
                                    labelFormatter={(value) => {
                                        const item = radarData.find(item => item.subject === value);
                                        return item ? item.fullName : value;
                                    }}
                                />
                                <Radar
                                    name="Votos"
                                    dataKey="A"
                                    stroke="#8884d8"
                                    fill="#8884d8"
                                    fillOpacity={0.6}
                                />
                                <Radar
                                    name="Canciones"
                                    dataKey="B"
                                    stroke="#82ca9d"
                                    fill="#82ca9d"
                                    fillOpacity={0.6}
                                />
                                <Legend />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Lista de top artistas */}
            <div className="bg-gray-50 p-4 rounded-lg mb-8">
                <h3 className="text-lg font-semibold mb-4 text-center flex items-center justify-center">
                    <Mic2 className="h-5 w-5 mr-2 text-purple-600" />
                    Artistas Más Populares
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {topArtistas.map((artista, index) => (
                        <div key={index} className="bg-white p-3 rounded-lg border border-gray-200 shadow-xs">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-gray-800 truncate" title={artista.artist}>
                                    {artista.artist}
                                </h4>
                                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                                    #{index + 1}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                                <span><Heart className="inline h-3 w-3 text-red-500" /> {artista.count} votos</span>
                                <span><Album className="inline h-3 w-3 text-blue-500" /> {artista.songs} canciones</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ icon, title, value, description, color, trend }) => {
    const trendColors = {
        up: 'text-green-500',
        down: 'text-red-500',
        neutral: 'text-gray-500'
    };

    const trendIcons = {
        up: <TrendingUp className="h-4 w-4" />,
        down: <TrendingUp className="h-4 w-4 transform rotate-180" />,
        neutral: <span className="h-4 w-4 inline-block"></span>
    };

    return (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <div className="flex items-baseline">
                        <p className={`text-2xl font-bold mt-1 ${color ? color.replace('bg', 'text') : 'text-gray-800'}`}>
                            {value}
                        </p>
                        {trend && (
                            <span className={`ml-2 ${trendColors[trend]}`}>
                                {trendIcons[trend]}
                            </span>
                        )}
                    </div>
                    {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
                </div>
                {icon && (
                    <div className={`p-3 rounded-full ${color || 'bg-indigo-500'} bg-opacity-20`}>
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventStats;