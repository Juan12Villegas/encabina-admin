"use client";
import Navbar from "@/components/Navbar";
import { useState, useEffect } from "react";
import { db, auth, doc, getDoc, setDoc, onAuthStateChanged } from "@/../lib/firebase";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { BadgeCheck, Instagram, Music2, Facebook, X, Download, Package } from "lucide-react";
import Image from "next/image";
import { toPng, toJpeg, toSvg } from 'html-to-image';
import { downloadQRCodeAsPDF } from "@/utils/downloadQR";
import toast from "react-hot-toast";
import { serverTimestamp } from "firebase/firestore";

export default function Profile({ dominantColor, colorText, startPeriode, endPeriode }) {
    const [djId, setDjId] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [showPdfModal, setShowPdfModal] = useState(false);
    const [showDomicilioModal, setShowDomicilioModal] = useState(false);
    const [imageFormat, setImageFormat] = useState('png');
    const [imageSize, setImageSize] = useState(500);
    const [pdfSize, setPdfSize] = useState(100);
    const [contactNumber, setContactNumber] = useState("");
    const [deliveryAddress, setDeliveryAddress] = useState("");
    const [hasRequestedQRThisPeriod, setHasRequestedQRThisPeriod] = useState(false);
    const [loadingRequest, setLoadingRequest] = useState(false);
    const [isCurrentDateInPeriod, setIsCurrentDateInPeriod] = useState(false);

    const [profileData, setProfileData] = useState({
        nombreDJ: "",
        plan: "",
        descripcion: "",
        instagram: "",
        tiktok: "",
        facebook: "",
    });
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const checkCurrentDateInPeriod = () => {
        const currentDate = new Date();
        // Establecer la hora de currentDate a 00:00:00 para comparar solo fechas
        currentDate.setHours(0, 0, 0, 0);

        console.log(currentDate);

        const startDate = new Date(startPeriode);
        // Establecer la hora de startDate a 00:00:00 para comparar solo fechas
        startDate.setHours(0, 0, 0, 0);

        console.log(startDate);

        const endDate = new Date(endPeriode);
        // Establecer la hora de endDate a 00:00:00 para comparar solo fechas
        endDate.setHours(0, 0, 0, 0);

        console.log(endDate);

        return currentDate >= startDate && currentDate <= endDate;
    };

    // Cargar los datos del usuario al iniciar
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.push("/login");
                return;
            }

            try {
                // Verificar si la fecha actual está dentro del período
                setIsCurrentDateInPeriod(checkCurrentDateInPeriod());

                const djRef = doc(db, "djs", user.uid);
                const djSnap = await getDoc(djRef);

                const userRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userRef);

                if (djSnap.exists() && userSnap.exists()) {
                    setDjId(user.uid);
                    setProfileData({
                        nombreDJ: djSnap.data().nombreDJ || "No especificado",
                        plan: userSnap.data().plan || "No especificado",
                        descripcion: djSnap.data().descripcion || "No especificado",
                        instagram: djSnap.data().instagram || "No especificado",
                        tiktok: djSnap.data().tiktok || "No especificado",
                        facebook: djSnap.data().facebook || "No especificado",
                    });

                    // Verificar si ya ha solicitado QR este período
                    const qrRequestRef = doc(db, "qr_domicilio_requests", user.uid);
                    const qrRequestSnap = await getDoc(qrRequestRef);

                    if (qrRequestSnap.exists()) {
                        const requestData = qrRequestSnap.data();
                        const requestStartDate = new Date(requestData.startPeriode);
                        const requestEndDate = new Date(requestData.endPeriode);
                        const currentStartDate = new Date(startPeriode);
                        const currentEndDate = new Date(endPeriode);

                        // Verificar si la solicitud anterior fue en el mismo período actual
                        if (
                            requestStartDate.getTime() === currentStartDate.getTime() &&
                            requestEndDate.getTime() === currentEndDate.getTime()
                        ) {
                            setHasRequestedQRThisPeriod(true);
                        }
                    }
                }
            } catch (error) {
                console.error("Error cargando datos del usuario:", error);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [router, startPeriode, endPeriode]);

    // Función para manejar la solicitud de QR a domicilio
    const handleQRDomicilioRequest = async () => {
        if (!contactNumber || !deliveryAddress) {
            toast.error("Por favor completa todos los campos");
            return;
        }

        if (!isCurrentDateInPeriod) {
            toast.error("No se pueden realizar solicitudes fuera del período activo");
            return;
        }

        setLoadingRequest(true);
        try {
            // Registrar la solicitud en Firestore
            await setDoc(doc(db, "qr_domicilio_requests", djId), {
                contactNumber,
                deliveryAddress,
                djName: profileData.nombreDJ,
                startPeriode,
                endPeriode,
                requestedAt: serverTimestamp(),
                status: "pending"
            });

            // Actualizar estado local
            setHasRequestedQRThisPeriod(true);
            toast.success("Solicitud de QR a domicilio enviada correctamente");
            setShowDomicilioModal(false);
        } catch (error) {
            console.error("Error al solicitar QR a domicilio:", error);
            toast.error("Error al enviar la solicitud");
        } finally {
            setLoadingRequest(false);
        }
    };

    // Función para extraer el nombre de usuario de Instagram
    const extractInstagramUsername = (url) => {
        if (!url) return "No especificado";

        const match = url.match(/instagram\.com\/([a-zA-Z0-9_.]+)/);
        return match ? `@${match[1]}` : "No especificado";
    };

    // Función para extraer el nombre de usuario de Tiktok
    const extractTiktokUsername = (url) => {
        if (!url) return "No especificado";

        const match = url.match(/tiktok\.com\/@?([a-zA-Z0-9_.]+)/);
        return match ? `@${match[1]}` : "No especificado";
    };

    // Función para extraer el nombre de usuario de Facebook
    const extractFacebookUsername = (url) => {
        if (!url) return "No especificado";

        const match = url.match(/facebook\.com\/([a-zA-Z0-9_.]+)/);
        return match ? `@${match[1]}` : "No especificado";
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
        link.download = `qr-${profileData.nombreDJ}.${imageFormat}`;
        link.href = dataUrl;
        link.click();
    };

    const handleDownload = () => {
        downloadQR();
        setShowModal(false);
    };

    const handleDownloadPdf = () => {
        const qrElement = document.querySelector('.qr-container');
        if (qrElement) {
            downloadQRCodeAsPDF(profileData.nombreDJ, djId, qrElement, pdfSize);
        }
        setShowPdfModal(false);
    };

    const handleOpenDomicilioModal = () => {
        if (!isCurrentDateInPeriod) {
            toast.error("Las solicitudes de QR a domicilio solo están disponibles durante el período activo");
            return;
        }

        if (hasRequestedQRThisPeriod) {
            toast.error("Ya has solicitado un QR a domicilio en este período");
            return;
        }

        setShowDomicilioModal(true);
    };

    if (loading) {
        return <p className="text-center text-gray-700">Cargando...</p>;
    }

    return (
        <div>
            <div className="h-max m-auto flex flex-col items-center justify-center bg-white text-black">
                <div className="max-w-sm md:max-w-md w-full overflow-hidden rounded-lg">
                    <div className="mx-auto text-center">
                        <div className="w-36 h-36 m-auto md:w-32 md:h-32 rounded-xl border-4 border-white overflow-hidden shadow-lg flex justify-center items-center qr-container">
                            <QRCodeSVG value={"https://encabina.vercel.app/event/dj-event/" + "DJ-" + djId} size={120} />
                        </div>
                    </div>
                    <div className="py-6 px-4 pt-3 text-center">
                        <div className="flex items-center justify-center space-x-2">
                            <h2 className="text-xl md:text-2xl font-bold">{profileData ? profileData.nombreDJ : "Cargando DJ..."}</h2>
                            <BadgeCheck className={`w-5 h-5 
                    ${profileData?.plan === "bassline" ? "text-green-600" :
                                    profileData?.plan === "drop pro" ? "text-purple-600" :
                                        profileData?.plan === "mainstage" ? "text-blue-600" : "text-gray-600"
                                }
                `} />
                        </div>
                        <p className={`w-fit text-center mx-auto text-sm font-semibold px-2 py-0.5 rounded-full ${profileData?.plan === "bassline" ? "bg-green-100 text-green-600" :
                            profileData?.plan === "drop pro" ? "bg-purple-100 text-purple-600" :
                                profileData?.plan === "mainstage" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                            }`}>
                            {profileData?.plan.toUpperCase()}
                        </p>
                        <p className="mt-2">{profileData?.descripcion}</p>
                        <div>
                            {profileData.instagram && (
                                <div className="flex items-center justify-center text-gray-400 mt-4 space-x-4">
                                    <Instagram className="mr-1" />
                                    <a
                                        href={profileData.instagram}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-500 hover:underline"
                                    >
                                        {extractInstagramUsername(profileData.instagram)}
                                    </a>
                                </div>
                            )}
                            {profileData.tiktok && (
                                <div className="flex items-center justify-center text-gray-400 mt-4 space-x-4">
                                    <Music2 className="mr-1" />
                                    <a
                                        href={profileData.tiktok}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-500 hover:underline"
                                    >
                                        {extractTiktokUsername(profileData.tiktok)}
                                    </a>
                                </div>
                            )}
                            {profileData.facebook && (
                                <div className="flex items-center justify-center text-gray-400 mt-4 space-x-4">
                                    <Facebook className="mr-1" />
                                    <a
                                        href={profileData.facebook}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-500 hover:underline"
                                    >
                                        {extractFacebookUsername(profileData.facebook)}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-2 flex-wrap items-center justify-end border-t border-gray-200 px-4 py-4 sm:px-6">
                <div
                    style={{ backgroundColor: dominantColor, color: colorText }}
                    className="w-full inline-flex justify-center rounded-md border border-transparent bg-gray-800 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-900 focus:outline-none hover:cursor-pointer"
                    onClick={() => setShowModal(true)}>
                    <Download className="mr-1" />
                    <button type="button">
                        QR como Imagen
                    </button>
                </div>

                <div
                    style={{ backgroundColor: dominantColor, color: colorText }}
                    className="w-full inline-flex justify-center rounded-md border border-transparent bg-gray-800 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-900 focus:outline-none hover:cursor-pointer"
                    onClick={() => setShowPdfModal(true)}>
                    <Download className="mr-1" />
                    <button type="button">
                        QR como PDF
                    </button>
                </div>

                <div
                    style={{ backgroundColor: dominantColor, color: colorText }}
                    className={`w-full inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none ${!isCurrentDateInPeriod || hasRequestedQRThisPeriod ? "bg-gray-400 cursor-not-allowed" : "bg-gray-800 hover:bg-gray-900"
                        }`}
                    onClick={handleOpenDomicilioModal}>
                    <Package className="mr-1" />
                    <button type="button" disabled={!isCurrentDateInPeriod || hasRequestedQRThisPeriod}>
                        {!isCurrentDateInPeriod ? "Fuera de período" :
                            hasRequestedQRThisPeriod ? "Solicitado este período" : "Solicitar QR a Domicilio"}
                    </button>
                </div>
            </div>

            {/* Modal para descargar QR como imagen */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md m-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">Descargar QR como imagen</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Formato de imagen</label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    onClick={() => setImageFormat('png')}
                                    className={`py-2 px-4 rounded ${imageFormat === 'png' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-800'}`}
                                >
                                    PNG
                                </button>
                                <button
                                    onClick={() => setImageFormat('jpeg')}
                                    className={`py-2 px-4 rounded ${imageFormat === 'jpeg' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-800'}`}
                                >
                                    JPEG
                                </button>
                                <button
                                    onClick={() => setImageFormat('svg')}
                                    className={`py-2 px-4 rounded ${imageFormat === 'svg' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-800'}`}
                                >
                                    SVG
                                </button>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tamaño de imagen (px)</label>
                            <input
                                type="range"
                                min="100"
                                max="3000"
                                step="50"
                                value={imageSize}
                                onChange={(e) => setImageSize(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="text-center mt-2 text-gray-700">{imageSize}px × {imageSize}px</div>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDownload}
                                className="px-4 py-2 bg-gray-800 text-white rounded-md text-sm font-medium hover:bg-gray-900"
                            >
                                Descargar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para descargar QR como PDF */}
            {showPdfModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md m-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">Descargar QR como PDF</h3>
                            <button onClick={() => setShowPdfModal(false)} className="text-gray-500 hover:text-gray-700">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tamaño del QR en el PDF (px)</label>
                            <input
                                type="range"
                                min="50"
                                max="200"
                                step="10"
                                value={pdfSize}
                                onChange={(e) => setPdfSize(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="text-center mt-2 text-gray-700">{pdfSize}px × {pdfSize}px</div>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowPdfModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDownloadPdf}
                                className="px-4 py-2 bg-gray-800 text-white rounded-md text-sm font-medium hover:bg-gray-900"
                            >
                                Descargar PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para solictar QR a domicilio */}
            {showDomicilioModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md m-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">Solicitar QR a Domicilio</h3>
                            <button onClick={() => setShowDomicilioModal(false)} className="text-gray-500 hover:text-gray-700">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Número de Contacto</label>
                            <input
                                type="number"
                                className="px-2 border border-gray-400 h-9 w-full rounded-sm"
                                value={contactNumber}
                                onChange={(e) => setContactNumber(e.target.value)}
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Dirección de Entrega</label>
                            <input
                                type="text"
                                className="px-2 border border-gray-400 h-9 w-full rounded-sm"
                                value={deliveryAddress}
                                onChange={(e) => setDeliveryAddress(e.target.value)}
                            />
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowDomicilioModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleQRDomicilioRequest}
                                disabled={loadingRequest}
                                className="px-4 py-2 bg-gray-800 text-white rounded-md text-sm font-medium hover:bg-gray-900 disabled:opacity-50"
                            >
                                {loadingRequest ? "Enviando..." : "Solicitar QR"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}