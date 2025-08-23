
'use server';

import { getLead } from "@/services/lead-service";
import type { Lead } from "@/services/types";
import { format } from "date-fns";

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
            lead.verifiedStatus === 'Verified' && 
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

        messageBody += `\n*Required target amt: ₹${totalRequired.toLocaleString('en-IN')}*`;

        const appBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://baitul-mal-connect.web.app';
        const ctaLink = `${appBaseUrl}/public-leads`;
        messageBody += `\n\n*View details and contribute here:*\n${ctaLink}`;

        const fullMessage = `${introMessage}\n\n${messageBody}\n\n${outroMessage}`;
        
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
