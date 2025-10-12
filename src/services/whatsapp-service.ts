
'use server';

/**
 * @fileOverview WhatsApp service for sending messages using Twilio.
 */
import twilio from 'twilio';
import { getAppSettings } from './app-settings-service';
import { config } from '@/lib/config';

/**
 * Sends a WhatsApp message.
 * @param to The recipient's phone number in E.164 format (e.g., whatsapp:+14155238886).
 * @param body The message to send.
 */
export async function sendWhatsappMessage(to: string, body: string) {
  const settings = await getAppSettings();
  const whatsappSettings = settings.notificationSettings?.whatsapp.twilio;

  if (!whatsappSettings?.accountSid) {
    throw new Error('Twilio WhatsApp provider is not configured.');
  }

  const accountSid = whatsappSettings.accountSid;
  // In a real app, fetch authToken and fromNumber from a secure vault or secrets manager
  const authToken = config.twilio.authToken;
  const from = whatsappSettings.fromNumber;

  if (!authToken || !from) {
      throw new Error('Twilio credentials or from number are missing.');
  }

  const client = twilio(accountSid, authToken);

  try {
    const message = await client.messages.create({
      from: from,
      body: body,
      to: `whatsapp:${to}` // Ensure 'whatsapp:' prefix
    });
    console.log(`WhatsApp message sent to ${to}. SID: ${message.sid}`);
    return message;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw new Error('Failed to send WhatsApp message.');
  }
}
