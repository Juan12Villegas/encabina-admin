// app/user/verification-pending/page.js
"use client";

import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default function VerificationPending() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Pago recibido!</h2>
                <p className="text-gray-600 mb-6">
                    Hemos recibido tu comprobante de pago. Nuestro equipo lo verificará y te notificará por correo electrónico una vez que tu cuenta esté activa. Este proceso puede tomar hasta 24 horas.
                </p>
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                    <p className="text-sm text-blue-700">
                        ¿Tienes alguna pregunta? Contáctanos en <span className="font-medium">soporte@encabina.com</span>
                    </p>
                </div>
                <Link
                    href="/"
                    className="w-full inline-flex justify-center rounded-md border border-transparent bg-gray-800 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-900"
                >
                    Volver al inicio
                </Link>
            </div>
        </div>
    );
}