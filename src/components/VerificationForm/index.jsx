"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

export default function VerificationForm({
    email,
    userData,
    onSuccess,
    onGoBack,
    selectedPlan,
    onResendCode
}) {
    const [verificationCode, setVerificationCode] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (verificationCode !== userData.verificationCode) {
            setError("El código de verificación es incorrecto.");
            setLoading(false);
            return;
        }

        onSuccess();
        setLoading(false);
    };

    const handleResendCode = async () => {
        setResendLoading(true);
        setError("");
        setResendSuccess(false);

        try {
            const success = await onResendCode();
            if (success) {
                setResendSuccess(true);
                setTimeout(() => setResendSuccess(false), 3000);
            } else {
                setError("Error al reenviar el código. Intenta nuevamente.");
            }
        } catch (error) {
            setError("Error al reenviar el código. Intenta nuevamente.");
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-200">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Verifica tu correo</h2>
                <p className="text-gray-600">Hemos enviado un código de 4 dígitos a {email}</p>
            </div>

            {selectedPlan !== "free" && (
                <div className="mb-6 bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                    <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">
                            Plan {selectedPlan === "bassline" ? "Bassline" :
                                selectedPlan === "drop pro" ? "Drop Pro" :
                                    "MainStage"}
                        </h3>
                        <span className="text-indigo-600 font-bold">
                            {selectedPlan === "bassline" ? "S/ 14.90/mes" :
                                selectedPlan === "drop pro" ? "S/ 32.90/mes" :
                                    "S/ 159.90/mes"}
                        </span>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Código de verificación
                    </label>
                    <input
                        type="text"
                        placeholder="1234"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        maxLength="4"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center text-xl tracking-widest"
                        required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Ingresa el código de 4 dígitos que enviamos a tu correo.
                    </p>

                    <div className="mt-2 text-center">
                        <button
                            type="button"
                            onClick={handleResendCode}
                            disabled={resendLoading || resendSuccess}
                            className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                        >
                            {resendLoading ? "Enviando..." :
                                resendSuccess ? "¡Código reenviado!" :
                                    "¿No recibiste el código? Reenviar"}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="text-red-500 text-sm p-2 bg-red-50 rounded-lg flex items-start">
                        <span className="mr-2">⚠</span>
                        <span>{error}</span>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center ${loading
                        ? "bg-gray-300 text-gray-600"
                        : "bg-gray-800 text-white hover:bg-gray-900 transition-colors"
                        }`}
                >
                    {loading ? "Verificando..." : (
                        <>
                            Verificar código <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                    )}
                </button>

                <div className="text-center text-sm text-gray-600">
                    <button
                        type="button"
                        onClick={onGoBack}
                        className="font-medium text-indigo-600 hover:text-indigo-500"
                    >
                        Volver atrás
                    </button>
                </div>
            </form>
        </div>
    );
}