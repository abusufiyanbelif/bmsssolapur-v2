
'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UploadCloud, FileText, ScanSearch, XCircle, PlusCircle, FileIcon, ZoomIn, ZoomOut } from "lucide-react";
import Image from "next/image";

export default function MyUploadsPage() {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [zoomLevels, setZoomLevels] = useState<Record<number, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prevFiles => [...prevFiles, ...Array.from(e.target.files!)]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    setZoomLevels(prev => {
        const newLevels = {...prev};
        delete newLevels[index];
        return newLevels;
    })
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      toast({ variant: 'destructive', title: 'No Files Selected', description: 'Please select one or more files to upload.' });
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
      description: `Successfully uploaded ${files.length} file(s).`
    });
    setFiles([]);
    setZoomLevels({});
  };

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">My Uploads</h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScanSearch />
            Upload a File
          </CardTitle>
          <CardDescription>
            You can upload images or PDFs here, such as screenshots of donation receipts or other relevant documents for verification by our team.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="image-upload">Select Image or Document</Label>
            <Input
              id="image-upload"
              type="file"
              accept="image/*,application/pdf"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              className="hidden"
            />
          </div>
          {files.length > 0 ? (
            <div className="space-y-4">
              <Label>File Previews</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {files.map((file, index) => {
                      const isImage = file.type.startsWith('image/');
                      const zoom = zoomLevels[index] || 1;
                      return (
                          <div key={index} className="relative group p-2 border rounded-lg bg-background space-y-2">
                              <div className="w-full h-40 overflow-auto flex items-center justify-center">
                                      {isImage ? (
                                      <Image
                                          src={URL.createObjectURL(file)}
                                          alt={`Preview ${index + 1}`}
                                          width={150 * zoom}
                                          height={150 * zoom}
                                          className="object-contain transition-transform duration-300"
                                      />
                                      ) : (
                                          <FileIcon className="w-16 h-16 text-muted-foreground" />
                                      )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">{file.name}</p>
                              <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 rounded-md">
                                  <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => setZoomLevels(z => ({...z, [index]: (z[index] || 1) * 1.2}))}><ZoomIn className="h-4 w-4"/></Button>
                                  <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => setZoomLevels(z => ({...z, [index]: Math.max(1, (z[index] || 1) / 1.2)}))}><ZoomOut className="h-4 w-4"/></Button>
                                  <Button type="button" size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => handleRemoveFile(index)}>
                                      <XCircle className="h-4 w-4"/>
                                  </Button>
                              </div>
                          </div>
                      )
                  })}
                   <Button
                      type="button"
                      variant="outline"
                      className="h-48 flex-col gap-2 border-dashed"
                      onClick={() => fileInputRef.current?.click()}
                  >
                      <PlusCircle className="h-8 w-8 text-muted-foreground" />
                      <span className="text-muted-foreground">Add More Files</span>
                  </Button>
              </div>
            </div>
          ) : (
            <div className="p-2 border-dashed border-2 rounded-md bg-muted/50 flex flex-col items-center justify-center gap-4 h-80">
              <FileText className="h-16 w-16 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Upload files to see a preview</p>
              <Button onClick={() => fileInputRef.current?.click()} variant="secondary">Select Files</Button>
            </div>
          )}
          <Button onClick={handleUpload} disabled={isUploading || files.length === 0}>
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
            Upload {files.length > 0 ? `${files.length} File(s)` : 'Files'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
