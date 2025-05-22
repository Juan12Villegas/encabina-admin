"use client";

import { useState, useEffect } from "react";
import { auth, db, storage } from "@/../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Upload, Loader2, X, Check } from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";

export default function EditPayment() {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const router = useRouter();

    // Verificar si el usuario tiene permiso para cambiar la imagen
    const canChangeImage = () => {
        if (!userData?.plan) return false;
        return ["drop pro", "mainstage"].includes(userData.plan.toLowerCase());
    };

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
                if (userSnap.data().qrPaymentUrl) {
                    setPreviewUrl(userSnap.data().qrPaymentUrl);
                }
            }
            setLoading(false);
        };

        fetchUserData();
    }, [router]);

    // Manejar selección de archivo
    const handleFileChange = (e) => {
        // Verificar plan primero
        if (!canChangeImage()) {
            toast.error("Esta función es exclusiva para los planes Drop Pro y Mainstage");
            return;
        }

        const file = e.target.files[0];
        if (!file) return;

        // Validar tipo de archivo
        if (!file.type.match("image.*")) {
            toast.error("Por favor, selecciona una imagen válida (JPEG, PNG, etc.)");
            return;
        }

        // Validar tamaño (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("La imagen no puede ser mayor a 5MB");
            return;
        }

        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    // Subir nueva imagen y actualizar Firestore
    const handleUpload = async () => {
        // Verificar plan primero
        if (!canChangeImage()) {
            toast.error("Esta función es exclusiva para los planes Drop Pro y Mainstage");
            return;
        }

        if (!selectedFile || !auth.currentUser) return;

        setUploading(true);
        const uploadToast = toast.loading("Subiendo imagen...");

        try {
            const user = auth.currentUser;
            const storageRef = ref(storage, `user-qrPayments/${user.uid}/${selectedFile.name}`);

            // 1. Subir nueva imagen al Storage
            const snapshot = await uploadBytes(storageRef, selectedFile);
            const downloadURL = await getDownloadURL(snapshot.ref);

            // 2. Eliminar la imagen anterior si existe
            if (userData?.qrPaymentUrl) {
                try {
                    const oldImageRef = ref(storage, userData.qrPaymentUrl);
                    await deleteObject(oldImageRef);
                } catch (error) {
                    console.error("Error al eliminar la imagen anterior:", error);
                    // Continuar aunque falle la eliminación
                }
            }

            // 3. Actualizar Firestore con la nueva URL
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                qrPaymentUrl: downloadURL
            });

            // 4. Actualizar el estado local
            setUserData(prev => ({ ...prev, qrPaymentUrl: downloadURL }));
            setPreviewUrl(downloadURL);
            setSelectedFile(null);

            toast.success("Imagen actualizada correctamente!", { id: uploadToast });
        } catch (error) {
            console.error("Error al actualizar la imagen:", error);
            toast.error("Error al actualizar la imagen. Por favor, intenta nuevamente.", { id: uploadToast });
        } finally {
            setUploading(false);
        }
    };

    /* if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin h-12 w-12 text-blue-500" />
            </div>
        );
    } */

    return (
        <div className="w-full">
            <div className="mx-auto p-4 bg-white shadow-md rounded-lg">
                <div className="mb-6">
                    <p className="text-gray-600">Sube una imagen de tu QR de Pago</p>
                    {!canChangeImage() && (
                        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 text-sm">
                            <p>⚠️ Esta función está disponible solo para los planes <strong>Drop Pro</strong> y <strong>Mainstage</strong>.</p>
                            <p className="mt-1">Actualiza tu plan para desbloquear esta y otras características premium.</p>
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap items-center justify-start gap-4">
                    {/* Vista previa del qr */}
                    <div className="flex justify-center h-44 w-full lg:w-auto bg-white rounded-lg shadow overflow-hidden">
                        {previewUrl ? (
                            <div className="relative" style={{ width: 176, height: 176 }}>
                                <p>holi</p>
                                <Image
                                    src={previewUrl}
                                    alt="QR actual"
                                    fill
                                    className="object-cover"
                                    quality={80}
                                />
                            </div>
                        ) : (
                            <div className="h-44 w-full px-4 bg-gray-200 flex items-center justify-center">
                                <p className="text-gray-500">No hay qr configurado</p>
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
                                    className={`block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  ${canChangeImage() ? "file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" : "file:bg-gray-100 file:text-gray-500 hover:file:bg-gray-200"}`}
                                    disabled={uploading || !canChangeImage()}
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Formatos soportados: JPEG, PNG. Tamaño máximo: 5MB
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
                                disabled={!selectedFile || uploading || !canChangeImage()}
                                className={`w-full flex items-center justify-center py-2 px-4 rounded-md text-white ${!selectedFile || uploading || !canChangeImage()
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
                                        Actualizar QR
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