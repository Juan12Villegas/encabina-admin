"use client";

export function Input({ className = "", ...props }) {
    return (
        <input
            className={`px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${className}`}
            {...props}
        />
    );
}