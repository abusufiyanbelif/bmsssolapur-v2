
'use server';

import { createRazorpayOrder as createOrderService, verifyRazorpayPayment as verifyPaymentService } from '@/services/razorpay-service';

interface OrderResponse {
    id: string;
    amount: number;
    currency: string;
}

export async function createRazorpayOrder(amount: number, currency: string = 'INR'): Promise<{success: boolean; order?: OrderResponse; error?: string}> {
    return createOrderService(amount, currency);
}


interface VerificationPayload {
    orderCreationId: string;
    razorpayPaymentId: string;
    razorpayOrderId: string;
    razorpaySignature: string;
    donationId: string;
    adminUserId: string;
}

export async function verifyRazorpayPayment(payload: VerificationPayload): Promise<{success: boolean; error?: string}> {
     return verifyPaymentService(payload);
}
