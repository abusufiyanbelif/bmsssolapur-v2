
"use client";

import React, { forwardRef } from 'react';
import { format } from 'date-fns';
import type { Organization } from '@/services/types';

interface LetterheadProps {
    organization: Organization;
}

export const Letterhead = forwardRef<HTMLDivElement, LetterheadProps>(
    ({ organization }, ref) => {
        const textStyle = { letterSpacing: '0.5px' };

        return (
            <div ref={ref} className="p-12 bg-white text-black font-serif w-[210mm] min-h-[297mm] flex flex-col relative">
                <img
                    src="https://firebasestorage.googleapis.com/v0/b/baitul-mal-connect-visualizer.firebasestorage.app/o/app_assets%2FIMG-20250816-WA0000.jpg?alt=media"
                    alt="Watermark"
                    crossOrigin="anonymous"
                    className="absolute inset-0 w-full h-full object-contain opacity-5 z-0"
                    data-ai-hint="logo watermark"
                />
                <div className="relative z-10 flex flex-col flex-grow">
                    <header className="pb-4 border-b-2 border-gray-800">
                        <table className="w-full">
                            <tbody>
                                <tr>
                                    <td style={{ width: '128px', verticalAlign: 'top' }}>
                                         <div className="relative w-32 h-32">
                                        <img
                                            src="https://firebasestorage.googleapis.com/v0/b/baitul-mal-connect-visualizer.firebasestorage.app/o/app_assets%2FIMG-20250816-WA0000.jpg?alt=media"
                                            alt="Organization Logo"
                                            crossOrigin="anonymous"
                                            className="w-full h-full object-contain"
                                            data-ai-hint="logo"
                                        />
                                    </div>
                                    </td>
                                    <td className="pl-4 align-top">
                                        <h1 className="text-4xl font-bold tracking-wider" style={textStyle}>
                                            <span className="text-primary">BAITULMAL</span> <span className="text-accent">SAMAJIK</span> <span className="text-primary">SANSTHA</span>
                                        </h1>
                                        <h2 className="text-4xl font-bold tracking-wider text-accent" style={textStyle}>SOLAPUR</h2>
                                        <p className="text-lg font-bold text-primary" style={textStyle}>({organization.city})</p>
                                        <p className="text-sm text-gray-600 mt-2" style={textStyle}>{organization.address}</p>
                                        <p className="text-sm text-gray-600" style={textStyle}>Email: {organization.contactEmail} | Phone: {organization.contactPhone}</p>
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
