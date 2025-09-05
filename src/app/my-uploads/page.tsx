
'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UploadCloud, FileText } from "lucide-react";
import Image from "next/image";

export default function MyUploadsPage() {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    if (selectedFile) {
      setPreviewUrl(URL.createObjectURL(selectedFile));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({ variant: 'destructive', title: 'No File Selected', description: 'Please select an image to upload.' });
      return;
    }
    setIsUploading(true);
    // In a real application, you would add the logic to upload the file to your storage service here.
    // For this prototype, we'll simulate an upload.
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsUploading(false);
    toast({
      variant: 'success',
      title: "Upload Complete",
      description: `Successfully uploaded ${file.name}.`
    });
  };

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">My Uploads</h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Upload a File</CardTitle>
          <CardDescription>
            You can upload images here, such as screenshots of donation receipts or other relevant documents.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="image-upload">Select Image</Label>
            <Input
              id="image-upload"
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>
          {previewUrl ? (
            <div className="p-2 border rounded-md bg-muted/50 flex flex-col items-center gap-4">
              <div className="relative w-full h-80">
                <Image src={previewUrl} alt="Image Preview" fill className="object-contain rounded-md" data-ai-hint="receipt screenshot" />
              </div>
            </div>
          ) : (
            <div className="p-2 border-dashed border-2 rounded-md bg-muted/50 flex flex-col items-center justify-center gap-4 h-80">
              <FileText className="h-16 w-16 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Upload an image to see a preview</p>
            </div>
          )}
          <Button onClick={handleUpload} disabled={isUploading || !file}>
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
            Upload Image
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
