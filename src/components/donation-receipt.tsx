
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
        
        return (
            <div ref={ref} className="p-8 bg-white text-black font-sans w-[800px] relative">
                <div 
                    className="absolute inset-0 bg-contain bg-center bg-no-repeat opacity-5" 
                    style={{ backgroundImage: "url('https://firebasestorage.googleapis.com/v0/b/baitul-mal-connect-visualizer.firebasestorage.app/o/app_assets%2FIMG-20250816-WA0000.jpg?alt=media')" }}
                >
                </div>
                <div className="relative z-10">
                    <header className="flex justify-between items-start pb-4 border-b-2 border-gray-800">
                        <div className="flex items-center gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800">{organizationDetails.name}</h1>
                                <p className="text-sm text-gray-600">{organizationDetails.address}</p>
                                <p className="text-sm text-gray-600">Email: {organizationDetails.email} | Phone: {organizationDetails.phone}</p>
                            </div>
                        </div>
                         <div className="text-right">
                            <h2 className="text-2xl font-bold text-gray-700">Receipt</h2>
                            <p className="text-sm text-gray-500 font-mono mt-1">Receipt No: {donation.id}</p>
                         </div>
                    </header>

                    <main className="mt-8">
                         <div className="grid grid-cols-2 gap-8 mb-8">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">BILLED TO</h3>
                                <p className="font-bold text-lg">{user.name}</p>
                                <p className="text-gray-600">{user.address?.addressLine1 || 'N/A'}</p>
                                <p className="text-gray-600">{user.email}</p>
                                <p className="text-gray-600">{user.phone}</p>
                            </div>
                             <div className="text-right">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">DETAILS</h3>
                                <p><span className="font-semibold">Donation Date:</span> {format(new Date(donation.donationDate), 'dd MMM, yyyy')}</p>
                                <p><span className="font-semibold">Transaction ID:</span> {donation.transactionId || "N/A"}</p>
                             </div>
                        </div>
                        
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="p-3 text-sm font-semibold uppercase">DESCRIPTION</th>
                                    <th className="p-3 text-sm font-semibold uppercase text-right">AMOUNT</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b">
                                    <td className="p-3">
                                        <p className="font-medium">Donation for the purpose of &quot;{donation.purpose || donation.type}&quot;</p>
                                        <p className="text-xs text-gray-500">Category: {donation.type}</p>
                                    </td>
                                    <td className="p-3 text-right font-medium">₹{donation.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                            </tbody>
                            <tfoot>
                                 <tr className="font-bold">
                                    <td className="p-3 text-right text-lg">Total Amount:</td>
                                    <td className="p-3 text-right text-lg">₹{donation.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                            </tfoot>
                        </table>
                        
                         <div className="mt-8 p-4 bg-green-50 border-l-4 border-green-500 text-green-800">
                            <p className="font-bold">Thank you for your generous contribution!</p>
                            <p className="text-sm">Your support helps us continue our mission to serve the community.</p>
                        </div>

                    </main>
                    
                    <footer className="mt-12 pt-4 border-t text-xs text-center text-gray-500">
                        <p>This is a computer-generated receipt and does not require a signature.</p>
                        <p>Donations to {organizationDetails.name} are eligible for tax exemption under section 80G of the Income Tax Act. PAN: {organizationDetails.pan}</p>
                        <p>Reg No: {organizationDetails.registration}</p>
                    </footer>
                </div>
            </div>
        );
    }
);

DonationReceipt.displayName = 'DonationReceipt';
