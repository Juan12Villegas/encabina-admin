import { useState, useEffect } from "react";
import { db, collection, addDoc, getDocs, auth, query, where } from "@/../lib/firebase";
import { Timestamp } from "firebase/firestore";
import ubigeoData from "@/../data/ubigeo.json";
import { X, Calendar, MapPin, Clock, Loader2, Plus, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import toast from "react-hot-toast";

export default function EventForm({
    setShowModal,
    djId,
    setEventos,
    eventsCreatedThisPeriod,
    eventLimit,
    userPlan,
    currentPeriod,
    dominantColor,
    textColor
}) {
    const [eventData, setEventData] = useState({
        nombre: "",
        lugar: "",
        direccion: "",
        horaInicio: "",
        horaFin: "",
        departamento: "",
        provincia: "",
        distrito: "",
        pais: "",
        qrCode: "",
        qrCodeId: "" // Nuevo campo para almacenar el ID del QR
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [showQRModal, setShowQRModal] = useState(false);
    const [qrEnabled, setQrEnabled] = useState(false);
    const [tempQRCode, setTempQRCode] = useState("");
    const [existingQRCodes, setExistingQRCodes] = useState([]);
    const [loadingQRCodes, setLoadingQRCodes] = useState(false);
    const [showQRSelector, setShowQRSelector] = useState(false);

    // Cargar QRs existentes al montar el componente
    useEffect(() => {
        const fetchQRCodes = async () => {
            setLoadingQRCodes(true);
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

                setExistingQRCodes(qrs);
            } catch (error) {
                console.error("Error al cargar QRs:", error);
                toast.error("Error al cargar códigos QR existentes");
            } finally {
                setLoadingQRCodes(false);
            }
        };

        fetchQRCodes();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEventData((prevData) => ({
            ...prevData,
            [name]: value.toUpperCase(),
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }
    };

    const generateQRCode = () => {
        const randomCode = Math.random().toString(36).substring(2, 7) + Math.random().toString(36).substring(2, 7);
        setTempQRCode(randomCode);
        setShowQRModal(true);
    };

    const confirmQRCode = () => {
        setEventData(prev => ({
            ...prev,
            qrCode: tempQRCode,
            qrCodeId: "" // Limpiar QR existente si se genera uno nuevo
        }));
        setShowQRModal(false);
    };

    // Función para seleccionar un QR existente
    const selectExistingQR = (qr) => {
        setEventData(prev => ({
            ...prev,
            qrCode: qr.code,
            qrCodeId: qr.id
        }));
        setShowQRSelector(false);
    };

    // Función para desvincular el QR actual
    const unlinkQR = () => {
        setEventData(prev => ({
            ...prev,
            qrCode: "",
            qrCodeId: ""
        }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!eventData.nombre) newErrors.nombre = "El nombre es requerido";
        if (!eventData.lugar) newErrors.lugar = "El lugar es requerido";
        if (!eventData.direccion) newErrors.direccion = "La dirección es requerida";
        if (!eventData.horaInicio) newErrors.horaInicio = "La hora de inicio es requerida";
        if (!eventData.horaFin) newErrors.horaFin = "La hora de fin es requerida";
        if (!eventData.departamento) newErrors.departamento = "El departamento es requerido";
        if (!eventData.provincia) newErrors.provincia = "La provincia es requerida";
        if (!eventData.distrito) newErrors.distrito = "El distrito es requerido";
        if (!eventData.pais) newErrors.pais = "El país es requerido";

        if (eventData.horaInicio && eventData.horaFin) {
            const inicio = new Date(eventData.horaInicio);
            const fin = new Date(eventData.horaFin);

            if (fin <= inicio) {
                newErrors.horaFin = "La hora de fin debe ser posterior a la de inicio";
            }

            if (userPlan !== "mainstage" && currentPeriod.start && currentPeriod.end) {
                const periodStart = new Date(currentPeriod.start);
                const periodEnd = new Date(currentPeriod.end);

                if (inicio < periodStart || inicio > periodEnd) {
                    newErrors.horaInicio = `La fecha debe estar entre ${periodStart.toLocaleDateString()} y ${periodEnd.toLocaleDateString()}`;
                }

                if (fin < periodStart || fin > periodEnd) {
                    newErrors.horaFin = `La fecha debe estar entre ${periodStart.toLocaleDateString()} y ${periodEnd.toLocaleDateString()}`;
                }
            }
        }

        if (userPlan !== "mainstage" && eventsCreatedThisPeriod >= eventLimit) {
            newErrors.general = `Has alcanzado el límite de ${eventLimit} eventos para tu período actual.`;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCreateEvent = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            const fechaInicio = Timestamp.fromDate(new Date(eventData.horaInicio));
            const fechaFin = Timestamp.fromDate(new Date(eventData.horaFin));

            const departamentoNombre = eventData.departamento;
            const provinciaNombre = eventData.provincia;
            const distritoNombre = eventData.distrito;

            const eventDataToSave = {
                ...eventData,
                horaInicio: fechaInicio,
                horaFin: fechaFin,
                estado: "pendiente",
                djId: djId,
                createdAt: Timestamp.now(),
                ubicacionCompleta: `${distritoNombre}, ${provinciaNombre}, ${departamentoNombre}, ${eventData.pais}`,
                qrCode: qrEnabled ? eventData.qrCode : "",
                qrCodeId: qrEnabled ? eventData.qrCodeId : "" // Guardar también el ID del QR
            };

            // Eliminar campos vacíos
            Object.keys(eventDataToSave).forEach(key => {
                if (eventDataToSave[key] === "") {
                    delete eventDataToSave[key];
                }
            });

            await addDoc(collection(db, "eventos"), eventDataToSave);
            setShowModal(false);
        } catch (error) {
            console.error("Error al crear evento:", error);
            alert("Hubo un error al crear el evento. Por favor intenta nuevamente.");
        }
        setLoading(false);
    };

    const getMinMaxDates = () => {
        if (userPlan === "mainstage" || !currentPeriod.start || !currentPeriod.end) {
            return { min: null, max: null };
        }

        const minDate = new Date(currentPeriod.start);
        const maxDate = new Date(currentPeriod.end);

        const formatForInput = (date) => {
            return date.toISOString().slice(0, 16);
        };

        return {
            min: formatForInput(minDate),
            max: formatForInput(maxDate)
        };
    };

    const { min, max } = getMinMaxDates();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={() => setShowModal(false)}
            />

            {/* Modal principal del formulario */}
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                {/* Encabezado */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 rounded-t-xl flex justify-between items-center z-50">
                    <h2 className="text-xl font-bold text-gray-900 bg-white">
                        Crear nuevo evento
                    </h2>
                    <button
                        onClick={() => setShowModal(false)}
                        className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Contenido */}
                <div className="p-6 space-y-4">
                    {errors.general && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4">
                            <p className="text-sm text-red-700">{errors.general}</p>
                        </div>
                    )}

                    {/* Campos del formulario (se mantienen igual) */}
                    {/* Nombre del evento */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre del evento
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                name="nombre"
                                placeholder="Ej: Fiesta de cumpleaños"
                                value={eventData.nombre.toUpperCase()}
                                onChange={handleInputChange}
                                className={`w-full uppercase px-4 py-2 border ${errors.nombre ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                            />
                            {errors.nombre && (
                                <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
                            )}
                        </div>
                    </div>

                    {/* Lugar */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Lugar específico
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                name="lugar"
                                placeholder="Ej: Salón de eventos 'La Terraza'"
                                value={eventData.lugar}
                                onChange={handleInputChange}
                                className={`w-full uppercase px-4 py-2 border ${errors.lugar ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                            />
                            {errors.lugar && (
                                <p className="mt-1 text-sm text-red-600">{errors.lugar}</p>
                            )}
                        </div>
                    </div>

                    {/* Dirección */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Dirección exacta
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                name="direccion"
                                placeholder="Ej: Av. Principal 123"
                                value={eventData.direccion}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-2 border ${errors.direccion ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                            />
                            {errors.direccion && (
                                <p className="mt-1 text-sm text-red-600">{errors.direccion}</p>
                            )}
                        </div>
                    </div>

                    {/* País */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            País
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                name="pais"
                                placeholder="Ej: Perú"
                                value={eventData.pais}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-2 border ${errors.pais ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                            />
                            {errors.pais && (
                                <p className="mt-1 text-sm text-red-600">{errors.pais}</p>
                            )}
                        </div>
                    </div>

                    {/* Ubicación - Departamentos */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Departamento
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                name="departamento"
                                placeholder="Ej: Lima"
                                value={eventData.departamento}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-2 border ${errors.departamento ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                            />
                            {errors.departamento && (
                                <p className="mt-1 text-sm text-red-600">{errors.departamento}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {/* Ubicación - Provincias */}
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Provincia
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    name="provincia"
                                    placeholder="Ej: Lima"
                                    value={eventData.provincia}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2 border ${errors.provincia ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                                />
                                {errors.provincia && (
                                    <p className="mt-1 text-sm text-red-600">{errors.provincia}</p>
                                )}
                            </div>
                        </div>

                        {/* Ubicación - Distritos */}
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Distrito
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    name="distrito"
                                    placeholder="Ej: Miraflores"
                                    value={eventData.distrito}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2 border ${errors.distrito ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                                />
                                {errors.distrito && (
                                    <p className="mt-1 text-sm text-red-600">{errors.distrito}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Fechas y horas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fecha y hora de inicio
                            </label>
                            <div className="relative">
                                <input
                                    type="datetime-local"
                                    name="horaInicio"
                                    value={eventData.horaInicio}
                                    onChange={handleInputChange}
                                    min={min}
                                    max={max}
                                    className={`w-full px-4 py-2 border ${errors.horaInicio ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                                />
                                {errors.horaInicio && (
                                    <p className="mt-1 text-sm text-red-600">{errors.horaInicio}</p>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fecha y hora de fin
                            </label>
                            <div className="relative">
                                <input
                                    type="datetime-local"
                                    name="horaFin"
                                    value={eventData.horaFin}
                                    onChange={handleInputChange}
                                    min={min}
                                    max={max}
                                    className={`w-full px-4 py-2 border ${errors.horaFin ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                                />
                                {errors.horaFin && (
                                    <p className="mt-1 text-sm text-red-600">{errors.horaFin}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sección de QR */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Código QR para el evento
                                </label>
                                <p className="text-xs text-gray-500">
                                    Asocia un QR existente o genera uno nuevo
                                </p>
                            </div>
                            <div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={qrEnabled}
                                        onChange={() => {
                                            const newValue = !qrEnabled;
                                            setQrEnabled(newValue);
                                            if (!newValue) {
                                                unlinkQR();
                                            }
                                        }}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>
                        </div>

                        {qrEnabled && (
                            <div className="space-y-2">
                                {eventData.qrCode ? (
                                    <div className="border rounded-lg p-3 bg-gray-50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className="border p-1 rounded bg-white">
                                                    <QRCodeSVG
                                                        value={eventData.qrCode}
                                                        size={60}
                                                        level="H"
                                                    />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">
                                                        {existingQRCodes.find(qr => qr.id === eventData.qrCodeId)?.name || "QR generado"}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {eventData.qrCode}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={unlinkQR}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <X className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => setShowQRSelector(true)}
                                            variant="outline"
                                            className="flex-1"
                                        >
                                            <QrCode className="h-4 w-4 mr-2" />
                                            Usar QR existente
                                        </button>
                                        <button
                                            onClick={generateQRCode}
                                            className="flex-1"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Generar nuevo QR
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Pie de página */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 rounded-b-xl flex justify-end space-x-3">
                    <button
                        onClick={() => setShowModal(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleCreateEvent}
                        disabled={loading || (userPlan !== "mainstage" && eventsCreatedThisPeriod >= eventLimit)}
                        style={{ backgroundColor: dominantColor, color: textColor }}
                        className="px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed flex items-center"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creando...
                            </>
                        ) : (
                            "Crear evento"
                        )}
                    </button>
                </div>
            </div>

            {/* Modal para mostrar el QR generado */}
            {showQRModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                        onClick={() => setShowQRModal(false)}
                    />

                    <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm">
                        <div className="p-6 space-y-4">
                            <h3 className="text-lg font-medium text-gray-900 text-center">
                                Código QR para el evento
                            </h3>

                            <div className="flex justify-center">
                                <QRCodeSVG
                                    value={tempQRCode}
                                    size={200}
                                    includeMargin={true}
                                />
                            </div>

                            <p className="text-sm text-gray-500 text-center">
                                Este código será asociado al evento para que los asistentes soliciten canciones.
                            </p>

                            <div className="flex justify-center pt-4">
                                <button
                                    onClick={confirmQRCode}
                                    style={{ backgroundColor: dominantColor, color: textColor }}
                                    className="px-4 py-2 text-sm font-medium rounded-lg text-white focus:outline-none focus:ring-2"
                                >
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para seleccionar QR existente */}
            {showQRSelector && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                        onClick={() => setShowQRSelector(false)}
                    />

                    <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 rounded-t-xl flex justify-between items-center z-50">
                            <h3 className="text-lg font-medium text-gray-900">
                                Seleccionar QR existente
                            </h3>
                            <button
                                onClick={() => setShowQRSelector(false)}
                                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-4">
                            {loadingQRCodes ? (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                                </div>
                            ) : existingQRCodes.length > 0 ? (
                                <div className="space-y-3">
                                    {existingQRCodes.map((qr) => (
                                        <div
                                            key={qr.id}
                                            className={`border rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors ${eventData.qrCodeId === qr.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}
                                            onClick={() => selectExistingQR(qr)}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className="border p-1 rounded bg-white">
                                                    <QRCodeSVG
                                                        value={qr.code}
                                                        size={50}
                                                        level="H"
                                                    />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-gray-800">{qr.name}</h4>
                                                    <p className="text-xs text-gray-500">
                                                        Creado: {new Date(qr.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <QrCode className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                                    <p className="text-gray-500">No tienes códigos QR creados</p>
                                    <button
                                        onClick={() => {
                                            setShowQRSelector(false);
                                            generateQRCode();
                                        }}
                                        className="mt-4"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Crear nuevo QR
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}