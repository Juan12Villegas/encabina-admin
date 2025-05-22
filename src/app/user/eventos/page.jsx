"use client";

import { useSidebar } from '@/../context/SidebarContext';
import { FastAverageColor } from 'fast-average-color';

import { useState, useEffect, useRef } from "react";
import { auth, db, doc, getDoc, collection, getDocs, onAuthStateChanged, query, where, onSnapshot, signOut } from "@/../lib/firebase";
import { useRouter } from "next/navigation";
import { Disc3, QrCode, Pencil, Eye, EyeClosed, Plus, Search, Calendar, MapPin, Clock, AlertCircle, Music, Download, Package, X } from "lucide-react";
import EventForm from "./EventForm";
import { QRCodeSVG } from "qrcode.react";
import { toPng, toJpeg, toSvg } from 'html-to-image';
import toast from "react-hot-toast"; // Para mostrar mensajes de error

import { EventCalendar } from "@/components/EventCalendar";
import { DJNotesModal } from "@/components/DJNotesModal";
import { SpotifyTopTracks } from "@/components/SpotifyTopTracks";
import { QRGenerator } from "@/components/QrGenerator";

// Precargamos el banner por defecto y calculamos su color dominante
const DEFAULT_BANNER = '/banner/banner-dj.png';
const DEFAULT_COLOR = '#000000';

// Función para precargar la imagen y calcular el color dominante
async function getDominantColor(imageUrl) {
    const fac = new FastAverageColor();
    try {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = imageUrl || DEFAULT_BANNER;

        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
        });

        const color = fac.getColor(img);
        fac.destroy();
        return color.hex;
    } catch (e) {
        console.error('Error al detectar color:', e);
        fac.destroy();
        return DEFAULT_COLOR;
    }
}

export default function Dashboard() {
    const { isCollapsed } = useSidebar();

    const [userActive, setUserActive] = useState(true); // Nuevo estado para rastrear el estado activo
    const [banner, setBanner] = useState(DEFAULT_BANNER); // Estado para la URL del banner

    const [dominantColor, setDominantColor] = useState(DEFAULT_COLOR);
    const rgbColor = hexToRgb(dominantColor);  // Convierte el color hex a RGB
    // Estado para controlar si el fondo y los textos están en su estado original o modificados
    const [isModified, setIsModified] = useState(false);
    const [djName, setDjName] = useState("");
    const [djId, setDjId] = useState("");
    const [eventoName, setEventoName] = useState("");
    const [userPlan, setUserPlan] = useState("");
    const [showModalPNG, setShowModalPNG] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showModalQR, setShowModalQR] = useState(false);
    const [qrEvent, setQrEvent] = useState("");
    const [eventos, setEventos] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState(eventos);
    const [loading, setLoading] = useState(true);
    const [eventLimit, setEventLimit] = useState(0);
    const [songLimit, setSongLimit] = useState(0);
    const [eventsCreatedThisPeriod, setEventsCreatedThisPeriod] = useState(0);
    const [currentPeriod, setCurrentPeriod] = useState({ start: null, end: null });
    const router = useRouter();

    const [imageFormat, setImageFormat] = useState('png');
    const [imageSize, setImageSize] = useState(500);

    // Función para verificar el estado del usuario en tiempo real
    const setupUserStatusListener = (uid) => {
        const userRef = doc(db, "users", uid);

        return onSnapshot(userRef, (doc) => {
            if (doc.exists()) {
                const userData = doc.data();
                const isActive = userData.active !== false; // Consideramos activo si no es explícitamente false

                setUserActive(isActive);

                // Actualizar bannerUrl si existe en los datos del usuario
                if (userData.bannerUrl && userData.showBanner === true) {
                    const newBannerUrl = userData.bannerUrl;
                    setBanner(newBannerUrl);
                    console.log("url banner: " + newBannerUrl);
                }

                if (!isActive) {
                    // Si el usuario está inactivo, desloguear y redirigir
                    signOut(auth).then(() => {
                        router.push("/");
                        toast.error("Tu cuenta ha sido desactivada. Por favor, contacta al soporte.");
                    });
                }
            }
        });
    };

    useEffect(() => {
        const fac = new FastAverageColor();
        const img = new Image();
        img.src = banner !== null ? banner : '/banner/banner-dj.png';
        img.crossOrigin = 'Anonymous';

        img.onload = () => {
            try {
                const color = fac.getColor(img);
                setDominantColor(color.hex);
            } catch (e) {
                console.error('Error al detectar color:', e);
            }
        };

        setFilteredEvents(eventos);

        return () => fac.destroy();
    }, [banner, eventos]); // ← Agrega banner como dependencia

    // Función para calcular eventos creados en el período actual
    const calculateEventsInPeriod = (events, period) => {
        if (!period.start || !period.end) return 0;

        const startDate = new Date(period.start);
        const endDate = new Date(period.end);

        return events.filter(event => {
            if (!event.createdAt?.seconds) return false;
            const eventDate = new Date(event.createdAt.seconds * 1000);
            return eventDate >= startDate && eventDate <= endDate;
        }).length;
    };

    // Actualizar eventos creados en el período cuando cambian los eventos o el período
    useEffect(() => {
        if (eventos.length > 0 && currentPeriod.start && currentPeriod.end) {
            const count = calculateEventsInPeriod(eventos, currentPeriod);
            setEventsCreatedThisPeriod(count);
        }
    }, [eventos, currentPeriod]);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setDjId(user.uid);
                await fetchUserData(user.uid);
                await fetchEventos(user.uid);

                // Configurar listener para el estado del usuario
                const unsubscribeStatus = setupUserStatusListener(user.uid);

                setLoading(false);

                // Retornar función de limpieza para ambos listeners
                return () => {
                    unsubscribeStatus();
                };
            } else {
                router.push("/login");
            }
        });

        return () => unsubscribeAuth();
    }, [router]);

    // Función para obtener las solicitudes de canciones en tiempo real
    const setupRealTimeSongRequests = async (eventId) => {
        const eventRequestsRef = collection(db, "event_requests");
        const q = query(eventRequestsRef, where("eventId", "==", eventId));

        return onSnapshot(q, (snapshot) => {
            const count = snapshot.size;
            setEventos(prevEventos =>
                prevEventos.map(evento =>
                    evento.id === eventId ? { ...evento, songsRequested: count } : evento
                )
            );
        });
    };

    // Hook para bloquear el desplazamiento cuando se muestra el modal
    useEffect(() => {
        if (showModal || showModalQR || showModalPNG) {
            document.body.style.overflow = 'hidden'; // Bloquea el desplazamiento
        } else {
            document.body.style.overflow = ''; // Restaura el desplazamiento
        }

        // Limpiar al desmontar el componente
        return () => {
            document.body.style.overflow = '';
        };
    }, [showModal, showModalQR, showModalPNG]);

    const formatDateOnly = (timestamp) => {
        if (!timestamp || !timestamp.seconds) return "";
        const date = new Date(timestamp.seconds * 1000);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const formatTimeOnly = (timestamp) => {
        if (!timestamp || !timestamp.seconds) return "";
        const date = new Date(timestamp.seconds * 1000);
        return date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getEventsCreatedInPeriod = (events, periodStart, periodEnd) => {
        if (!periodStart || !periodEnd) return 0;

        const startDate = new Date(periodStart);
        const endDate = new Date(periodEnd);

        return events.filter(event => {
            if (!event.horaInicio?.seconds) return false;
            const eventDate = new Date(event.horaInicio.seconds * 1000);
            return eventDate >= startDate && eventDate <= endDate;
        }).length;
    };

    const getPlanLimits = (plan) => {
        switch (plan) {
            case "bassline":
                return { events: 10, songs: 100 };
            case "drop pro":
                return { events: 30, songs: 300 };
            case "mainstage":
                return { events: Infinity, songs: Infinity };
            default:
                return { events: 0, songs: 0 };
        }
    };

    // Función modificada para manejar consistentemente los formatos de fecha
    const getCurrentPeriod = (payments) => {
        const now = new Date();

        if (payments?.monthly) {
            const monthlyPayments = Object.values(payments.monthly);
            for (const payment of monthlyPayments) {
                if (payment.paid && payment.dueDate) {
                    const dueDate = new Date(payment.dueDate);
                    const paymentDate = new Date(payment.date);

                    if (now >= paymentDate && now <= dueDate) {
                        return {
                            start: paymentDate,
                            end: dueDate
                        };
                    }
                }
            }
        }

        if (payments?.initial?.date) {
            const initialDate = new Date(payments.initial.date);
            const dueDate = new Date(initialDate);
            dueDate.setMonth(dueDate.getMonth() + 1);

            if (now >= initialDate && now <= dueDate) {
                return {
                    start: initialDate,
                    end: dueDate
                };
            }
        }

        return { start: null, end: null };
    };

    // Función unificada para contar eventos en el período
    const countEventsInPeriod = (events, period) => {
        if (!period.start || !period.end) return 0;

        return events.filter(event => {
            if (!event.createdAt?.seconds) return false;
            const eventDate = new Date(event.createdAt.seconds * 1000);
            return eventDate >= period.start && eventDate <= period.end;
        }).length;
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setDjId(user.uid);
                await fetchUserData(user.uid);
                await fetchEventos(user.uid);
                setLoading(false);
            } else {
                router.push("/");
            }
        });

        return () => unsubscribe();
    }, [router]);

    // Modificación en fetchUserData para usar fechas consistentes
    const fetchUserData = async (uid) => {
        const djRef = doc(db, "djs", uid);
        const djSnap = await getDoc(djRef);

        if (djSnap.exists()) {
            setDjName(djSnap.data().nombreDJ);
        }

        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            const plan = userData.plan || "free";
            setUserPlan(plan);

            if (userData.bannerUrl && userData.showBanner === true) {
                setBanner(userData.bannerUrl);
            }

            const limits = getPlanLimits(plan);
            setEventLimit(limits.events);
            setSongLimit(limits.songs);

            const period = getCurrentPeriod(userData.payments);
            setCurrentPeriod(period);

            // Calcular eventos del período inmediatamente con los datos disponibles
            if (eventos.length > 0 && period.start && period.end) {
                const count = countEventsInPeriod(eventos, period);
                setEventsCreatedThisPeriod(count);
            }
        }
    };

    const fetchEventos = async (uid) => {
        const eventosRef = collection(db, "eventos");
        const q = query(eventosRef, where("djId", "==", uid));

        // Configurar listener en tiempo real para eventos
        const unsubscribeEvents = onSnapshot(q, async (snapshot) => {
            let eventosData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Configurar listeners para cada evento
            const unsubscribeFunctions = [];
            for (const evento of eventosData) {
                const unsubscribe = await setupRealTimeSongRequests(evento.id);
                unsubscribeFunctions.push(unsubscribe);
            }

            // Ordenar eventos por fecha de creación (más recientes primero)
            eventosData.sort((a, b) => {
                // Si no hay createdAt, ponemos el evento al final
                if (!a.createdAt || !a.createdAt.seconds) return 1;
                if (!b.createdAt || !b.createdAt.seconds) return -1;
                return b.createdAt.seconds - a.createdAt.seconds;
            });

            setEventos(eventosData);

            if (currentPeriod.start && currentPeriod.end) {
                const count = getEventsCreatedInPeriod(eventosData, currentPeriod.start, currentPeriod.end);
                setEventsCreatedThisPeriod(count);
            }

            return () => unsubscribeFunctions.forEach(fn => fn());
        });

        return unsubscribeEvents;
    };

    // Efecto unificado para manejar los cálculos
    useEffect(() => {
        if (eventos.length > 0 && currentPeriod.start && currentPeriod.end) {
            const count = countEventsInPeriod(eventos, currentPeriod);
            setEventsCreatedThisPeriod(count);
        }
    }, [eventos, currentPeriod]);

    const handleCreateEventClick = () => {
        if (eventsCreatedThisPeriod >= eventLimit && userPlan !== "mainstage") {
            toast.error(`Has alcanzado el límite de ${eventLimit} eventos para tu período de suscripción actual. Actualiza tu plan para crear más eventos.`);
        } else {
            setShowModal(true);
        }
    };

    const handleQrEvent = (qrEvento, nombreEvento) => {
        setQrEvent(qrEvento);
        setEventoName(nombreEvento);
        setShowModalQR(true);
    }

    const getSongsRemaining = (evento) => {
        if (userPlan === "mainstage") return "Ilimitadas";
        const remaining = songLimit - evento.songsRequested;
        return remaining > 0 ? remaining : 0;
    };

    const downloadQR = async () => {
        const qrElement = document.querySelector('.qr-container svg');
        if (!qrElement) return;

        let dataUrl;
        switch (imageFormat) {
            case 'png':
                dataUrl = await toPng(qrElement, {
                    width: imageSize,
                    height: imageSize,
                    quality: 1,
                    pixelRatio: 1,
                });
                break;
            case 'jpeg':
                dataUrl = await toJpeg(qrElement, {
                    width: imageSize,
                    height: imageSize,
                    quality: 1,
                    pixelRatio: 1,
                });
                break;
            case 'svg':
                dataUrl = await toSvg(qrElement, {
                    width: imageSize,
                    height: imageSize,
                    quality: 1,
                    pixelRatio: 1,
                });
                break;
            default:
                dataUrl = await toPng(qrElement, {
                    width: imageSize,
                    height: imageSize,
                    quality: 1,
                    pixelRatio: 1,
                });
        }

        const link = document.createElement('a');
        link.download = `qr-${eventoName}.${imageFormat}`;
        link.href = dataUrl;
        link.click();
    };

    const handleDownload = () => {
        downloadQR();
        setShowModalPNG(false);
    };

    const getPlanBadgeColor = (plan) => {
        switch (plan) {
            case "bassline": return "bg-blue-100 text-blue-800";
            case "drop pro": return "bg-purple-100 text-purple-800";
            case "mainstage": return "bg-yellow-100 text-yellow-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    // Función helper para determinar color de texto según contraste
    function getContrastYIQ(hexcolor) {
        hexcolor = hexcolor.replace('#', '');
        const r = parseInt(hexcolor.substr(0, 2), 16);
        const g = parseInt(hexcolor.substr(2, 2), 16);
        const b = parseInt(hexcolor.substr(4, 2), 16);
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? 'black' : 'white';
    }

    function hexToRgb(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return { r, g, b };
    }

    // Función helper para determinar color de fondo de banner
    function getContrastYIQ2(hexcolor) {
        hexcolor = hexcolor.replace('#', '');
        const r = parseInt(hexcolor.substr(0, 2), 16);
        const g = parseInt(hexcolor.substr(2, 2), 16);
        const b = parseInt(hexcolor.substr(4, 2), 16);
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? 'white' : 'black';
    }

    // Función para alternar entre el estado modificado y el original
    const toggleBanner = () => {
        setIsModified(!isModified);
    };

    const handleUploadSuccess = (imageUrl) => {
        console.log('Imagen subida:', imageUrl);
        // Guardar en tu base de datos o hacer algo con la URL
    };

    const EventListItem = ({ evento, router, dominantColor, userPlan, getSongsRemaining }) => (
        <li key={evento.id} className="hover:bg-gray-50 transition-colors duration-150">
            <div className="px-6 py-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Event Info */}
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-lg font-medium text-gray-900">{evento.nombre}</h3>
                            <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${evento.estado === "pendiente" ? "bg-yellow-200 text-yellow-700 border border-yellow-200" :
                                evento.estado === "en vivo" ? "bg-green-300 text-green-700 border border-green-300" :
                                    "bg-red-300 text-red-800 border border-red-200"
                                }`}>
                                {evento.estado}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="flex items-start">
                                <div className="bg-gray-100 p-2 rounded-lg mr-3">
                                    <Calendar className="h-5 w-5 text-gray-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Fecha</p>
                                    <p className="text-sm font-medium text-gray-700">
                                        {formatDateOnly(evento.horaInicio)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <div className="bg-gray-100 p-2 rounded-lg mr-3">
                                    <Clock className="h-5 w-5 text-gray-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Horario</p>
                                    <p className="text-sm font-medium text-gray-700">
                                        {formatTimeOnly(evento.horaInicio)} - {formatTimeOnly(evento.horaFin)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <div className="bg-gray-100 p-2 rounded-lg mr-3">
                                    <MapPin className="h-5 w-5 text-gray-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Lugar</p>
                                    <p className="text-sm font-medium text-gray-700">
                                        {evento.lugar}
                                    </p>
                                </div>
                            </div>

                            {evento.qrCode && (
                                <div className="flex items-start">
                                    <div className="bg-gray-100 p-2 rounded-lg mr-3">
                                        <QrCode className="h-5 w-5 text-gray-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">QR Único</p>
                                        <button
                                            key={evento.id}
                                            onClick={() => handleQrEvent(evento.qrCode, evento.nombre)}
                                            className="text-sm font-medium text-gray-700"
                                        >
                                            <span className="hover:cursor-pointer hover:underline">Visualizar QR</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Songs Info */}
                        <div className="mt-3 flex items-center">
                            <div className="bg-gray-100 p-1.5 rounded-lg mr-2">
                                <Music className="h-4 w-4 text-gray-600" />
                            </div>
                            <div className="text-sm text-gray-600">
                                <span className="font-medium">{evento.songsRequested || 0}</span> canciones
                                {userPlan !== "mainstage" && (
                                    <span className="ml-2 text-gray-500">
                                        ({getSongsRemaining(evento)} restantes)
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-2">
                        <button
                            onClick={() => router.push(`eventos/edit/${evento.id}`)}
                            className="hover:cursor-pointer flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 transition-all border border-gray-200"
                        >
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                        </button>
                        <button
                            onClick={() => router.push(`eventos/view/${evento.id}`)}
                            style={{ backgroundColor: dominantColor, color: getContrastYIQ(dominantColor) }}
                            className="hover:cursor-pointer flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-gray-900 hover:bg-gray-800 transition-all"
                        >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver
                        </button>
                    </div>
                </div>
            </div>
        </li>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <Disc3
                        style={{ color: dominantColor }}
                        className="h-12 w-12 animate-spin mx-auto text-blue-500" />
                    <p className="mt-4 text-lg">Cargando tus eventos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full">
            <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-0 lg:ml-16' : 'ml-0 lg:ml-64'
                }`}>

                <div className='p-4 lg:p-6'>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                        <div
                            className="lg:col-span-2 rounded-xl border border-none space-y-6 bg-cover bg-center flex flex-col justify-between items-center"
                            style={{ backgroundImage: `url(${banner || '/banner/banner-dj.png'})` }}
                        >
                            <div className="rounded-xl w-full h-full flex flex-col justify-center items-center m-auto transition-opacity duration-1000">
                                {!isModified ? (
                                    <div
                                        style={{
                                            backgroundColor: `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, 0.5)`,
                                        }}
                                        className={`rounded-xl w-full h-full flex flex-col items-center justify-center m-auto px-4 py-4 transition-opacity duration-1000 ${isModified ? '' : 'backdrop-blur-xs'}`}
                                    >
                                        {/* Contenedor principal */}
                                        <div className="relative w-full min-h-28 flex flex-col items-center justify-center">
                                            {/* Ojo posicionado en la parte superior derecha */}
                                            <div className="absolute right-4 flex flex-col gap-2 items-center justify-center">
                                                <button
                                                    onClick={toggleBanner}
                                                    className="hover:cursor-pointer"
                                                >
                                                    <Eye style={{ color: getContrastYIQ(dominantColor) }} />
                                                </button>
                                            </div>
                                            <h1
                                                style={{ color: getContrastYIQ(dominantColor) }}
                                                className="text-3xl sm:text-4xl font-extrabold text-white leading-tight text-center"
                                            >
                                                Hola, <span style={{ color: getContrastYIQ(dominantColor) }} className="text-white">{djName}</span>
                                            </h1>
                                        </div>
                                    </div>

                                ) : (
                                    <div
                                        className={`rounded-xl w-full h-full flex flex-col items-center justify-center m-auto px-4 py-4 transition-opacity duration-1000 ${isModified ? '' : 'backdrop-blur-xs'}`}
                                    >
                                        {/* Contenedor principal */}
                                        <div className="relative w-full min-h-28 flex flex-col items-center justify-center">
                                            {/* Ojo posicionado en la parte superior derecha */}
                                            <div className="absolute right-4 flex flex-col gap-2 items-center justify-center">
                                                <button
                                                    onClick={toggleBanner}
                                                    className="hover:cursor-pointer"
                                                >
                                                    <EyeClosed style={{ color: getContrastYIQ(dominantColor) }} />
                                                </button>
                                            </div>
                                            <h1
                                                className="text-3xl sm:text-4xl font-extrabold text-transparent leading-tight text-center"
                                            >
                                                ENCABINA.PE
                                            </h1>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>


                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                            <div className="bg-white p-6 w-full rounded-xl shadow-sm border border-gray-200">
                                <div className="w-full flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Total de eventos</p>
                                        <p className="text-2xl font-semibold text-gray-900 mt-1">{eventos.length}</p>
                                    </div>
                                    <div className="p-3 bg-gray-200 rounded-lg">
                                        <Calendar className="h-6 w-6 text-gray-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 w-full rounded-xl shadow-sm border border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Eventos activos</p>
                                        <p className="text-2xl font-semibold text-gray-900 mt-1">
                                            {eventos.filter(e => e.estado === "en vivo").length}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-gray-200 rounded-lg">
                                        <Music className="h-6 w-6 text-gray-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 w-full rounded-xl shadow-sm border border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Próximos eventos</p>
                                        <p className="text-2xl font-semibold text-gray-900 mt-1">
                                            {eventos.filter(e => e.estado === "pendiente").length}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-gray-200 rounded-lg">
                                        <Clock className="h-6 w-6 text-gray-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 w-full rounded-xl shadow-sm border border-gray-200">
                                <div className="flex flex-wrap m-auto items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Tu plan</p>
                                        <p className="text-lg font-semibold text-gray-900 mt-1 capitalize">
                                            {userPlan === "bassline" ? "Bassline" :
                                                userPlan === "drop pro" ? "Drop Pro" :
                                                    userPlan === "mainstage" ? "MainStage" : "Free"}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-gray-200 rounded-lg">
                                        <Package className="h-6 w-6 text-gray-600" />
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Main Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Left Column */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Plan Status */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">Estado de tu plan</h2>
                                        <p className="text-sm text-gray-500 mt-1">
                                            <span>
                                                Período actual: {formatDateOnly({ seconds: new Date(currentPeriod.start).getTime() / 1000 })} -{' '}
                                                {formatDateOnly({ seconds: new Date(currentPeriod.end).getTime() / 1000 })}
                                            </span>
                                            {/* {userPlan !== "mainstage" && currentPeriod.start && currentPeriod.end ? (
                                                <span>
                                                    Período actual: {formatDateOnly({ seconds: new Date(currentPeriod.start).getTime() / 1000 })} -{' '}
                                                    {formatDateOnly({ seconds: new Date(currentPeriod.end).getTime() / 1000 })}
                                                </span>
                                            ) : (
                                                <span>Plan {userPlan === "mainstage" ? "ilimitado" : "básico"}</span>
                                            )} */}
                                        </p>
                                    </div>

                                    <button
                                        onClick={handleCreateEventClick}
                                        /* disabled={eventsCreatedThisPeriod >= eventLimit && userPlan !== "mainstage"} */
                                        style={{ backgroundColor: dominantColor, color: getContrastYIQ(dominantColor) }}
                                        className={`mt-4 sm:mt-0 flex items-center px-5 py-2.5 rounded-lg transition-all ${eventsCreatedThisPeriod >= eventLimit && userPlan !== "mainstage"
                                            ? "bg-gray-100 cursor-not-allowed text-gray-500"
                                            : "bg-gray-900 text-white hover:bg-gray-800 hover:cursor-pointer"
                                            }`}
                                    >
                                        <Plus className="mr-2 h-5 w-5" />
                                        Nuevo evento
                                    </button>
                                </div>

                                {userPlan !== "mainstage" && (
                                    <div className="mt-6">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium text-gray-700">Límite de eventos</span>
                                            <span className="text-sm font-medium text-gray-900">
                                                {eventsCreatedThisPeriod} / {eventLimit}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div
                                                className="bg-blue-600 h-2.5 rounded-full"
                                                style={{ backgroundColor: dominantColor, width: `${Math.min(100, (eventsCreatedThisPeriod / eventLimit) * 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Events List with Search */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="w-full sm:w-auto">
                                        <h2 className="text-lg font-semibold text-gray-900">Tus eventos</h2>
                                        <span className="text-sm text-gray-500">{eventos.length} eventos</span>
                                    </div>

                                    {/* Search Bar */}
                                    <div className="w-full sm:w-64 relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Search className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Buscar eventos..."
                                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            onChange={(e) => {
                                                const searchTerm = e.target.value.toLowerCase();
                                                setFilteredEvents(
                                                    searchTerm === "" ? eventos : eventos.filter(evento =>
                                                        evento.nombre.toLowerCase().includes(searchTerm) ||
                                                        evento.lugar.toLowerCase().includes(searchTerm) ||
                                                        formatDateOnly(evento.horaInicio).toLowerCase().includes(searchTerm)
                                                    )
                                                );
                                            }}
                                        />
                                    </div>
                                </div>

                                {filteredEvents.length > 0 ? (
                                    <ul className="divide-y divide-gray-200">
                                        {/* Primero: Eventos en vivo */}
                                        {filteredEvents
                                            .filter(evento => evento.estado === "en vivo")
                                            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // Ordenar por fecha más reciente
                                            .map(evento => (
                                                <EventListItem
                                                    key={evento.id}
                                                    evento={evento}
                                                    router={router}
                                                    dominantColor={dominantColor}
                                                    userPlan={userPlan}
                                                    getSongsRemaining={getSongsRemaining}
                                                />
                                            ))
                                        }

                                        {/* Luego: Otros eventos ordenados por fecha de creación (más recientes primero) */}
                                        {filteredEvents
                                            .filter(evento => evento.estado !== "en vivo")
                                            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // Ordenar por fecha más reciente
                                            .map(evento => (
                                                <EventListItem
                                                    key={evento.id}
                                                    evento={evento}
                                                    router={router}
                                                    dominantColor={dominantColor}
                                                    userPlan={userPlan}
                                                    getSongsRemaining={getSongsRemaining}
                                                />
                                            ))
                                        }
                                    </ul>
                                ) : (
                                    <div className="px-6 py-12 text-center">
                                        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                            <Calendar className="h-12 w-12 text-gray-400" />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900">
                                            {eventos.length === 0 ? "No hay eventos creados" : "No se encontraron resultados"}
                                        </h3>
                                        <p className="mt-1 text-gray-500">
                                            {eventos.length === 0 ? "Comienza creando tu primer evento" : "Intenta con otros términos de búsqueda"}
                                        </p>
                                        {eventos.length === 0 && (
                                            <button
                                                onClick={handleCreateEventClick}
                                                disabled={eventsCreatedThisPeriod >= eventLimit && userPlan !== "mainstage"}
                                                className={`mt-6 inline-flex items-center px-5 py-2.5 rounded-lg transition-all ${eventsCreatedThisPeriod >= eventLimit && userPlan !== "mainstage" ?
                                                    "bg-gray-100 cursor-not-allowed" :
                                                    "bg-gray-900 hover:bg-gray-800 text-white font-medium"}`}
                                            >
                                                <Plus className="-ml-1 mr-2 h-5 w-5" />
                                                Crear evento
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                            {/* Quick Actions */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones rápidas</h2>
                                <div className="grid grid-cols-1 gap-3">
                                    <EventCalendar
                                        eventos={eventos}
                                        dominantColor={dominantColor}
                                        colorText={getContrastYIQ(dominantColor)} />
                                    <DJNotesModal
                                        djId={djId}
                                        dominantColor={dominantColor}
                                        colorText={getContrastYIQ(dominantColor)} />
                                    <SpotifyTopTracks
                                        dominantColor={dominantColor}
                                        colorText={getContrastYIQ(dominantColor)} />
                                </div>
                            </div>

                            <div>
                                <QRGenerator
                                    dominantColor={dominantColor}
                                    textColor={getContrastYIQ(dominantColor)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </main >

            {/* Event Form Modal */}
            {
                showModal && (
                    <EventForm
                        dominantColor={dominantColor}
                        textColor={getContrastYIQ(dominantColor)}
                        setShowModal={setShowModal}
                        djId={djId}
                        setEventos={setEventos}
                        eventsCreatedThisPeriod={eventsCreatedThisPeriod}
                        eventLimit={eventLimit}
                        userPlan={userPlan}
                        currentPeriod={currentPeriod}
                        songLimit={songLimit}
                    />
                )
            }

            {/* QR Form Modal */}
            {
                showModalQR && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-xl p-6 max-w-sm w-full text-center shadow-2xl">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl text-center font-bold text-gray-900">Código QR del Evento</h3>
                                <button
                                    onClick={() => setShowModalQR(false)}
                                    className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="flex justify-center qr-container mb-6">
                                <QRCodeSVG
                                    value={"https://encabina.vercel.app/event/dj-event/" + "EV-" + qrEvent}
                                    size={200}
                                    includeMargin={true}
                                />
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => setShowModalPNG(true)}
                                    style={{ backgroundColor: dominantColor, color: getContrastYIQ(dominantColor) }}
                                    className="w-full flex justify-center items-center px-4 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-all hover:cursor-pointer"
                                >
                                    <Download className="mr-2 h-5 w-5" />
                                    QR como Imagen
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Modal para descargar QR como imagen */}
            {
                showModalPNG && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md m-6 shadow-2xl">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-gray-900">Descargar QR como imagen</h3>
                                <button
                                    onClick={() => setShowModalPNG(false)}
                                    className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-3">Formato de imagen</label>
                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        onClick={() => setImageFormat('png')}
                                        style={imageFormat === 'png' ? { backgroundColor: dominantColor, color: getContrastYIQ(dominantColor) } : {}}
                                        className={`py-3 px-4 rounded-lg transition-all ${imageFormat === 'png' ? '' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                                    >
                                        PNG
                                    </button>

                                    <button
                                        onClick={() => setImageFormat('jpeg')}
                                        style={imageFormat === 'jpeg' ? { backgroundColor: dominantColor, color: getContrastYIQ(dominantColor) } : {}}
                                        className={`py-3 px-4 rounded-lg transition-all ${imageFormat === 'png' ? '' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                                    >
                                        JPEG
                                    </button>
                                    <button
                                        onClick={() => setImageFormat('svg')}
                                        style={imageFormat === 'svg' ? { backgroundColor: dominantColor, color: getContrastYIQ(dominantColor) } : {}}
                                        className={`py-3 px-4 rounded-lg transition-all ${imageFormat === 'png' ? '' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                                    >
                                        SVG
                                    </button>
                                </div>
                            </div>

                            <div className="mb-8">
                                <label className="block text-sm font-medium text-gray-700 mb-3">Tamaño de imagen (px)</label>
                                <input
                                    type="range"
                                    min="100"
                                    max="3000"
                                    step="50"
                                    value={imageSize}
                                    onChange={(e) => setImageSize(parseInt(e.target.value))}
                                    style={{ accentColor: dominantColor }}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="text-center mt-3 text-gray-700 font-medium">{imageSize}px × {imageSize}px</div>
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowModalPNG(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDownload}
                                    style={{ backgroundColor: dominantColor, color: getContrastYIQ(dominantColor) }}
                                    className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-all"
                                >
                                    Descargar
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}