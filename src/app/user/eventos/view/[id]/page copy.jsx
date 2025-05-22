"use client";

import { useSidebar } from '@/../context/SidebarContext';
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, doc, getDoc, setDoc, collection, query, where, onSnapshot, updateDoc, deleteDoc, addDoc } from "@/../lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { ListMusic, Share2, Tag, Music, X, Check, Disc3, Ban, RotateCcw, Loader2, ChevronUp, MessageSquareDot, ChevronDown } from "lucide-react";
import { Switch } from "@/components/Switch";

import EventStats from "@/components/EventStats";
import { EventNotes } from "@/components/EventNotes";
import { Modal } from "@/components/modal";
import { Input } from "@/components/input";
import { Button } from "@/components/button";
import toast from "react-hot-toast";

export default function EventDetail() {
    const { id } = useParams();
    const { isCollapsed } = useSidebar();

    const [evento, setEvento] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [totalCanciones, setTotalCanciones] = useState(0);
    const [cantidadSolicitadas, setCantidadSolicitadas] = useState(0);
    const [cantidadColocadas, setCantidadColocadas] = useState(0);
    const [cantidadDescartadas, setCantidadDescartadas] = useState(0);
    const [canciones, setCanciones] = useState([]);
    const [descartados, setDescartados] = useState([]);
    const [colocadas, setColocadas] = useState([]);
    const [mostrarLista, setMostrarLista] = useState("solicitadas");
    const [filtroArtista, setFiltroArtista] = useState("");
    const [showStats, setShowStats] = useState(false);
    const [expandedMessages, setExpandedMessages] = useState({});
    const [timelineData, setTimelineData] = useState([]);
    const [showShareModal, setShowShareModal] = useState(false);
    const [sharePassword, setSharePassword] = useState("");
    const [isGeneratingLink, setIsGeneratingLink] = useState(false);
    const [shareLink, setShareLink] = useState("");
    const [sharePermission, setSharePermission] = useState("view");
    const [isShared, setIsShared] = useState(false);
    const [currentShareSettings, setCurrentShareSettings] = useState(null);

    const [tags, setTags] = useState([]);
    const [newTagName, setNewTagName] = useState("");
    const [showTagModal, setShowTagModal] = useState(false);
    const [selectedTags, setSelectedTags] = useState({});
    const [showTagSelector, setShowTagSelector] = useState(null);

    const [selectedFilterTags, setSelectedFilterTags] = useState([]);

    const router = useRouter();

    // Función para cargar tags del evento - MODIFICADA
    const loadEventTags = async () => {
        const tagsRef = collection(db, "event_tags");
        const q = query(tagsRef, where("eventId", "==", id));

        return onSnapshot(q, (querySnapshot) => {
            const tagsList = [];
            querySnapshot.forEach((doc) => {
                tagsList.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            setTags(tagsList);
        });
    };

    // Función para crear un nuevo tag
    const createNewTag = async () => {
        if (!newTagName.trim()) {
            toast.error("El nombre del tag no puede estar vacío");
            return;
        }

        try {
            const tagsRef = collection(db, "event_tags");
            await addDoc(tagsRef, {
                eventId: id,
                name: newTagName.trim(),
                color: `#${Math.floor(Math.random() * 16777215).toString(16)}`, // Color aleatorio
                createdAt: new Date()
            });
            setNewTagName("");
            setShowTagModal(false);
            toast.success("Tag creado exitosamente");
        } catch (error) {
            console.error("Error al crear tag:", error);
            toast.error("Error al crear tag");
        }
    };

    // Función para asignar/remover tag a una canción
    const toggleTagForSong = async (songId, tagId) => {
        try {
            const songRef = doc(db, "event_requests", songId);
            const songSnap = await getDoc(songRef);

            if (songSnap.exists()) {
                const currentTags = songSnap.data().tags || [];
                let newTags;

                if (currentTags.includes(tagId)) {
                    newTags = currentTags.filter(id => id !== tagId);
                } else {
                    newTags = [...currentTags, tagId];
                }

                await updateDoc(songRef, { tags: newTags });
            }
        } catch (error) {
            console.error("Error al actualizar tags de la canción:", error);
        }
    };

    // Función para cargar los tags seleccionados para cada canción
    const loadSelectedTags = async () => {
        const songsRef = collection(db, "event_requests");
        const q = query(songsRef, where("eventId", "==", id));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const selectedTagsMap = {};
            querySnapshot.forEach((doc) => {
                selectedTagsMap[doc.id] = doc.data().tags || [];
            });
            setSelectedTags(selectedTagsMap);
        });

        return unsubscribe;
    };

    const checkIfEventIsShared = async () => {
        try {
            const sharedEventRef = doc(db, "shared_events", id);
            const sharedEventSnap = await getDoc(sharedEventRef);

            if (sharedEventSnap.exists()) {
                setIsShared(true);
                setCurrentShareSettings(sharedEventSnap.data());
                setSharePermission(sharedEventSnap.data().permission || "view");
                setSharePassword(sharedEventSnap.data().password || "");
                setShareLink(`${window.location.origin}/shared-event/${id}`);
            } else {
                setIsShared(false);
                setCurrentShareSettings(null);
            }
        } catch (error) {
            console.error("Error al verificar estado compartido:", error);
        }
    };

    const generateShareLink = async () => {
        if (!sharePassword) {
            toast.error("Debes establecer una contraseña");
            return;
        }

        setIsGeneratingLink(true);
        try {
            const sharedEventRef = doc(db, "shared_events", id);

            if (isShared) {
                await updateDoc(sharedEventRef, {
                    password: sharePassword,
                    permission: sharePermission,
                    updatedAt: new Date()
                });
                toast.success("Configuración de compartido actualizada");
            } else {
                await setDoc(sharedEventRef, {
                    eventId: id,
                    password: sharePassword,
                    permission: sharePermission,
                    createdAt: new Date()
                });
                toast.success("Enlace generado correctamente");
            }

            const publicUrl = `${window.location.origin}/shared-event/${id}`;
            setShareLink(publicUrl);
            setIsShared(true);
        } catch (error) {
            console.error("Error al generar/actualizar el enlace compartido:", error);
            toast.error("Error al generar/actualizar el enlace");
        } finally {
            setIsGeneratingLink(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareLink);
        toast.success("Enlace copiado al portapapeles");
    };

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

    useEffect(() => {
        if (!id) return;

        const fetchEventData = async () => {
            const eventoRef = doc(db, "eventos", id);
            const eventoSnap = await getDoc(eventoRef);

            if (eventoSnap.exists()) {
                const data = eventoSnap.data();
                setEvento(data);
            } else {
                router.push("/user/eventos");
            }
            await checkIfEventIsShared();
        };

        const fetchSongs = () => {
            const cancionesRef = collection(db, "event_requests");
            const q = query(cancionesRef, where("eventId", "==", id));

            return onSnapshot(q, (snapshot) => {
                const cancionesList = [];
                const descartadosList = [];
                const colocadasList = [];
                const timeSeries = [];

                snapshot.docs.forEach(doc => {
                    const cancionData = {
                        id: doc.id,
                        ...doc.data(),
                        timestamp: doc.data().createdAt || doc.data().timestamp || { seconds: Date.now() / 1000 },
                        messages: doc.data().messages?.map(msg => ({
                            text: msg.text,
                            timestamp: msg.timestamp?.toDate ? msg.timestamp.toDate() :
                                (msg.timestamp?.seconds ? new Date(msg.timestamp.seconds * 1000) : new Date())
                        })) || [],
                        tags: doc.data().tags || []
                    };

                    timeSeries.push({
                        time: new Date(cancionData.timestamp.seconds * 1000),
                        count: cancionData.count,
                    });

                    if (cancionData.colocada) {
                        colocadasList.push(cancionData);
                    } else if (cancionData.descartado) {
                        descartadosList.push(cancionData);
                    } else {
                        cancionesList.push(cancionData);
                    }
                });

                timeSeries.sort((a, b) => a.time - b.time);
                setTimelineData(timeSeries);

                cancionesList.sort((a, b) => b.count - a.count || b.timestamp.seconds - a.timestamp.seconds);
                descartadosList.sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);
                colocadasList.sort((a, b) => (b.colocadaTimestamp?.seconds || 0) - (a.colocadaTimestamp?.seconds || 0));

                const totalSolicitadas = cancionesList.length + colocadasList.length + descartadosList.length;

                setTotalCanciones(totalSolicitadas);
                setCantidadSolicitadas(cancionesList.length);
                setCantidadColocadas(colocadasList.length);
                setCantidadDescartadas(descartadosList.length);
                setCanciones(cancionesList);
                setDescartados(descartadosList);
                setColocadas(colocadasList);
            });
        };

        fetchEventData();
        const unsubscribeSongs = fetchSongs();
        const unsubscribeTags = loadEventTags(); // Ahora devuelve el unsubscribe correctamente
        const unsubscribeSelectedTags = loadSelectedTags();

        return () => {
            unsubscribeSongs();
            if (typeof unsubscribeTags === 'function') {
                unsubscribeTags(); // Solo llamamos si es una función
            }
            if (typeof unsubscribeSelectedTags === 'function') {
                unsubscribeSelectedTags();
            }
        };
    }, [id, router]);

    const descartarCancion = async (cancionId) => {
        try {
            const cancionRef = doc(db, "event_requests", cancionId);
            await updateDoc(cancionRef, {
                descartado: true,
                descartadoTimestamp: new Date(),
                colocada: false
            });
        } catch (error) {
            console.error("Error al descartar la canción:", error);
        }
    };

    const restaurarCancion = async (cancionId) => {
        try {
            const cancionRef = doc(db, "event_requests", cancionId);
            await updateDoc(cancionRef, {
                descartado: false,
                descartadoTimestamp: null
            });
        } catch (error) {
            console.error("Error al restaurar la canción:", error);
        }
    };

    const marcarComoColocada = async (cancionId) => {
        try {
            const cancionRef = doc(db, "event_requests", cancionId);
            await updateDoc(cancionRef, {
                colocada: true,
                colocadaTimestamp: new Date(),
                descartado: false
            });
        } catch (error) {
            console.error("Error al marcar la canción como colocada:", error);
        }
    };

    const desmarcarComoColocada = async (cancionId) => {
        try {
            const cancionRef = doc(db, "event_requests", cancionId);
            await updateDoc(cancionRef, {
                colocada: false,
                colocadaTimestamp: null
            });
        } catch (error) {
            console.error("Error al desmarcar la canción como colocada:", error);
        }
    };

    const toggleAcceptSongs = async (newValue) => {
        setIsLoading(true);
        try {
            const eventoRef = doc(db, "eventos", id);
            await updateDoc(eventoRef, {
                aceptaCanciones: newValue
            });
            setEvento(prev => ({ ...prev, aceptaCanciones: newValue }));
        } catch (error) {
            console.error("Error al actualizar estado de canciones:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const filtrarPorArtistaYTags = (lista) => {
        let resultado = [...lista];

        // Filtro por artista (existente)
        if (filtroArtista) {
            resultado = resultado.filter(cancion =>
                cancion.artist.toLowerCase().includes(filtroArtista.toLowerCase())
            );
        }

        // Nuevo filtro por tags
        if (selectedFilterTags.length > 0) {
            resultado = resultado.filter(cancion =>
                selectedFilterTags.every(tagId =>
                    (selectedTags[cancion.id] || []).includes(tagId)
                ));
        }

        return resultado;
    };

    const formatTimeShort = (timestamp) => {
        if (!timestamp || !timestamp.seconds) return "";
        const date = new Date(timestamp.seconds * 1000);
        return date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const toggleMessages = (cancionId) => {
        setExpandedMessages(prev => ({
            ...prev,
            [cancionId]: !prev[cancionId]
        }));
    };

    const toggleTagSelector = (songId) => {
        setShowTagSelector(prev => prev === songId ? null : songId);
    };

    const TagFilterSelector = () => (
        <div className="mb-4">
            <div className="flex flex-wrap items-center gap-2">
                {tags.map(tag => (
                    <button
                        key={tag.id}
                        onClick={() => {
                            setSelectedFilterTags(prev =>
                                prev.includes(tag.id)
                                    ? prev.filter(id => id !== tag.id)
                                    : [...prev, tag.id]
                            );
                        }}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${selectedFilterTags.includes(tag.id)
                            ? 'text-white'
                            : 'opacity-70 hover:opacity-100'
                            }`}
                        style={{
                            backgroundColor: selectedFilterTags.includes(tag.id)
                                ? tag.color
                                : `${tag.color}20`,
                            border: `1px solid ${tag.color}`,
                            color: selectedFilterTags.includes(tag.id)
                                ? 'white'
                                : tag.color
                        }}
                    >
                        {tag.name}
                        {selectedFilterTags.includes(tag.id) && (
                            <X className="h-3 w-3 ml-1" />
                        )}
                    </button>
                ))}
                {selectedFilterTags.length > 0 && (
                    <button
                        onClick={() => setSelectedFilterTags([])}
                        className="text-xs text-gray-500 hover:text-gray-700 ml-2"
                    >
                        Limpiar filtros
                    </button>
                )}
            </div>
        </div>
    );

    if (!evento) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="flex flex-col items-center">
                    <Disc3 className="h-12 w-12 text-gray-600 animate-spin" />
                    <p className="mt-4 text-gray-700">Cargando evento...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full">
            <Modal isOpen={showShareModal} onClose={() => setShowShareModal(false)}>
                <div className="p-6">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                        {isShared ? "Configuración de compartido" : "Compartir evento"}
                    </h3>

                    {isShared && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-md text-sm text-blue-800">
                            <p>Este evento ya está compartido actualmente. <span className='font-bold'> {currentShareSettings?.permission === "edit" ? "Edición" : "Solo visualización"}</span></p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Permisos de acceso
                            </label>
                            <div className="flex gap-4">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={sharePermission === "view"}
                                        onChange={() => setSharePermission("view")}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span>Solo ver</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={sharePermission === "edit"}
                                        onChange={() => setSharePermission("edit")}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span>Editar (puede marcar/descartar canciones)</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Contraseña para acceder
                            </label>
                            <Input
                                type="password"
                                id="password"
                                value={sharePassword}
                                onChange={(e) => setSharePassword(e.target.value)}
                                placeholder="Establece una contraseña"
                                className="w-full"
                            />
                        </div>

                        {shareLink ? (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Enlace compartido
                                </label>
                                <div className="flex">
                                    <Input
                                        value={shareLink}
                                        readOnly
                                        className="w-full rounded-r-none"
                                    />
                                    <Button
                                        onClick={copyToClipboard}
                                        className="rounded-l-none"
                                    >
                                        Copiar
                                    </Button>
                                </div>
                            </div>
                        ) : null}

                        <div className="flex gap-2">
                            <Button
                                onClick={generateShareLink}
                                disabled={isGeneratingLink || !sharePassword}
                                className="flex-1"
                            >
                                {isGeneratingLink ? (
                                    <>
                                        <div className='flex items-center justify-center'>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            <span>{isShared ? "Actualizando..." : "Generando..."}</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className='flex items-center justify-center'>
                                            <Share2 className="h-4 w-4 mr-2" />
                                            <span>{isShared ? "Actualizar" : "Generar enlace"}</span>
                                        </div>
                                    </>
                                )}
                            </Button>
                            {isShared && (
                                <Button
                                    variant="destructive"
                                    onClick={async () => {
                                        try {
                                            const sharedEventRef = doc(db, "shared_events", id);
                                            await deleteDoc(sharedEventRef);
                                            setIsShared(false);
                                            setShareLink("");
                                            setSharePassword("");
                                            toast.success("Evento dejó de estar compartido");
                                        } catch (error) {
                                            toast.error("Error al dejar de compartir");
                                        }
                                    }}
                                    className="flex-1"
                                >
                                    <div className='flex items-center justify-center'>
                                        <Ban className="h-4 w-4 mr-2" />
                                        <span>Dejar de compartir</span>
                                    </div>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Modal para crear nuevo tag */}
            <Modal isOpen={showTagModal} onClose={() => setShowTagModal(false)}>
                <div className="p-6">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                        Crear nuevo tag
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="tagName" className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre del tag
                            </label>
                            <Input
                                type="text"
                                id="tagName"
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                                placeholder="Ej: Para antesala, Para el cierre, etc."
                                className="w-full"
                            />
                        </div>
                        <Button
                            onClick={createNewTag}
                            className="w-full"
                        >
                            Crear Tag
                        </Button>
                    </div>
                </div>
            </Modal>

            <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-0 lg:ml-16' : 'ml-0 lg:ml-64'}`}>
                <div className='p-4 lg:p-6 bg-white h-full'>
                    <div
                        className="h-40 lg:col-span-2 rounded-xl border border-none space-y-6 bg-cover bg-center flex flex-col justify-between items-center"
                        style={{ backgroundImage: 'url(/banner/banner-dj.png)' }}
                    >
                    </div>

                    <div className="max-w-full h-full mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="overflow-hidden"
                        >
                            <div className="text-black text-center sm:pb-0">
                                <div className="flex justify-center md:justify-between items-center my-6">
                                    <div className="flex flex-col md:flex-row gap-4 md:gap-0 justify-between  w-full">
                                        <div className="flex justify-start md:justify-center flex-col md:flex-row space-x-4 items-center md:items-center">
                                            <p className="text-2xl font-bold m-0 sm:mr-2">{evento.nombre}</p>
                                            <div className="flex items-center mt-2 gap-2">
                                                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${evento.estado === "pendiente" ? "bg-yellow-400 text-gray-900" :
                                                    evento.estado === "en vivo" ? "bg-green-400 text-white" :
                                                        "bg-red-400 text-white"
                                                    }`}>
                                                    {evento.estado.toUpperCase()}
                                                </span>
                                                <div className="flex items-center gap-1 px-3 py-1 text-sm font-semibold rounded-full bg-gray-200">
                                                    <ListMusic className="w-4 h-4" />
                                                    <p>{totalCanciones}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap justify-center gap-4">
                                            <button
                                                onClick={() => setShowStats(false)}
                                                className={`px-4 py-2 rounded-full font-medium flex items-center transition-colors ${!showStats ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                            >
                                                <ListMusic className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => setShowStats(true)}
                                                className={`px-4 py-2 rounded-full font-medium flex items-center transition-colors ${showStats ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                            >
                                                <Disc3 className="h-4 w-4" />
                                            </button>

                                            <button
                                                onClick={() => setShowShareModal(true)}
                                                className="px-4 py-2 rounded-full font-medium flex items-center bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                                            >
                                                <Share2 className="h-4 w-4" />
                                            </button>

                                            <button
                                                onClick={() => setShowTagModal(true)}
                                                className="px-4 py-2 rounded-full font-medium flex items-center bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                                            >
                                                <Tag className="h-4 w-4" />
                                            </button>

                                            <EventNotes eventId={id} />
                                        </div>

                                        <div className="flex items-center justify-center gap-2 mt-4 sm:mt-0 sm:ml-4">
                                            <Switch
                                                id="accept-songs"
                                                checked={evento.aceptaCanciones}
                                                onCheckedChange={toggleAcceptSongs}
                                                disabled={isLoading}
                                            />
                                            <label htmlFor="accept-songs" className="text-sm font-medium">
                                                {evento.aceptaCanciones ? "Recibiendo canciones" : "No recibir canciones"}
                                            </label>
                                            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {showStats ? (
                                    <div className="lg:col-span-3">
                                        <EventStats
                                            totalCanciones={totalCanciones}
                                            cantidadSolicitadas={cantidadSolicitadas}
                                            cantidadColocadas={cantidadColocadas}
                                            cantidadDescartadas={cantidadDescartadas}
                                            canciones={canciones}
                                            colocadas={colocadas}
                                            descartados={descartados}
                                            timelineData={timelineData}
                                        />
                                    </div>
                                ) : (
                                    <div className="lg:col-span-3">
                                        <div className="bg-white rounded-lg border border-gray-200">
                                            <div className="px-4 py-4 border-b border-gray-200 bg-gray-50 flex flex-wrap gap-2 justify-center items-center md:justify-between">
                                                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                                                    {mostrarLista === "solicitadas" ? `x${cantidadSolicitadas} Canciones solicitadas` :
                                                        mostrarLista === "descartadas" ? `x${cantidadDescartadas} Canciones Descartadas` :
                                                            `x${cantidadColocadas} Canciones Colocadas`}
                                                </h2>

                                                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2">
                                                    {mostrarLista === "solicitadas" && (
                                                        <div className="relative w-full sm:w-auto">
                                                            <input
                                                                type="text"
                                                                placeholder="Filtrar por artista..."
                                                                value={filtroArtista}
                                                                onChange={(e) => setFiltroArtista(e.target.value)}
                                                                className="text-sm w-full px-3 py-1 border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                            />
                                                            {filtroArtista && (
                                                                <button
                                                                    onClick={() => setFiltroArtista("")}
                                                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                    {descartados.length > 0 && (
                                                        <button
                                                            onClick={() => setMostrarLista(mostrarLista === "descartadas" ? "solicitadas" : "descartadas")}
                                                            className={`text-xs px-3 py-1 rounded-full font-medium flex items-center ${mostrarLista === "descartadas" ? 'bg-red-600 text-white' : 'bg-red-100 text-red-800 hover:bg-red-200'
                                                                }`}
                                                        >
                                                            <Ban className="h-3 w-3 mr-1" />
                                                            <p>Descartadas <span>{descartados.length}</span></p>
                                                        </button>
                                                    )}
                                                    {colocadas.length > 0 && (
                                                        <button
                                                            onClick={() => setMostrarLista(mostrarLista === "colocadas" ? "solicitadas" : "colocadas")}
                                                            className={`text-xs px-3 py-1 rounded-full font-medium flex items-center ${mostrarLista === "colocadas" ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800 hover:bg-green-200'
                                                                }`}
                                                        >
                                                            <Check className="h-3 w-3 mr-1" />
                                                            <p>Colocadas <span>{colocadas.length}</span></p>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="p-4">
                                                {mostrarLista === "solicitadas" && tags.length > 0 && (
                                                    <TagFilterSelector />
                                                )}

                                                {mostrarLista === "solicitadas" ? (
                                                    filtrarPorArtistaYTags(canciones).length > 0 ? (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                            {filtrarPorArtistaYTags(canciones).map((cancion, index) => (
                                                                <motion.div
                                                                    key={cancion.id}
                                                                    initial={{ opacity: 0, y: 10 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    transition={{ duration: 0.2, delay: index * 0.05 }}
                                                                    className={`bg-gray-50 hover:bg-gray-100 rounded-lg p-4 transition-colors border ${index === 0 ? 'border-l-4 border-indigo-500' : 'border-gray-200'
                                                                        }`}
                                                                >
                                                                    <div className="flex flex-col h-full">
                                                                        <div className="flex items-start">
                                                                            <img
                                                                                src={cancion.albumCover}
                                                                                alt={cancion.title}
                                                                                className="w-16 h-16 rounded-md object-cover flex-shrink-0"
                                                                            />
                                                                            <div className="ml-3 flex-1 min-w-0">
                                                                                <h3 className="text-sm font-medium text-gray-900 truncate">{cancion.title}</h3>
                                                                                <p className="text-xs text-gray-500 truncate">{cancion.artist}</p>
                                                                                <p className="text-xs text-gray-400 mt-1">
                                                                                    {formatFirebaseTimestamp(cancion.timestamp)}
                                                                                </p>
                                                                            </div>
                                                                        </div>

                                                                        <div className="mt-3 flex justify-between items-center">
                                                                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${cancion.count > 5 ? 'bg-green-100 text-green-800' :
                                                                                cancion.count > 3 ? 'bg-blue-100 text-blue-800' :
                                                                                    'bg-indigo-100 text-indigo-800'
                                                                                }`}>
                                                                                {cancion.count} votos
                                                                            </span>

                                                                            <div className="flex space-x-2">
                                                                                <button
                                                                                    onClick={() => marcarComoColocada(cancion.id)}
                                                                                    className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-full transition-colors"
                                                                                    title="Marcar como colocada"
                                                                                >
                                                                                    <Check className="h-4 w-4" />
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => descartarCancion(cancion.id)}
                                                                                    className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full transition-colors"
                                                                                    title="Descartar canción"
                                                                                >
                                                                                    <X className="h-4 w-4" />
                                                                                </button>
                                                                            </div>
                                                                        </div>

                                                                        {(cancion.messages?.length > 0 || cancion.message) && (
                                                                            <div className="mt-2">
                                                                                <button
                                                                                    onClick={() => toggleMessages(cancion.id)}
                                                                                    className="flex items-center text-xs text-gray-500 hover:text-gray-700"
                                                                                >
                                                                                    <MessageSquareDot className="h-3 w-3 mr-1" />
                                                                                    {expandedMessages[cancion.id] ? (
                                                                                        <>
                                                                                            <span>Ocultar mensajes</span>
                                                                                            <ChevronUp className="h-3 w-3 ml-1" />
                                                                                        </>
                                                                                    ) : (
                                                                                        <>
                                                                                            <span>Mostrar mensajes ({cancion.messages?.length || (cancion.message ? 1 : 0)})</span>
                                                                                            <ChevronDown className="h-3 w-3 ml-1" />
                                                                                        </>
                                                                                    )}
                                                                                </button>

                                                                                <AnimatePresence>
                                                                                    {expandedMessages[cancion.id] && (
                                                                                        <motion.div
                                                                                            initial={{ opacity: 0, height: 0 }}
                                                                                            animate={{ opacity: 1, height: 'auto' }}
                                                                                            exit={{ opacity: 0, height: 0 }}
                                                                                            transition={{ duration: 0.2 }}
                                                                                            className="mt-2 space-y-2 overflow-hidden"
                                                                                        >
                                                                                            {/* Mensaje antiguo (para compatibilidad con versiones anteriores) */}
                                                                                            {cancion.message && (
                                                                                                <div className="bg-gray-100 p-2 rounded-md text-xs text-gray-700">
                                                                                                    <div className="flex justify-between items-start">
                                                                                                        <p>{cancion.message}</p>
                                                                                                        <span className="text-gray-500 text-xxs whitespace-nowrap ml-2">
                                                                                                            {formatTimeShort(cancion.timestamp)}
                                                                                                        </span>
                                                                                                    </div>
                                                                                                </div>
                                                                                            )}

                                                                                            {/* Historial de mensajes */}
                                                                                            {cancion.messages?.map((msg, idx) => (
                                                                                                <div key={idx} className="bg-gray-100 p-2 rounded-md text-xs text-gray-700">
                                                                                                    <div className="flex justify-between items-start">
                                                                                                        <p>{msg.text}</p>
                                                                                                        <span className="text-gray-500 text-xxs whitespace-nowrap ml-2">
                                                                                                            {msg.timestamp ? formatTimeShort({ seconds: msg.timestamp.getTime() / 1000 }) : ""}
                                                                                                        </span>
                                                                                                    </div>
                                                                                                </div>
                                                                                            ))}
                                                                                        </motion.div>
                                                                                    )}
                                                                                </AnimatePresence>
                                                                            </div>
                                                                        )}

                                                                        {/* Sección de tags */}
                                                                        <div className="mt-2">
                                                                            <div className="flex flex-wrap gap-1 mb-1">
                                                                                {selectedTags[cancion.id]?.map(tagId => {
                                                                                    const tag = tags.find(t => t.id === tagId);
                                                                                    return tag ? (
                                                                                        <span
                                                                                            key={tagId}
                                                                                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                                                                                            style={{ backgroundColor: `${tag.color}20`, color: tag.color, border: `1px solid ${tag.color}` }}
                                                                                        >
                                                                                            {tag.name}
                                                                                        </span>
                                                                                    ) : null;
                                                                                })}
                                                                            </div>

                                                                            <button
                                                                                onClick={() => toggleTagSelector(cancion.id)}
                                                                                className="flex items-center text-xs text-gray-500 hover:text-gray-700"
                                                                            >
                                                                                <Tag className="h-3 w-3 mr-1" />
                                                                                {showTagSelector === cancion.id ? (
                                                                                    <>
                                                                                        <span>Ocultar tags</span>
                                                                                        <ChevronUp className="h-3 w-3 ml-1" />
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <span>Asignar tags</span>
                                                                                        <ChevronDown className="h-3 w-3 ml-1" />
                                                                                    </>
                                                                                )}
                                                                            </button>

                                                                            <AnimatePresence>
                                                                                {showTagSelector === cancion.id && (
                                                                                    <motion.div
                                                                                        initial={{ opacity: 0, height: 0 }}
                                                                                        animate={{ opacity: 1, height: 'auto' }}
                                                                                        exit={{ opacity: 0, height: 0 }}
                                                                                        transition={{ duration: 0.2 }}
                                                                                        className="mt-2 space-y-1 overflow-hidden"
                                                                                    >
                                                                                        <div className="flex flex-wrap gap-1">
                                                                                            {tags.map(tag => (
                                                                                                <button
                                                                                                    key={tag.id}
                                                                                                    onClick={() => toggleTagForSong(cancion.id, tag.id)}
                                                                                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${selectedTags[cancion.id]?.includes(tag.id) ?
                                                                                                        `text-white` :
                                                                                                        `opacity-70 hover:opacity-100`}`}
                                                                                                    style={{
                                                                                                        backgroundColor: selectedTags[cancion.id]?.includes(tag.id) ?
                                                                                                            tag.color : `${tag.color}20`,
                                                                                                        border: `1px solid ${tag.color}`,
                                                                                                        color: selectedTags[cancion.id]?.includes(tag.id) ?
                                                                                                            'white' : tag.color
                                                                                                    }}
                                                                                                >
                                                                                                    {tag.name}
                                                                                                </button>
                                                                                            ))}
                                                                                        </div>
                                                                                    </motion.div>
                                                                                )}
                                                                            </AnimatePresence>
                                                                        </div>
                                                                    </div>
                                                                </motion.div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-8">
                                                            <Music className="mx-auto h-12 w-12 text-gray-400" />
                                                            <h3 className="mt-2 text-sm font-medium text-gray-900">
                                                                {filtroArtista ? "No hay canciones del artista buscado" : "No hay canciones solicitadas"}
                                                            </h3>
                                                            <p className="mt-1 text-sm text-gray-500">
                                                                {filtroArtista ? "Intenta con otro nombre de artista" : "Todavía no se han solicitado canciones para este evento."}
                                                            </p>
                                                            {filtroArtista && (
                                                                <button
                                                                    onClick={() => setFiltroArtista("")}
                                                                    className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
                                                                >
                                                                    Limpiar filtro
                                                                </button>
                                                            )}
                                                        </div>
                                                    )
                                                ) : mostrarLista === "descartadas" ? (
                                                    descartados.length > 0 ? (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                            {descartados.map((cancion) => (
                                                                <motion.div
                                                                    key={cancion.id}
                                                                    initial={{ opacity: 0, y: 10 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    transition={{ duration: 0.2 }}
                                                                    className="bg-gray-50 hover:bg-gray-100 rounded-lg p-4 transition-colors border-l-4 border-red-500 border"
                                                                >
                                                                    <div className="flex flex-col h-full">
                                                                        <div className="flex items-start">
                                                                            <img
                                                                                src={cancion.albumCover}
                                                                                alt={cancion.title}
                                                                                className="w-16 h-16 rounded-md object-cover flex-shrink-0"
                                                                            />
                                                                            <div className="ml-3 flex-1 min-w-0">
                                                                                <h3 className="text-sm font-medium text-gray-900 truncate">{cancion.title}</h3>
                                                                                <p className="text-xs text-gray-500 truncate">{cancion.artist}</p>
                                                                                <p className="text-xs text-gray-400 mt-1">
                                                                                    Descartada: {formatFirebaseTimestamp(cancion.descartadoTimestamp)}
                                                                                </p>
                                                                            </div>
                                                                        </div>

                                                                        <div className="mt-3 flex justify-end">
                                                                            <button
                                                                                onClick={() => restaurarCancion(cancion.id)}
                                                                                className="flex items-center text-sm text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-3 py-1 rounded-full transition-colors"
                                                                            >
                                                                                <RotateCcw className="h-4 w-4 mr-1" />
                                                                                Restaurar
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </motion.div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-8">
                                                            <Ban className="mx-auto h-12 w-12 text-gray-400" />
                                                            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay canciones descartadas</h3>
                                                            <p className="mt-1 text-sm text-gray-500">Todavía no se han descartado canciones para este evento.</p>
                                                        </div>
                                                    )
                                                ) : colocadas.length > 0 ? (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        {colocadas.map((cancion) => (
                                                            <motion.div
                                                                key={cancion.id}
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ duration: 0.2 }}
                                                                className="bg-gray-50 hover:bg-gray-100 rounded-lg p-4 transition-colors border-l-4 border-green-500 border"
                                                            >
                                                                <div className="flex flex-col h-full">
                                                                    <div className="flex items-start">
                                                                        <img
                                                                            src={cancion.albumCover}
                                                                            alt={cancion.title}
                                                                            className="w-16 h-16 rounded-md object-cover flex-shrink-0"
                                                                        />
                                                                        <div className="ml-3 flex-1 min-w-0">
                                                                            <h3 className="text-sm font-medium text-gray-900 truncate">{cancion.title}</h3>
                                                                            <p className="text-xs text-gray-500 truncate">{cancion.artist}</p>
                                                                            <p className="text-xs text-gray-400 mt-1">
                                                                                Colocada: {formatFirebaseTimestamp(cancion.colocadaTimestamp)}
                                                                            </p>
                                                                        </div>
                                                                    </div>

                                                                    <div className="mt-3 flex justify-between items-center">
                                                                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${cancion.count > 5 ? 'bg-green-100 text-green-800' :
                                                                            cancion.count > 3 ? 'bg-blue-100 text-blue-800' :
                                                                                'bg-indigo-100 text-indigo-800'
                                                                            }`}>
                                                                            {cancion.count} votos
                                                                        </span>

                                                                        <button
                                                                            onClick={() => desmarcarComoColocada(cancion.id)}
                                                                            className="flex items-center text-sm text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 px-3 py-1 rounded-full transition-colors"
                                                                        >
                                                                            <RotateCcw className="h-4 w-4 mr-1" />
                                                                            Desmarcar
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-8">
                                                        <Check className="mx-auto h-12 w-12 text-gray-400" />
                                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No hay canciones colocadas</h3>
                                                        <p className="mt-1 text-sm text-gray-500">Todavía no se han marcado canciones como ya colocadas.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </main>
        </div>
    );
}