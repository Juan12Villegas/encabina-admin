"use client";

import { useState, useEffect } from "react";
import { auth, db, storage } from "@/../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Upload, Loader2, X, Check, User, Disc3 } from "lucide-react";
import Link from "next/link";

export default function EditProfilePhoto() {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const router = useRouter();

    // Obtener datos del usuario al cargar el componente
    useEffect(() => {
        const fetchUserData = async () => {
            const user = auth.currentUser;
            if (!user) {
                router.push("/login");
                return;
            }

            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                setUserData(userSnap.data());
                if (userSnap.data().profileUrl) {
                    setPreviewUrl(userSnap.data().profileUrl);
                }
            }
            setLoading(false);
        };

        fetchUserData();
    }, [router]);

    // Manejar selección de archivo
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validar tipo de archivo
        if (!file.type.match("image.*")) {
            alert("Por favor, selecciona una imagen válida (JPEG, PNG, etc.)");
            return;
        }

        // Validar tamaño (máximo 2MB para foto de perfil)
        if (file.size > 2 * 1024 * 1024) {
            alert("La imagen no puede ser mayor a 2MB");
            return;
        }

        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    // Subir nueva imagen y actualizar Firestore
    const handleUpload = async () => {
        if (!selectedFile || !auth.currentUser) return;

        setUploading(true);
        try {
            const user = auth.currentUser;
            const storageRef = ref(storage, `profile-photos/${user.uid}/${selectedFile.name}`);

            // 1. Subir nueva imagen al Storage
            const snapshot = await uploadBytes(storageRef, selectedFile);
            const downloadURL = await getDownloadURL(snapshot.ref);

            // 2. Eliminar la imagen anterior si existe
            if (userData?.profileUrl) {
                try {
                    const oldImageRef = ref(storage, userData.profileUrl);
                    await deleteObject(oldImageRef);
                } catch (error) {
                    console.error("Error al eliminar la imagen anterior:", error);
                    // Continuar aunque falle la eliminación
                }
            }

            // 3. Actualizar Firestore con la nueva URL
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                profileUrl: downloadURL
            });

            // 4. Actualizar el estado local
            setUserData(prev => ({ ...prev, profileUrl: downloadURL }));
            setPreviewUrl(downloadURL);
            setSelectedFile(null);

            alert("Foto de perfil actualizada correctamente!");
        } catch (error) {
            console.error("Error al actualizar la foto de perfil:", error);
            alert("Error al actualizar la foto de perfil. Por favor, intenta nuevamente.");
        } finally {
            setUploading(false);
        }
    };

    /* if (loading) {
        return (
            <div className="h-full w-full m-auto flex items-center justify-center bg-white">
                <div className="flex flex-col items-center">
                    <Disc3
                        className="h-12 w-12 text-gray-600 animate-spin" />
                    <p className="mt-4 text-gray-700">Cargando tus eventos...</p>
                </div>
            </div>
        );
    } */

    return (
        <div className="w-full">
            <div className="w-full mx-auto p-4 bg-white shadow-md rounded-lg">
                <div className="mb-6">
                    {/* <h1 className="text-2xl font-bold">Editar Foto de Perfil</h1> */}
                    <p className="text-gray-600">Sube una imagen para tu perfil</p>
                </div>

                <div className="flex flex-wrap items-center justify-start gap-4">
                    {/* Vista previa de la foto */}
                    <div className="flex justify-center h-44 w-44 bg-white rounded-full shadow overflow-hidden">
                        {previewUrl ? (
                            <div className="relative w-full h-full">
                                <Image
                                    src={previewUrl}
                                    alt="Foto de perfil actual"
                                    fill
                                    className="object-cover rounded-full"
                                    quality={80}
                                />
                            </div>
                        ) : (
                            <div className="h-full w-full bg-gray-200 flex items-center justify-center rounded-full">
                                <User className="h-20 w-20 text-gray-500" />
                            </div>
                        )}
                    </div>

                    {/* Selector de archivo */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Seleccionar nueva imagen
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
                                    disabled={uploading}
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Formatos soportados: JPEG, PNG. Tamaño máximo: 2MB
                                </p>
                            </div>

                            {selectedFile && (
                                <div className="flex items-center justify-between bg-blue-50 p-3 rounded-md">
                                    <div className="flex items-center">
                                        <Check className="h-5 w-5 text-green-500 mr-2" />
                                        <span className="text-sm">{selectedFile.name}</span>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                    </span>
                                </div>
                            )}

                            <button
                                onClick={handleUpload}
                                disabled={!selectedFile || uploading}
                                className={`w-full flex items-center justify-center py-2 px-4 rounded-md text-white ${!selectedFile || uploading
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-blue-600 hover:bg-blue-700"
                                    }`}
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                        Subiendo...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4 mr-2" />
                                        Actualizar Foto
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}