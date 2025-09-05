

"use client";

import React, { forwardRef } from 'react';
import { format } from 'date-fns';
import type { Donation, User } from '@/services/types';

interface DonationReceiptProps {
    donation: Donation;
    user: User;
}

export const DonationReceipt = forwardRef<HTMLDivElement, DonationReceiptProps>(
    ({ donation, user }, ref) => {
        const organizationDetails = {
            name: "Baitul Mal Samajik Sanstha (Solapur)",
            address: "123 Muslim Peth, Solapur, Maharashtra 413001",
            registration: "MAHA/123/2024",
            pan: "AAFTB9401P",
            email: "contact@baitulmalsolapur.org",
            phone: "+91 9372145889"
        };
        
        const textStyle = { letterSpacing: '0.5px' };

        return (
            <div ref={ref} className="p-12 bg-white text-black font-sans w-[800px] relative">
                <img
                    src="https://firebasestorage.googleapis.com/v0/b/baitul-mal-connect.appspot.com/o/app_assets%2FIMG-20250816-WA0000.jpg?alt=media&token=a8698188-5394-4303-9118-8f8319f397d1"
                    alt="Watermark"
                    crossOrigin="anonymous"
                    className="absolute inset-0 w-full h-full object-contain opacity-5 z-0"
                    data-ai-hint="logo watermark"
                />
                <div className="relative z-10">
                     <table className="w-full border-b-2 border-gray-800 pb-4">
                        <tbody>
                            <tr>
                                <td style={{ width: '128px', verticalAlign: 'top' }}>
                                     <div className="relative w-32 h-32">
                                        <img
                                            src="https://firebasestorage.googleapis.com/v0/b/baitul-mal-connect.appspot.com/o/app_assets%2FIMG-20250816-WA0000.jpg?alt=media&token=a8698188-5394-4303-9118-8f8319f397d1"
                                            alt="Organization Logo"
                                            crossOrigin="anonymous"
                                            className="w-full h-full object-contain"
                                            data-ai-hint="logo"
                                        />
                                    </div>
                                </td>
                                <td className="pl-4 align-top">
                                    <h1 className="text-3xl font-bold text-gray-800" style={textStyle}>{organizationDetails.name}</h1>
                                    <p className="text-sm text-gray-600" style={textStyle}>{organizationDetails.address}</p>
                                    <p className="text-sm text-gray-600" style={textStyle}>Email: {organizationDetails.email} | Phone: {organizationDetails.phone}</p>
                                </td>
                                <td className="text-right align-top">
                                    <h2 className="text-2xl font-bold text-gray-700" style={textStyle}>Receipt</h2>
                                    <p className="text-sm text-gray-500 font-mono mt-1" style={textStyle}>Receipt No: {donation.id}</p>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <main className="mt-8">
                         <table className="w-full mb-8">
                            <tbody>
                                <tr>
                                    <td className="w-1/2 pr-4 align-top">
                                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2" style={textStyle}>BILLED TO</h3>
                                        <p className="font-bold text-lg" style={textStyle}>{user.name}</p>
                                        <p className="text-gray-600" style={textStyle}>{user.address?.addressLine1 || 'N/A'}</p>
                                        <p className="text-gray-600" style={textStyle}>{user.email}</p>
                                        <p className="text-gray-600" style={textStyle}>{user.phone}</p>
                                    </td>
                                     <td className="w-1/2 text-right align-top">
                                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2" style={textStyle}>DETAILS</h3>
                                        <p style={textStyle}><span className="font-semibold">Donation Date:</span> {format(new Date(donation.donationDate), 'dd MMM, yyyy')}</p>
                                        <p style={textStyle}><span className="font-semibold">Transaction ID:</span> {donation.transactionId || "N/A"}</p>
                                     </td>
                                </tr>
                            </tbody>
                        </table>
                        
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="p-3 text-sm font-semibold uppercase" style={textStyle}>DESCRIPTION</th>
                                    <th className="p-3 text-sm font-semibold uppercase text-right" style={textStyle}>AMOUNT</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b">
                                    <td className="p-3">
                                        <p className="font-medium" style={textStyle}>Donation for the purpose of &quot;{donation.purpose || donation.type}&quot;</p>
                                        <p className="text-xs text-gray-500" style={textStyle}>Category: {donation.type}</p>
                                    </td>
                                    <td className="p-3 text-right font-medium" style={textStyle}>₹{donation.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                            </tbody>
                            <tfoot>
                                 <tr className="font-bold">
                                    <td className="p-3 text-right text-lg" style={textStyle}>Total Amount:</td>
                                    <td className="p-3 text-right text-lg" style={textStyle}>₹{donation.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                            </tfoot>
                        </table>
                        
                         <div className="mt-8 p-4 bg-green-50 border-l-4 border-green-500 text-green-800">
                            <p className="font-bold" style={textStyle}>Thank you for your generous contribution!</p>
                            <p className="text-sm" style={textStyle}>Your support helps us continue our mission to serve the community.</p>
                        </div>

                    </main>
                    
                    <footer className="mt-12 pt-4 border-t text-xs text-center text-gray-500">
                        <p style={textStyle}>This is a computer-generated receipt and does not require a signature.</p>
                        <p style={textStyle}>Donations to {organizationDetails.name} are eligible for tax exemption under section 80G of the Income Tax Act. PAN: {organizationDetails.pan}</p>
                        <p style={textStyle}>Reg No: {organizationDetails.registration}</p>
                    </footer>
                </div>
            </div>
        );
    }
);

DonationReceipt.displayName = 'DonationReceipt';
