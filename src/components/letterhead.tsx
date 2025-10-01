
"use client";

import React, { forwardRef } from 'react';
import { format } from 'date-fns';
import type { Organization, LetterheadInclusionOptions, LetterContentOptions } from '@/services/types';
import { ScrollArea } from './ui/scroll-area';


interface LetterheadProps {
    organization: Organization;
    logoDataUri?: string;
    isTemplate?: boolean;
    inclusions?: LetterheadInclusionOptions;
    letterContent?: LetterContentOptions;
    contentRef?: React.Ref<HTMLDivElement>;
}

export const Letterhead = forwardRef<HTMLDivElement, LetterheadProps>(
    ({ organization, logoDataUri, isTemplate = false, inclusions = {}, letterContent, contentRef }, ref) => {

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
            (includeEmail || isTemplate) && `Email: ${isTemplate ? '' : organizationDetails.email}`,
            (includePhone || isTemplate) && `Phone: ${isTemplate ? '' : organizationDetails.phone}`
        ].filter(Boolean).join('  |  ');
        
        const regPanText = [
            (includeRegNo || isTemplate) && `Reg No: ${isTemplate ? '' : organizationDetails.registration}`,
            (includePan || isTemplate) && `PAN: ${isTemplate ? '' : organizationDetails.pan}`
        ].filter(Boolean).join(' | ');

        return (
             <div ref={ref} className="p-12 bg-background text-foreground font-serif w-[210mm] h-[297mm] flex flex-col relative shadow-lg overflow-hidden">
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
                <div ref={contentRef} className="relative z-10 flex flex-col flex-grow h-full">
                     <header className="pb-4 border-b-2 border-foreground/50">
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
                                        <h1 className="text-4xl font-bold font-headline text-primary" style={{...textStyle}}>
                                            {organizationDetails.titleLine1.toUpperCase()}
                                        </h1>
                                        <h2 className="text-4xl font-bold font-headline text-accent" style={{...textStyle}}>
                                            {organizationDetails.titleLine2.toUpperCase()}
                                        </h2>
                                        <h3 className="text-3xl font-bold font-headline text-primary" style={{...textStyle}}>
                                             {organizationDetails.titleLine3.toUpperCase()}
                                        </h3>
                                        {(includeAddress || isTemplate) && (
                                            <p className="text-sm text-muted-foreground mt-2" style={textStyle}>
                                                Address: {isTemplate ? '' : `${organizationDetails.address}`}
                                            </p>
                                        )}
                                        {emailPhoneText && (
                                            <p className="text-sm text-muted-foreground" style={textStyle}>
                                                {emailPhoneText}
                                            </p>
                                        )}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </header>
                    <ScrollArea className="flex-grow my-4">
                        <main className="text-foreground/80 text-base leading-normal whitespace-pre-wrap" style={textStyle}>
                           {(includeDate || isTemplate) && <p>Date: {isTemplate ? '' : format(content.date, 'dd MMM, yyyy')}</p>}
                           {(includeRecipient || isTemplate) && (
                               <div className="pt-8">
                                   <p>To,</p>
                                   <p className='font-bold'>{content.recipientName}</p>
                                   <p>{content.recipientAddress}</p>
                               </div>
                           )}
                            {(includeSubject || isTemplate) && (
                                <p className="pt-8"><span className="font-bold">Subject:</span> {content.subject}</p>
                            )}
                            {(includeBody || isTemplate) && (
                               <p className="pt-8">{content.body}</p>
                            )}
                        </main>
                    </ScrollArea>

                     <div className="mt-auto pt-4 text-right">
                        {(includeClosing || isTemplate) && (
                            <div className="space-y-1 mb-12">
                                <p className="text-foreground/80" style={textStyle}>Sincerely,</p>
                                <p className="text-foreground/80" style={textStyle}>{content.closingName}</p>
                            </div>
                        )}
                        <p className="text-foreground/80 inline-block" style={textStyle}>_________________________</p>
                        <p className="text-sm text-muted-foreground pr-4" style={textStyle}>(Signature / Stamp)</p>
                    </div>
                    
                    <footer className="mt-4 pt-4 border-t text-xs text-center text-muted-foreground" style={textStyle}>
                         {regPanText && (
                            <p>{regPanText}</p>
                         )}
                         {(includeUrl || isTemplate) && (
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
