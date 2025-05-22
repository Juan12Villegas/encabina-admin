"use client";

import Navbar from "@/components/Navbar";
import { useState, useEffect, useRef } from "react";
import { auth, db, doc, getDoc, collection, getDocs, onAuthStateChanged, query, where } from "@/../lib/firebase";
import { useRouter } from "next/navigation";
import { Pencil, Eye, Plus, Loader2, Calendar, MapPin, Clock, AlertCircle, Music, Download, Package, X } from "lucide-react";
import EventForm from "./EventForm";
import { QRCodeSVG } from "qrcode.react";
import { toPng, toJpeg, toSvg } from 'html-to-image';
import { downloadQRCodeAsPDF } from "@/utils/downloadQR";

export default function Dashboard() {
    const [djName, setDjName] = useState("");
    const [djId, setDjId] = useState("");
    const [eventoName, setEventoName] = useState("");
    const [userPlan, setUserPlan] = useState("");
    const [showModalPNG, setShowModalPNG] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showModalQR, setShowModalQR] = useState(false);
    const [showPdfModal, setShowPdfModal] = useState(false);
    const [showDomicilioModal, setShowDomicilioModal] = useState(false);
    const [qrEvent, setQrEvent] = useState("");
    const [eventos, setEventos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [eventLimit, setEventLimit] = useState(0);
    const [songLimit, setSongLimit] = useState(0);
    const [eventsCreatedThisPeriod, setEventsCreatedThisPeriod] = useState(0);
    const [currentPeriod, setCurrentPeriod] = useState({ start: null, end: null });
    const router = useRouter();
    const qrRef = useRef(null);

    const [imageFormat, setImageFormat] = useState('png');
    const [imageSize, setImageSize] = useState(500);
    const [pdfSize, setPdfSize] = useState(100);

    const formatFirebaseTimestamp = (timestamp) => {
        if (!timestamp || !timestamp.seconds) return "Fecha no disponible";
        const date = new Date(timestamp.seconds * 1000);
        return date.toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

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
                return { events: 10, songs: 50 };
            case "drop pro":
                return { events: 30, songs: 100 };
            case "mainstage":
                return { events: Infinity, songs: Infinity }; // Ilimitado
            default:
                return { events: 0, songs: 0 };
        }
    };

    const getCurrentPeriod = (payments) => {
        const now = new Date();

        // Buscar el pago mensual vigente
        if (payments?.monthly) {
            const monthlyPayments = Object.values(payments.monthly);
            for (const payment of monthlyPayments) {
                if (payment.paid && payment.dueDate) {
                    const dueDate = new Date(payment.dueDate);
                    const paymentDate = new Date(payment.date);

                    if (now >= paymentDate && now <= dueDate) {
                        return {
                            start: payment.date,
                            end: payment.dueDate
                        };
                    }
                }
            }
        }

        // Si no hay pago mensual, usar el pago inicial
        if (payments?.initial?.date) {
            const initialDate = new Date(payments.initial.date);
            const dueDate = new Date(initialDate);
            dueDate.setMonth(dueDate.getMonth() + 1);

            if (now >= initialDate && now <= dueDate) {
                return {
                    start: payments.initial.date,
                    end: dueDate.toISOString()
                };
            }
        }

        return { start: null, end: null };
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

    const fetchUserData = async (uid) => {
        // Obtener datos del DJ
        const djRef = doc(db, "djs", uid);
        const djSnap = await getDoc(djRef);

        if (djSnap.exists()) {
            setDjName(djSnap.data().nombreDJ);
        }

        // Obtener plan y pagos del usuario
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            const plan = userData.plan || "free";
            setUserPlan(plan);

            const limits = getPlanLimits(plan);
            setEventLimit(limits.events);
            setSongLimit(limits.songs);

            // Determinar el período actual de suscripción
            const period = getCurrentPeriod(userData.payments);
            setCurrentPeriod(period);
        }
    };

    const fetchEventos = async (uid) => {
        const eventosRef = collection(db, "eventos");
        const eventosSnapshot = await getDocs(eventosRef);
        let eventosData = eventosSnapshot.docs
            .filter(doc => doc.data().djId === uid)
            .map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

        // Obtener el conteo de canciones solicitadas para cada evento
        const eventRequestsRef = collection(db, "event_requests");
        const eventRequestsSnapshot = await getDocs(eventRequestsRef);

        // Crear un mapa de eventId a conteo de canciones
        const songsRequestedMap = {};
        eventRequestsSnapshot.docs.forEach(doc => {
            const eventId = doc.data().eventId;
            songsRequestedMap[eventId] = (songsRequestedMap[eventId] || 0) + 1;
        });

        // Actualizar los eventos con el conteo de canciones
        eventosData = eventosData.map(evento => ({
            ...evento,
            songsRequested: songsRequestedMap[evento.id] || 0
        }));

        eventosData.sort((a, b) => b.horaInicio.seconds - a.horaInicio.seconds);
        setEventos(eventosData);

        // Actualizar contador de eventos para el período actual
        if (currentPeriod.start && currentPeriod.end) {
            const count = getEventsCreatedInPeriod(eventosData, currentPeriod.start, currentPeriod.end);
            setEventsCreatedThisPeriod(count);
        }
    };

    useEffect(() => {
        if (currentPeriod.start && currentPeriod.end) {
            const count = getEventsCreatedInPeriod(eventos, currentPeriod.start, currentPeriod.end);
            setEventsCreatedThisPeriod(count);
        }
    }, [currentPeriod, eventos]);

    const handleCreateEventClick = () => {
        if (eventsCreatedThisPeriod >= eventLimit && userPlan !== "mainstage") {
            alert(`Has alcanzado el límite de ${eventLimit} eventos para tu período de suscripción actual (${formatDateOnly({ seconds: new Date(currentPeriod.start).getTime() / 1000 })} - ${formatDateOnly({ seconds: new Date(currentPeriod.end).getTime() / 1000 })}). Actualiza tu plan para crear más eventos.`);
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

    const handleDownloadPdf = () => {
        const qrElement = document.querySelector('.qr-container');
        if (qrElement) {
            downloadQRCodeAsPDF(djName, djId, qrElement, pdfSize);
        }
        setShowPdfModal(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
                <div className="flex flex-col items-center">
                    <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
                    <p className="mt-4 text-gray-300">Cargando tu dashboard...</p>
                </div>
            </div>
        );
    }

    const getPlanColor = (plan) => {
        switch (plan) {
            case "bassline": return "from-blue-600 to-blue-800";
            case "drop pro": return "from-purple-600 to-purple-800";
            case "mainstage": return "from-yellow-500 to-yellow-700";
            default: return "from-gray-600 to-gray-800";
        }
    };

    const getPlanTextColor = (plan) => {
        switch (plan) {
            case "bassline": return "text-blue-100";
            case "drop pro": return "text-purple-100";
            case "mainstage": return "text-yellow-100";
            default: return "text-gray-100";
        }
    };

    const getPlanBadgeColor = (plan) => {
        switch (plan) {
            case "bassline": return "bg-blue-100 text-blue-800";
            case "drop pro": return "bg-purple-100 text-purple-800";
            case "mainstage": return "bg-yellow-100 text-yellow-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Hero Section Rediseñada */}
                <div className="flex flex-col lg:flex-row gap-6 mb-8">
                    {/* Hero Card Principal */}
                    <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-[#3f0f94] via-purple-700 to-pink-600 min-h-[300px] flex flex-col lg:flex-row items-center justify-between px-6 sm:px-10 py-8">

                        {/* Imagen del DJ */}
                        <div className="absolute right-4 bottom-0 lg:static lg:w-1/3 z-20 flex justify-end">
                            <img
                                src="/images/djmitad.png"
                                alt="DJ"
                                className="w-40 sm:w-52 md:w-60 object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.25)]"
                            />
                        </div>

                        {/* Contenido principal */}
                        <div className="relative z-10 flex-1 text-left space-y-4 pr-0 lg:pr-12">
                            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                                Hola, <span className="text-white">{djName}</span>
                            </h1>
                            <p className="text-base sm:text-lg text-indigo-100">Administra tus eventos y conecta con tu audiencia</p>

                            {/* Info del plan */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-4">

                                {/* Badge del plan */}
                                <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 shadow-md">
                                    <span className="text-sm font-semibold text-gray-700">Plan:</span>
                                    <span className={`text-sm font-bold ${getPlanBadgeColor(userPlan)}`}>
                                        {userPlan === "bassline" ? "Bassline" :
                                            userPlan === "drop pro" ? "Drop Pro" :
                                                userPlan === "mainstage" ? "MainStage" : "Free"}
                                    </span>
                                </div>

                                {/* Eventos usados */}
                                <div className="bg-white rounded-xl px-4 py-2 text-sm text-gray-800 shadow-md">
                                    <span className="font-bold">{eventsCreatedThisPeriod}</span> de <span className="font-bold">{eventLimit}</span> eventos
                                    <div className="text-xs text-gray-500">
                                        {formatDateOnly({ seconds: new Date(currentPeriod.start).getTime() / 1000 })} -{' '}
                                        {formatDateOnly({ seconds: new Date(currentPeriod.end).getTime() / 1000 })}
                                    </div>
                                </div>

                                {/* Botón */}
                                <button
                                    onClick={handleCreateEventClick}
                                    disabled={eventsCreatedThisPeriod >= eventLimit && userPlan !== "mainstage"}
                                    className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all shadow-md hover:scale-105 ${eventsCreatedThisPeriod >= eventLimit && userPlan !== "mainstage"
                                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                        : "bg-white text-indigo-700 hover:bg-indigo-100"
                                        }`}
                                >
                                    <Plus className="h-4 w-4" />
                                    Nuevo evento
                                </button>
                            </div>
                        </div>

                    </div>



                    {/* Panel de Estadísticas - Mejorado para responsividad */}
                    <div className="w-full lg:w-80 flex-shrink-0">
                        <div className="bg-white rounded-xl shadow-md border border-gray-200 h-full p-4 sm:p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 sm:mb-6">Resumen de eventos</h3>

                            <div className="space-y-3 sm:space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <div className="bg-indigo-100 p-1 sm:p-2 rounded-lg">
                                            <Package className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs sm:text-sm text-gray-500">Total</p>
                                            <p className="text-lg sm:text-xl font-bold text-gray-900">{eventos.length}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs sm:text-sm text-gray-500">Límite</p>
                                        <p className="text-lg sm:text-xl font-bold text-indigo-600">
                                            {userPlan === "mainstage" ? "∞" : eventLimit}
                                        </p>
                                    </div>
                                </div>

                                <div className="border-t border-gray-200 pt-3 sm:pt-4">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <div className="bg-green-100 p-1 sm:p-2 rounded-lg">
                                            <Music className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs sm:text-sm text-gray-500">Activos</p>
                                            <p className="text-lg sm:text-xl font-bold text-green-600">
                                                {eventos.filter(e => e.estado === "en vivo").length}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-gray-200 pt-3 sm:pt-4">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <div className="bg-blue-100 p-1 sm:p-2 rounded-lg">
                                            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs sm:text-sm text-gray-500">Próximos</p>
                                            <p className="text-lg sm:text-xl font-bold text-blue-600">
                                                {eventos.filter(e => e.estado === "pendiente").length}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {userPlan !== "mainstage" && (
                                    <div className="border-t border-gray-200 pt-3 sm:pt-4">
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <div className="bg-yellow-100 p-1 sm:p-2 rounded-lg">
                                                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs sm:text-sm text-gray-500">Disponibles</p>
                                                <p className="text-lg sm:text-xl font-bold text-yellow-600">
                                                    {Math.max(eventLimit - eventsCreatedThisPeriod, 0)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Plan Alert */}
                {eventsCreatedThisPeriod >= eventLimit && userPlan !== "mainstage" && (
                    <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg shadow-sm">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <AlertCircle className="h-5 w-5 text-yellow-500" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-yellow-700">
                                    Has alcanzado el límite de {eventLimit} eventos para tu período de suscripción actual.{' '}
                                    <a href="/pricing" className="font-bold underline text-yellow-700 hover:text-yellow-600">
                                        Actualiza tu plan
                                    </a>{' '}
                                    para crear más eventos.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Events List */}
                <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                        <h2 className="text-xl font-bold text-gray-900">Tus eventos</h2>
                    </div>

                    {eventos.length > 0 ? (
                        <ul className="divide-y divide-gray-200">
                            {eventos.map(evento => (
                                <li key={evento.id} className="hover:bg-gray-50/50 transition-colors duration-150">
                                    <div className="px-6 py-4">
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                            {/* Event Info */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <h3 className="text-lg font-bold text-gray-900">{evento.nombre}</h3>
                                                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${evento.estado === "pendiente" ? "bg-yellow-100 text-yellow-800" :
                                                        evento.estado === "en vivo" ? "bg-green-100 text-green-800" :
                                                            "bg-red-100 text-red-800"
                                                        }`}>
                                                        {evento.estado}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                    <div className="flex items-start">
                                                        <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                                                            <Calendar className="h-5 w-5 text-indigo-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500">Fecha</p>
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {formatDateOnly(evento.horaInicio)}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-start">
                                                        <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                                                            <Clock className="h-5 w-5 text-indigo-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500">Horario</p>
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {formatTimeOnly(evento.horaInicio)} - {formatTimeOnly(evento.horaFin)}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-start">
                                                        <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                                                            <MapPin className="h-5 w-5 text-indigo-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500">Lugar</p>
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {evento.lugar}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {evento.qrCode &&
                                                        (
                                                            <div className="flex items-start">
                                                                <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                                                                    <Music className="h-5 w-5 text-indigo-600" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-gray-500">Código QR</p>
                                                                    <p
                                                                        className={`text-sm font-medium ${evento.qrCode ? 'cursor-pointer hover:underline text-indigo-600 hover:text-indigo-800' : 'text-gray-900'}`}
                                                                        onClick={() => handleQrEvent(evento.qrCode, evento.nombre)}>
                                                                        {evento.qrCode ? "Visualizar QR único" : "Qr General"}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}
                                                </div>

                                                {/* Songs Info */}
                                                <div className="mt-3 flex items-center">
                                                    <div className="bg-indigo-100 p-1.5 rounded-lg mr-2">
                                                        <Music className="h-4 w-4 text-indigo-600" />
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        <span className="font-bold">{evento.songsRequested || 0}</span> canciones solicitadas
                                                        {userPlan !== "mainstage" && (
                                                            <span className="ml-2">
                                                                (<span className="font-bold">{getSongsRemaining(evento)}</span> restantes)
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex flex-col sm:flex-row gap-2">
                                                <button
                                                    onClick={() => router.push(`eventos/edit/${evento.id}`)}
                                                    className="flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 transition-all"
                                                >
                                                    <Pencil className="h-4 w-4 mr-2" />
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => router.push(`eventos/view/${evento.id}`)}
                                                    className="flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md"
                                                >
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    Ver
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="px-6 py-12 text-center">
                            <div className="mx-auto w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                                <Calendar className="h-12 w-12 text-indigo-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">No hay eventos creados</h3>
                            <p className="mt-1 text-gray-500">Comienza creando tu primer evento</p>
                            <button
                                onClick={handleCreateEventClick}
                                disabled={eventsCreatedThisPeriod >= eventLimit && userPlan !== "mainstage"}
                                className={`mt-6 inline-flex items-center px-5 py-2.5 rounded-lg shadow-md transition-all transform hover:scale-105 ${eventsCreatedThisPeriod >= eventLimit && userPlan !== "mainstage" ?
                                    "bg-gray-300 cursor-not-allowed" :
                                    "bg-indigo-600 hover:bg-indigo-700 text-white font-bold"}`}
                            >
                                <Plus className="-ml-1 mr-2 h-5 w-5" />
                                Crear evento
                            </button>
                        </div>
                    )}
                </div>
            </main>

            {/* Event Form Modal */}
            {
                showModal && (
                    <EventForm
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
            {showModalQR && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
                    <div className="bg-white rounded-xl p-6 max-w-sm w-full text-center shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-900">Código QR del Evento</h3>
                            <button onClick={() => setShowModalQR(false)} className="text-gray-500 hover:text-gray-700">
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
                                className="w-full flex justify-center items-center px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
                            >
                                <Download className="mr-2 h-5 w-5" />
                                QR como Imagen
                            </button>

                            <button
                                onClick={() => setShowPdfModal(true)}
                                className="w-full flex justify-center items-center px-4 py-3 bg-gradient-to-r from-gray-700 to-gray-900 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
                            >
                                <Download className="mr-2 h-5 w-5" />
                                QR como PDF
                            </button>

                            <button
                                onClick={() => setShowDomicilioModal(true)}
                                className="w-full flex justify-center items-center px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-800 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
                            >
                                <Package className="mr-2 h-5 w-5" />
                                Solicitar QR a Domicilio
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para descargar QR como imagen */}
            {showModalPNG && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md m-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-900">Descargar QR como imagen</h3>
                            <button onClick={() => setShowModalPNG(false)} className="text-gray-500 hover:text-gray-700">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-3">Formato de imagen</label>
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    onClick={() => setImageFormat('png')}
                                    className={`py-3 px-4 rounded-lg transition-all ${imageFormat === 'png' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                                >
                                    PNG
                                </button>
                                <button
                                    onClick={() => setImageFormat('jpeg')}
                                    className={`py-3 px-4 rounded-lg transition-all ${imageFormat === 'jpeg' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                                >
                                    JPEG
                                </button>
                                <button
                                    onClick={() => setImageFormat('svg')}
                                    className={`py-3 px-4 rounded-lg transition-all ${imageFormat === 'svg' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
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
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
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
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-md transition-all"
                            >
                                Descargar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}