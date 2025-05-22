"use client";

import { useState, useEffect } from "react";
import { auth, db, doc, getDoc } from "@/../lib/firebase";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronDown, X, SquareMousePointer, User } from "lucide-react";
import Profile from "./profile";

export default function Navbar({ dominantColor, colorText, startPeriode, endPeriode }) {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [menuOpen, setMenuOpen] = useState(false);
    const [profileSidebarOpen, setProfileSidebarOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    // Hook para bloquear el desplazamiento cuando se muestra el modal
    useEffect(() => {
        if (menuOpen || profileSidebarOpen) {
            document.body.style.overflow = 'hidden'; // Bloquea el desplazamiento
        } else {
            document.body.style.overflow = ''; // Restaura el desplazamiento
        }

        // Limpiar al desmontar el componente
        return () => {
            document.body.style.overflow = '';
        };
    }, [menuOpen, profileSidebarOpen]);

    useEffect(() => {
        const fetchUserData = async () => {
            const user = auth.currentUser;
            if (!user) {
                router.push("/login");
                return;
            }

            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                setUserData(userSnap.data());
            }
            setLoading(false);
        };

        fetchUserData();
    }, [router]);

    const handleLogout = async () => {
        try {
            await auth.signOut();
            router.push("/login");
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        }
    };

    const handleProfileClick = (e) => {
        e.preventDefault();
        setMenuOpen(false);

        // Solo abrir el modal si estamos en la ruta /user/eventos
        if (pathname === "/user/eventos") {
            setProfileSidebarOpen(true);
        }
    };

    return (
        <>
            <nav className="bg-white border-b border-gray-200 py-2 px-4 sm:px-6 lg:px-8 z-50">
                <div className="flex justify-between items-center">
                    {/* Logo */}
                    <Link href="/user/eventos" className="flex items-center">
                        <span className="text-xl font-bold text-gray-900">En Cabina</span>
                    </Link>

                    <div className="flex gap-4 items-center">
                        {/* Menú de usuario */}
                        <div className="relative">
                            <button
                                onClick={() => setMenuOpen(!menuOpen)}
                                className="flex items-center space-x-2 focus:outline-none group"
                            >
                                <div className="relative">
                                    {userData?.profileUrl ? (
                                        <Image
                                            src={userData.profileUrl}
                                            alt="Avatar del usuario"
                                            width={40}
                                            height={40}
                                            className="rounded-full border-2 border-gray-200 group-hover:border-gray-800 transition-colors object-cover"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-200 group-hover:border-gray-800 transition-colors">
                                            <User className="h-5 w-5 text-gray-500" />
                                        </div>
                                    )}
                                    <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${userData?.plan === "bassline" ? "bg-yellow-500" :
                                        userData?.plan === "drop pro" ? "bg-purple-500" :
                                            userData?.plan === "mainstage" ? "bg-blue-500" : "bg-gray-400"
                                        }`}></span>
                                </div>
                                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
                            </button>

                            {/* Menú desplegable */}
                            {menuOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg ring-1 ring-gray-900/5 overflow-hidden z-50">
                                    <div className="p-4 border-b border-gray-100">
                                        {loading ? (
                                            <div className="animate-pulse space-y-2">
                                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center space-x-3">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {userData?.email || "Usuario"}
                                                        </p>
                                                        <div className="flex items-center mt-1">
                                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${userData?.plan === "bassline" ? "bg-yellow-100 text-yellow-800" :
                                                                userData?.plan === "drop pro" ? "bg-purple-100 text-purple-800" :
                                                                    userData?.plan === "mainstage" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                                                                }`}>
                                                                {userData?.plan?.toUpperCase() || "PLAN"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="py-1">
                                        <button
                                            onClick={handleProfileClick}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                            Mi QR
                                        </button>
                                        <Link
                                            href="/user/profile"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            onClick={() => setMenuOpen(false)}
                                        >
                                            Mi Perfil
                                        </Link>
                                        <Link
                                            href="/user/eventos"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            onClick={() => setMenuOpen(false)}
                                        >
                                            Mis Eventos
                                        </Link>
                                        <Link
                                            href="/user/dashboard"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            onClick={() => setMenuOpen(false)}
                                        >
                                            Dashboard
                                        </Link>
                                        <Link
                                            href="/user/billing"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            onClick={() => setMenuOpen(false)}
                                        >
                                            Facturación
                                        </Link>
                                        <Link
                                            href="/user/profile-photo"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            onClick={() => setMenuOpen(false)}
                                        >
                                            Cambiar foto
                                        </Link>
                                        <Link
                                            href="/user/personalization"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            onClick={() => setMenuOpen(false)}
                                        >
                                            Personalización
                                        </Link>
                                    </div>

                                    <div className="py-1 border-t border-gray-100">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                                        >
                                            <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
                                            Cerrar sesión
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Sidebar de Perfil */}
            {profileSidebarOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    {/* Fondo oscuro */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                        onClick={() => setProfileSidebarOpen(false)}
                    ></div>

                    {/* Panel lateral */}
                    <div className="absolute inset-y-0 right-0 max-w-full flex">
                        <div className="relative w-screen max-w-md">
                            <div className="h-full flex flex-col bg-white shadow-xl">
                                <div className="flex-1 overflow-y-auto">
                                    <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                                        <h2 className="text-lg font-medium text-gray-900">Mi Perfil</h2>
                                        <button
                                            type="button"
                                            className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                                            onClick={() => setProfileSidebarOpen(false)}
                                        >
                                            <span className="sr-only">Cerrar panel</span>
                                            <X className="h-6 w-6" />
                                        </button>
                                    </div>

                                    <div className="p-6">
                                        <Profile
                                            dominantColor={dominantColor}
                                            colorText={colorText}
                                            startPeriode={startPeriode}
                                            endPeriode={endPeriode}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}