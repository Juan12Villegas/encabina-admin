"use client";
import { useState, useEffect } from "react";
import { db, auth, collection, query, where, getDocs } from "@/../lib/firebase";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Music, Disc, ListMusic } from "lucide-react";

export default function SongAnalytics({ compact = false }) {
    const [songStats, setSongStats] = useState({
        topSongs: [],
        byGenre: [],
        requestCount: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSongStats = async () => {
            const user = auth.currentUser;
            if (!user) return;

            try {
                // Obtener todas las solicitudes de canciones para los eventos de este DJ
                const eventsRef = collection(db, "eventos");
                const eventsQuery = query(eventsRef, where("djId", "==", user.uid));
                const eventsSnapshot = await getDocs(eventsQuery);

                const eventIds = eventsSnapshot.docs.map(doc => doc.id);

                if (eventIds.length === 0) {
                    setSongStats({
                        topSongs: [],
                        byGenre: [],
                        requestCount: 0
                    });
                    return;
                }

                const requestsRef = collection(db, "event_requests");
                const requestsQuery = query(requestsRef, where("eventId", "in", eventIds));
                const requestsSnapshot = await getDocs(requestsQuery);

                const songsData = {};
                const genreData = {};
                let totalRequests = 0;

                requestsSnapshot.forEach(doc => {
                    const request = doc.data();
                    totalRequests++;

                    // Contar canciones
                    if (songsData[request.trackId]) {
                        songsData[request.trackId].count += request.count;
                    } else {
                        songsData[request.trackId] = {
                            title: request.title,
                            artist: request.artist,
                            count: request.count
                        };
                    }

                    // Aquí podrías agregar lógica para contar por género si tienes esa información
                });

                // Convertir a array y ordenar
                const topSongs = Object.values(songsData)
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5)
                    .map((song, index) => ({
                        ...song,
                        name: `${song.title.slice(0, 15)}... - ${song.artist.slice(0, 10)}...`
                    }));

                setSongStats({
                    topSongs,
                    byGenre: [
                        { name: "Reggaeton", count: 12 },
                        { name: "House", count: 8 },
                        { name: "Techno", count: 5 }
                    ], // Datos de ejemplo - deberías reemplazar con datos reales
                    requestCount: totalRequests
                });

            } catch (error) {
                console.error("Error fetching song stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSongStats();
    }, []);

    if (loading) {
        return (
            <div className={`flex justify-center items-center ${compact ? 'h-40' : 'h-64'}`}>
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-800"></div>
            </div>
        );
    }

    if (compact) {
        return (
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Music className="h-5 w-5 text-gray-700" />
                    Canciones Populares
                </h3>

                {songStats.topSongs.length > 0 ? (
                    <div className="space-y-3">
                        {songStats.topSongs.slice(0, 3).map((song, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-gray-500">{index + 1}</span>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">{song.title}</p>
                                        <p className="text-xs text-gray-500">{song.artist}</p>
                                    </div>
                                </div>
                                <span className="text-sm font-semibold text-gray-800">{song.count} solicitudes</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-4">No hay datos de canciones aún</p>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <Music className="h-5 w-5 text-gray-700" />
                Análisis de Canciones
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Canciones */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-gray-700 mb-4 flex items-center gap-2">
                        <ListMusic className="h-4 w-4" />
                        Canciones más solicitadas
                    </h4>
                    <div className="h-64">
                        {songStats.topSongs.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={songStats.topSongs}>
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
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-gray-500">No hay datos de canciones</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Por Género */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-gray-700 mb-4 flex items-center gap-2">
                        <Disc className="h-4 w-4" />
                        Solicitudes por género
                    </h4>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={songStats.byGenre}>
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

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-800">Total de solicitudes:</span> {songStats.requestCount}
                </p>
            </div>
        </div>
    );
}