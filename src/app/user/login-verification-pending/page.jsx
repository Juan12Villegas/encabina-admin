"use client";

import { auth } from "@/../lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
/* import { Button } from "@/components/ui/button"; */

export default function VerificationPending() {
    const router = useRouter();

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            router.push("/login");
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 max-w-md w-full">
                <div className="p-8 text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                        <svg
                            className="h-6 w-6 text-yellow-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Pago en verificación</h2>
                    <p className="text-gray-600 mb-6">
                        Tu pago por Yape aún no ha sido validado. Por favor espera a que nuestro equipo verifique tu transacción.
                        Te notificaremos por correo electrónico una vez que tu pago haya sido aprobado.
                    </p>
                    <p className="text-gray-500 text-sm mb-6">
                        Si crees que esto es un error, por favor contacta a nuestro soporte.
                    </p>
                    <button
                        onClick={handleSignOut}
                        className="w-full inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                    >
                        Cerrar sesión
                    </button>
                </div>
            </div>
        </div>
    );
}