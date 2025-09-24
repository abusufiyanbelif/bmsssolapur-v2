
"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, FileText, Settings, Type, Milestone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Organization } from "@/services/types";
import { Letterhead, LetterheadInclusionOptions, LetterContentOptions } from "@/components/letterhead";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import jsPDF from "jspdf";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

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

  // State for what to *include* in the letterhead
  const [inclusions, setInclusions] = useState<LetterheadInclusionOptions>({
      includeAddress: true,
      includeEmail: true,
      includePhone: true,
      includeRegNo: true,
      includePan: true,
      includeUrl: true,
      includeRecipient: true,
      includeSubject: true,
      includeBody: true,
      includeClosing: true,
  });
  
  // State for the *content* of the letterhead
  const [letterContent, setLetterContent] = useState<LetterContentOptions>({
      recipientName: 'Recipient Name',
      recipientAddress: 'Recipient Address,\nCity, State, Pincode',
      subject: 'Regarding the subject matter',
      body: 'This is the main body of the letter. You can write multiple paragraphs here, and the PDF will handle the line breaks automatically.',
      closingName: 'Your Name',
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
      const margin = 45;
      const contentWidth = A4_WIDTH_PT - (margin * 2);
      const logoWidth = 150;

      // --- Watermark ---
      const watermarkProps = pdf.getImageProperties(logoDataUri);
      const watermarkWidth = 400;
      const watermarkHeight = (watermarkProps.height * watermarkWidth) / watermarkProps.width;
      const watermarkX = (A4_WIDTH_PT - watermarkWidth) / 2;
      const watermarkY = (A4_HEIGHT_PT - watermarkHeight) / 2;
      
      pdf.setGState(new (pdf as any).GState({ opacity: 0.08 }));
      pdf.addImage(logoDataUri, 'PNG', watermarkX, watermarkY, watermarkWidth, watermarkHeight);
      pdf.setGState(new (pdf as any).GState({ opacity: 1 }));

      // --- Header ---
      const logoHeight = (watermarkProps.height * logoWidth) / watermarkProps.width;
      pdf.addImage(logoDataUri, 'PNG', margin, 40, logoWidth, logoHeight);

      const textX = margin + logoWidth + 20;
      const orgInfo = organization.footer!.organizationInfo;
      
      pdf.setFont('Helvetica', 'bold');
      pdf.setTextColor('#16a34a'); // Primary Green
      pdf.setFontSize(28);
      pdf.text(orgInfo.titleLine1.toUpperCase(), textX, 70);
      
      pdf.setTextColor('#FFC107'); // Accent Gold/Yellow
      pdf.text(orgInfo.titleLine2.toUpperCase(), textX, 100);

      pdf.setTextColor('#16a34a'); // Primary Green
      pdf.setFontSize(22);
      pdf.text(orgInfo.titleLine3.toUpperCase(), textX, 125);
      
      pdf.setFont('Helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.setFontSize(9);
      
      let headerTextY = 145;
      if (inclusions.includeAddress) {
          pdf.text(`Address: ${isTemplate ? '' : `${organization.address}, ${organization.city}`}`, textX, headerTextY);
          headerTextY += 13;
      }

      if (isTemplate) {
          const emailX = textX;
          const phoneX = emailX + 80; // Increased spacing
          if (inclusions.includeEmail) pdf.text('Email:', emailX, headerTextY);
          if (inclusions.includePhone) pdf.text('Phone:', phoneX, headerTextY);
      } else {
          const emailPhoneText = [
              inclusions.includeEmail && `Email: ${organization.contactEmail}`,
              inclusions.includePhone && `Phone: ${organization.contactPhone}`,
          ].filter(Boolean).join('  |  ');
          if (emailPhoneText) pdf.text(emailPhoneText, textX, headerTextY);
      }

      pdf.setDrawColor(150, 150, 150);
      pdf.setLineWidth(1.5);
      pdf.line(margin, 180, A4_WIDTH_PT - margin, 180);

      // --- Body ---
      pdf.setTextColor(50, 50, 50);
      pdf.setFontSize(11);
      let bodyY = 220;
      pdf.text('Date: ', margin, bodyY);
      
      if (inclusions.includeRecipient) {
          bodyY += 40;
          pdf.text('To,', margin, bodyY);
          bodyY += 15;
          const recipientLines = pdf.splitTextToSize(isTemplate ? "Recipient Name" : letterContent.recipientName, contentWidth);
          pdf.text(recipientLines, margin, bodyY);
          bodyY += (recipientLines.length * 15);
          
          const addressLines = pdf.splitTextToSize(isTemplate ? 'Recipient Address' : letterContent.recipientAddress, contentWidth);
          pdf.text(addressLines, margin, bodyY);
          bodyY += (addressLines.length * 15);
      }

      if(inclusions.includeSubject) {
        bodyY += 40;
        pdf.setFont('Helvetica', 'bold');
        pdf.text('Subject: ', margin, bodyY);
        pdf.setFont('Helvetica', 'normal');
        pdf.text(isTemplate ? '' : letterContent.subject, margin + 50, bodyY);
      }
      
       if (inclusions.includeBody) {
        bodyY += 40;
        const bodyLines = pdf.splitTextToSize(isTemplate ? '' : letterContent.body, contentWidth);
        pdf.text(bodyLines, margin, bodyY);
      }

      // --- Signature ---
      let signatureY = A4_HEIGHT_PT - 150;
      if (inclusions.includeClosing) {
          pdf.setFont('Helvetica', 'normal');
          pdf.text('Sincerely,', margin, signatureY);
          signatureY += 30; // More space for signature
          const closingName = isTemplate ? 'Sender Name' : letterContent.closingName;
          pdf.text(closingName, margin, signatureY);
      }

      const signatureLineX2 = A4_WIDTH_PT - margin;
      const signatureLineX1 = signatureLineX2 - 200;
      pdf.setDrawColor(50, 50, 50);
      pdf.setLineWidth(0.5);
      pdf.line(signatureLineX1, signatureY, signatureLineX2, signatureY);
      pdf.text('(Signature / Stamp)', signatureLineX1 + 100, signatureY + 15, { align: 'center' });

      // --- Footer ---
      let footerY = A4_HEIGHT_PT - 45;
      pdf.setFont('Helvetica', 'normal');
      pdf.setTextColor(150, 150, 150);
      pdf.setFontSize(8);
      
      if (isTemplate) {
          const regX = margin;
          const panX = regX + 150; // Increased spacing
          const urlX = panX + 150;
          if(inclusions.includeRegNo) pdf.text('Reg No:', regX, footerY);
          if(inclusions.includePan) pdf.text('PAN:', panX, footerY);
          if(inclusions.includeUrl) pdf.text('URL:', urlX, footerY);
      } else {
          const regPanText = [
            inclusions.includeRegNo && `Reg No: ${organization.registrationNumber}`,
            inclusions.includePan && `PAN: ${organization.panNumber || 'N/A'}`,
          ].filter(Boolean).join(' | ');
          
          if(regPanText) pdf.text(regPanText, margin, footerY);
          if (inclusions.includeUrl) pdf.text(`URL: ${organization.website}`, A4_WIDTH_PT - margin, footerY, { align: 'right' });
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
                                    letterContent={letterContent}
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
                        <div>
                            <h4 className="font-semibold text-sm mb-2">Header & Footer Details</h4>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
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
                            </div>
                        </div>
                    </CardContent>
                </Card>

                 <Card className="mt-6">
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Type className="h-5 w-5" />
                           Letter Editor
                        </CardTitle>
                        <CardDescription>
                            Edit the content of your letter here.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="recipientName">Recipient Name</Label>
                            <Input id="recipientName" value={letterContent.recipientName} onChange={e => setLetterContent(prev => ({...prev, recipientName: e.target.value}))} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="recipientAddress">Recipient Address</Label>
                            <Textarea id="recipientAddress" value={letterContent.recipientAddress} onChange={e => setLetterContent(prev => ({...prev, recipientAddress: e.target.value}))} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="subject">Subject</Label>
                            <Input id="subject" value={letterContent.subject} onChange={e => setLetterContent(prev => ({...prev, subject: e.target.value}))} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="body">Body</Label>
                            <Textarea id="body" value={letterContent.body} onChange={e => setLetterContent(prev => ({...prev, body: e.target.value}))} rows={8} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="closingName">Closing Name</Label>
                            <Input id="closingName" value={letterContent.closingName} onChange={e => setLetterContent(prev => ({...prev, closingName: e.target.value}))} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
