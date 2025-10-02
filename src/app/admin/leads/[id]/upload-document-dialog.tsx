
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
import { useState, useRef, useEffect } from "react";
import { Loader2, Upload, RotateCw, FileIcon, ZoomIn, ZoomOut, XCircle } from "lucide-react";
import { handleUploadVerificationDocument } from "./actions";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress"; // Import Progress component
import Image from "next/image";

interface UploadDocumentDialogProps {
  leadId: string;
}

export function UploadDocumentDialog({ leadId }: UploadDocumentDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [open, setOpen] = useState(false);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
      if (open) {
          const storedUserId = localStorage.getItem('userId');
          setAdminUserId(storedUserId);
          setUploadProgress(0); // Reset progress on open
      }
  }, [open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
          setFile(selectedFile);
          setPreviewUrl(URL.createObjectURL(selectedFile));
          setZoom(1);
          setRotation(0);
      }
  };
  
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!adminUserId) {
        toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "Could not identify the logged-in administrator. Please log out and back in.",
        });
        return;
    }

    if (!file) {
        toast({ variant: "destructive", title: "No File", description: "Please select a document to upload." });
        return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData(event.currentTarget);
    formData.append("adminUserId", adminUserId);
    formData.append("document", file);

    const result = await handleUploadVerificationDocument(leadId, formData, setUploadProgress);

    setIsUploading(false);

    if (result.success) {
      toast({
        variant: "success",
        title: "Upload Successful",
        description: "The verification document has been attached to the lead.",
      });
      setOpen(false);
      router.refresh();
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
                <Input id="document" name="document" type="file" required accept="image/*,application/pdf" disabled={isUploading} onChange={handleFileChange} />
            </div>
            
            {previewUrl && (
                <div className="relative group p-2 border rounded-lg">
                    <div className="relative w-full h-60 bg-gray-100 dark:bg-gray-800 rounded-md overflow-auto flex items-center justify-center">
                        {file?.type.startsWith('image/') ? (
                             <div className="relative w-full h-full cursor-zoom-in" onWheel={(e) => {e.preventDefault(); setZoom(prev => Math.max(0.5, Math.min(prev - e.deltaY * 0.001, 5)))}}>
                                <Image 
                                    src={previewUrl} 
                                    alt="Document Preview" 
                                    fill
                                    className="object-contain transition-transform duration-100"
                                    style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
                                />
                             </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <FileIcon className="h-16 w-16" />
                                <span className="text-sm font-semibold">{file?.name}</span>
                            </div>
                        )}
                    </div>
                     <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 rounded-md">
                        <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => setZoom(z => z * 1.2)}><ZoomIn className="h-4 w-4"/></Button>
                        <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => setZoom(z => Math.max(0.5, z / 1.2))}><ZoomOut className="h-4 w-4"/></Button>
                        <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => setRotation(r => r + 90)}><RotateCw className="h-4 w-4"/></Button>
                        <Button type="button" size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => { setFile(null); setPreviewUrl(null); }}><XCircle className="h-4 w-4"/></Button>
                    </div>
                </div>
            )}

             {isUploading && (
              <div className="space-y-2">
                <Label>Uploading...</Label>
                <Progress value={uploadProgress} />
                <p className="text-xs text-muted-foreground text-center">{Math.round(uploadProgress)}%</p>
              </div>
            )}

            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary" disabled={isUploading}>
                        Cancel
                    </Button>
                </DialogClose>
                <Button type="submit" disabled={isUploading || !file}>
                    {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    {isUploading ? 'Uploading...' : 'Upload'}
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
