"use client"

import React, { useState, useEffect } from 'react';
import { FileAudio2 } from "lucide-react";

export const SpotifyTopTracks = ({ dominantColor, colorText }) => {
    const [isOpen, setIsOpen] = useState(false);
    const topTracksPlaylistId = "37i9dQZEVXbJfdy5b0KP7W";

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

    return (
        <>
            {/* Botón para abrir el modal */}
            <button
                onClick={() => setIsOpen(true)}
                style={{ backgroundColor: dominantColor, color: colorText }}
                className="h-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-800 bg-gray-700 text-white transition-colors hover:cursor-pointer"
            >
                <FileAudio2 className="h-4 w-4" />
                <span>Spotify</span>
            </button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[120vh] overflow-auto">
                        {/* Encabezado del modal */}
                        <div className="flex justify-between items-center border-b p-4">
                            <h3 className="font-bold text-xl text-gray-800">Top Canciones de Spotify</h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Contenido del modal */}
                        <div className="p-4">
                            <iframe
                                src={`https://open.spotify.com/embed/playlist/${topTracksPlaylistId}`}
                                width="100%"
                                height="450"
                                frameBorder="0"
                                allow="encrypted-media"
                                className="rounded"
                                title="Spotify Top Tracks Playlist"
                            ></iframe>
                        </div>

                        {/* Pie del modal */}
                        {/* <div className="border-t p-4 flex justify-end">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
                            >
                                Cerrar
                            </button>
                        </div> */}
                    </div>
                </div>
            )}
        </>
    );
};