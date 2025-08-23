
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Copy, Loader2, Share2, Wand2, ShieldCheck, Megaphone } from "lucide-react";
import type { Lead, LeadPurpose } from "@/services/types";
import { generateAppealMessage, generateAdminActionMessage } from "./actions";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";


const allLeadPurposes: LeadPurpose[] = ['Education', 'Medical', 'Relief Fund', 'Deen', 'Loan', 'Other'];

type AppealType = 'selected' | 'purpose' | 'all';
type FormType = 'public-appeal' | 'admin-action';

interface CommunicationsFormProps {
    openLeads: Lead[];
    formType: FormType;
}

export function CommunicationsForm({ openLeads, formType }: CommunicationsFormProps) {
    const { toast } = useToast();
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedMessage, setGeneratedMessage] = useState("");
    const [appealType, setAppealType] = useState<AppealType>('selected');
    const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
    const [selectedPurpose, setSelectedPurpose] = useState<LeadPurpose | undefined>();
    const [introMessage, setIntroMessage] = useState("Alhamdullilah kuch pending aur new cases hai, jiske liye hume aap sabse aur funds ki umeed hai aur sabi se appeal hai sabi iss Baitul Mal Sanstha ka hissa bane aur zyada se zyada apna mal is neak amal mae lagaye.");
    const [outroMessage, setOutroMessage] = useState("Note: Zakat and Interest amts are accepted.");

    const handleGenerate = async () => {
        setIsGenerating(true);
        let result;

        if (formType === 'public-appeal') {
            let data = {};
            if (appealType === 'selected') {
                if (selectedLeadIds.length === 0) {
                    toast({ variant: "destructive", title: "No leads selected", description: "Please select at least one lead to include in the appeal." });
                    setIsGenerating(false);
                    return;
                }
                data = { leadIds: selectedLeadIds };
            } else if (appealType === 'purpose') {
                if (!selectedPurpose) {
                    toast({ variant: "destructive", title: "No purpose selected", description: "Please select a lead purpose for the appeal." });
                    setIsGenerating(false);
                    return;
                }
                data = { purpose: selectedPurpose };
            }
            result = await generateAppealMessage(appealType, data, introMessage, outroMessage);
        } else if (formType === 'admin-action') {
            if (selectedLeadIds.length === 0) {
                toast({ variant: "destructive", title: "No leads selected", description: "Please select at least one lead for the admin action message." });
                setIsGenerating(false);
                return;
            }
            result = await generateAdminActionMessage(selectedLeadIds);
        }
        
        if (result && result.success && result.message) {
            setGeneratedMessage(result.message);
        } else if (result) {
            toast({ variant: "destructive", title: "Generation Failed", description: result.error || "An unknown error occurred." });
        }
        setIsGenerating(false);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedMessage);
        toast({ title: "Copied to clipboard!" });
    };

    const handleShare = () => {
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(generatedMessage)}`;
        window.open(whatsappUrl, '_blank');
    };

    const totalRequired = selectedLeadIds.reduce((sum, id) => {
        const lead = openLeads.find(l => l.id === id);
        return sum + (lead ? lead.helpRequested - lead.helpGiven : 0);
    }, 0);

    const renderPublicAppealConfig = () => (
        <>
            <div className="space-y-2">
                <Label htmlFor="introMessage">Introduction</Label>
                <Textarea id="introMessage" value={introMessage} onChange={(e) => setIntroMessage(e.target.value)} rows={4} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="outroMessage">Conclusion / Note</Label>
                <Textarea id="outroMessage" value={outroMessage} onChange={(e) => setOutroMessage(e.target.value)} rows={2} />
            </div>
        </>
    );

    const renderLeadSelection = () => (
         <div className="space-y-6">
            <h3 className="text-lg font-semibold">2. Select Leads</h3>
            {formType === 'public-appeal' && (
                <RadioGroup value={appealType} onValueChange={(v) => setAppealType(v as AppealType)} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                     <Label className="flex items-center space-x-2 rounded-md border p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                        <RadioGroupItem value="selected" />
                        <span>Selected Leads</span>
                    </Label>
                    <Label className="flex items-center space-x-2 rounded-md border p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                        <RadioGroupItem value="purpose" />
                        <span>By Purpose</span>
                    </Label>
                    <Label className="flex items-center space-x-2 rounded-md border p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                        <RadioGroupItem value="all" />
                        <span>All Open</span>
                    </Label>
                </RadioGroup>
            )}

            {(formType === 'admin-action' || appealType === 'selected') && (
                <ScrollArea className="h-96 w-full rounded-md border p-4">
                    <div className="space-y-2">
                    {openLeads.map(lead => {
                        const isChecked = selectedLeadIds.includes(lead.id!);
                        return (
                            <div 
                                key={lead.id}
                                className="flex items-center space-x-3 rounded-md p-2 hover:bg-muted/50 transition-colors"
                            >
                                <Checkbox
                                    id={`lead-${lead.id}`}
                                    checked={isChecked}
                                    onCheckedChange={(checked) => {
                                        setSelectedLeadIds(prev => 
                                            checked ? [...prev, lead.id!] : prev.filter(id => id !== lead.id!)
                                        );
                                    }}
                                />
                                <label
                                    htmlFor={`lead-${lead.id}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-grow"
                                >
                                    {lead.name} - {lead.purpose} (Req: ₹{(lead.helpRequested - lead.helpGiven).toLocaleString()})
                                </label>
                            </div>
                        )
                    })}
                    </div>
                </ScrollArea>
            )}
             {appealType === 'purpose' && formType === 'public-appeal' && (
                <Select onValueChange={(v) => setSelectedPurpose(v as LeadPurpose)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a lead purpose..." />
                    </SelectTrigger>
                    <SelectContent>
                        {allLeadPurposes.map(purpose => (
                            <SelectItem key={purpose} value={purpose}>{purpose}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}
            
            {appealType === 'selected' && (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Total Required for Selection</AlertTitle>
                    <AlertDescription>
                        Based on your selection, the total required amount is approximately <span className="font-bold">₹{totalRequired.toLocaleString()}</span>.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );

    return (
        <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
                 {formType === 'public-appeal' ? (
                     <>
                        <h3 className="text-lg font-semibold">1. Configure Your Message</h3>
                        {renderPublicAppealConfig()}
                        {renderLeadSelection()}
                     </>
                 ) : (
                    <>
                        <h3 className="text-lg font-semibold">1. Select Leads for Admin Action</h3>
                        <p className="text-sm text-muted-foreground">Select one or more leads that require verification or another administrative action.</p>
                        {renderLeadSelection()}
                    </>
                 )}
                <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                    Generate Message
                </Button>
            </div>
             <div className="space-y-6">
                <h3 className="text-lg font-semibold">3. Copy or Share</h3>
                <div className="relative">
                    <ScrollArea className="h-96 w-full rounded-md border">
                        <Textarea
                            readOnly
                            value={generatedMessage}
                            placeholder="Your generated WhatsApp message will appear here..."
                            rows={20}
                            className="bg-muted pr-12 border-none"
                        />
                    </ScrollArea>
                </div>
                 {generatedMessage && (
                     <div className="flex gap-4">
                        <Button onClick={handleCopy} variant="outline" className="w-full">
                            <Copy className="mr-2 h-4 w-4" /> Copy Message
                        </Button>
                         <Button onClick={handleShare} className="w-full">
                            <Share2 className="mr-2 h-4 w-4" /> Share on WhatsApp
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
