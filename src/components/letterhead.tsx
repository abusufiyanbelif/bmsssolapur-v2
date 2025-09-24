"use client";

import React, { forwardRef } from 'react';
import { format } from 'date-fns';
import type { Organization } from '@/services/types';

interface LetterheadProps {
    organization: Organization;
    // Allow passing base64 data URIs for PDF generation
    logoDataUri?: string;
    watermarkDataUri?: string;
}

export const Letterhead = forwardRef<HTMLDivElement, LetterheadProps>(
    ({ organization, logoDataUri, watermarkDataUri }, ref) => {

        const organizationDetails = {
            name: organization?.name || "Baitul Mal Samajik Sanstha (Solapur)",
            address: organization?.address || "123 Muslim Peth, Solapur, Maharashtra 413001",
            registration: organization?.registrationNumber || "MAHA/123/2024",
            pan: organization?.panNumber || "AAFTB9401P",
            email: organization?.contactEmail || "contact@baitulmalsolapur.org",
            phone: organization?.contactPhone || "+91 9372145889",
            logoUrl: organization?.logoUrl || "https://picsum.photos/seed/logo/128/128",
            titleLine1: organization.footer?.organizationInfo.titleLine1 || 'Baitul Mal',
            titleLine2: organization.footer?.organizationInfo.titleLine2 || 'Samajik Sanstha',
            titleLine3: organization.footer?.organizationInfo.titleLine3 || '(Solapur)',
        };
        
        const textStyle = { letterSpacing: '0.5px' };

        return (
            <div ref={ref} className="p-12 bg-white text-black font-serif w-[210mm] min-h-[297mm] relative">
                {/* Watermark Layer */}
                <div className="absolute inset-0 z-0 flex items-center justify-center">
                    <img
                        src={watermarkDataUri || organizationDetails.logoUrl}
                        alt="Watermark"
                        crossOrigin="anonymous"
                        className="w-3/4 h-3/4 object-contain opacity-5"
                        data-ai-hint="logo watermark"
                    />
                </div>

                {/* Content Layer */}
                <div className="relative z-10 flex flex-col h-full">
                     <header className="pb-4 border-b-2 border-gray-800">
                        <table className="w-full">
                            <tbody>
                                <tr>
                                    <td style={{ width: '128px', verticalAlign: 'top' }}>
                                        <div className="relative w-32 h-32">
                                            <img
                                                src={logoDataUri || organizationDetails.logoUrl}
                                                alt="Organization Logo"
                                                crossOrigin="anonymous"
                                                className="w-full h-full object-contain"
                                                data-ai-hint="logo"
                                            />
                                        </div>
                                    </td>
                                    <td className="pl-4 align-top">
                                        <h1 className="text-3xl font-bold font-headline" style={{...textStyle, color: 'hsl(var(--primary))'}}>
                                            {organizationDetails.titleLine1.toUpperCase()}
                                        </h1>
                                        <h2 className="text-3xl font-bold font-headline" style={{...textStyle, color: 'hsl(var(--accent))'}}>
                                            {organizationDetails.titleLine2.toUpperCase()}
                                        </h2>
                                        <h3 className="text-2xl font-bold font-headline" style={{...textStyle, color: 'hsl(var(--primary))'}}>
                                             {organizationDetails.titleLine3.toUpperCase()}
                                        </h3>
                                        <p className="text-sm text-gray-600 mt-2" style={textStyle}>{organizationDetails.address}</p>
                                        <p className="text-sm text-gray-600" style={textStyle}>Email: {organizationDetails.email} | Phone: {organizationDetails.phone}</p>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </header>

                    <main className="flex-grow pt-8">
                        {/* The content of the letter will be placed here by the user */}
                         <div className="space-y-4 text-gray-800 text-base leading-relaxed" style={textStyle}>
                            <p>Date: {format(new Date(), 'MMMM dd, yyyy')}</p>
                            <br />
                            <p>To,</p>
                            <p>[Recipient Name]</p>
                            <p>[Recipient Address]</p>
                            <br />
                            <p><span className="font-bold">Subject:</span> [Subject of the Letter]</p>
                            <br />
                            <p>Respected Sir/Madam,</p>
                            <br />
                            <p>
                                [Start writing the body of your letter here...]
                            </p>
                            <br />
                            <p>Thank you for your consideration.</p>
                            <br />
                            <br />
                            <p className="font-bold">[Your Name/Organization Name]</p>
                        </div>
                    </main>
                    
                    <footer className="mt-12 pt-4 border-t text-xs text-center text-gray-500" style={textStyle}>
                        <p>Reg No: {organization.registrationNumber} | PAN: {organization.panNumber}</p>
                        <p>{organization.website}</p>
                    </footer>
                </div>
            </div>
        );
    }
);

Letterhead.displayName = 'Letterhead';
