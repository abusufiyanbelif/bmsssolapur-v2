

'use server';

import { getLead } from "@/services/lead-service";
import type { Lead } from "@/services/types";
import { format } from "date-fns";
import { ai } from "@/ai/genkit";
import { googleAI } from "@genkit-ai/googleai";

interface ActionResult {
    success: boolean;
    message?: string;
    error?: string;
}

type AppealType = 'selected' | 'purpose' | 'all';

async function getLeadsToProcess(appealType: AppealType, data: { leadIds?: string[], purpose?: string }): Promise<{leads: Lead[], error?: string}> {
    let leadsToProcess: Lead[] = [];

    if (appealType === 'selected') {
        if (!data.leadIds || data.leadIds.length === 0) {
            return { leads: [], error: "For a 'selected' appeal, you must provide lead IDs." };
        }
        const leadPromises = data.leadIds.map(id => getLead(id));
        const results = await Promise.all(leadPromises);
        leadsToProcess = results.filter((lead): lead is Lead => lead !== null);
    } else {
        const { getAllLeads } = await import('@/services/lead-service');
        const allLeads = await getAllLeads();
        const openLeads = allLeads.filter(lead => 
            lead.caseVerification === 'Verified' && 
            (lead.caseAction === 'Publish' || lead.caseAction === 'Ready For Help' || lead.caseAction === 'Partial')
        );

        if (appealType === 'purpose') {
            if (!data.purpose) {
                return { leads: [], error: "A purpose is required for a 'purpose-based' appeal." };
            }
            leadsToProcess = openLeads.filter(lead => lead.purpose === data.purpose);
             if (leadsToProcess.length === 0) {
                return { leads: [], error: `No open leads found for the purpose "${data.purpose}".` };
            }
        } else { // 'all'
            leadsToProcess = openLeads;
        }
    }
    return { leads: leadsToProcess };
}

export async function generateAppealMessage(
    appealType: AppealType,
    data: { leadIds?: string[], purpose?: string },
    introMessage: string,
    outroMessage: string
): Promise<ActionResult> {
    
    try {
        const { leads, error } = await getLeadsToProcess(appealType, data);
        if (error) {
            return { success: false, error };
        }
        
        if (leads.length === 0) {
            return { success: false, error: "No leads found to generate an appeal message." };
        }

        let messageBody = `*Priority wise leads & required amt:*\n`;
        let totalRequired = 0;

        leads.forEach((lead, index) => {
            if (lead) {
                const requiredAmount = lead.helpRequested - lead.helpGiven;
                totalRequired += requiredAmount;
                
                const leadLine = `${index + 1}. ${lead.purpose} (${lead.category}) - Required amt.: ₹${requiredAmount.toLocaleString('en-IN')}\n`;
                messageBody += leadLine;
            }
        });
        
        const appBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://baitul-mal-connect.web.app';
        const ctaLink = `${appBaseUrl}/public-leads`;

        const llmResponse = await ai.generate({
            model: googleAI.model('gemini-pro'),
            prompt: `
                You are a helpful assistant for a charity organization. Your task is to craft a complete and compelling WhatsApp appeal message.
                
                Follow these instructions precisely:
                1.  Start the message with an inspirational quote about charity from Islamic teachings. The quote should be formatted like this: _"The text of the quote"_\n- The Source (e.g., Quran 2:261 or Sahih al-Bukhari)
                2.  After the quote, add two newlines.
                3.  Insert the provided introduction message.
                4.  After the introduction, add two newlines.
                5.  Insert the provided list of leads.
                6.  Calculate the total required amount from the leads and add a line: *Required target amt: ₹[TOTAL_AMOUNT]*
                7.  After the total amount, add two newlines.
                8.  Insert the call-to-action link to view details.
                9.  After the link, add two newlines.
                10. Insert the provided concluding message.

                ---
                **Introduction Message:**
                ${introMessage}
                ---
                **List of Leads:**
                ${messageBody}
                ---
                **Call-to-Action Link:**
                *View details and contribute here:*
                ${ctaLink}
                ---
                **Concluding Message:**
                ${outroMessage}
                ---
            `,
        });

        const fullMessage = llmResponse.text;
        
        return { success: true, message: fullMessage };

    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred.";
        console.error("Error generating appeal message:", error);
        return { success: false, error: `Failed to generate message: ${error}` };
    }
}


export async function generateAdminActionMessage(leadIds: string[]): Promise<ActionResult> {
    try {
        if (!leadIds || leadIds.length === 0) {
            return { success: false, error: "You must select at least one lead." };
        }
        const leadPromises = leadIds.map(id => getLead(id));
        const leads = (await Promise.all(leadPromises)).filter((lead): lead is Lead => lead !== null);

        if (leads.length === 0) {
            return { success: false, error: "Could not find details for the selected leads." };
        }

        let messageBody = `*Action Required: Pending Lead Verifications*\n\nThe following leads require verification from an administrator:\n`;

        leads.forEach((lead, index) => {
            const appBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://baitul-mal-connect.web.app';
            const leadLink = `${appBaseUrl}/admin/leads/${lead.id}`;
            const submittedDate = format(lead.dateCreated as Date, 'dd MMM, yyyy');

            messageBody += `\n${index + 1}. *${lead.name}*
   - *Lead ID:* ${lead.id}
   - *Purpose:* ${lead.purpose} (${lead.category})
   - *Amount Req:* ₹${lead.helpRequested.toLocaleString('en-IN')}
   - *Submitted:* ${submittedDate}
   - *Review Link:* ${leadLink}`;
        });
        
        messageBody += `\n\nPlease review these cases at your earliest convenience.`;

        return { success: true, message: messageBody };

    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred.";
        console.error("Error generating admin action message:", error);
        return { success: false, error: `Failed to generate message: ${error}` };
    }
}
