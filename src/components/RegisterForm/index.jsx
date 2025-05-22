"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function RegisterForm({ selectedPlan, onSuccess, onGoogleLogin, error }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        await onSuccess(email, password);
        setLoading(false);
    };

    return (
        <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-200">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Crea tu cuenta</h2>
                <p className="text-gray-600">Únete a la plataforma preferida por los mejores DJs</p>
            </div>

            {selectedPlan !== "free" && (
                <div className="mb-6 bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-medium text-gray-900">
                                Plan {selectedPlan === "bassline" ? "Bassline" :
                                    selectedPlan === "drop pro" ? "Drop Pro" :
                                        "MainStage"}
                            </h3>
                            <p className="text-sm text-gray-600">
                                {selectedPlan === "bassline" ? "Ideal para DJs que están comenzando" :
                                    selectedPlan === "drop pro" ? "Para DJs que buscan crecer" :
                                        "Para profesionales establecidos"}
                            </p>
                        </div>
                        <span className="text-indigo-600 font-bold">
                            {selectedPlan === "bassline" ? "S/ 14.90/mes" :
                                selectedPlan === "drop pro" ? "S/ 32.90/mes" :
                                    "S/ 159.90/mes"}
                        </span>
                    </div>
                </div>
            )}

            {error && (
                <div className="text-red-500 text-sm p-2 bg-red-50 rounded-lg flex items-start mb-4">
                    <span className="mr-2">⚠</span>
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
                    <input
                        type="email"
                        placeholder="tucorreo@ejemplo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                    <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                        minLength={6}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center ${loading
                        ? "bg-gray-300 text-gray-600"
                        : "bg-gray-800 text-white hover:bg-gray-900 transition-colors"
                        }`}
                >
                    {loading ? "Registrando..." : (
                        <>
                            Continuar <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                    )}
                </button>
            </form>

            <div className="my-6 relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center">
                    <span className="px-2 bg-white text-sm text-gray-500">o regístrate con</span>
                </div>
            </div>

            <button
                onClick={onGoogleLogin}
                disabled={loading}
                className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center border ${loading
                    ? "bg-gray-100 text-gray-400 border-gray-200"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 transition-colors"
                    }`}
            >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                    />
                    <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                    />
                    <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                    />
                    <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                    />
                </svg>
                {loading ? "Registrando..." : "Continuar con Google"}
            </button>

            <div className="mt-6 text-center text-sm text-gray-600">
                <p>
                    ¿Ya tienes una cuenta?{" "}
                    <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                        Inicia sesión
                    </Link>
                </p>
            </div>
        </div>
    );
}