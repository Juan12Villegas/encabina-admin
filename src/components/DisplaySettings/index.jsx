"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Switch } from "@/components/Switch";
import { Loader2 } from "lucide-react";

export default function DisplaySettings() {
    const [loading, setLoading] = useState(true);
    const [userPlan, setUserPlan] = useState(null);
    const [userData, setUserData] = useState(null);
    const [settings, setSettings] = useState({
        showQR: false,
        showProfile: false,
        showBanner: false
    });

    useEffect(() => {
        const fetchUserSettings = async () => {
            const user = auth.currentUser;
            if (!user) return;

            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const data = userSnap.data();
                setUserData(data);
                setUserPlan(data.plan || 'bassline');
                setSettings({
                    showQR: data.showQR || false,
                    showProfile: data.showProfile || false,
                    showBanner: data.showBanner || false
                });

                // Verificar si los switches están activos pero el plan no lo permite
                if (data.plan === 'bassline') {
                    const updates = {};
                    if (data.showQR) updates.showQR = false;
                    if (data.showBanner) updates.showBanner = false;

                    if (Object.keys(updates).length > 0) {
                        await updateDoc(userRef, updates);
                        setSettings(prev => ({
                            ...prev,
                            ...updates
                        }));
                    }
                }
            }
            setLoading(false);
        };

        fetchUserSettings();
    }, []);

    const validateField = (field) => {
        switch (field) {
            case 'showQR':
                return !!userData?.qrPaymentUrl; // Verifica si existe qrPaymentUrl
            case 'showProfile':
                return !!userData?.profileUrl; // Verifica si existe profileUrl
            case 'showBanner':
                return !!userData?.bannerUrl; // Verifica si existe bannerUrl
            default:
                return false;
        }
    };

    const handleSwitchChange = async (field, value) => {
        const user = auth.currentUser;
        if (!user || !userData) return;

        // Verificar restricciones de plan
        if (userPlan === 'bassline' && (field === 'showQR' || field === 'showBanner')) {
            return;
        }

        // Validar si el campo requerido está vacío
        if (value && !validateField(field)) {
            alert(`Debes configurar primero el ${field.replace('show', '').toLowerCase()} antes de activarlo`);
            return;
        }

        try {
            // Actualizar estado local primero para una respuesta más rápida
            setSettings(prev => ({ ...prev, [field]: value }));

            // Actualizar Firestore
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, { [field]: value });
        } catch (error) {
            console.error("Error al actualizar configuración:", error);
            // Revertir el cambio si falla
            setSettings(prev => ({ ...prev, [field]: !value }));
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        );
    }

    return (
        <div className="w-full h-full p-4 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold">Configuración de visualización</h2>
            {userPlan === 'bassline' && (
                <div className="my-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 text-sm">
                    <p>⚠️ Las funciones de QR y Banner están disponibles en planes superiores al bassline.
                        Actualiza tu plan para desbloquear esta y otras características premium.</p>
                </div>
            )}

            <div className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                    <label htmlFor="qr-switch" className="text-sm font-medium leading-none">
                        Habilitar QR
                    </label>
                    <Switch
                        id="qr-switch"
                        checked={settings.showQR}
                        onCheckedChange={(checked) => handleSwitchChange("showQR", checked)}
                        disabled={userPlan === 'bassline' || !userData?.qrPaymentUrl}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <label htmlFor="profile-switch" className="text-sm font-medium leading-none">
                        Habilitar perfil
                    </label>
                    <Switch
                        id="profile-switch"
                        checked={settings.showProfile}
                        onCheckedChange={(checked) => handleSwitchChange("showProfile", checked)}
                        disabled={!userData?.profileUrl}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <label htmlFor="banner-switch" className="text-sm font-medium leading-none">
                        Habilitar banner
                    </label>
                    <Switch
                        id="banner-switch"
                        checked={settings.showBanner}
                        onCheckedChange={(checked) => handleSwitchChange("showBanner", checked)}
                        disabled={userPlan === 'bassline' || !userData?.bannerUrl}
                    />
                </div>
            </div>
        </div>
    );
}