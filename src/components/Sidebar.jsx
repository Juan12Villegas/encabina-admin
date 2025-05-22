"use client";
import { useSidebar } from '@/../context/SidebarContext';
import { useState, useEffect } from "react";
import { auth, db, doc, getDoc } from "@/../lib/firebase";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronDown, X, Menu, User, SquareMousePointer, CalendarDays, LayoutDashboard, CircleDollarSign, UserRoundPen, SquarePen, QrCode } from "lucide-react";
import Profile from "./profile";

export default function Sidebar({ dominantColor, colorText, startPeriode, endPeriode }) {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [profileSidebarOpen, setProfileSidebarOpen] = useState(false);
    /* const [isCollapsed, setIsCollapsed] = useState(false); */
    const { isCollapsed, setIsCollapsed } = useSidebar();
    const router = useRouter();
    const pathname = usePathname();

    // Hook para bloquear el desplazamiento cuando se muestra el modal
    useEffect(() => {
        if (mobileMenuOpen || profileSidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileMenuOpen, profileSidebarOpen]);

    // Verificar el tamaño de la pantalla al cargar y en cambios
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setIsCollapsed(true);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
        setMobileMenuOpen(false);
        if (pathname === "/user/eventos") {
            setProfileSidebarOpen(true);
        }
    };

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    const NavItem = ({ href, icon: Icon, children, onClick }) => (
        <li>
            {onClick ? (
                <button
                    onClick={onClick}
                    className={`flex items-center w-full p-3 rounded-lg hover:bg-gray-100 ${isCollapsed ? 'justify-center' : ''}`}
                >
                    <Icon className="h-5 w-5" />
                    {!isCollapsed && <span className="ml-3">{children}</span>}
                </button>
            ) : (
                <Link
                    href={href}
                    className={`flex items-center w-full p-3 rounded-lg hover:bg-gray-100 ${isCollapsed ? 'justify-center' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                >
                    <Icon className="h-5 w-5" />
                    {!isCollapsed && <span className="ml-3">{children}</span>}
                </Link>
            )}
        </li>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin h-12 w-12 text-blue-500" />
            </div>
        );
    }

    return (
        <>
            {/* Mobile Menu Button */}
            <div className="md:hidden fixed top-4 left-4 z-40">
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-2 rounded-md bg-white shadow-md"
                >
                    <Menu className="h-6 w-6" />
                </button>
            </div>

            {/* Sidebar */}
            <aside className={`fixed top-0 left-0 z-30 h-screen transition-all duration-300 ease-in-out 
                ${isCollapsed ? 'w-16' : 'w-64'} 
                ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
            >
                <div className="h-full flex flex-col bg-white border-r border-gray-200">
                    {/* Logo y toggle */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        {!isCollapsed && (
                            <Link href="/user/eventos" className="text-xl font-bold text-gray-900">
                                En Cabina
                            </Link>
                        )}
                        <button
                            onClick={toggleSidebar}
                            className="p-1 rounded-md hover:bg-gray-100"
                        >
                            {isCollapsed ? <ChevronDown className="h-5 w-5 rotate-90" /> : <ChevronDown className="h-5 w-5 -rotate-90" />}
                        </button>
                    </div>

                    {/* Menú principal */}
                    <nav className="flex-1 overflow-y-auto p-2">
                        <ul className="space-y-1">
                            <NavItem href="/user/eventos" icon={CalendarDays}>
                                Mis Eventos
                            </NavItem>
                            <NavItem href="/user/dashboard" icon={LayoutDashboard}>
                                Dashboard
                            </NavItem>
                            <NavItem href="/user/billing" icon={CircleDollarSign}>
                                Facturación
                            </NavItem>
                            <NavItem href="/user/profile" icon={UserRoundPen}>
                                Mi Perfil
                            </NavItem>
                            <NavItem href="/user/personalization" icon={SquarePen}>
                                Personalización
                            </NavItem>
                            <NavItem onClick={handleProfileClick} icon={QrCode}>
                                Mi QR
                            </NavItem>
                        </ul>
                    </nav>

                    {/* Perfil y logout */}
                    <div className="p-4 border-t border-gray-200">
                        <div className="flex items-center space-x-3">
                            <div className="relative">
                                {userData?.profileUrl ? (
                                    <Image
                                        src={userData.profileUrl}
                                        alt="Avatar del usuario"
                                        width={40}
                                        height={40}
                                        className="rounded-full border-2 border-gray-200 hover:border-gray-800 transition-colors object-cover"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-200 hover:border-gray-800 transition-colors">
                                        <User className="h-5 w-5 text-gray-500" />
                                    </div>
                                )}
                                <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${userData?.plan === "bassline" ? "bg-green-600" :
                                    userData?.plan === "drop pro" ? "bg-purple-600" :
                                        userData?.plan === "mainstage" ? "bg-blue-600" : "bg-gray-400"
                                    }`}
                                />
                            </div>
                            {!isCollapsed && (
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {userData?.email || "Usuario"}
                                    </p>
                                    <div className="flex items-center mt-1">
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${userData?.plan === "bassline" ? "bg-yellow-100 text-green-600" :
                                            userData?.plan === "drop pro" ? "bg-purple-100 text-purple-600" :
                                                userData?.plan === "mainstage" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                                            }`}
                                        >
                                            {userData?.plan?.toUpperCase() || "PLAN"}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {!isCollapsed && (
                            <button
                                onClick={handleLogout}
                                className="w-full mt-4 flex items-center justify-center py-2 px-4 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                            >
                                <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
                                Cerrar sesión
                            </button>
                        )}
                    </div>
                </div>
            </aside>

            {/* Overlay para mobile */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 md:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar de Perfil */}
            {profileSidebarOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                        onClick={() => setProfileSidebarOpen(false)}
                    />
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