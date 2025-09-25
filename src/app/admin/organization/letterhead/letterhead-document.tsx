

"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, FileText, Settings, Type, Milestone, CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Organization, LetterheadInclusionOptions, LetterContentOptions } from "@/services/types";
import { Letterhead } from "@/components/letterhead";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import jsPDF from "jspdf";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from 'date-fns';
import { cn } from "@/lib/utils";


interface LetterheadDocumentProps {
  organization: Organization;
  logoDataUri?: string;
}

const headerInclusionOptions: { id: keyof LetterheadInclusionOptions, label: string }[] = [
    { id: 'includeAddress', label: 'Address' },
    { id: 'includeEmail', label: 'Email' },
    { id: 'includePhone', label: 'Phone' },
];

const footerInclusionOptions: { id: keyof LetterheadInclusionOptions, label: string }[] = [
    { id: 'includeRegNo', label: 'Registration No.' },
    { id: 'includePan', label: 'PAN Number' },
    { id: 'includeUrl', label: 'Website URL' },
];

const letterSectionOptions: { id: keyof LetterheadInclusionOptions, label: string }[] = [
    { id: 'includeDate', label: 'Date' },
    { id: 'includeRecipient', label: 'Recipient' },
    { id: 'includeSubject', label: 'Subject Line' },
    { id: 'includeBody', label: 'Body Text' },
    { id: 'includeClosing', label: 'Closing/Signature' },
]


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
      includeDate: true,
      includeRecipient: true,
      includeSubject: true,
      includeBody: true,
      includeClosing: true,
  });
  
  // State for the *content* of the letterhead
  const [letterContent, setLetterContent] = useState<LetterContentOptions>({
      date: new Date(),
      recipientName: 'The Manager',
      recipientAddress: '[Bank Name]\n[Branch Address]',
      subject: 'Request to Open a Bank Account for Baitul Mal Samajik Sanstha (Solapur)',
      body: `Dear Sir/Madam,

This letter serves as a formal request to open a bank account on behalf of **Baitul Mal Samajik Sanstha (Solapur)**, a registered charitable organization dedicated to **providing educational and medical support to underprivileged communities**.

We believe that opening an account with your esteemed bank will enable us to manage our finances transparently and efficiently, supporting our mission and ensuring proper accountability.

We are prepared to submit all necessary documents and fulfill the requirements for opening a bank account for a non-profit organization. We have attached a copy of the resolution passed by our Governing Body/Board of Trustees authorizing the opening of this account and designating the authorized signatories.

We kindly request you to provide us with the necessary application forms and details regarding the required documentation and procedures to complete the account opening process.

Thank you for your time and consideration. We look forward to establishing a banking relationship with you.`,
      closingName: 'Abusufiyan Belif',
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
      
      pdf.setTextColor('#FFC107');
      pdf.text(orgInfo.titleLine2.toUpperCase(), textX, 100);

      pdf.setTextColor('#16a34a');
      pdf.setFontSize(22);
      pdf.text(orgInfo.titleLine3.toUpperCase(), textX, 125);
      
      pdf.setFont('Helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.setFontSize(9);
      
      let headerTextY = 145;
      if (inclusions.includeAddress) {
          pdf.text(`Address: ${isTemplate ? '' : `${organization.address}, ${organization.city}`}`, textX, headerTextY);
          headerTextY += 15;
      }
      
       if (isTemplate) {
          const emailX = textX;
          const phoneX = emailX + 150; 
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
      
      if (inclusions.includeDate) {
        pdf.text(`Date: ${isTemplate ? '' : format(letterContent.date, 'dd MMM, yyyy')}`, margin, bodyY);
      }
      
      if (inclusions.includeRecipient) {
          bodyY += 40;
          pdf.text('To,', margin, bodyY);
          bodyY += 15;
          const recipientLines = pdf.splitTextToSize(isTemplate ? "" : letterContent.recipientName, contentWidth);
          pdf.setFont('Helvetica', 'bold');
          pdf.text(recipientLines, margin, bodyY);
          bodyY += (recipientLines.length * 15);
          
          pdf.setFont('Helvetica', 'normal');
          const addressLines = pdf.splitTextToSize(isTemplate ? '' : letterContent.recipientAddress, contentWidth);
          pdf.text(addressLines, margin, bodyY);
          bodyY += (addressLines.length * 15);
      }

      if(inclusions.includeSubject) {
        bodyY += 40;
        pdf.setFont('Helvetica', 'bold');
        pdf.text('Subject: ', margin, bodyY);
        pdf.setFont('Helvetica', 'normal');
        pdf.text(isTemplate ? '' : letterContent.subject, margin + 50, bodyY);
        bodyY += 15;
      }
      
       if (inclusions.includeBody) {
        bodyY += 40;
        const bodyText = isTemplate ? '[Main body of the letter...]' : letterContent.body;
        const bodyLines = pdf.splitTextToSize(bodyText, contentWidth);
        pdf.text(bodyLines, margin, bodyY);
      }

      // --- Signature ---
      let signatureY = A4_HEIGHT_PT - 150;
      if (inclusions.includeClosing) {
          pdf.setFont('Helvetica', 'normal');
          pdf.text('Sincerely,', margin, signatureY - 30);
          const closingName = isTemplate ? '[Sender Name]' : letterContent.closingName;
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
          const panX = regX + 150;
          let currentY = footerY;
          if(inclusions.includeRegNo) pdf.text('Reg No:', regX, currentY);
          if(inclusions.includePan) pdf.text('PAN:', panX, currentY);
          
          currentY += 15;
          if (inclusions.includeUrl) pdf.text('URL:', regX, currentY);

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
                                <div className="w-[210mm] h-[297mm] bg-white flex items-center justify-center shadow-lg">
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
                                {headerInclusionOptions.map(option => (
                                    <div key={option.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`inc-${option.id}`}
                                            checked={inclusions[option.id as keyof LetterheadInclusionOptions]}
                                            onCheckedChange={(checked) => handleInclusionChange(option.id as keyof LetterheadInclusionOptions, !!checked)}
                                        />
                                        <Label htmlFor={`inc-${option.id}`} className="font-normal">{option.label}</Label>
                                    </div>
                                ))}
                                 {footerInclusionOptions.map(option => (
                                    <div key={option.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`inc-${option.id}`}
                                            checked={inclusions[option.id as keyof LetterheadInclusionOptions]}
                                            onCheckedChange={(checked) => handleInclusionChange(option.id as keyof LetterheadInclusionOptions, !!checked)}
                                        />
                                        <Label htmlFor={`inc-${option.id}`} className="font-normal">{option.label}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <Separator />
                         <div>
                            <h4 className="font-semibold text-sm mb-2">Letter Sections</h4>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                {letterSectionOptions.map(option => (
                                    <div key={option.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`inc-${option.id}`}
                                            checked={inclusions[option.id as keyof LetterheadInclusionOptions]}
                                            onCheckedChange={(checked) => handleInclusionChange(option.id as keyof LetterheadInclusionOptions, !!checked)}
                                        />
                                        <Label htmlFor={`inc-${option.id}`} className="font-normal">{option.label}</Label>
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
                            <Label htmlFor="date">Date</Label>
                             <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !letterContent.date && "text-muted-foreground"
                                    )}
                                    >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {letterContent.date ? format(letterContent.date, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                    mode="single"
                                    selected={letterContent.date}
                                    onSelect={(date) => setLetterContent(prev => ({...prev, date: date || new Date()}))}
                                    initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
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
