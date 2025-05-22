"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { storage, ref, uploadBytes, getDownloadURL } from "@/../lib/firebase";
import imageCompression from 'browser-image-compression';

export default function PaymentForm({ userData, selectedPlan, planPrice, onSuccess, onGoBack }) {
    const [paymentProof, setPaymentProof] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const compressAndUploadImage = async (file) => {
        const options = {
            maxSizeMB: 0.5,
            maxWidthOrHeight: 1024,
            useWebWorker: true,
            fileType: 'image/jpeg'
        };

        try {
            const compressedFile = await imageCompression(file, options);
            const storageRef = ref(storage, `payment-proofs/${userData.uid}/${Date.now()}.jpg`);
            const snapshot = await uploadBytes(storageRef, compressedFile);
            return await getDownloadURL(snapshot.ref);
        } catch (error) {
            console.error("Error al comprimir/subir imagen:", error);
            throw error;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (!paymentProof) {
            setError("Por favor, sube una imagen del comprobante de pago.");
            setLoading(false);
            return;
        }

        try {
            const proofUrl = await compressAndUploadImage(paymentProof);
            await onSuccess({
                proofUrl,
                amount: planPrice,
                date: new Date().toISOString()
            });
        } catch (error) {
            setError("Error al procesar el pago. Por favor intenta nuevamente.");
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type.match('image.*')) {
            setPaymentProof(file);
            setError("");
        } else {
            setError("Por favor, sube un archivo de imagen válido (JPEG, PNG)");
        }
    };

    return (
        <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-200">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Completa tu registro</h2>
                <p className="text-gray-600">Realiza el pago correspondiente a tu plan</p>
            </div>

            <div className="mb-6 bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">
                        Plan {selectedPlan === "bassline" ? "Bassline" :
                            selectedPlan === "drop pro" ? "Drop Pro" :
                                "MainStage"}
                    </h3>
                    <span className="text-indigo-600 font-bold">
                        S/ {planPrice.toFixed(2)}
                    </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                    Este pago es válido x1 mes de suscripción.
                </p>
            </div>

            <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Método de pago</h4>
                <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                        <Image
                            src="/images/logo-yape.png"
                            alt="Yape"
                            width={40}
                            height={40}
                            className="mr-2 rounded-full"
                        />
                        <span className="font-medium">Yape</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Escanea el código QR o realiza la transferencia manual</p>
                    <div className="flex justify-center mb-3">
                        <Image
                            src="/images/qrhd.jpeg"
                            alt="Código QR de Yape"
                            width={150}
                            height={150}
                            className="border border-gray-200 rounded-xl"
                        />
                    </div>
                    <div className="text-center text-sm bg-gray-50 p-2 rounded">
                        <p className="font-medium">Número de teléfono: 976 569 677</p>
                        <p className="text-gray-600">Referencia: ENCABINA-{userData?.uid.slice(0, 5).toUpperCase()}</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sube tu comprobante de pago
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                            {paymentProof ? (
                                <div className="text-sm text-gray-600">
                                    <p>Archivo seleccionado: {paymentProof.name}</p>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentProof(null)}
                                        className="mt-2 text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                                    >
                                        Cambiar archivo
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="flex text-sm text-gray-600">
                                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none">
                                            <span>Sube una imagen</span>
                                            <input
                                                type="file"
                                                className="sr-only"
                                                onChange={handleFileChange}
                                                accept="image/*"
                                            />
                                        </label>
                                        <p className="pl-1">o arrástrala aquí</p>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        PNG, JPG, JPEG hasta 5MB
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="text-red-500 text-sm p-2 bg-red-50 rounded-lg flex items-start">
                        <span className="mr-2">⚠</span>
                        <span>{error}</span>
                    </div>
                )}

                <div className="flex space-x-3">
                    <button
                        type="button"
                        onClick={onGoBack}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Volver atrás
                    </button>
                    <button
                        type="submit"
                        disabled={loading || !paymentProof}
                        className={`flex-1 px-4 py-2 rounded-md text-sm font-medium text-white ${loading ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                        {loading ? "Enviando..." : "Enviar comprobante"}
                    </button>
                </div>
            </form>
        </div>
    );
}