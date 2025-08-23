
'use server';

import { getAllLeads, getLead } from "@/services/lead-service";

interface ActionResult {
    success: boolean;
    message?: string;
    error?: string;
}

type AppealType = 'selected' | 'purpose' | 'all';

export async function generateAppealMessage(
    appealType: AppealType,
    data: { leadIds?: string[], purpose?: string },
    introMessage: string,
    outroMessage: string
): Promise<ActionResult> {
    
    try {
        let leadsToProcess: any[] = [];

        if (appealType === 'selected') {
            if (!data.leadIds || data.leadIds.length === 0) {
                return { success: false, error: "For a 'selected' appeal, you must provide lead IDs." };
            }
            const leadPromises = data.leadIds.map(id => getLead(id));
            const results = await Promise.all(leadPromises);
            leadsToProcess = results.filter(lead => lead !== null);
        } else {
            const allLeads = await getAllLeads();
            const openLeads = allLeads.filter(lead => 
                lead.verifiedStatus === 'Verified' && 
                (lead.caseAction === 'Publish' || lead.caseAction === 'Ready For Help' || lead.caseAction === 'Partial')
            );

            if (appealType === 'purpose') {
                if (!data.purpose) {
                    return { success: false, error: "A purpose is required for a 'purpose-based' appeal." };
                }
                leadsToProcess = openLeads.filter(lead => lead.purpose === data.purpose);
                 if (leadsToProcess.length === 0) {
                    return { success: false, error: `No open leads found for the purpose "${data.purpose}".` };
                }
            } else { // 'all'
                leadsToProcess = openLeads;
            }
        }
        
        if (leadsToProcess.length === 0) {
            return { success: false, error: "No leads found to generate an appeal message." };
        }


        let messageBody = `*Priority wise leads & required amt:*\n`;
        let totalRequired = 0;

        leadsToProcess.forEach((lead, index) => {
            if (lead) {
                const requiredAmount = lead.helpRequested - lead.helpGiven;
                totalRequired += requiredAmount;
                
                // Format the line for each lead
                const leadLine = `${index + 1}. ${lead.purpose} (${lead.category}) - Required amt.: ₹${requiredAmount.toLocaleString('en-IN')}\n`;
                messageBody += leadLine;
            }
        });

        // Add the total required amount
        messageBody += `\n*Required target amt: ₹${totalRequired.toLocaleString('en-IN')}*`;

        // Add the call to action link
        // In a real production app, you'd get this from an environment variable.
        const appBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://baitul-mal-connect.web.app';
        const ctaLink = `${appBaseUrl}/public-leads`;
        messageBody += `\n\n*View details and contribute here:*\n${ctaLink}`;

        // Construct the full message
        const fullMessage = `${introMessage}\n\n${messageBody}\n\n${outroMessage}`;
        
        return { success: true, message: fullMessage };

    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred.";
        console.error("Error generating appeal message:", error);
        return { success: false, error: `Failed to generate message: ${error}` };
    }
}
