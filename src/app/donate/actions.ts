// src/app/donate/actions.ts
'use server';

import { createRazorpayOrder as createOrderService } from '@/services/razorpay-service';
import { handleAddDonation as recordDonationService } from '@/app/admin/donations/add/actions';

interface OrderResponse {
    id: string;
    amount: number;
    currency: string;
}

export async function createRazorpayOrder(amount: number, currency: string = 'INR'): Promise<{success: boolean; order?: OrderResponse; error?: string}> {
    return createOrderService(amount, currency);
}

export async function handleManualDonation(userId: string, formData: FormData): Promise<{ success: boolean; error?: string }> {
    try {
        formData.append("adminUserId", userId); // The user is acting as their own admin here
        formData.append("donorId", userId);
        formData.append("status", "Pending verification");
        
        // Pass leadId and campaignId if they exist
        const leadId = formData.get('leadId');
        if (leadId) formData.append('leadId', leadId);
        
        const campaignId = formData.get('campaignId');
        if (campaignId) formData.append('campaignId', campaignId);

        const result = await recordDonationService(formData);

        if (result.success) {
            return { success: true };
        } else {
            return { success: false, error: result.error };
        }
    } catch(e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred";
        return { success: false, error };
    }
}
