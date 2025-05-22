"use client";
import { useState, useEffect } from "react";
import { NotebookPen, Save, X, Trash2, Edit } from "lucide-react";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/../lib/firebase";

export const DJNotesModal = ({ djId, dominantColor, colorText }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [notes, setNotes] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [charCount, setCharCount] = useState(0);
    const [editMode, setEditMode] = useState(false);
    const MAX_CHARS = 1000; // Aumenté el límite de caracteres

    // Hook para bloquear el desplazamiento cuando se muestra el modal
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'; // Bloquea el desplazamiento
        } else {
            document.body.style.overflow = ''; // Restaura el desplazamiento
        }

        // Limpiar al desmontar el componente
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Cargar notas existentes
    useEffect(() => {
        if (!isOpen) return;

        const loadNotes = async () => {
            try {
                const docRef = doc(db, "dj_notes", djId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setNotes(docSnap.data().notes);
                    setCharCount(docSnap.data().notes.length);
                } else {
                    setNotes("");
                    setCharCount(0);
                }
            } catch (error) {
                console.error("Error loading notes:", error);
            }
        };

        loadNotes();
    }, [djId, isOpen]);

    const handleSave = async () => {
        if (charCount > MAX_CHARS) return;

        setIsSaving(true);
        try {
            await setDoc(doc(db, "dj_notes", djId), {
                notes,
                lastUpdated: new Date()
            });
            setEditMode(false);
        } catch (error) {
            console.error("Error saving notes:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("¿Estás seguro de que quieres eliminar todos tus apuntes?")) return;

        try {
            await deleteDoc(doc(db, "dj_notes", djId));
            setNotes("");
            setCharCount(0);
            setEditMode(false);
        } catch (error) {
            console.error("Error deleting notes:", error);
        }
    };

    return (
        <>
            {/* Botón para abrir el modal */}
            <button
                onClick={() => setIsOpen(true)}
                style={{ backgroundColor: dominantColor, color: colorText }}
                className="h-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-800 bg-gray-700 text-white transition-colors hover:cursor-pointer"
            >
                <NotebookPen className="h-4 w-4" />
                <span>Apuntes</span>
            </button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                        {/* Encabezado */}
                        <div className="flex justify-between items-center border-b p-4">
                            <div className="flex items-center gap-2">
                                <NotebookPen
                                    style={{ color: dominantColor }}
                                    className="text-indigo-600" size={20} />
                                <h3 className="font-bold text-lg text-gray-800">Mis Apuntes DJ</h3>
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
                            {editMode ? (
                                <>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => {
                                            setNotes(e.target.value);
                                            setCharCount(e.target.value.length);
                                        }}
                                        placeholder="Escribe aquí tus apuntes, ideas para sets, contactos importantes..."
                                        className="w-full border rounded-lg p-3 min-h-[200px] text-sm"
                                        maxLength={MAX_CHARS}
                                    />
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-xs text-gray-500">
                                            {charCount}/{MAX_CHARS} caracteres
                                        </span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setEditMode(false)}
                                                className="px-3 py-1 border border-gray-300 rounded text-sm hover:cursor-pointer"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={handleSave}
                                                disabled={isSaving}
                                                style={{ backgroundColor: dominantColor, color: colorText }}
                                                className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm hover:cursor-pointer"
                                            >
                                                {isSaving ? "Guardando..." : "Guardar"}
                                                {!isSaving && <Save size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {notes ? (
                                        <div className="whitespace-pre-wrap p-3 bg-gray-50 rounded-lg min-h-[200px]">
                                            {notes}
                                        </div>
                                    ) : (
                                        <div className="text-center py-10 text-gray-500">
                                            No tienes apuntes guardados aún
                                        </div>
                                    )}
                                    <div className="flex justify-end gap-2 mt-4">
                                        <button
                                            onClick={handleDelete}
                                            disabled={!notes}
                                            className="flex items-center gap-1 px-3 py-1 text-red-600 hover:bg-red-50 rounded text-sm disabled:opacity-50 hover:cursor-pointer"
                                        >
                                            <Trash2 size={16} />
                                            Eliminar
                                        </button>
                                        <button
                                            onClick={() => setEditMode(true)}
                                            style={{ backgroundColor: dominantColor, color: colorText }}
                                            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm hover:cursor-pointer"
                                        >
                                            <Edit size={16} />
                                            {notes ? "Editar" : "Crear"} Apuntes
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Pie de página */}
                        <div className="border-t p-3 text-xs text-gray-500">
                            <p>Los apuntes se guardan automáticamente y son privados.</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};