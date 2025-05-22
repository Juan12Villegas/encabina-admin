"use client";
import { useState, useEffect } from "react";
import { NotebookPen, Save, X, Trash2, Edit } from "lucide-react";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/../lib/firebase";
import toast from "react-hot-toast"; // Para mostrar mensajes de error

export const EventNotes = ({ eventId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [note, setNote] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [charCount, setCharCount] = useState(0);
    const [editMode, setEditMode] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isCheckingPlan, setIsCheckingPlan] = useState(false);
    const MAX_CHARS = 2000;

    // Función para verificar el plan del DJ
    const checkDJPlan = async () => {
        setIsCheckingPlan(true);
        try {
            // 1. Obtener el evento para sacar el djId
            const eventDoc = await getDoc(doc(db, "eventos", eventId));
            if (!eventDoc.exists()) {
                toast.error("Evento no encontrado");
                return false;
            }

            const djId = eventDoc.data().djId;
            if (!djId) {
                toast.error("No se encontró el DJ asociado a este evento");
                return false;
            }

            // 2. Obtener el usuario (DJ) para sacar el plan
            const userDoc = await getDoc(doc(db, "users", djId));
            if (!userDoc.exists()) {
                toast.error("DJ no encontrado");
                return false;
            }

            const userPlan = userDoc.data().plan;

            // 3. Validar el plan
            if (userPlan === "bassline") {
                toast.error("Esta función es exclusiva para las cuentas Drop Pro y Mainstage");
                return false;
            }

            return true;
        } catch (error) {
            console.error("Error verificando plan del DJ:", error);
            toast.error("Error al verificar el plan");
            return false;
        } finally {
            setIsCheckingPlan(false);
        }
    };

    // Manejar click en el botón
    const handleOpenModal = async () => {
        const hasAccess = await checkDJPlan();
        if (hasAccess) {
            setIsOpen(true);
        }
    };

    // Bloquear desplazamiento cuando el modal está abierto
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Cargar nota existente
    useEffect(() => {
        if (!isOpen) return;

        const loadNote = async () => {
            setIsLoading(true);
            try {
                const docRef = doc(db, "event_notes", eventId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setNote(docSnap.data().content || "");
                    setCharCount(docSnap.data().content?.length || 0);
                } else {
                    setNote("");
                    setCharCount(0);
                }
            } catch (error) {
                console.error("Error loading note:", error);
                toast.error("Error al cargar la nota");
            } finally {
                setIsLoading(false);
            }
        };

        loadNote();
    }, [eventId, isOpen]);

    const handleSave = async () => {
        if (charCount > MAX_CHARS) return;

        setIsSaving(true);
        try {
            await setDoc(doc(db, "event_notes", eventId), {
                content: note,
                eventId,
                lastUpdated: new Date()
            });
            setEditMode(false);
            toast.success("Nota guardada correctamente");
        } catch (error) {
            console.error("Error saving note:", error);
            toast.error("Error al guardar la nota");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("¿Estás seguro de que quieres eliminar esta nota permanentemente?")) return;

        try {
            await deleteDoc(doc(db, "event_notes", eventId));
            setNote("");
            setCharCount(0);
            setEditMode(false);
            toast.success("Nota eliminada correctamente");
        } catch (error) {
            console.error("Error deleting note:", error);
            toast.error("Error al eliminar la nota");
        }
    };

    return (
        <>
            {/* Botón para abrir el modal */}
            <button
                onClick={handleOpenModal}
                disabled={isCheckingPlan}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isCheckingPlan ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                ) : (
                    <NotebookPen className="h-4 w-4" />
                )}
                {/* <span>Notas del evento</span> */}
            </button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                        {/* Encabezado */}
                        <div className="flex justify-between items-center border-b p-4">
                            <div className="flex items-center gap-2">
                                <NotebookPen className="text-indigo-600" size={20} />
                                <h3 className="font-bold text-lg text-gray-800">Notas del Evento</h3>
                            </div>
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    setEditMode(false);
                                }}
                                className="p-1 rounded-full hover:bg-gray-100"
                            >
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Contenido */}
                        <div className="p-4 overflow-y-auto flex-grow">
                            {isLoading ? (
                                <div className="flex justify-center items-center h-32">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                </div>
                            ) : editMode ? (
                                <>
                                    <textarea
                                        value={note}
                                        onChange={(e) => {
                                            setNote(e.target.value);
                                            setCharCount(e.target.value.length);
                                        }}
                                        placeholder="Escribe aquí tus notas sobre este evento..."
                                        className="w-full border rounded-lg p-3 min-h-[200px] text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        maxLength={MAX_CHARS}
                                    />
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-xs text-gray-500">
                                            {charCount}/{MAX_CHARS} caracteres
                                        </span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setEditMode(false)}
                                                className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={handleSave}
                                                disabled={isSaving}
                                                className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                                            >
                                                {isSaving ? (
                                                    <span className="flex items-center gap-1">
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                        Guardando...
                                                    </span>
                                                ) : (
                                                    <>
                                                        <Save size={16} />
                                                        Guardar
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {note ? (
                                        <div className="text-start whitespace-pre-wrap p-3 bg-gray-50 rounded-lg min-h-[200px] border border-gray-200">
                                            {note}
                                        </div>
                                    ) : (
                                        <div className="text-center py-10 text-gray-500">
                                            No hay notas para este evento
                                        </div>
                                    )}
                                    <div className="flex justify-end gap-2 mt-4">
                                        {note && (
                                            <button
                                                onClick={handleDelete}
                                                className="flex items-center gap-1 px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg text-sm transition-colors"
                                            >
                                                <Trash2 size={16} />
                                                Eliminar
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setEditMode(true)}
                                            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                                        >
                                            <Edit size={16} />
                                            {note ? "Editar" : "Crear"} Nota
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Pie de página */}
                        <div className="border-t p-3 text-xs text-gray-500">
                            <p>Esta nota es específica para este evento y solo tú puedes verla.</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};