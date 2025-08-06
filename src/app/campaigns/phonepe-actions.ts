
'use server';

import { sha256 } from 'js-sha256';
import { v4 as uuidv4 } from 'uuid';

interface PhonePePaymentRequest {
    amount: number;
    userId: string;
    userName: string;
    userPhone?: string;
}

interface PhonePePaymentResponse {
    success: boolean;
    error?: string;
    redirectUrl?: string;
}

/**
 * Initiates a payment with PhonePe.
 * This is a placeholder function that simulates the server-side logic.
 * In a real application, this would call the PhonePe API with your merchant credentials.
 */
export async function startPhonePePayment(payload: PhonePePaymentRequest): Promise<PhonePePaymentResponse> {
    
    // --- THIS IS ALL MOCK DATA FOR DEMONSTRATION ---
    // In a real app, these would come from your secure environment variables
    const merchantId = 'PGTESTPAYUAT'; // This is a test merchant ID
    const saltKey = '099eb0cd-02cf-4e2a-8aca-3e6c6aff0399'; // This is a test salt key
    const saltIndex = 1;
    const appBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';


    // --- PhonePe Payload Structure ---
    const paymentData = {
        merchantId: merchantId,
        merchantTransactionId: `TXN-${uuidv4()}`,
        merchantUserId: payload.userId,
        amount: payload.amount * 100, // Amount in paise
        redirectUrl: `${appBaseUrl}/payment-status/success`, // A dummy URL to return to
        redirectMode: 'GET', // Changed from POST to GET to match simulator
        callbackUrl: `${appBaseUrl}/api/payment-callback`, // Server-to-server callback
        mobileNumber: payload.userPhone || '9999999999',
        paymentInstrument: {
            type: 'PAY_PAGE'
        }
    };

    // --- Checksum Calculation (This is a critical step) ---
    const base64Payload = Buffer.from(JSON.stringify(paymentData)).toString('base64');
    const checksum = sha256(base64Payload + '/pg/v1/pay' + saltKey) + '###' + saltIndex;
    
    // In a real app, you would make a `fetch` or `axios` call to PhonePe's API endpoint here:
    // const response = await fetch('https://api-preprod.phonepe.com/pg/v1/pay', {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json',
    //         'X-VERIFY': checksum
    //     },
    //     body: JSON.stringify({ request: base64Payload })
    // });
    // const responseData = await response.json();
    
    // --- MOCKING THE API RESPONSE ---
    // We simulate a successful response from the PhonePe API.
    const mockApiResponse = {
        success: true,
        code: 'PAYMENT_INITIATED',
        message: 'Your request has been successfully received.',
        data: {
            merchantId: merchantId,
            merchantTransactionId: paymentData.merchantTransactionId,
            instrumentResponse: {
                type: 'PAY_PAGE',
                redirectInfo: {
                    url: 'https://mercury-uat.phonepe.com/transact/simulator', // This is PhonePe's test simulator page
                    method: 'GET'
                }
            }
        }
    };
    
    if (mockApiResponse.success) {
        return {
            success: true,
            redirectUrl: mockApiResponse.data.instrumentResponse.redirectInfo.url,
        };
    } else {
        return {
            success: false,
            error: mockApiResponse.message || 'Payment initiation failed.',
        };
    }
}
