"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, QrCode, X, Plus, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Modal } from "@/components/modal";
import toast from "react-hot-toast";
import { db, auth } from "@/../lib/firebase";
import { collection, addDoc, getDocs, doc, deleteDoc, query, where } from "firebase/firestore";

export const QRGenerator = ({ dominantColor, textColor }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [qrName, setQrName] = useState("");
    const [generatedQRs, setGeneratedQRs] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedQR, setSelectedQR] = useState(null);
    const [qrEvents, setQrEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(false);
    const [showQRDetailModal, setShowQRDetailModal] = useState(false);

    // Obtener QRs existentes
    useEffect(() => {
        const fetchQRs = async () => {
            try {
                const user = auth.currentUser;
                if (!user) return;

                const qrsRef = collection(db, "qrcodes");
                const q = query(qrsRef, where("createdBy", "==", user.uid));
                const querySnapshot = await getDocs(q);

                const qrs = [];
                querySnapshot.forEach((doc) => {
                    qrs.push({ id: doc.id, ...doc.data() });
                });

                setGeneratedQRs(qrs);
            } catch (error) {
                console.error("Error al cargar QRs:", error);
                toast.error("Error al cargar códigos QR existentes");
            } finally {
                setIsLoading(false);
            }
        };

        fetchQRs();
    }, []);

    // Obtener eventos asociados a un QR
    const fetchEventsForQR = async (qrId) => {
        setLoadingEvents(true);
        try {
            const eventsRef = collection(db, "eventos");
            const q = query(eventsRef, where("qrCodeId", "==", qrId));
            const querySnapshot = await getDocs(q);

            const events = [];
            querySnapshot.forEach((doc) => {
                events.push({ id: doc.id, ...doc.data() });
            });

            setQrEvents(events);
        } catch (error) {
            console.error("Error al cargar eventos:", error);
            toast.error("Error al cargar eventos asociados");
        } finally {
            setLoadingEvents(false);
        }
    };

    const handleQRClick = (qr) => {
        setSelectedQR(qr);
        fetchEventsForQR(qr.id);
        setShowQRDetailModal(true);
    };

    const generateRandomCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 10; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    const handleGenerateQR = async () => {
        if (!qrName.trim()) {
            toast.error("Por favor ingresa un nombre para el QR");
            return;
        }

        const user = auth.currentUser;
        if (!user) {
            toast.error("Debes iniciar sesión para generar QRs");
            return;
        }

        setIsGenerating(true);

        try {
            const qrCode = generateRandomCode();
            const qrData = {
                name: qrName,
                code: qrCode,
                createdBy: user.uid,
                createdAt: new Date().toISOString(),
            };

            const docRef = await addDoc(collection(db, "qrcodes"), qrData);
            setGeneratedQRs([...generatedQRs, { id: docRef.id, ...qrData }]);
            setQrName("");
            setIsModalOpen(false);
            toast.success("QR generado y guardado exitosamente");
        } catch (error) {
            console.error("Error al generar QR:", error);
            toast.error("Error al guardar el código QR");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDeleteQR = async (qrId) => {
        try {
            // Verificar si el QR está asociado a algún evento
            const eventsRef = collection(db, "eventos");
            const q = query(eventsRef, where("qrCodeId", "==", qrId));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                toast.error("No puedes eliminar este QR porque está asociado a eventos");
                return;
            }

            await deleteDoc(doc(db, "qrcodes", qrId));
            setGeneratedQRs(generatedQRs.filter(qr => qr.id !== qrId));

            if (selectedQR?.id === qrId) {
                setSelectedQR(null);
                setQrEvents([]);
            }

            toast.success("QR eliminado correctamente");
        } catch (error) {
            console.error("Error al eliminar QR:", error);
            toast.error("Error al eliminar el código QR");
        }
    };

    const downloadQR = (id, code) => {
        const svg = document.getElementById(`qr-${id}`);
        if (svg) {
            const svgData = new XMLSerializer().serializeToString(svg);
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const img = new Image();

            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                const pngUrl = canvas.toDataURL("image/png");
                const downloadLink = document.createElement("a");
                downloadLink.href = pngUrl;
                downloadLink.download = `qr-${code}.png`;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
            };

            img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp?.seconds) return "Fecha no disponible";
        const date = new Date(timestamp.seconds * 1000);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="w-full max-w-6xl mx-auto">
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                {/* Header */}
                <div className="px-6 py-4 border-gray-200">
                    <div className="flex flex-col sm:justify-between gap-3">
                        <div className="">
                            <div>
                                <p className="text-lg text-start font-semibold text-gray-800">Códigos QR</p>
                            </div>
                        </div>
                        <Button
                            onClick={() => setIsModalOpen(true)}
                            style={{ backgroundColor: dominantColor, color: textColor }}
                            className="shrink-0 w-full flex gap-2 justify-center items-center"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Nuevo QR</span>
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 pb-6">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                        </div>
                    ) : generatedQRs.length > 0 ? (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <p className="text-lg font-medium text-gray-800">Tus códigos QR</p>
                                <span className="text-sm text-gray-500">
                                    {generatedQRs.length} {generatedQRs.length === 1 ? 'código' : 'códigos'}
                                </span>
                            </div>

                            <div className="space-y-3">
                                {generatedQRs.map((qr) => (
                                    <div
                                        key={qr.id}
                                        className="group relative border border-gray-300 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 bg-white cursor-pointer"
                                        onClick={() => handleQRClick(qr)}
                                    >
                                        <div className="p-4 flex justify-between flex-wrap items-center">
                                            <div className="text-start">
                                                <h3 className="font-medium text-gray-800 truncate">{qr.name}</h3>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Creado: {new Date(qr.createdAt).toLocaleDateString('es-ES', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </p>
                                            </div>

                                            <div className="flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        downloadQR(qr.id, qr.code);
                                                    }}
                                                    className="text-indigo-600 hover:bg-indigo-50"
                                                    style={{ backgroundColor: dominantColor, color: textColor }}
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteQR(qr.id);
                                                    }}
                                                    className="text-red-600 hover:bg-red-50"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="mx-auto w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                                <QrCode className="h-10 w-10 text-indigo-500" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-800">No hay códigos QR</h3>
                            <p className="text-gray-500 mt-2 mb-6 max-w-md mx-auto">
                                Crea tu primer código QR para compartir información de manera rápida y sencilla
                            </p>
                            <Button
                                onClick={() => setIsModalOpen(true)}
                                size="lg"
                            >
                                <Plus className="h-5 w-5 mr-2" />
                                Crear primer QR
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal para generación de QR */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-gray-800">Nuevo código QR</h3>
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre descriptivo
                            </label>
                            <Input
                                type="text"
                                value={qrName}
                                onChange={(e) => setQrName(e.target.value)}
                                placeholder="Ej: Mesa VIP, Entrada Principal, Menú Digital"
                                className="w-full"
                            />
                            <p className="mt-1 text-sm text-gray-500">
                                Este nombre te ayudará a identificar el código QR más tarde
                            </p>
                        </div>

                        <div className="pt-2">
                            <Button
                                onClick={handleGenerateQR}
                                disabled={isGenerating}
                                className="w-full py-3"
                            >
                                {isGenerating ? (
                                    <span className="flex items-center justify-center">
                                        <span className="animate-pulse mr-2">⚡</span>
                                        Generando...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center">
                                        <QrCode className="h-5 w-5 mr-2" />
                                        Generar código QR
                                    </span>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Modal para detalles del QR */}
            {selectedQR && (
                <Modal isOpen={showQRDetailModal} onClose={() => setShowQRDetailModal(false)} size="lg">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-gray-800">Detalles del QR</h3>
                            <button
                                onClick={() => setShowQRDetailModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="flex flex-col items-center">
                                <div className="border-2 border-gray-200 p-3 rounded-lg bg-white mb-4">
                                    <QRCodeSVG
                                        id={`qr-${selectedQR.id}`}
                                        value={"https://encabina.vercel.app/event/dj-event/" + "EV-" + selectedQR.code}
                                        size={180}
                                        level="H"
                                        includeMargin={false}
                                    />
                                </div>
                                <h4 className="text-xl font-medium text-gray-800">{selectedQR.name}</h4>
                                <p className="text-sm text-gray-500">Código: {selectedQR.code}</p>
                            </div>

                            <div className="border-t border-gray-200 pt-4">
                                <h4 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                                    <Calendar className="h-5 w-5 mr-2" />
                                    Eventos asociados ({qrEvents.length})
                                </h4>

                                {loadingEvents ? (
                                    <div className="flex justify-center py-4">
                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                                    </div>
                                ) : qrEvents.length > 0 ? (
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                                        {qrEvents.map(event => (
                                            <div key={event.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                                                <h5 className="font-medium text-gray-800">{event.nombre}</h5>
                                                <div className="flex items-center text-sm text-gray-500 mt-1">
                                                    <MapPin className="h-4 w-4 mr-1" />
                                                    <span>{event.ubicacionCompleta || "Ubicación no especificada"}</span>
                                                </div>
                                                <div className="text-xs text-gray-400 mt-2">
                                                    {formatDate(event.horaInicio)} - {formatDate(event.horaFin)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-gray-500">
                                        Este QR no está asociado a ningún evento
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};