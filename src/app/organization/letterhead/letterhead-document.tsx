
"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Organization } from "@/services/types";
import { Letterhead } from "@/components/letterhead";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface LetterheadDocumentProps {
  organization: Organization;
}

// Helper function to fetch an image and convert it to a base64 data URI
const toDataURL = async (url: string): Promise<string> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export function LetterheadDocument({ organization }: LetterheadDocumentProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [embeddedImages, setEmbeddedImages] = useState<{logoDataUri?: string, watermarkDataUri?: string}>({});
  const letterheadRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!letterheadRef.current) return;
    
    setIsGenerating(true);

    try {
        // Fetch images and convert to base64 data URIs
        const logoDataUri = organization.logoUrl ? await toDataURL(organization.logoUrl) : undefined;
        // Assuming watermark is the same as the logo
        const watermarkDataUri = organization.logoUrl ? await toDataURL(organization.logoUrl) : undefined;
        setEmbeddedImages({ logoDataUri, watermarkDataUri });

        // Allow a brief moment for React to re-render with the new base64 URIs
        await new Promise(resolve => setTimeout(resolve, 100));

        const canvas = await html2canvas(letterheadRef.current, {
            scale: 3,
            useCORS: true, 
            logging: false,
            backgroundColor: '#ffffff',
        });
      
        const imgData = canvas.toDataURL('image/png');
        
        const A4_WIDTH_PT = 595.28;

        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'pt',
            format: 'a4'
        });
      
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = A4_WIDTH_PT;
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Letterhead-${organization.name.replace(/\s/g, '-')}.pdf`);
      
        toast({
            variant: 'success',
            title: "Download Started",
            description: "Your letterhead is being downloaded."
        });
    } catch (e) {
      console.error("Error generating PDF", e);
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "An error occurred while generating the PDF. Please check the console for details.",
      });
    } finally {
        setIsGenerating(false);
        setEmbeddedImages({}); // Clear embedded images after generation
    }
  };

  return (
    <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Organization Letterhead</h2>
             <Button onClick={handleDownload} disabled={isGenerating}>
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Download as PDF
            </Button>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Letterhead Preview</CardTitle>
                <CardDescription>
                    This is a preview of the official organization letterhead. Click the download button to save it as a PDF. The content inside the letter is placeholder text.
                </CardDescription>
            </CardHeader>
            <CardContent className="bg-gray-200 p-8 flex justify-center">
                <div className="transform scale-90 origin-top">
                    <Letterhead ref={letterheadRef} organization={organization} {...embeddedImages} />
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
