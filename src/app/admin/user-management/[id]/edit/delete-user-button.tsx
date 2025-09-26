
"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { handleDeleteUser } from "../../actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface DeleteUserButtonProps {
    userId: string;
    userName: string;
}

export function DeleteUserButton({ userId, userName }: DeleteUserButtonProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [adminUserId, setAdminUserId] = useState<string | null>(null);

    useEffect(() => {
        const storedAdminId = localStorage.getItem('userId');
        setAdminUserId(storedAdminId);
    }, []);

    const onSuccess = () => {
        toast({
            title: "User Deleted",
            description: `The user ${userName} has been successfully removed.`,
        });
        router.push("/admin/user-management");
    };
    
    return (
        <DeleteConfirmationDialog
            itemType="user"
            itemName={userName}
            onDelete={async () => {
                if (!adminUserId) {
                    return { success: false, error: "Could not identify administrator." };
                }
                return await handleDeleteUser(userId, adminUserId);
            }}
            onSuccess={onSuccess}
        >
            <Button variant="destructive" type="button">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete User
            </Button>
        </DeleteConfirmationDialog>
    );
}
