"use client";

import { useState, useEffect } from "react";

export function Switch({
    checked,
    onCheckedChange,
    id,
    className = "",
    disabled = false
}) {
    const [isChecked, setIsChecked] = useState(checked);

    useEffect(() => {
        setIsChecked(checked);
    }, [checked]);

    const handleToggle = () => {
        if (disabled) return;
        const newValue = !isChecked;
        setIsChecked(newValue);
        onCheckedChange(newValue);
    };

    return (
        <button
            id={id}
            type="button"
            role="switch"
            aria-checked={isChecked}
            aria-disabled={disabled}
            onClick={handleToggle}
            disabled={disabled}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${className} ${isChecked ? "bg-blue-600" : "bg-gray-200"
                } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                }`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isChecked ? "translate-x-6" : "translate-x-1"
                    }`}
            />
        </button>
    );
}