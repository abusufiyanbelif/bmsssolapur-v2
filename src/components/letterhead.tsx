
"use client";

import React, { forwardRef } from 'react';
import { format } from 'date-fns';
import type { Organization } from '@/services/types';
import { Logo } from './logo';

interface LetterheadProps {
    organization: Organization;
}

export const Letterhead = forwardRef<HTMLDivElement, LetterheadProps>(
    ({ organization }, ref) => {
        return (
            <div ref={ref} className="p-12 bg-white text-black font-serif w-[210mm] min-h-[297mm] flex flex-col relative">
                <div 
                    className="absolute inset-0 bg-contain bg-center bg-no-repeat opacity-5" 
                    style={{ backgroundImage: "url('https://firebasestorage.googleapis.com/v0/b/baitul-mal-connect-visualizer.firebasestorage.app/o/app_assets%2FIMG-20250816-WA0000.jpg?alt=media')" }}
                >
                </div>
                <div className="relative z-10">
                    <header className="flex justify-between items-center pb-4 border-b-2 border-gray-800">
                        <div className="flex items-center gap-6">
                            <Logo className="h-32 w-32" />
                            <div>
                                <h1 className="text-4xl font-bold tracking-wider">
                                    <span className="text-primary">Baitul Mal</span> <span className="text-accent">Samajik Sanstha</span>
                                </h1>
                                <p className="text-lg font-bold text-primary">(Solapur)</p>
                                <p className="text-sm text-gray-600 mt-2">{organization.address}</p>
                                <p className="text-sm text-gray-600">Email: {organization.contactEmail} | Phone: {organization.contactPhone}</p>
                            </div>
                        </div>
                    </header>

                    <main className="flex-grow pt-8">
                        {/* The content of the letter will be placed here by the user */}
                         <div className="space-y-4 text-gray-800 text-base leading-relaxed">
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
                            <p>Sincerely,</p>
                            <br />
                            <br />
                            <p className="font-bold">[Your Name/Organization Name]</p>
                        </div>
                    </main>
                    
                    <footer className="mt-12 pt-4 border-t text-xs text-center text-gray-500">
                        <p>Reg No: {organization.registrationNumber} | PAN: {organization.panNumber}</p>
                        <p>{organization.website}</p>
                    </footer>
                </div>
            </div>
        );
    }
);

Letterhead.displayName = 'Letterhead';
