
"use client";

import React, { forwardRef } from 'react';
import { format } from 'date-fns';
import type { Organization } from '@/services/types';

export interface LetterheadInclusionOptions {
    includeAddress?: boolean;
    includeEmail?: boolean;
    includePhone?: boolean;
    includeRegNo?: boolean;
    includePan?: boolean;
    includeUrl?: boolean;
    includeRecipient?: boolean;
    includeSubject?: boolean;
    includeBody?: boolean;
    includeClosing?: boolean;
}

interface LetterheadProps {
    organization: Organization;
    logoDataUri?: string;
    isTemplate?: boolean;
    inclusions?: LetterheadInclusionOptions;
    contentRef?: React.Ref<HTMLDivElement>;
}

export const Letterhead = forwardRef<HTMLDivElement, LetterheadProps>(
    ({ organization, logoDataUri, isTemplate = false, inclusions = {}, contentRef }, ref) => {

        const {
            includeAddress = true,
            includeEmail = true,
            includePhone = true,
            includeRegNo = true,
            includePan = true,
            includeUrl = true,
            includeRecipient = true,
            includeSubject = true,
            includeBody = true,
            includeClosing = true,
        } = inclusions;

        const organizationDetails = {
            name: organization?.name || "Baitul Mal Samajik Sanstha (Solapur)",
            address: organization?.address || "123 Muslim Peth, Solapur, Maharashtra 413001",
            registration: organization?.registrationNumber || "MAHA/123/2024",
            email: organization?.contactEmail || "contact@baitulmalsolapur.org",
            phone: organization?.contactPhone || "+91 9372145889",
            website: organization?.website || 'https://baitulmalsolapur.org',
            pan: organization?.panNumber || 'AAPAB1213J',
            titleLine1: organization.footer?.organizationInfo.titleLine1 || 'BAITUL MAL',
            titleLine2: organization.footer?.organizationInfo.titleLine2 || 'SAMAJIK SANSTHA',
            titleLine3: organization.footer?.organizationInfo.titleLine3 || '(SOLAPUR)',
        };
        
        const textStyle = { letterSpacing: '0.5px' };

        const emailPhoneText = [
            (isTemplate || includeEmail) && `Email:${isTemplate ? '          ' : ` ${organizationDetails.email}`}`,
            (isTemplate || includePhone) && `Phone:${isTemplate ? '          ' : ` ${organizationDetails.phone}`}`
        ].filter(Boolean).join(isTemplate ? '          ' : '  |  ');
        
        const regPanText = [
            (isTemplate || includeRegNo) && `Reg No:${isTemplate ? '' : ` ${organization.registrationNumber}`}`,
            (isTemplate || includePan) && `PAN:${isTemplate ? '' : ` ${organization.panNumber || 'N/A'}`}`
        ].filter(Boolean).join('          |   ');


        return (
             <div ref={ref} className="p-12 bg-white text-black font-serif w-[210mm] min-h-[297mm] flex flex-col relative shadow-lg">
                {/* Watermark */}
                {logoDataUri && (
                    <div className="absolute inset-0 flex items-center justify-center z-0">
                        <img
                            src={logoDataUri}
                            alt="Watermark"
                            className="w-2/3 h-2/3 object-contain opacity-5"
                        />
                    </div>
                )}
                <div ref={contentRef} className="relative z-10 flex flex-col flex-grow">
                     <header className="pb-4 border-b-2 border-gray-800">
                        <table className="w-full">
                            <tbody>
                                <tr>
                                    <td style={{ width: '150px', verticalAlign: 'top' }}>
                                         {logoDataUri && (
                                            <div className="relative w-36 h-36">
                                                <img
                                                    src={logoDataUri}
                                                    alt="Organization Logo"
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                         )}
                                    </td>
                                    <td className="pl-4 align-top">
                                        <h1 className="text-4xl font-bold font-headline" style={{...textStyle, color: '#16a34a'}}>
                                            {organizationDetails.titleLine1.toUpperCase()}
                                        </h1>
                                        <h2 className="text-4xl font-bold font-headline" style={{...textStyle, color: '#FFC107'}}>
                                            {organizationDetails.titleLine2.toUpperCase()}
                                        </h2>
                                        <h3 className="text-3xl font-bold font-headline" style={{...textStyle, color: '#16a34a'}}>
                                             {organizationDetails.titleLine3.toUpperCase()}
                                        </h3>
                                        {includeAddress && (
                                            <p className="text-sm text-gray-600 mt-2" style={textStyle}>
                                                Address: {isTemplate ? '' : `${organizationDetails.address}`}
                                            </p>
                                        )}
                                        {emailPhoneText && (
                                            <p className="text-sm text-gray-600" style={textStyle}>
                                                {emailPhoneText}
                                            </p>
                                        )}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </header>

                    <main className="flex-grow pt-8" style={{minHeight: '450px'}}>
                        <div className="space-y-4 text-gray-800 text-base leading-relaxed" style={textStyle}>
                           <p>Date: </p>
                           {includeRecipient && (
                               <div className="pt-8">
                                   <p>To,</p>
                                   <p>{isTemplate ? 'Recipient Name' : '[Recipient Name]'}</p>
                                   <p>{isTemplate ? 'Recipient Address' : '[Recipient Address]'}</p>
                               </div>
                           )}
                            {includeSubject && (
                                <p className="pt-8"><span className="font-bold">Subject:</span> </p>
                            )}
                            {includeBody && (
                               <p className="pt-8">Thank you for your consideration.</p>
                            )}
                        </div>
                    </main>

                     <div className="mt-auto text-right">
                        {includeClosing && (
                            <div className="space-y-1 mb-12">
                                <p className="text-gray-800" style={textStyle}>Sincerely,</p>
                                <p className="text-gray-800" style={textStyle}>{isTemplate ? 'Recipient Name' : '[Recipient Name]'}</p>
                            </div>
                        )}
                        <p className="text-gray-800" style={textStyle}>_________________________</p>
                        <p className="text-sm text-gray-600 pr-4" style={textStyle}>(Signature / Stamp)</p>
                    </div>
                    
                    <footer className="mt-8 pt-4 border-t text-xs text-center text-gray-500" style={textStyle}>
                         {regPanText && (
                            <p>{regPanText}</p>
                         )}
                         {includeUrl && (
                            <p className='mt-2'>
                                URL: {isTemplate ? '' : organization.website}
                            </p>
                         )}
                    </footer>
                </div>
            </div>
        );
    }
);

Letterhead.displayName = 'Letterhead';
