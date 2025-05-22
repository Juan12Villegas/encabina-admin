"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db, doc, getDoc, updateDoc } from "@/../lib/firebase";

export default function EventDetail() {
    const [evento, setEvento] = useState(null);
    const [estado, setEstado] = useState("");
    const router = useRouter();
    const searchParams = useSearchParams();
    const eventId = searchParams.get("id");

    useEffect(() => {
        const fetchEvento = async () => {
            if (!eventId) return;

            const eventoRef = doc(db, "eventos", eventId);
            const eventoSnap = await getDoc(eventoRef);

            if (eventoSnap.exists()) {
                setEvento(eventoSnap.data());
                setEstado(eventoSnap.data().estado);
            } else {
                alert("Evento no encontrado");
                router.push("/dashboard");
            }
        };

        fetchEvento();
    }, [eventId]);

    const handleUpdateEstado = async () => {
        if (!evento || !eventId) return;

        try {
            await updateDoc(doc(db, "eventos", eventId), {
                estado: estado
            });
            alert("Estado actualizado correctamente");
        } catch (error) {
            console.error("Error actualizando el estado:", error);
            alert("Error al actualizar el estado.");
        }
    };

    if (!evento) return <p className="text-center text-white">Cargando...</p>;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-5">
            <h1 className="text-3xl font-bold">{evento.nombre}</h1>
            <p className="mt-2">{evento.lugar} - {evento.direccion}</p>
            <p>{evento.horaInicio} - {evento.horaFin}</p>

            <div className="mt-5">
                <label className="block text-gray-300">Actualizar Estado:</label>
                <select
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                    className="p-2 rounded bg-gray-700"
                >
                    <option value="pendiente">Pendiente</option>
                    <option value="en vivo">En Vivo</option>
                    <option value="culminado">Culminado</option>
                </select>

                <button
                    className="mt-3 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg"
                    onClick={handleUpdateEstado}
                >
                    Guardar Cambios
                </button>
            </div>

            <button
                className="mt-5 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg"
                onClick={() => router.push("/dashboard")}
            >
                Volver
            </button>
        </div>
    );
}