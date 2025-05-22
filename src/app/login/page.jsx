"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    auth,
    googleProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    sendPasswordResetEmail
} from "@/../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/../lib/firebase";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loadingEmail, setLoadingEmail] = useState(false);
    const [loadingGoogle, setLoadingGoogle] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showResetForm, setShowResetForm] = useState(false);
    const [resetEmail, setResetEmail] = useState("");
    const [resetSent, setResetSent] = useState(false);
    const router = useRouter();

    const checkUserProfile = async (userId) => {
        try {
            const userRef = doc(db, "users", userId);
            const userSnap = await getDoc(userRef);
            return userSnap.exists() ? userSnap.data().completedProfile || false : false;
        } catch (error) {
            console.error("Error verificando perfil:", error);
            return false;
        }
    };

    const checkStatusUser = async (userId) => {
        try {
            const userRef = doc(db, "users", userId);
            const userSnap = await getDoc(userRef);
            return userSnap.exists() ? userSnap.data().active || false : false;
        } catch (error) {
            console.error("Error verificando estado:", error);
            return false;
        }
    };

    const checkStatusYape = async (userId) => {
        try {
            const userRef = doc(db, "users", userId);
            const userSnap = await getDoc(userRef);
            return userSnap.exists() ? userSnap.data().statusPayment || false : false;
        } catch (error) {
            console.error("Error verificando pago:", error);
            return false;
        }
    };

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoadingEmail(true);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const userId = userCredential.user.uid;

            const isProfileComplete = await checkUserProfile(userId);
            const isYapeCheck = await checkStatusYape(userId);
            const isStatusUser = await checkStatusUser(userId);

            if (isProfileComplete && isYapeCheck && isStatusUser) {
                router.push("/user/eventos");
            } else if (!isProfileComplete && isYapeCheck && isStatusUser) {
                router.push("/user/complete-profile");
            } else if (!isYapeCheck) {
                router.push("/user/login-verification-pending");
            } else if (!isStatusUser && isYapeCheck) {
                setError("Esta cuenta no está activa. Contacta al soporte.");
            }
        } catch (error) {
            console.error("Error en inicio de sesión:", error);
            handleAuthError(error);
        } finally {
            setLoadingEmail(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError("");
        setLoadingGoogle(true);

        try {
            const result = await signInWithPopup(auth, googleProvider);
            const userId = result.user.uid;

            const isProfileComplete = await checkUserProfile(userId);
            const isYapeCheck = await checkStatusYape(userId);
            const isStatusUser = await checkStatusUser(userId);

            if (isProfileComplete && isYapeCheck && isStatusUser) {
                router.push("/user/eventos");
            } else if (!isProfileComplete && isYapeCheck && isStatusUser) {
                router.push("/user/complete-profile");
            } else if (!isYapeCheck) {
                router.push("/user/login-verification-pending");
            } else if (!isStatusUser && isYapeCheck) {
                setError("Esta cuenta no está activa. Contacta al soporte.");
            }
        } catch (error) {
            console.error("Error en inicio de sesión con Google:", error);
            handleAuthError(error);
        } finally {
            setLoadingGoogle(false);
        }
    };

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        if (!resetEmail) {
            setError("Por favor ingresa tu correo electrónico");
            return;
        }

        try {
            await sendPasswordResetEmail(auth, resetEmail);
            setResetSent(true);
            setError("");
        } catch (error) {
            console.error("Error al enviar correo de recuperación:", error);
            setError("No pudimos enviar el correo. Verifica la dirección e intenta nuevamente.");
        }
    };

    const handleAuthError = (error) => {
        switch (error.code) {
            case 'auth/invalid-email':
                setError("El correo electrónico no es válido.");
                break;
            case 'auth/user-not-found':
                setError("No existe una cuenta con este correo.");
                break;
            case 'auth/wrong-password':
                setError("Contraseña incorrecta.");
                break;
            case 'auth/too-many-requests':
                setError("Demasiados intentos fallidos. Intenta más tarde o restablece tu contraseña.");
                break;
            case 'auth/popup-closed-by-user':
                setError("El inicio de sesión con Google fue cancelado.");
                break;
            case 'auth/invalid-credential':
                setError("El correo o la contraseña son incorrectos.");
                break;
            case 'auth/account-exists-with-different-credential':
                setError("Este correo ya está registrado con otro método de inicio de sesión.");
                break;
            default:
                setError("Error al iniciar sesión. Por favor intenta nuevamente.");
        }
    };

    const handleSelectPlan = (plan) => {
        router.push(`/plan-form?plan=${plan.toLowerCase()}`);
    };

    return (
        <div className="min-h-screen flex bg-gradient-to-br bg-white">
            <div className="container m-auto px-4 py-12">
                <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="md:flex">
                        {/* Lado izquierdo - Ilustración */}
                        <div className="md:w-1/2 bg-gradient-to-br bg-gray-900 p-10 flex flex-col justify-center items-center text-white">
                            {/* <div className="mb-8">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                </svg>
                            </div> */}
                            <h1 className="text-4xl font-bold mb-4 text-center">EN CABINA</h1>
                            <p className="text-lg text-indigo-100 text-center mb-8">La plataforma profesional para DJs</p>
                            <div className="w-full max-w-xs">
                                <div className="h-2 bg-white rounded-full mb-2"></div>
                                <div className="h-2 bg-white/70 rounded-full mb-2 w-3/4 mx-auto"></div>
                                <div className="h-2 bg-white/50 rounded-full w-1/2 mx-auto"></div>
                            </div>
                        </div>

                        {/* Lado derecho - Formulario */}
                        <div className="md:w-1/2 p-10">
                            {showResetForm ? (
                                <div className="space-y-6">
                                    <div className="text-center">
                                        <h2 className="text-2xl font-bold text-gray-800">Restablecer contraseña</h2>
                                        <div className="mt-2 h-1 w-20 bg-indigo-600 mx-auto rounded-full"></div>
                                    </div>

                                    {resetSent ? (
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                                                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                            <h3 className="text-lg font-medium text-green-800 mb-2">Correo enviado</h3>
                                            <p className="text-green-600">
                                                Hemos enviado un correo a <span className="font-semibold">{resetEmail}</span> con instrucciones para restablecer tu contraseña.
                                            </p>
                                            <button
                                                onClick={() => {
                                                    setShowResetForm(false);
                                                    setResetSent(false);
                                                }}
                                                className="mt-6 w-full py-2 px-4 rounded-lg font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                                            >
                                                Volver al inicio de sesión
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-gray-600 text-center mb-6">
                                                Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                                            </p>

                                            {error && (
                                                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0">
                                                            <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                        <div className="ml-3">
                                                            <p className="text-sm text-red-700">{error}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <form onSubmit={handlePasswordReset} className="space-y-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
                                                    <input
                                                        type="email"
                                                        placeholder="tucorreo@ejemplo.com"
                                                        value={resetEmail}
                                                        onChange={(e) => setResetEmail(e.target.value)}
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                                        required
                                                    />
                                                </div>

                                                <div className="flex space-x-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowResetForm(false)}
                                                        className="flex-1 py-3 px-4 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                                                    >
                                                        Cancelar
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        className="flex-1 py-3 px-4 rounded-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md"
                                                    >
                                                        Enviar enlace
                                                    </button>
                                                </div>
                                            </form>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div className="text-center mb-8">
                                        <h2 className="text-3xl font-bold text-gray-800">Inicia sesión</h2>
                                        <p className="text-gray-500 mt-2">Accede a tu cuenta para comenzar</p>
                                    </div>

                                    <form onSubmit={handleEmailLogin} className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
                                            <input
                                                type="email"
                                                placeholder="tucorreo@ejemplo.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="••••••••"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pr-12 transition-all"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="h-5 w-5" />
                                                    ) : (
                                                        <Eye className="h-5 w-5" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <input
                                                    id="remember-me"
                                                    name="remember-me"
                                                    type="checkbox"
                                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                />
                                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                                                    Recuérdame
                                                </label>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => setShowResetForm(true)}
                                                className="text-sm font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
                                            >
                                                ¿Olvidaste tu contraseña?
                                            </button>
                                        </div>

                                        {error && (
                                            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0">
                                                        <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                    <div className="ml-3">
                                                        <p className="text-sm text-red-700">{error}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={loadingEmail}
                                            className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center ${loadingEmail
                                                ? "bg-indigo-400 text-white cursor-not-allowed"
                                                : "bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-md"
                                                }`}
                                        >
                                            {loadingEmail ? (
                                                <>
                                                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                                    Iniciando sesión...
                                                </>
                                            ) : (
                                                <>
                                                    Continuar <ArrowRight className="ml-2 h-4 w-4" />
                                                </>
                                            )}
                                        </button>
                                    </form>

                                    {/* <div className="mt-8">
                                        <div className="relative">
                                            <div className="absolute inset-0 flex items-center">
                                                <div className="w-full border-t border-gray-300"></div>
                                            </div>
                                            <div className="relative flex justify-center">
                                                <span className="px-3 bg-white text-sm text-gray-500">O inicia sesión con</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleGoogleLogin}
                                            disabled={loadingGoogle}
                                            className={`w-full mt-6 py-3 px-4 rounded-lg font-medium flex items-center justify-center border ${loadingGoogle
                                                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
                                                }`}
                                        >
                                            {loadingGoogle ? (
                                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                            ) : (
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
                                            )}
                                            {loadingGoogle ? "Iniciando sesión..." : "Continuar con Google"}
                                        </button>
                                    </div> */}

                                    <div className="mt-8 text-center text-sm text-gray-600">
                                        <p>
                                            ¿No tienes una cuenta?{" "}
                                            <button
                                                onClick={() => handleSelectPlan("drop pro")}
                                                className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
                                            >
                                                Regístrate ahora
                                            </button>
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}