
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DeleteConfirmationDialogProps {
  children: React.ReactNode;
  itemType: string;
  itemName: string;
  onDelete: () => Promise<{ success: boolean, error?: string } | void>;
  onSuccess?: () => void;
}

export function DeleteConfirmationDialog({ 
  children, 
  itemType, 
  itemName, 
  onDelete, 
  onSuccess 
}: DeleteConfirmationDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await onDelete();
    setIsDeleting(false);

    if (result && result.success) {
        if (onSuccess) {
            onSuccess();
        }
    } else if (result) { // Check if result exists before trying to access .error
      toast({
        variant: "destructive",
        title: `Failed to delete ${itemType}`,
        description: result.error || "An unknown error occurred.",
      });
    } else if (!result) {
        // This case handles when the onDelete function is successful but returns no object.
        if (onSuccess) {
            onSuccess();
        }
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the {itemType}{" "}
            <span className="font-semibold text-foreground">&quot;{itemName}&quot;</span> from the database.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Yes, delete it
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
