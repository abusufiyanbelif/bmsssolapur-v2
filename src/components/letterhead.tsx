
"use client";

import React, { forwardRef } from 'react';
import { format } from 'date-fns';
import type { Organization } from '@/services/types';

interface LetterheadProps {
    organization: Organization;
    logoDataUri?: string;
    isTemplate?: boolean;
    contentRef: React.Ref<HTMLDivElement>; // Ref for the content area
}

export const Letterhead = forwardRef<HTMLDivElement, LetterheadProps>(
    ({ organization, logoDataUri, isTemplate = false, contentRef }, ref) => {

        const organizationDetails = {
            name: organization?.name || "Baitul Mal Samajik Sanstha (Solapur)",
            address: organization?.address || "123 Muslim Peth, Solapur, Maharashtra 413001",
            registration: organization?.registrationNumber || "MAHA/123/2024",
            email: organization?.contactEmail || "contact@baitulmalsolapur.org",
            phone: organization?.contactPhone || "+91 9372145889",
            website: organization?.website || 'https://baitulmalsolapur.org',
            pan: organization?.panNumber || 'AAFSB9401P',
            titleLine1: organization.footer?.organizationInfo.titleLine1 || 'BAITUL MAL',
            titleLine2: organization.footer?.organizationInfo.titleLine2 || 'SAMAJIK SANSTHA',
            titleLine3: organization.footer?.organizationInfo.titleLine3 || '(SOLAPUR)',
        };
        
        const textStyle = { letterSpacing: '0.5px' };

        return (
             <div ref={ref} className="p-12 bg-white text-black font-serif w-[210mm] min-h-[297mm] relative shadow-lg">
                {/* This div will be captured by html2canvas */}
                <div ref={contentRef} className="relative z-10 flex flex-col h-full bg-transparent">
                     <header className="pb-4 border-b-2 border-gray-800">
                        <table className="w-full">
                            <tbody>
                                <tr>
                                    <td style={{ width: '128px', verticalAlign: 'top' }}>
                                        {/* Logo is now outside the captured content, will be added by jsPDF */}
                                    </td>
                                    <td className="pl-4 align-top">
                                        <h1 className="text-3xl font-bold font-headline" style={{...textStyle, color: '#16a34a'}}>
                                            {organizationDetails.titleLine1.toUpperCase()}
                                        </h1>
                                        <h2 className="text-3xl font-bold font-headline" style={{...textStyle, color: '#ca8a04'}}>
                                            {organizationDetails.titleLine2.toUpperCase()}
                                        </h2>
                                        <h3 className="text-2xl font-bold font-headline" style={{...textStyle, color: '#16a34a'}}>
                                             {organizationDetails.titleLine3.toUpperCase()}
                                        </h3>
                                        <p className="text-sm text-gray-600 mt-2" style={textStyle}>{organizationDetails.address}</p>
                                        <p className="text-sm text-gray-600" style={textStyle}>Email: {organizationDetails.email} | Phone: {organizationDetails.phone}</p>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </header>

                    <main className="flex-grow pt-8 min-h-[550px]">
                        <div className="space-y-4 text-gray-800 text-base leading-relaxed" style={textStyle}>
                            <p>Date: {format(new Date(), 'MMMM dd, yyyy')}</p>
                            
                            {!isTemplate && (
                                <>
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
                                </>
                            )}
                        </div>
                    </main>
                    
                    <footer className="mt-12 pt-4 border-t text-xs text-center text-gray-500" style={textStyle}>
                        <p>Reg No: {organization.registrationNumber} | PAN: {organization.panNumber}</p>
                        <p>{organization.website}</p>
                    </footer>
                </div>

                {/* Logo and Watermark are now siblings to the content, not parents/children.
                    This makes them visible in the preview but separate from the html2canvas capture. */}
                {logoDataUri && (
                    <div className="absolute top-12 left-12 z-20 pointer-events-none">
                        <div className="relative w-28 h-28">
                             <img
                                src={logoDataUri}
                                alt="Organization Logo"
                                className="w-full h-full object-contain"
                            />
                        </div>
                    </div>
                )}
                 {logoDataUri && (
                    <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
                        <img
                            src={logoDataUri}
                            alt="Watermark"
                            className="w-3/4 h-3/4 object-contain opacity-5"
                        />
                    </div>
                )}
            </div>
        );
    }
);

Letterhead.displayName = 'Letterhead';
