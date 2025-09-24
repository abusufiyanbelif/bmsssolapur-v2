
"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, FileText, Settings, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Organization } from "@/services/types";
import { Letterhead, LetterheadInclusionOptions } from "@/components/letterhead";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import jsPDF from "jspdf";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface LetterheadDocumentProps {
  organization: Organization;
  logoDataUri?: string;
}

const inclusionOptions: { id: keyof LetterheadInclusionOptions, label: string }[] = [
    { id: 'includeAddress', label: 'Address' },
    { id: 'includeEmail', label: 'Email' },
    { id: 'includePhone', label: 'Phone' },
    { id: 'includeRegNo', label: 'Registration No.' },
    { id: 'includePan', label: 'PAN Number' },
    { id: 'includeUrl', label: 'Website URL' },
];

export function LetterheadDocument({ organization, logoDataUri }: LetterheadDocumentProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTemplateGenerating, setIsTemplateGenerating] = useState(false);
  const [inclusions, setInclusions] = useState<LetterheadInclusionOptions>({
      includeAddress: true,
      includeEmail: true,
      includePhone: true,
      includeRegNo: true,
      includePan: true,
      includeUrl: true,
  });

  const letterheadRef = useRef<HTMLDivElement>(null);

  const generatePdf = async (isTemplate: boolean = false) => {
    if (!logoDataUri) {
        toast({ variant: 'destructive', title: "Error", description: "Letterhead logo is not ready. The logo URL might be invalid or inaccessible." });
        return;
    }
    
    const setLoading = isTemplate ? setIsTemplateGenerating : setIsGenerating;
    setLoading(true);

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });
      
      const A4_WIDTH_PT = pdf.internal.pageSize.getWidth();
      const A4_HEIGHT_PT = pdf.internal.pageSize.getHeight();
      const margin = 45;

      // --- 1. Watermark (Faint, Background) ---
      const watermarkProps = pdf.getImageProperties(logoDataUri);
      const watermarkWidth = 400;
      const watermarkHeight = (watermarkProps.height * watermarkWidth) / watermarkProps.width;
      const watermarkX = (A4_WIDTH_PT - watermarkWidth) / 2;
      const watermarkY = (A4_HEIGHT_PT - watermarkHeight) / 2;
      
      pdf.setGState(new (pdf as any).GState({ opacity: 0.08 }));
      pdf.addImage(logoDataUri, 'PNG', watermarkX, watermarkY, watermarkWidth, watermarkHeight);
      pdf.setGState(new (pdf as any).GState({ opacity: 1 }));

      // --- 2. Header ---
      const logoWidth = 128;
      const logoHeight = (watermarkProps.height * logoWidth) / watermarkProps.width;
      pdf.addImage(logoDataUri, 'PNG', margin, 40, logoWidth, logoHeight);

      const textX = margin + logoWidth + 20;
      const orgInfo = organization.footer!.organizationInfo;
      
      pdf.setFont('Helvetica', 'bold');
      pdf.setTextColor('#16a34a');
      pdf.setFontSize(28);
      pdf.text(orgInfo.titleLine1.toUpperCase(), textX, 70);
      
      pdf.setTextColor("#FFC107");
      pdf.text(orgInfo.titleLine2.toUpperCase(), textX, 100);

      pdf.setTextColor('#16a34a');
      pdf.setFontSize(22);
      pdf.text(orgInfo.titleLine3.toUpperCase(), textX, 125);
      
      pdf.setFont('Helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.setFontSize(9);
      
      const emailPhoneText = [
        (!isTemplate && inclusions.includeEmail) && `Email: ${organization.contactEmail}`,
        (isTemplate && inclusions.includeEmail) && 'Email:',
        (!isTemplate && inclusions.includePhone) && `Phone: ${organization.contactPhone}`,
        (isTemplate && inclusions.includePhone) && 'Phone:',
      ].filter(Boolean).join(isTemplate ? '          |   ' : '  |  ');
      
      if (inclusions.includeAddress) {
          pdf.text(`Address: ${isTemplate ? '' : `${organization.address}, ${organization.city}`}`, textX, 145);
      }
      if (emailPhoneText) {
          pdf.text(emailPhoneText, textX, 158);
      }

      pdf.setDrawColor(150, 150, 150);
      pdf.setLineWidth(1.5);
      pdf.line(margin, 180, A4_WIDTH_PT - margin, 180);

      // --- 3. Body Content ---
      pdf.setTextColor(50, 50, 50);
      pdf.setFontSize(11);
      pdf.text('Date: ', margin, 220);
      
      // --- 4. Signature ---
      const signatureY = A4_HEIGHT_PT - 120;
      const signatureLineX2 = A4_WIDTH_PT - margin;
      const signatureLineX1 = signatureLineX2 - 200;
      pdf.setDrawColor(50, 50, 50);
      pdf.setLineWidth(0.5);
      pdf.line(signatureLineX1, signatureY, signatureLineX2, signatureY);
      pdf.text('(Signature / Stamp)', signatureLineX1 + 100, signatureY + 15, { align: 'center' });


      // --- 5. Footer ---
      const footerY = A4_HEIGHT_PT - 45;
      pdf.setFont('Helvetica', 'normal');
      pdf.setTextColor(150, 150, 150);
      pdf.setFontSize(8);

      const regPanText = [
        (!isTemplate && inclusions.includeRegNo) && `Reg No: ${organization.registrationNumber}`,
        (isTemplate && inclusions.includeRegNo) && 'Reg No.:',
        (!isTemplate && inclusions.includePan) && `PAN: ${organization.panNumber || 'N/A'}`,
        (isTemplate && inclusions.includePan) && 'PAN:',
      ].filter(Boolean).join(isTemplate ? '          |   ' : ' | ');
      
      if(regPanText) {
          pdf.text(regPanText, A4_WIDTH_PT / 2, footerY - (isTemplate ? 50 : 15), { align: 'center' });
      }

      if(inclusions.includeUrl) {
           pdf.text(`URL: ${isTemplate ? '' : organization.website}`, A4_WIDTH_PT / 2, footerY, { align: 'center' });
      }

      const fileName = isTemplate 
        ? `Letterhead-Template-${organization.name.replace(/\s/g, '-')}.pdf`
        : `Letterhead-${organization.name.replace(/\s/g, '-')}.pdf`;

      pdf.save(fileName);
      
      toast({
          variant: 'success',
          title: "Download Started",
          description: `Your ${isTemplate ? 'template' : ''} letterhead is being downloaded.`,
      });
    } catch (e) {
      console.error("Error generating PDF", e);
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "An error occurred while generating the PDF. Please check the console for details.",
      });
    } finally {
        setLoading(false);
    }
  };

  const handleInclusionChange = (field: keyof LetterheadInclusionOptions, checked: boolean) => {
    setInclusions(prev => ({ ...prev, [field]: checked }));
  }

  return (
    <div className="flex-1 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column for Preview */}
            <div className="lg:col-span-2 space-y-6">
                 <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Organization Letterhead</h2>
                    <div className="flex gap-2">
                        <Button onClick={() => generatePdf(true)} disabled={isTemplateGenerating || !logoDataUri}>
                            {isTemplateGenerating || !logoDataUri ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                            Download Template
                        </Button>
                        <Button onClick={() => generatePdf(false)} disabled={isGenerating || !logoDataUri}>
                            {isGenerating || !logoDataUri ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                            Download as PDF
                        </Button>
                    </div>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Letterhead Preview</CardTitle>
                        <CardDescription>
                            This is a preview of the official organization letterhead, reflecting your selections.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="bg-gray-200 p-8 flex justify-center">
                        <div className="transform scale-90 origin-top">
                            {!logoDataUri ? (
                                <div className="w-[210mm] min-h-[297mm] bg-white flex items-center justify-center shadow-lg">
                                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                </div>
                            ) : (
                                <Letterhead 
                                    ref={letterheadRef}
                                    organization={organization}
                                    logoDataUri={logoDataUri}
                                    inclusions={inclusions}
                                />
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            {/* Right Column for Settings */}
            <div className="lg:col-span-1">
                <Card>
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Settings className="h-5 w-5" />
                           PDF Content
                        </CardTitle>
                        <CardDescription>
                            Select the fields to include in the downloaded PDF.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {inclusionOptions.map(option => (
                            <div key={option.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={option.id}
                                    checked={inclusions[option.id]}
                                    onCheckedChange={(checked) => handleInclusionChange(option.id, !!checked)}
                                />
                                <Label htmlFor={option.id} className="font-normal">{option.label}</Label>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
