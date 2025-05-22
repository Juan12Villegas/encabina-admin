"use client";
import Navbar from "@/components/Navbar";
import { useState, useEffect } from "react";
import { db, auth, doc, getDoc, onAuthStateChanged } from "@/../lib/firebase";
import { useRouter } from "next/navigation";
import { BadgeCheck, CalendarDays, Music, Users, TrendingUp } from "lucide-react";
import EventStats from "@/components/AnalysisDashboard/EventStats";
import SongAnalytics from "@/components/AnalysisDashboard/SongAnalytics";
import AudienceMetrics from "@/components/AnalysisDashboard/AudienceMetrics";

export default function DashboardPage() {
    const [profileData, setProfileData] = useState({
        nombreDJ: "",
        plan: "",
        redesSociales: "",
    });
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('overview');

    const extractInstagramUsername = (url) => {
        if (!url) return "No especificado";
        const match = url.match(/instagram\.com\/([a-zA-Z0-9_.]+)/);
        return match ? `@${match[1]}` : "No especificado";
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.push("/login");
                return;
            }

            try {
                const djRef = doc(db, "djs", user.uid);
                const userRef = doc(db, "users", user.uid);
                const [djSnap, userSnap] = await Promise.all([getDoc(djRef), getDoc(userRef)]);

                if (djSnap.exists() && userSnap.exists()) {
                    setProfileData({
                        nombreDJ: djSnap.data().nombreDJ || "No especificado",
                        plan: userSnap.data().plan || "No especificado",
                        redesSociales: djSnap.data().instagram || "No especificado",
                    });
                }
            } catch (error) {
                console.error("Error cargando datos:", error);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-800"></div>
            </div>
        );
    }

    const renderTabContent = () => {
        switch (activeTab) {
            case 'events':
                return <EventStats />;
            case 'songs':
                return <SongAnalytics />;
            case 'audience':
                return <AudienceMetrics />;
            default:
                return (
                    <div className="space-y-6">
                        <QuickStats />
                        <EventStats compact={true} />
                        <SongAnalytics compact={true} />
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Bienvenido al Dashboard</p>
                            <div className="flex items-center gap-2 mt-1">
                                <h1 className="text-2xl font-bold text-gray-900">{profileData.nombreDJ}</h1>
                                <BadgeCheck className={`h-5 w-5 ${profileData.plan === "bassline" ? "text-yellow-500" :
                                    profileData.plan === "drop pro" ? "text-gray-600" :
                                        profileData.plan === "mainstage" ? "text-gray-800" : "text-gray-400"
                                    }`} />
                            </div>
                            <span className={`inline-block mt-2 text-xs font-semibold px-2 py-1 rounded-full ${profileData.plan === "bassline" ? "bg-yellow-100 text-yellow-800" :
                                profileData.plan === "drop pro" ? "bg-gray-100 text-gray-800" :
                                    profileData.plan === "mainstage" ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-800"
                                }`}>
                                Plan {profileData.plan}
                            </span>
                        </div>
                        <div className="mt-4 md:mt-0">
                            <p className="text-sm text-gray-600">Redes sociales</p>
                            <p className="text-gray-800 font-medium">
                                {extractInstagramUsername(profileData.redesSociales)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex overflow-x-auto mb-6 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === 'overview' ? 'text-gray-800 border-b-2 border-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Resumen
                    </button>
                    <button
                        onClick={() => setActiveTab('events')}
                        className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === 'events' ? 'text-gray-800 border-b-2 border-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Eventos
                    </button>
                    <button
                        onClick={() => setActiveTab('songs')}
                        className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === 'songs' ? 'text-gray-800 border-b-2 border-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Canciones
                    </button>
                    <button
                        onClick={() => setActiveTab('audience')}
                        className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === 'audience' ? 'text-gray-800 border-b-2 border-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Audiencia
                    </button>
                </div>

                {/* Content */}
                {renderTabContent()}
            </div>
        </div>
    );
}

function QuickStats() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Eventos Hoy */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                        <CalendarDays className="text-gray-800 h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Eventos hoy</p>
                        <p className="text-xl font-bold text-gray-800">2</p>
                    </div>
                </div>
            </div>

            {/* Canciones Populares */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                        <Music className="text-gray-800 h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Top canción</p>
                        <p className="text-xl font-bold text-gray-800">"Baila Reggaeton"</p>
                    </div>
                </div>
            </div>

            {/* Crecimiento */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                        <TrendingUp className="text-gray-800 h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Crecimiento</p>
                        <p className="text-xl font-bold text-green-600">+15%</p>
                    </div>
                </div>
            </div>
        </div>
    );
}