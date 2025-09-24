
"use client";

import React, { forwardRef } from 'react';
import { format } from 'date-fns';
import type { Organization } from '@/services/types';
import { ScrollArea } from './ui/scroll-area';

export interface LetterheadInclusionOptions {
    includeAddress?: boolean;
    includeEmail?: boolean;
    includePhone?: boolean;
    includeRegNo?: boolean;
    includePan?: boolean;
    includeUrl?: boolean;
    includeDate?: boolean;
    includeRecipient?: boolean;
    includeSubject?: boolean;
    includeBody?: boolean;
    includeClosing?: boolean;
}

export interface LetterContentOptions {
    date: Date;
    recipientName: string;
    recipientAddress: string;
    subject: string;
    body: string;
    closingName: string;
}

interface LetterheadProps {
    organization: Organization;
    logoDataUri?: string;
    isTemplate?: boolean;
    inclusions?: LetterheadInclusionOptions;
    letterContent?: LetterContentOptions;
}

export const Letterhead = forwardRef<HTMLDivElement, LetterheadProps>(
    ({ organization, logoDataUri, isTemplate = false, inclusions = {}, letterContent }, ref) => {

        const {
            includeAddress = true,
            includeEmail = true,
            includePhone = true,
            includeRegNo = true,
            includePan = true,
            includeUrl = true,
            includeDate = true,
            includeRecipient = true,
            includeSubject = true,
            includeBody = true,
            includeClosing = true,
        } = inclusions;
        
        const defaultContent: LetterContentOptions = {
            date: new Date(),
            recipientName: '[Recipient Name]',
            recipientAddress: '[Recipient Address,\nCity, State, Pincode]',
            subject: '[Subject Line]',
            body: '[Main body of the letter...]',
            closingName: '[Sender Name]',
        };
        
        const content = isTemplate ? defaultContent : letterContent || defaultContent;


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
            (includeEmail) && `Email: ${isTemplate ? '' : organizationDetails.email}`,
            (includePhone) && `Phone: ${isTemplate ? '' : organizationDetails.phone}`
        ].filter(Boolean).join('  |  ');
        
        const regPanText = [
            (includeRegNo) && `Reg No: ${isTemplate ? '' : organizationDetails.registration}`,
            (includePan) && `PAN: ${isTemplate ? '' : organizationDetails.pan}`
        ].filter(Boolean).join(' | ');

        return (
             <div ref={ref} className="p-12 bg-white text-black font-serif w-[210mm] h-[297mm] flex flex-col relative shadow-lg overflow-hidden">
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
                <div className="relative z-10 flex flex-col flex-grow">
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
                    <ScrollArea className="flex-grow my-8">
                        <main className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap" style={textStyle}>
                           {includeDate && <p>Date: {isTemplate ? '' : format(content.date, 'dd MMM, yyyy')}</p>}
                           {includeRecipient && (
                               <div className="pt-8">
                                   <p>To,</p>
                                   <p className='font-bold'>{content.recipientName}</p>
                                   <p>{content.recipientAddress}</p>
                               </div>
                           )}
                            {includeSubject && (
                                <p className="pt-8"><span className="font-bold">Subject:</span> {content.subject}</p>
                            )}
                            {includeBody && (
                               <p className="pt-8">{content.body}</p>
                            )}
                        </main>
                    </ScrollArea>

                     <div className="mt-auto pt-8 text-right">
                        {includeClosing && (
                            <div className="space-y-1 mb-12">
                                <p className="text-gray-800" style={textStyle}>Sincerely,</p>
                                <p className="text-gray-800" style={textStyle}>{content.closingName}</p>
                            </div>
                        )}
                        <p className="text-gray-800 inline-block" style={textStyle}>_________________________</p>
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
