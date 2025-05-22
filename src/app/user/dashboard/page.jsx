"use client";
import { useSidebar } from '@/../context/SidebarContext';
import { useState, useEffect } from "react";
import { db, auth, doc, getDoc, onAuthStateChanged } from "@/../lib/firebase";
import { useRouter } from "next/navigation";
import CancionesSolicitadasGeneral from '@/components/Dashboard/CancionesSolicitadas';
import EventosPorHora from '@/components/Dashboard/EventosPorHora';
import UbicacionesEventos from '@/components/Dashboard/UbicacionesEventos';
import { Disc3, Home, ChevronDown, ArrowLeft } from "lucide-react";

const Dashboard = () => {
    const { isCollapsed } = useSidebar();
    const [activeTab, setActiveTab] = useState('canciones');
    const [userId, setUserId] = useState(null);
    const [profileData, setProfileData] = useState({
        uid: "",
        nombreDJ: "",
        plan: "",
        redesSociales: "",
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.push("/login");
                return;
            }

            try {
                setLoading(true);
                setUserId(user.uid);

                const djRef = doc(db, "djs", user.uid);
                const userRef = doc(db, "users", user.uid);

                const [djSnap, userSnap] = await Promise.all([
                    getDoc(djRef),
                    getDoc(userRef)
                ]);

                if (djSnap.exists() && userSnap.exists()) {
                    setProfileData({
                        uid: user.uid,
                        nombreDJ: djSnap.data().nombreDJ || "No especificado",
                        plan: userSnap.data().plan || "No especificado",
                        redesSociales: djSnap.data().instagram || "No especificado",
                    });
                } else {
                    setError("No se encontraron datos completos del perfil");
                }
            } catch (error) {
                console.error("Error cargando datos:", error);
                setError("Error al cargar los datos del dashboard");
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <Disc3 className="h-12 w-12 animate-spin mx-auto" />
                    <p className="mt-4 text-lg">Cargando tu dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center p-6 bg-red-100 rounded-lg max-w-md">
                    <h2 className="text-xl font-bold text-red-800">Error</h2>
                    <p className="mt-2 text-red-600">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    const renderActiveTab = () => {
        if (!userId) return null;

        switch (activeTab) {
            case 'canciones':
                return <CancionesSolicitadasGeneral userId={userId} darkMode={false} maxItems={20} />;
            case 'eventos':
                return <EventosPorHora userId={userId} darkMode={false} />;
            case 'ubicaciones':
                return <UbicacionesEventos userId={userId} darkMode={false} />;
            default:
                return <CancionesSolicitadasGeneral userId={userId} darkMode={false} maxItems={5} />;
        }
    };

    return (
        <div className='w-full'>
            <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-0 lg:ml-16' : 'ml-0 lg:ml-64'}`}>
                <div className="bg-white border border-gray-200 p-4 lg:p-6">
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                        <a href="/user/eventos" className="flex items-center hover:text-indigo-600">
                            <Home className="h-4 w-4 mr-1" />
                            Inicio
                        </a>
                        {/* <ChevronDown className="h-4 w-4 mx-1 transform -rotate-90" />
                        <a href="/user/eventos" className="flex items-center hover:text-indigo-600">
                            <List className="h-4 w-4 mr-1" />
                            Mis Eventos
                        </a> */}
                        <ChevronDown className="h-4 w-4 mx-1 transform -rotate-90" />
                        <span className="text-indigo-600 font-medium">Dashboard</span>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Dashboard de {profileData.nombreDJ}</h1>
                            <p className="text-gray-600 mt-1">Visualiza y modifica la información de tu perfil.</p>
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

                <div className="px-6 border border-gray-200">
                    {/* <header className="space-y-2">
                        <h1 className="text-3xl font-bold">Dashboard de {profileData.nombreDJ}</h1>
                        <div className="flex flex-wrap gap-4 text-sm">
                            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                                Plan: {profileData.plan}
                            </div>
                            {profileData.redesSociales && (
                                <a
                                    href={`https://instagram.com/${profileData.redesSociales}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full hover:bg-purple-200 transition"
                                >
                                    @{profileData.redesSociales}
                                </a>
                            )}
                        </div>
                    </header> */}

                    {/* Pestañas */}
                    <div className="border-b pb-4 border-gray-200 overflow-x-auto">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => setActiveTab('canciones')}
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'canciones'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                            >
                                Canciones Solicitadas
                            </button>
                            <button
                                onClick={() => setActiveTab('eventos')}
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'eventos'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                            >
                                Eventos por Hora
                            </button>
                            <button
                                onClick={() => setActiveTab('ubicaciones')}
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'ubicaciones'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                            >
                                Ubicaciones de Eventos
                            </button>
                        </nav>
                    </div>

                    {/* Contenido de la pestaña activa */}
                    <div className="py-4">
                        {renderActiveTab()}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;