
"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { handleDeleteLead } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface DeleteLeadButtonProps {
    leadId: string;
    leadName: string;
}

export function DeleteLeadButton({ leadId, leadName }: DeleteLeadButtonProps) {
    const { toast } = useToast();
    const router = useRouter();

    const onSuccess = () => {
        toast({
            title: "Lead Deleted",
            description: `The lead for ${leadName} has been successfully removed.`,
        });
        router.push("/admin/leads");
    };
    
    return (
        <DeleteConfirmationDialog
            itemType="lead"
            itemName={leadName}
            onDelete={() => handleDeleteLead(leadId)}
            onSuccess={onSuccess}
        >
            <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
            </Button>
        </DeleteConfirmationDialog>
    );
}
