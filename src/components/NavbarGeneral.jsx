"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Menu, X, User, Headphones, Info, Mail } from "lucide-react";

export default function NavbarGeneral() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [isDarkBackground, setIsDarkBackground] = useState(true);
    const navbarRef = useRef(null);
    const router = useRouter();

    useEffect(() => {
        const checkBackgroundColor = () => {
            if (!navbarRef.current) return;

            // Obtenemos el elemento debajo del navbar
            const navbarRect = navbarRef.current.getBoundingClientRect();
            const elementBelow = document.elementFromPoint(
                window.innerWidth / 2,
                navbarRect.bottom + 10
            );

            if (!elementBelow) return;

            // Función para obtener el color de fondo real
            const getActualBackgroundColor = (element) => {
                const style = window.getComputedStyle(element);
                let bgColor = style.backgroundColor;

                // Si el fondo es transparente, buscamos en los padres
                while (bgColor === 'rgba(0, 0, 0, 0)' && element.parentElement) {
                    element = element.parentElement;
                    const parentStyle = window.getComputedStyle(element);
                    bgColor = parentStyle.backgroundColor;
                }

                return bgColor;
            };

            const bgColor = getActualBackgroundColor(elementBelow);

            // Convertimos el color RGB a luminosidad para determinar si es claro u oscuro
            if (bgColor) {
                const rgb = bgColor.match(/\d+/g);
                if (rgb && rgb.length >= 3) {
                    const [r, g, b] = rgb.map(Number);
                    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                    setIsDarkBackground(brightness < 128);
                }
            }
        };

        // Verificamos el color al montar y al hacer scroll
        checkBackgroundColor();
        window.addEventListener('scroll', checkBackgroundColor);
        window.addEventListener('resize', checkBackgroundColor);

        return () => {
            window.removeEventListener('scroll', checkBackgroundColor);
            window.removeEventListener('resize', checkBackgroundColor);
        };
    }, []);

    const textColorClass = isDarkBackground ? 'text-white' : 'text-gray-900';
    const hoverTextColorClass = isDarkBackground ? 'hover:text-indigo-400' : 'hover:text-indigo-600';
    const borderColorClass = isDarkBackground ? 'border-gray-700' : 'border-gray-300';
    const mobileMenuBgClass = isDarkBackground ? 'bg-gray-800' : 'bg-white';
    const mobileMenuTextClass = isDarkBackground ? 'text-gray-300' : 'text-gray-700';
    const mobileMenuHoverClass = isDarkBackground ? 'hover:bg-gray-700' : 'hover:bg-gray-100';

    return (
        <>
            <nav
                ref={navbarRef}
                className={`fixed w-full backdrop-blur-sm ${textColorClass} z-50 shadow-lg`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <Link href="/" className="flex items-center">
                            <span className={`text-xl font-bold ${textColorClass} ${hoverTextColorClass} transition-colors`}>
                                EN CABINA
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-8">
                            <Link
                                href="/nuestro-team"
                                className={`flex items-center text-sm font-medium ${textColorClass} ${hoverTextColorClass} transition-colors`}
                            >
                                <Headphones className="h-4 w-4 mr-2" />
                                Nuestro Team
                            </Link>
                            <Link
                                href="/sobre-nosotros"
                                className={`flex items-center text-sm font-medium ${textColorClass} ${hoverTextColorClass} transition-colors`}
                            >
                                <Info className="h-4 w-4 mr-2" />
                                Sobre Nosotros
                            </Link>
                            <Link
                                href="/contacto"
                                className={`flex items-center text-sm font-medium ${textColorClass} ${hoverTextColorClass} transition-colors`}
                            >
                                <Mail className="h-4 w-4 mr-2" />
                                Contáctanos
                            </Link>

                            <div className={`border-l ${borderColorClass} h-6`}></div>

                            <Link
                                href="/login"
                                className={`text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-colors flex items-center`}
                            >
                                <User className="h-4 w-4 mr-2" />
                                Iniciar Sesión
                            </Link>
                        </div>

                        {/* Mobile menu button */}
                        <div className="md:hidden flex items-center">
                            <button
                                onClick={() => setMenuOpen(!menuOpen)}
                                className={`inline-flex items-center justify-center p-2 rounded-md ${textColorClass} focus:outline-none`}
                            >
                                {menuOpen ? (
                                    <X className="h-6 w-6" />
                                ) : (
                                    <Menu className="h-6 w-6" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {menuOpen && (
                    <div className={`md:hidden ${mobileMenuBgClass} shadow-xl`}>
                        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                            <Link
                                href="/nuestro-team"
                                className={`flex items-center px-3 py-2 text-base font-medium ${mobileMenuTextClass} ${mobileMenuHoverClass} rounded-md`}
                                onClick={() => setMenuOpen(false)}
                            >
                                <Headphones className="h-5 w-5 mr-3" />
                                Nuestro Team
                            </Link>
                            <Link
                                href="/sobre-nosotros"
                                className={`flex items-center px-3 py-2 text-base font-medium ${mobileMenuTextClass} ${mobileMenuHoverClass} rounded-md`}
                                onClick={() => setMenuOpen(false)}
                            >
                                <Info className="h-5 w-5 mr-3" />
                                Sobre Nosotros
                            </Link>
                            <Link
                                href="/contacto"
                                className={`flex items-center px-3 py-2 text-base font-medium ${mobileMenuTextClass} ${mobileMenuHoverClass} rounded-md`}
                                onClick={() => setMenuOpen(false)}
                            >
                                <Mail className="h-5 w-5 mr-3" />
                                Contáctanos
                            </Link>

                            <div className={`border-t ${borderColorClass} my-2`}></div>

                            <Link
                                href="/login"
                                className={`flex items-center justify-center px-3 py-2 text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md mx-2`}
                                onClick={() => setMenuOpen(false)}
                            >
                                <User className="h-5 w-5 mr-2" />
                                Iniciar Sesión
                            </Link>
                        </div>
                    </div>
                )}
            </nav>
        </>
    );
}