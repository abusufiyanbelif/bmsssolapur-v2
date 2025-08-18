
"use client";

import { useState, useEffect } from 'react';

export function useRazorpay(): [boolean, string | null] {
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        
        const handleLoad = () => setIsLoaded(true);
        const handleError = () => setError("Failed to load the Razorpay payment gateway. Please check your internet connection and try again.");
        
        script.addEventListener('load', handleLoad);
        script.addEventListener('error', handleError);

        document.body.appendChild(script);

        return () => {
            script.removeEventListener('load', handleLoad);
            script.removeEventListener('error', handleError);
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

    return [isLoaded, error];
}
