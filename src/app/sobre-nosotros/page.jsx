import Image from 'next/image';
import Head from 'next/head';

import NavbarGeneral from '@/components/NavbarGeneral';

const AboutPage = () => {
    return (
        <>
            <NavbarGeneral />
            <Head>
                <title>✨ Nuestra Historia | En Cabina</title>
                <meta name="description" content="La pasión y personas detrás de esta plataforma" />
            </Head>

            {/* Hero Section */}
            <div className="relative min-h-[70vh] py-16 flex items-center justify-center overflow-hidden bg-gray-900">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute inset-0 bg-[url('/images/pattern.svg')] bg-center"></div>
                </div>

                <div className="max-w-7xl mx-auto py-24 px-4 sm:px-6 lg:px-8 relative">
                    <div className="text-center">
                        <h1 className="text-4xl font-extrabold text-white sm:text-5xl sm:tracking-tight lg:text-6xl">
                            Más que una plataforma
                        </h1>
                        <p className="mt-6 max-w-lg mx-auto text-xl text-gray-100">
                            Una historia de pasión, código y demasiado café
                        </p>
                    </div>
                </div>
            </div>

            {/* Creator Section - Modern Card */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 mt-10">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="md:flex">
                        <div className="md:w-1/3 relative h-80 md:h-auto">
                            <Image
                                src="/images/juanvillegas.png"
                                alt="Creador de la plataforma"
                                fill
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Juan Villegas</h2>
                                    <p className="text-gray-200">Fundador, Dev Principal, DJ y <span className='line-through'>Spiderman</span></p>
                                </div>
                            </div>
                        </div>

                        <div className="md:w-2/3 p-8 md:p-10">
                            <div className="flex space-x-4 mb-6">
                                <a href="https://www.instagram.com/juanvillegas._/" className="text-gray-600 hover:text-gray-500">
                                    <span className="sr-only">Twitter</span>
                                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
                                    </svg>
                                </a>

                                {/* <a href="#" className="text-gray-600 hover:text-gray-500">
                                    <span className="sr-only">GitHub</span>
                                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                                    </svg>

                                </a> */}
                            </div>

                            <p className="text-lg text-gray-600 mb-6">
                                👋 ¡Hola! Soy Juan Villegas, el cerebro detrás de esta locura <span className="font-semibold">(a ratos DJ, a ratos estudiante de Ing. de Sistemas, y a veces ambas cosas al mismo tiempo con una laptop en la cabina)</span>. Todo esto comenzó cuando vi un problema que nadie arreglaba… así que le metí código, estilo y un poco de bass. ✨Boom, problema resuelto.✨
                            </p>

                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                <p className="text-gray-800 font-medium">"Dense una vuelta por la web, adquieran su membresía, y si ven un bug... actúen normal, como si fuera parte del show 🕺."</p>
                            </div>

                        </div>
                    </div>
                </div>

                <div className='text-center text-xl font-bold py-10'>
                    <p>Naaaaah, con lo de arriba fue suficiente; solo somos Chat GPT, Deepsek y Yo 😄.</p>
                </div>
            </div>



            {/* Story Sections */}
            {/* <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
                <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="md:w-1/2">
                        <div className="relative h-64 rounded-2xl overflow-hidden shadow-lg">
                            <Image
                                src="/images/office.jpg"
                                alt="Oficina o espacio de trabajo"
                                fill
                                className="object-cover"
                            />
                        </div>
                    </div>
                    <div className="md:w-1/2">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">¿Por qué existe esto?</h2>
                        <p className="text-lg text-gray-600">
                            En [año], me di cuenta de que [problema específico]. Todos los intentos de solución eran [qué fallaba].
                            Así que armado con [herramientas/recursos] y mucha determinación, construí la primera versión en solo [tiempo].
                        </p>
                        <p className="mt-4 text-lg text-gray-600">
                            Hoy, [NombreDeTuWeb] ayuda a [número] personas cada mes a [beneficio concreto].
                        </p>
                    </div>
                </div>

            <div className="bg-gray-900 rounded-2xl p-8 text-white">
                <h2 className="text-2xl font-bold mb-6">Nuestro stack tecnológico</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['Next.js', 'React', 'Tailwind', 'Node.js', 'MongoDB', 'Vercel', 'GitHub', 'Figma'].map((tech) => (
                        <div key={tech} className="bg-gray-800 rounded-lg p-4 text-center hover:bg-gray-700 transition">
                            {tech}
                        </div>
                    ))}
                </div>
                <p className="mt-6 text-gray-300">
                    Elegimos estas tecnologías porque [razón breve pero humana].
                </p>
            </div>

            <div className="text-center">
                <div className="inline-flex items-center px-6 py-3 bg-gray-100 rounded-full">
                    <span className="text-gray-800 font-medium">✨ Curiosidad: </span>
                    <span className="ml-2 text-gray-700">El primer prototipo fue hecho en {new Date().getFullYear() - 1} y se llamaba "[NombreTemporal]"</span>
                </div>
            </div>
        </div > */
            }

            {/* CTA */}
            {/* <div className="bg-gray-50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">¿Quieres ser parte de esta historia?</h2>
                    <p className="text-lg text-gray-600 mb-8">
                        Estamos siempre abiertos a conversaciones, colaboraciones o simplemente a tomar un café (virtual).
                    </p>
                    <a
                        href="#"
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-gray-600 hover:bg-gray-700"
                    >
                        Contáctanos
                    </a>
                </div>
            </div> */}
        </>
    );
};

export default AboutPage;