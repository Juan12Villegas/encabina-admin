'use client';
import { useSidebar } from '@/../context/SidebarContext';
import DisplaySettings from '@/components/DisplaySettings';
import EditBanner from "@/components/EditBanner";
import EditPayment from '@/components/EditPayment';
import EditProfilePhoto from "@/components/EditProfilePhoto";

import { ChevronDown, MapPin, Calendar, Clock, Check, X, Disc3, ArrowLeft, Disc, Home, List } from "lucide-react";

export default function Personalization() {
    const { isCollapsed } = useSidebar();

    return (
        <div className='w-full'>
            <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-0 lg:ml-16' : 'ml-0 lg:ml-64'
                }`}>
                {/* Cabecera con breadcrumbs y título */}
                <div className="bg-white border border-gray-200 p-4 lg:p-6">
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                        <a href="/user/eventos" className="flex items-center hover:text-indigo-600">
                            <Home className="h-4 w-4 mr-1" />
                            Inicio
                        </a>
                        {/* <ChevronDown className="h-4 w-4 mx-1 transform -rotate-90" />
                    <a href="/user/eventos" className="flex items-center hover:text-indigo-600">
                        <List className="h-4 w-4 mr-1" />
                        Mis Eventos
                    </a> */}
                        <ChevronDown className="h-4 w-4 mx-1 transform -rotate-90" />
                        <span className="text-indigo-600 font-medium">Personalización</span>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Personalización</h1>
                            <p className="text-gray-600 mt-1">Personaliza como quieres verte y como quieres que te vean.</p>
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
                    <div className="flex flex-wrap gap-4">
                        <div className='flex flex-col lg:flex-row gap-4 w-full'>
                            <div className='w-full'>
                                <EditPayment />
                            </div>
                            <div className='w-full'>
                                <EditBanner />
                            </div>
                        </div>

                        <div className='flex flex-col lg:flex-row gap-4 w-full'>
                            <div className='w-full'>
                                <EditProfilePhoto />
                            </div>
                            <div className='w-full'>
                                <DisplaySettings />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}