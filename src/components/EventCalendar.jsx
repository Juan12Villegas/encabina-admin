"use client";

import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, X, RefreshCw, LoaderCircle, Check, ExternalLink } from "lucide-react";

export const EventCalendar = ({ eventos, dominantColor, colorText }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [syncStatus, setSyncStatus] = useState({}); // {eventId: 'loading' | 'success' | 'error'}

    // Hook para bloquear el desplazamiento cuando se muestra el modal
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'; // Bloquea el desplazamiento
        } else {
            document.body.style.overflow = ''; // Restaura el desplazamiento
        }

        // Limpiar al desmontar el componente
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Convertir eventos a fechas para marcar en el calendario
    const eventDates = eventos.map(evento => {
        if (!evento.horaInicio?.seconds) return null;
        return new Date(evento.horaInicio.seconds * 1000);
    }).filter(date => date !== null);

    // Función para sincronizar un evento individual con Google Calendar
    const syncEventWithGoogleCalendar = (evento) => {
        setSyncStatus(prev => ({ ...prev, [evento.id]: 'loading' }));

        try {
            // Formatear fechas para Google Calendar
            const startDate = new Date(evento.horaInicio.seconds * 1000);
            const endDate = new Date(evento.horaFin.seconds * 1000);

            // Crear URL para Google Calendar
            const calendarUrl = new URL('https://calendar.google.com/calendar/render');
            calendarUrl.searchParams.append('action', 'TEMPLATE');
            calendarUrl.searchParams.append('text', evento.nombre);
            calendarUrl.searchParams.append('dates',
                `${formatDateForGoogle(startDate)}/${formatDateForGoogle(endDate)}`);
            calendarUrl.searchParams.append('details', `Evento DJ: ${evento.nombre}\nLugar: ${evento.lugar}\nEstado: ${evento.estado}`);
            calendarUrl.searchParams.append('location', evento.lugar);

            // Abrir en nueva pestaña
            window.open(calendarUrl.toString(), '_blank');

            setSyncStatus(prev => ({ ...prev, [evento.id]: 'success' }));
            setTimeout(() => setSyncStatus(prev => ({ ...prev, [evento.id]: undefined })), 3000);
        } catch (error) {
            console.error('Error al sincronizar evento:', error);
            setSyncStatus(prev => ({ ...prev, [evento.id]: 'error' }));
            setTimeout(() => setSyncStatus(prev => ({ ...prev, [evento.id]: undefined })), 3000);
        }
    };

    // Formatear fecha para Google Calendar (YYYYMMDDTHHmmss)
    const formatDateForGoogle = (date) => {
        return [
            date.getUTCFullYear(),
            String(date.getUTCMonth() + 1).padStart(2, '0'),
            String(date.getUTCDate()).padStart(2, '0'),
            'T',
            String(date.getUTCHours()).padStart(2, '0'),
            String(date.getUTCMinutes()).padStart(2, '0'),
            String(date.getUTCSeconds()).padStart(2, '0'),
            'Z'
        ].join('');
    };

    // Componente de calendario simple
    const SimpleCalendar = () => {
        const [currentDate, setCurrentDate] = useState(new Date());

        const getDaysInMonth = (date) => {
            const year = date.getFullYear();
            const month = date.getMonth();
            return new Date(year, month + 1, 0).getDate();
        };

        const getFirstDayOfMonth = (date) => {
            const year = date.getFullYear();
            const month = date.getMonth();
            return new Date(year, month, 1).getDay();
        };

        const daysInMonth = getDaysInMonth(currentDate);
        const firstDayOfMonth = getFirstDayOfMonth(currentDate);

        const prevMonth = () => {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
        };

        const nextMonth = () => {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
        };

        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

        // Obtener eventos para el mes actual
        const eventsThisMonth = eventos.filter(evento => {
            if (!evento.horaInicio?.seconds) return false;
            const eventDate = new Date(evento.horaInicio.seconds * 1000);
            return eventDate.getMonth() === currentDate.getMonth() &&
                eventDate.getFullYear() === currentDate.getFullYear();
        });

        return (
            <div className="m-auto border rounded-lg p-4 w-full max-w-xs bg-white">
                <div className="flex justify-between items-center mb-4">
                    <button
                        onClick={prevMonth}
                        className="p-1 rounded hover:bg-gray-100 text-gray-700"
                    >
                        &lt;
                    </button>
                    <h3 className="font-medium text-gray-800">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h3>
                    <button
                        onClick={nextMonth}
                        className="p-1 rounded hover:bg-gray-100 text-gray-700"
                    >
                        &gt;
                    </button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-4">
                    {["D", "L", "M", "X", "J", "V", "S"].map(day => (
                        <div key={day} className="text-center text-sm font-medium text-gray-500">
                            {day}
                        </div>
                    ))}

                    {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                        <div key={`empty-${i}`} className="h-8"></div>
                    ))}

                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                        const hasEvent = eventDates.some(eventDate =>
                            eventDate.getDate() === day &&
                            eventDate.getMonth() === currentDate.getMonth() &&
                            eventDate.getFullYear() === currentDate.getFullYear()
                        );

                        return (
                            <div
                                key={day}
                                style={{
                                    backgroundColor: hasEvent ? dominantColor : 'transparent',
                                    color: date.toDateString() === new Date().toDateString() ? dominantColor : (hasEvent ? colorText : 'inherit')
                                }}

                                className={`h-8 flex items-center justify-center rounded-full text-sm cursor-default
                  ${hasEvent ? 'bg-indigo-100 border-2' : ''}
                  ${date.toDateString() === new Date().toDateString() ? 'font-bold text-indigo-600' : ''}`}
                            >
                                {day}
                            </div>
                        );
                    })}
                </div>

                {/* Lista de eventos del mes */}
                <div className="mt-4 border-t pt-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Eventos este mes:</h4>
                    {eventsThisMonth.length > 0 ? (
                        <ul className="space-y-2 h-32 sm:max-h-96 overflow-y-auto">
                            {eventsThisMonth.map(evento => (
                                <li key={evento.id} className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-medium">{evento.nombre}</p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(evento.horaInicio.seconds * 1000).toLocaleDateString()} - {evento.lugar}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => syncEventWithGoogleCalendar(evento)}
                                        disabled={syncStatus[evento.id] === 'loading'}
                                        className={`p-1.5 rounded-full ${syncStatus[evento.id] === 'loading'
                                            ? 'text-gray-400'
                                            : syncStatus[evento.id] === 'success'
                                                ? 'text-green-500 bg-green-50'
                                                : 'text-indigo-600 hover:bg-indigo-50'
                                            }`}
                                        title="Sincronizar con Google Calendar"
                                    >
                                        {syncStatus[evento.id] === 'loading' ? (
                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                        ) : syncStatus[evento.id] === 'success' ? (
                                            <LoaderCircle className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <ExternalLink className="h-4 w-4" />
                                        )}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500">No hay eventos este mes</p>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="relative">
            {/* Botón para abrir el calendario */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{ backgroundColor: dominantColor, color: colorText }}
                className="h-full w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-800 bg-gray-700 text-white transition-colors hover:cursor-pointer"
            >
                <CalendarIcon className="h-4 w-4" />
                <span>Calendario</span>
            </button>

            {/* Modal/Overlay del calendario */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity flex items-center justify-center z-50">
                    <div className="relative bg-white rounded-xl shadow-xl p-4 max-w-sm w-full mx-4 m-auto">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100"
                        >
                            <X className="h-5 w-5 text-gray-500" />
                        </button>
                        <h2 className="text-lg text-center font-bold text-gray-800 mb-4">Calendario de Eventos</h2>
                        <SimpleCalendar />

                        <div className="mt-4 px-2 py-2 text-sm text-gray-600 border-t flex items-center justify-center gap-2">
                            <div
                                style={{ backgroundColor: dominantColor }}
                                className="w-3 h-3 rounded-full"></div>
                            <span>Días con eventos</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};