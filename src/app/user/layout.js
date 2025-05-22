'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/../lib/firebase';
import { SidebarProvider } from '@/../context/SidebarContext';
import Sidebar from '@/components/Sidebar';

export default function UserLayout({ children }) {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const router = useRouter();
    const pathname = usePathname(); // 👈 obtener la ruta actual

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUser(user);
            } else {
                router.push('/login');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    if (!user || loading) {
        return null;
    }

    const hideSidebar = pathname === '/user/complete-profile'; // 👈 condicional para ocultar Sidebar

    return (
        <SidebarProvider>
            <div>
                {!hideSidebar && (
                    <div className="h-full w-full">
                        <div className="fixed inset-y-0 z-30">
                            <Sidebar />
                        </div>
                    </div>
                )}
                {children}
            </div>
        </SidebarProvider>
    );
}