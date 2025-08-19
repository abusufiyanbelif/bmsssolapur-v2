
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const config = {
  firebase: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  },
  twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      verifySid: process.env.TWILIO_VERIFY_SID,
  },
  smtp: {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE,
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
  },
  emailFrom: process.env.EMAIL_FROM,
  razorpay: {
    test_key_id: process.env.RAZORPAY_TEST_KEY_ID,
    test_key_secret: process.env.RAZORPAY_TEST_KEY_SECRET,
    live_key_id: process.env.RAZORPAY_LIVE_KEY_ID,
    live_key_secret: process.env.RAZORPAY_LIVE_KEY_SECRET,
  },
  phonepe: {
      test_merchant_id: process.env.PHONEPE_TEST_MERCHANT_ID,
      test_salt_key: process.env.PHONEPE_TEST_SALT_KEY,
      test_salt_index: process.env.PHONEPE_TEST_SALT_INDEX,
      live_merchant_id: process.env.PHONEPE_LIVE_MERCHANT_ID,
      live_salt_key: process.env.PHONEPE_LIVE_SALT_KEY,
      live_salt_index: process.env.PHONEPE_LIVE_SALT_INDEX,
  }
};
