
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef } from "react";
import { Loader2, Upload } from "lucide-react";
import { handleUploadVerificationDocument } from "./actions";
import { useRouter } from "next/navigation";

interface UploadDocumentDialogProps {
  leadId: string;
}

export function UploadDocumentDialog({ leadId }: UploadDocumentDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsUploading(true);

    const formData = new FormData(event.currentTarget);
    const result = await handleUploadVerificationDocument(leadId, formData);

    setIsUploading(false);

    if (result.success) {
      toast({
        variant: "success",
        title: "Upload Successful",
        description: "The verification document has been attached to the lead.",
      });
      setOpen(false);
      // No need to call router.refresh() if the revalidatePath in the action works
    } else {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: result.error || "An unknown error occurred.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Verification Document</DialogTitle>
          <DialogDescription>
            Attach a supporting document to this lead (e.g., ID card, medical report, bill). This will replace any existing document.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="document">Document File</Label>
                <Input id="document" name="document" type="file" required accept="image/*,application/pdf" />
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary" disabled={isUploading}>
                        Cancel
                    </Button>
                </DialogClose>
                <Button type="submit" disabled={isUploading}>
                    {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    Upload
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
