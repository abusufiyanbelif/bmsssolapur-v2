
"use client";

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { getCurrentOrganization } from '@/app/admin/settings/actions';

interface LogoProps {
    className?: string;
    logoUrl?: string | null;
}

const isValidHttpUrl = (string?: string | null): boolean => {
    if (!string) return false;
    try {
        const url = new URL(string);
        // Only allow http and https protocols, reject gs://, blob:, etc.
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
};

const DEFAULT_LOGO = "https://firebasestorage.googleapis.com/v0/b/baitul-mal-connect.appspot.com/o/app-assets%2Flogo-new.png?alt=media&token=e5079a49-2723-4d22-b91c-297c357662c2";

export function Logo({ className, logoUrl: propLogoUrl }: LogoProps) {
  const [logoUrl, setLogoUrl] = useState(() => 
    isValidHttpUrl(propLogoUrl) ? propLogoUrl! : DEFAULT_LOGO
  );
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const effectiveUrl = isValidHttpUrl(propLogoUrl) ? propLogoUrl : null;
    
    if (effectiveUrl) {
      setLogoUrl(effectiveUrl);
      setHasError(false);
    } else {
      // If no valid prop URL, try fetching from the organization data as a fallback.
      getCurrentOrganization().then(org => {
        if (isValidHttpUrl(org?.logoUrl)) {
          setLogoUrl(org!.logoUrl!);
          setHasError(false);
        } else {
          setLogoUrl(DEFAULT_LOGO); // Fallback if fetched URL is also invalid
        }
      }).catch(() => {
        setLogoUrl(DEFAULT_LOGO); // Fallback on fetch error
      });
    }
  }, [propLogoUrl]);
  
  const handleError = () => {
    if (!hasError) { // Prevent infinite loops if the default logo also fails
        setHasError(true);
        setLogoUrl(DEFAULT_LOGO);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <Image
        src={logoUrl}
        alt="Baitul Mal Samajik Sanstha (Solapur) Logo"
        fill
        sizes="56px"
        priority
        className="object-contain"
        data-ai-hint="logo"
        onError={handleError}
      />
    </div>
  );
}


export const GooglePayLogo = ({ className }: LogoProps) => (
    <svg className={className} width="100" height="40" viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg">
      <g fill="none" fillRule="evenodd">
        <path d="M78.53 17.06c0-1.8-1.46-3.26-3.27-3.26h-4.8v6.52h4.8c1.8 0 3.27-1.46 3.27-3.26zm-1.47 0c0 .9-.73 1.63-1.63 1.63h-3.17v-3.26h3.17c.9 0 1.63.73 1.63 1.63z" fill="#4285F4"></path>
        <path d="M84.73 17.06c0-1.8-1.46-3.26-3.27-3.26h-4.8v6.52h4.8c1.8 0 3.27-1.46 3.27-3.26zm-1.47 0c0 .9-.73 1.63-1.63 1.63h-3.17v-3.26h3.17c.9 0 1.63.73 1.63 1.63zM88.53 13.8h-2.5v6.52h1.47v-2.5h1.03c1.8 0 3.27-1.46 3.27-3.26s-1.47-3.26-3.27-3.26zm0 4.9h-1.03v-3.26h1.03c.9 0 1.63.73 1.63 1.63s-.73 1.63-1.63 1.63z" fill="#EA4335"></path>
        <path d="M47.79 17.02c0-2.45-1.92-4.14-4.52-4.14-2.6 0-4.52 1.69-4.52 4.14 0 2.4 1.92 4.13 4.52 4.13 2.6 0 4.52-1.74 4.52-4.13zm-7.6-0c0-1.65 1.18-2.8 3.08-2.8s3.08 1.15 3.08 2.8c0 1.6-1.18 2.79-3.08 2.79s-3.08-1.2-3.08-2.8z" fill="#4285F4"></path>
        <path d="M57.17 17.02c0-2.45-1.92-4.14-4.52-4.14-2.6 0-4.52 1.69-4.52 4.14 0 2.4 1.92 4.13 4.52 4.13 2.6 0 4.52-1.74 4.52-4.13zm-7.6-0c0-1.65 1.18-2.8 3.08-2.8s3.08 1.15 3.08 2.8c0 1.6-1.18 2.79-3.08 2.79s-3.08-1.2-3.08-2.8z" fill="#FBBC04"></path>
        <path d="M66.55 17.02c0-2.45-1.92-4.14-4.52-4.14-2.6 0-4.52 1.69-4.52 4.14 0 2.4 1.92 4.13 4.52 4.13 2.6 0 4.52-1.74 4.52-4.13zm-7.6-0c0-1.65 1.18-2.8 3.08-2.8s3.08 1.15 3.08 2.8c0 1.6-1.18 2.79-3.08 2.79s-3.08-1.2-3.08-2.8z" fill="#EA4335"></path>
        <path d="M35.63 13h-1.4v8.32h1.4V13z" fill="#34A853"></path>
        <path d="M21.2 19.34c.82 0 1.5-.68 1.5-1.5V9.45c0-2.6-2-4.4-4.7-4.4-2.65 0-4.65 1.77-4.65 4.3v1.5h1.44v-1.6c0-1.6 1.3-2.7 3.2-2.7 1.9 0 3.26 1.1 3.26 2.8v8.72c0 .82.68 1.5 1.5 1.5z" fill="#4285F4"></path>
        <path d="M32.06 20.35l-2.44-3.66c-.16-.24-.16-.56 0-.8l2.44-3.66h-1.6l-2.45 3.65 2.45 3.66h1.6z" fill="#34A853"></path>
      </g>
    </svg>
);

export const PhonePeLogo = ({ className }: LogoProps) => (
    <svg className={className} width="100" height="40" viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg">
        <path d="M51.9,19.8c0-3.1-2.4-5.5-5.5-5.5s-5.5,2.4-5.5,5.5s2.4,5.5,5.5,5.5S51.9,22.9,51.9,19.8z M46.4,14.3 c-3.1,0-5.5,2.4-5.5,5.5s2.4,5.5,5.5,5.5s5.5-2.4,5.5-5.5S49.5,14.3,46.4,14.3z" fill="#FFF"></path>
        <path d="M60.7,19.8L60.7,19.8c0-3.1-2.4-5.5-5.5-5.5h-2.1v11h2.1C58.2,25.3,60.7,22.9,60.7,19.8z M55.2,14.3h-2.1 c-3.1,0-5.5,2.4-5.5,5.5s2.4,5.5,5.5,5.5h2.1c3.1,0,5.5-2.4,5.5-5.5S58.2,14.3,55.2,14.3z" fill="#FFF"></path>
        <path d="M72.9,14.3H63v11h1.7v-4.4h6.5c2.4,0,4.2-1.9,4.2-4.4C75.4,15.6,74.3,14.3,72.9,14.3z M69.5,19.8h-4.8v-4h4.8 c1.5,0,2.6,1.2,2.6,2.7S71,19.8,69.5,19.8z" fill="#FFF"></path>
        <rect x="0" y="0" width="100" height="40" fill="#6739B7" rx="4" ry="4" style={{"mixBlendMode": "destination-over"}}></rect>
    </svg>
);

export const PaytmLogo = ({ className }: LogoProps) => (
     <svg className={className} width="100" height="40" viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg">
      <g fill="none" fillRule="evenodd">
        <path d="M37.6 30.2h-18L28.3 10h18z" fill="#00B9F1"></path>
        <path d="M28.4 30.2H10L18.7 10h18z" fill="#002E6E"></path>
      </g>
    </svg>
);

    