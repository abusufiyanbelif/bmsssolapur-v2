// src/app/admin/organization/letterhead/letterhead-document.tsx

"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, FileText, Settings, Type, Milestone, CalendarIcon, Users, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Organization, LetterheadInclusionOptions, LetterContentOptions } from "@/services/types";
import { Letterhead } from "@/components/letterhead";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import jsPDF from "jspdf";
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";


interface LetterheadDocumentProps {
  organization: Organization;
  logoDataUri?: string;
}

export function LetterheadDocument({ organization, logoDataUri }: LetterheadDocumentProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTemplateGenerating, setIsTemplateGenerating] = useState(false);
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

  const letterheadRef = useRef<HTMLDivElement>(null);
  const letterheadContentRef = useRef<HTMLDivElement>(null);
  const templateRef = useRef<HTMLDivElement>(null);
  const templateContentRef = useRef<HTMLDivElement>(null);

  const generatePdf = async (isTemplate: boolean = false) => {
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
      if (logoDataUri) {
          const watermarkProps = pdf.getImageProperties(logoDataUri);
          const watermarkWidth = 400;
          const watermarkHeight = (watermarkProps.height * watermarkWidth) / watermarkProps.width;
          const watermarkX = (A4_WIDTH_PT - watermarkWidth) / 2;
          const watermarkY = (A4_HEIGHT_PT - watermarkHeight) / 2;
          
          pdf.setGState(new (pdf as any).GState({ opacity: 0.08 }));
          pdf.addImage(logoDataUri, 'PNG', watermarkX, watermarkY, watermarkWidth, watermarkHeight);
          pdf.setGState(new (pdf as any).GState({ opacity: 1 }));
      }

      // --- Header ---
      let textX = margin;
      if (logoDataUri) {
          const logoProps = pdf.getImageProperties(logoDataUri);
          const logoHeight = (logoProps.height * logoWidth) / logoProps.width;
          pdf.addImage(logoDataUri, 'PNG', margin, 40, logoWidth, logoHeight);
          textX = margin + logoWidth + 20;
      }

      const orgInfo = organization.footer?.organizationInfo;
      
      pdf.setFont('Helvetica', 'bold');
      pdf.setTextColor('#16a34a'); // Primary Green
      pdf.setFontSize(28);
      pdf.text(orgInfo?.titleLine1?.toUpperCase() || organization.name.toUpperCase(), textX, 70);
      
      if(orgInfo?.titleLine2) {
        pdf.setTextColor('#FFC107'); // Accent Gold
        pdf.text(orgInfo.titleLine2.toUpperCase(), textX, 100);
      }

      if(orgInfo?.titleLine3){
        pdf.setTextColor('#16a34a');
        pdf.setFontSize(22);
        pdf.text(orgInfo.titleLine3.toUpperCase(), textX, 125);
      }
      
      pdf.setFont('Helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.setFontSize(9);
      
      let headerTextY = orgInfo?.titleLine3 ? 145 : 125;
      if (inclusions.includeAddress) {
        pdf.text(`Address: ${isTemplate ? '' : `${organization.address}, ${organization.city}`}`, textX, headerTextY);
        headerTextY += 15;
      }
      
       const emailPhoneText = [
          (inclusions.includeEmail || isTemplate) && `Email: ${isTemplate ? '' : organization.contactEmail}`,
          (inclusions.includePhone || isTemplate) && `Phone: ${isTemplate ? '' : organization.contactPhone}`,
      ].filter(Boolean).join('  |  ');
      if (emailPhoneText) pdf.text(emailPhoneText, textX, headerTextY);

      pdf.setDrawColor(150, 150, 150);
      pdf.setLineWidth(1.5);
      pdf.line(margin, 180, A4_WIDTH_PT - margin, 180);

      // --- Body ---
      pdf.setTextColor(50, 50, 50);
      pdf.setFontSize(11);
      let bodyY = 220;
      
      if (inclusions.includeDate || isTemplate) {
        pdf.text(`Date: ${isTemplate ? '' : format(letterContent.date, 'dd MMM, yyyy')}`, margin, bodyY);
      }
      
      bodyY += 40;
      if (inclusions.includeRecipient || isTemplate) {
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

      bodyY += 40;
      if (inclusions.includeSubject || isTemplate) {
        pdf.setFont('Helvetica', 'bold');
        pdf.text('Subject: ', margin, bodyY);
        pdf.setFont('Helvetica', 'normal');
        pdf.text(isTemplate ? '' : letterContent.subject, margin + 50, bodyY);
        bodyY += 15;
      }
      
      bodyY += 40;
      if (inclusions.includeBody || isTemplate) {
        const bodyText = isTemplate ? '[Main body of the letter...]' : letterContent.body;
        const bodyLines = pdf.splitTextToSize(bodyText, contentWidth);
        pdf.text(bodyLines, margin, bodyY);
      }
      

      // --- Signature ---
      let signatureY = A4_HEIGHT_PT - 150;
      if (inclusions.includeClosing || isTemplate) {
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
      
      const regPanText = [
        (inclusions.includeRegNo || isTemplate) && `Reg No: ${isTemplate ? '' : organization.registrationNumber}`,
        (inclusions.includePan || isTemplate) && `PAN: ${isTemplate ? '' : organization.panNumber || 'N/A'}`
      ].filter(Boolean).join(' | ');
      
      if(regPanText) pdf.text(regPanText, margin, footerY);
      if(inclusions.includeUrl || isTemplate) {
        pdf.text(`URL: ${isTemplate ? '' : organization.website}`, A4_WIDTH_PT - margin, footerY, { align: 'right' });
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


  return (
    <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Organization Letterhead</h2>
            <div className="flex gap-2">
                <Button onClick={() => generatePdf(true)} disabled={isTemplateGenerating}>
                    {isTemplateGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                    Download Template
                </Button>
                <Button onClick={() => generatePdf(false)} disabled={isGenerating}>
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Download as PDF
                </Button>
            </div>
        </div>
        {!logoDataUri && (
            <Alert variant="warning">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Logo Not Available</AlertTitle>
                <AlertDescription>
                    The organization logo could not be loaded. This might be due to an invalid URL. PDFs will be generated without the logo. Please update the logo URL in the <a href="/admin/organization" className="font-semibold underline">Organization Profile</a> settings.
                </AlertDescription>
            </Alert>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
                 <CardHeader>
                    <CardTitle className="text-primary flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Customize Letter
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Select which elements to include and edit the content for your letter.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h4 className="font-semibold text-lg mb-4 text-primary">Inclusion Options</h4>
                        <div className="grid grid-cols-2 gap-4">
                            {Object.keys(inclusions).map(key => (
                                <div key={key} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={key}
                                        checked={inclusions[key as keyof LetterheadInclusionOptions]}
                                        onCheckedChange={(checked) => setInclusions(prev => ({ ...prev, [key]: !!checked }))}
                                    />
                                    <label htmlFor={key} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        {key.replace('include', '').replace(/([A-Z])/g, ' $1').trim()}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                     <div>
                        <h4 className="font-semibold text-lg mb-4 text-primary">Content Editor</h4>
                        <div className="space-y-4">
                             <div className="space-y-2">
                                <Label className="flex items-center gap-2"><CalendarIcon className="h-4 w-4" /> Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn("w-full justify-start text-left font-normal", !letterContent.date && "text-muted-foreground")}
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
                                <Label className="flex items-center gap-2"><Users className="h-4 w-4" /> Recipient</Label>
                                <Input value={letterContent.recipientName} onChange={(e) => setLetterContent(prev => ({...prev, recipientName: e.target.value}))} />
                                <Textarea value={letterContent.recipientAddress} onChange={(e) => setLetterContent(prev => ({...prev, recipientAddress: e.target.value}))} placeholder="Recipient Address" />
                            </div>
                            <div className="space-y-2">
                                 <Label className="flex items-center gap-2"><Milestone className="h-4 w-4" /> Subject</Label>
                                <Input value={letterContent.subject} onChange={(e) => setLetterContent(prev => ({...prev, subject: e.target.value}))} />
                            </div>
                            <div className="space-y-2">
                                 <Label className="flex items-center gap-2"><Type className="h-4 w-4" /> Body</Label>
                                <Textarea value={letterContent.body} onChange={(e) => setLetterContent(prev => ({...prev, body: e.target.value}))} rows={10} />
                            </div>
                            <div className="space-y-2">
                                 <Label className="flex items-center gap-2"><Users className="h-4 w-4" /> Closing</Label>
                                <Input value={letterContent.closingName} onChange={(e) => setLetterContent(prev => ({...prev, closingName: e.target.value}))} />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-primary">Letterhead Preview</CardTitle>
                        <CardDescription className="text-muted-foreground">
                            This is a preview of the official organization letterhead, reflecting your selections.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="bg-gray-200 p-8 flex justify-center">
                        <div className="transform scale-90 origin-top">
                            <Letterhead 
                                ref={letterheadRef}
                                contentRef={letterheadContentRef}
                                organization={organization}
                                logoDataUri={logoDataUri}
                                letterContent={letterContent}
                                inclusions={inclusions}
                            />
                            {/* Hidden template for PDF generation */}
                            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                                <Letterhead
                                    ref={templateRef}
                                    contentRef={templateContentRef}
                                    organization={organization}
                                    logoDataUri={logoDataUri}
                                    isTemplate={true}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
