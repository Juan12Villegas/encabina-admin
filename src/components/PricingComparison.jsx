import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { te } from "date-fns/locale";

const PricingComparison = () => {
    const features = [
        { name: "Eventos mensuales", basic: "10", pro: "30", premium: "Ilimitados*" },
        { name: "Solicitudes por evento", basic: "100", pro: "300", premium: "Ilimitadas*" },
        { name: "Analíticas avanzadas", basic: "Básicas", pro: "Avanzadas", premium: "Avanzadas" },
        { name: "Presencia Online", basic: "✓", pro: "✓", premium: "✓" },
        { name: "Soporte prioritario", basic: "✗", pro: "✓", premium: "24/7 VIP" }
    ];

    return (
        <div className="py-10 bg-white rounded-xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
                    Compara nuestros planes
                </h2>
                <div className="overflow-x-auto w-full">
                    <table className="w-full overflow-x-auto">
                        <thead>
                            <tr>
                                <th className="text-left pb-6">Características</th>
                                <th className="text-center pb-6">Bassline</th>
                                <th className="text-center pb-6">Drop Pro</th>
                                <th className="text-center pb-6">MainStage</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {features.map((feature, index) => (
                                <tr key={index}>
                                    <td className="py-4 text-gray-700">{feature.name}</td>
                                    <td className="text-center py-4">{feature.basic}</td>
                                    <td className="text-center py-4">{feature.pro}</td>
                                    <td className="text-center py-4 font-medium">{feature.premium}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PricingComparison;