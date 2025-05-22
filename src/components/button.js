"use client";

export function Button({ className = "", children, ...props }) {
    return (
        <button
            className={`px-4 py-2 rounded-md font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}