
'use server';

import Razorpay from 'razorpay';
import crypto from 'crypto';
import { getAppSettings } from '@/services/app-settings-service';
import { updateDonation } from '@/services/donation-service';
import { getUser } from '@/services/user-service';
import { config } from '@/lib/config';

interface OrderResponse {
    id: string;
    amount: number;
    currency: string;
}

export async function createRazorpayOrder(amount: number, currency: string = 'INR'): Promise<{success: boolean; order?: OrderResponse; error?: string}> {
    try {
        const settings = await getAppSettings();
        const razorpaySettings = settings.paymentGateway?.razorpay;

        if (!razorpaySettings?.enabled) {
            throw new Error("Razorpay gateway is not enabled.");
        }
        
        const mode = razorpaySettings.mode;
        const keyId = mode === 'live' ? razorpaySettings.live.keyId : razorpaySettings.test.keyId;
        const keySecret = mode === 'live' ? razorpaySettings.live.keySecret : razorpaySettings.test.keySecret;
        
        if (!keyId || !keySecret) {
            throw new Error(`Razorpay ${mode} credentials are not configured.`);
        }

        const instance = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });

        const options = {
            amount: amount * 100, // amount in the smallest currency unit
            currency,
            receipt: `receipt_order_${new Date().getTime()}`
        };
        
        const order = await instance.orders.create(options);

        return { success: true, order: {id: order.id, amount: order.amount, currency: order.currency} };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        console.error("Error creating Razorpay order:", errorMessage);
        return { success: false, error: errorMessage };
    }
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
     try {
        const settings = await getAppSettings();
        const razorpaySettings = settings.paymentGateway?.razorpay;

        if (!razorpaySettings?.enabled) {
             throw new Error("Razorpay gateway is not enabled for verification.");
        }
        
        const mode = razorpaySettings.mode;
        const keySecret = mode === 'live' ? razorpaySettings.live.keySecret : razorpaySettings.test.keySecret;

        if (!keySecret) {
             throw new Error(`Razorpay ${mode} Key Secret is not configured for verification.`);
        }

        const shasum = crypto.createHmac('sha256', keySecret);
        shasum.update(`${payload.orderCreationId}|${payload.razorpayPaymentId}`);
        const digest = shasum.digest('hex');

        if (digest !== payload.razorpaySignature) {
            return { success: false, error: 'Payment verification failed: Signature mismatch.' };
        }
        
        // Signature is valid, update donation status to 'Verified'
        const adminUser = await getUser(payload.adminUserId);
        if (!adminUser) {
            return { success: false, error: "Admin user for logging not found." };
        }

        await updateDonation(payload.donationId, {
            status: 'Verified',
            transactionId: payload.razorpayPaymentId,
        }, adminUser, 'Donation Verified (Razorpay)');
        
        return { success: true };
     } catch (error) {
         const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during verification.";
         console.error("Error verifying Razorpay payment:", errorMessage);
         return { success: false, error: errorMessage };
     }
}
