// src/app/user/billing/page.jsx
'use client';
import { useSidebar } from '@/../context/SidebarContext';

import { useEffect, useState } from 'react';
import { auth, db, doc, getDoc, onAuthStateChanged } from '@/../lib/firebase';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChevronDown, Home, Disc3, ArrowLeft } from "lucide-react";
import { format, parseISO, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import Image from "next/image";

import { Timestamp } from 'firebase/firestore';

export default function BillingPage() {
    const { isCollapsed } = useSidebar();

    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.push("/login");
                return;
            }

            try {
                const userRef = doc(db, 'users', user.uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    setUserData(userSnap.data());
                }
                setLoading(false);
            } catch (error) {
                console.error("Error cargando datos:", error);
            } finally {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, [router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <Disc3 className="h-12 w-12 animate-spin mx-auto" />
                    <p className="mt-4 text-lg">Cargando tu facturación...</p>
                </div>
            </div>
        );
    }

    // Función para convertir Timestamp de Firebase a Date
    const convertTimestamp = (timestamp) => {
        if (!timestamp) return null;

        // Si es un Timestamp de Firebase
        if (timestamp instanceof Timestamp) {
            return timestamp.toDate();
        }

        // Si ya es un objeto Date
        if (timestamp instanceof Date) {
            return timestamp;
        }

        // Si es una cadena ISO
        if (typeof timestamp === 'string') {
            try {
                return new Date(timestamp);
            } catch (e) {
                return null;
            }
        }

        return null;
    };

    // Obtener el último pago registrado
    const monthlyPayments = userData.payments?.monthly ? Object.values(userData.payments.monthly) : [];
    const lastPayment = [...monthlyPayments].sort((a, b) => {
        const dateA = convertTimestamp(a.date) || new Date(a.monthKey);
        const dateB = convertTimestamp(b.date) || new Date(b.monthKey);
        return dateB - dateA;
    })[0];

    // Obtener el próximo pago (dueDate + 1 día)
    const nextPaymentDate = lastPayment?.dueDate
        ? convertTimestamp(lastPayment.dueDate)
        : null;

    // Precios de los planes
    const planPrices = {
        bassline: 19.90,
        'drop pro': 34.90,
        mainstage: 159.90
    };

    // Crear mensaje para WhatsApp
    const whatsappMessage = encodeURIComponent(
        `Hola, soy el usuario con ID: ${userData.uid}, mi correo es ${userData.email} y mi plan actual es ${userData.plan}. Quiero renovar mi suscripción.`
    );

    return (
        <div className='w-full'>
            <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-0 lg:ml-16' : 'ml-0 lg:ml-64'}`}>
                <div className="">
                    {/* Cabecera con breadcrumbs y título */}
                    <div className="bg-white border border-gray-200 p-4 lg:p-6">
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                            <a href="/user/eventos" className="flex items-center hover:text-indigo-600">
                                <Home className="h-4 w-4 mr-1" />
                                Inicio
                            </a>
                            <ChevronDown className="h-4 w-4 mx-1 transform -rotate-90" />
                            <span className="text-indigo-600 font-medium">Facturación</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Facturación</h1>
                                <p className="text-gray-600 mt-1">Visualiza los detalles de tu cuenta, pagos realizados y pendientes.</p>
                            </div>
                            <button
                                onClick={() => router.push("/user/eventos")}
                                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Volver a eventos
                            </button>
                        </div>
                    </div>
                    <div className="mx-auto p-4 lg:p-6 border border-gray-200">
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Tarjeta de Plan Actual */}
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Plan Actual</h2>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Tipo de Plan</p>
                                        <p className="font-medium capitalize">{userData.plan}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Precio Mensual</p>
                                        <p className="font-medium">S/ {planPrices[userData.plan]?.toFixed(2) || '0.00'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Estado</p>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${userData.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {userData.active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Tarjeta de Último Pago */}
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Último Pago</h2>
                                {lastPayment ? (
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-sm text-gray-500">Monto</p>
                                            <p className="font-medium">S/ {lastPayment.amount?.toFixed(2) || '0.00'}</p>
                                        </div>
                                        <div className="flex flex-wrap gap-5">
                                            <div>
                                                <p className="text-sm text-gray-500">Fecha de Pago</p>
                                                <p className="font-medium">
                                                    {lastPayment.date ? format(convertTimestamp(lastPayment.date), 'dd/MM/yyyy') : 'N/A'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Tu suscripción finaliza</p>
                                                <p className="font-medium">
                                                    {lastPayment.dueDate ? format(convertTimestamp(lastPayment.dueDate), 'dd/MM/yyyy') : 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Estado</p>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${lastPayment.paid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {lastPayment.paid ? 'Pagado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-500">No hay registros de pago</p>
                                )}
                            </div>

                            {/* Tarjeta de Próximo Pago */}
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Próximo Pago</h2>
                                {nextPaymentDate ? (
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-sm text-gray-500">Fecha Límite</p>
                                            <p className="font-medium">
                                                {format(nextPaymentDate, 'dd/MM/yyyy', { locale: es })}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Monto a Pagar</p>
                                            <p className="font-medium">S/ {planPrices[userData.plan]?.toFixed(2) || '0.00'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Estado</p>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${new Date() > nextPaymentDate ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                {new Date() > nextPaymentDate ? 'Vencido' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-500">No hay próximo pago programado</p>
                                )}
                            </div>

                            {/* Tarjeta de Métodos de Pago */}
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Métodos de Pago</h2>
                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <Image
                                            src="/images/logo-yape.png"
                                            alt="Yape"
                                            width={40}
                                            height={40}
                                            className="mr-3"
                                        />
                                        <div>
                                            <p className="font-medium">Yape/Plin</p>
                                            <p className="text-sm text-gray-500">N° 976 569 677</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Referencia</p>
                                        <p className="font-medium">{userData.uid?.toUpperCase()}</p>
                                        <p className='text-sm text-yellow-600 font-semibold'>Solo haz click en el enlace de abajo.</p>
                                    </div>
                                    <a
                                        href={`https://wa.me/51923829148?text=${whatsappMessage}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                                    >
                                        Contactar por WhatsApp
                                        <ArrowRight className="h-4 w-4 ml-2" />
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Historial de Pagos */}
                        <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Historial de Pagos</h2>
                            {monthlyPayments.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mes</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Finaliza</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {monthlyPayments.sort((a, b) => {
                                                const dateA = convertTimestamp(a.date) || new Date(a.monthKey);
                                                const dateB = convertTimestamp(b.date) || new Date(b.monthKey);
                                                return dateB - dateA;
                                            }).map((payment, index) => (
                                                <tr key={index}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                                                        {format(addMonths(new Date(payment.monthKey), 1), 'MMMM yyyy', { locale: es })}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        S/ {payment.amount?.toFixed(2) || '0.00'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {payment.date ? format(convertTimestamp(payment.date), 'dd/MM/yyyy', { locale: es }) : 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {payment.dueDate ? format(convertTimestamp(payment.dueDate), 'dd/MM/yyyy', { locale: es }) : 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${payment.paid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                            {payment.paid ? 'Pagado' : 'Pendiente'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-gray-500">No hay historial de pagos disponible</p>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}