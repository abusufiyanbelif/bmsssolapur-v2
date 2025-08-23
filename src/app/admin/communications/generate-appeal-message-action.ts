
'use server';

import { getLead } from "@/services/lead-service";

interface ActionResult {
    success: boolean;
    message?: string;
    error?: string;
}

export async function generateAppealMessage(
    leadIds: string[],
    introMessage: string,
    outroMessage: string
): Promise<ActionResult> {
    if (!leadIds || leadIds.length === 0) {
        return { success: false, error: "No lead IDs provided." };
    }

    try {
        const leadPromises = leadIds.map(id => getLead(id));
        const leads = await Promise.all(leadPromises);

        let messageBody = `*Priority wise leads & required amt:*\n`;
        let totalRequired = 0;

        leads.forEach((lead, index) => {
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

        // Construct the full message
        const fullMessage = `${introMessage}\n\n${messageBody}\n\n${outroMessage}`;
        
        return { success: true, message: fullMessage };

    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred.";
        console.error("Error generating appeal message:", error);
        return { success: false, error: `Failed to generate message: ${error}` };
    }
}
