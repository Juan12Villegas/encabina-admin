/* module.exports = {
    output: "standalone",
    images: {
        domains: ["drive.google.com"],
    },
};

 */
// next.config.js
const nextConfig = {
    images: {
        domains: ["drive.google.com"], // Permitir imágenes desde Google Drive
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'firebasestorage.googleapis.com',
                // Opcional: puedes restringir a paths específicos
                // pathname: '/v0/b/encabina.firebasestorage.app/o/**',
            },
            // Puedes agregar otros dominios si es necesario
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com', // Para fotos de perfil de Google
            },
        ],
    },
};

module.exports = nextConfig;