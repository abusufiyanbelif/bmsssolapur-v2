
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Copy, Loader2, Share2, Wand2 } from "lucide-react";
import type { Lead } from "@/services/types";
import { generateAppealMessage } from "./generate-appeal-message-action";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

interface CommunicationsFormProps {
    openLeads: Lead[];
}

export function CommunicationsForm({ openLeads }: CommunicationsFormProps) {
    const { toast } = useToast();
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedMessage, setGeneratedMessage] = useState("");
    const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
    const [introMessage, setIntroMessage] = useState("Alhamdullilah kuch pending aur new cases hai, jiske liye hume aap sabse aur funds ki umeed hai aur sabi se appeal hai sabi iss Baitul Mal Sanstha ka hissa bane aur zyada se zyada apna mal is neak amal mae lagaye.");
    const [outroMessage, setOutroMessage] = useState("Note: Zakat and Interest amts are accepted.");

    const handleGenerate = async () => {
        if (selectedLeadIds.length === 0) {
            toast({ variant: "destructive", title: "No leads selected", description: "Please select at least one lead to include in the appeal." });
            return;
        }

        setIsGenerating(true);
        const result = await generateAppealMessage(selectedLeadIds, introMessage, outroMessage);

        if (result.success && result.message) {
            setGeneratedMessage(result.message);
        } else {
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


    return (
        <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
                <h3 className="text-lg font-semibold">1. Configure Your Message</h3>
                 <div className="space-y-2">
                    <Label htmlFor="introMessage">Introduction</Label>
                    <Textarea
                        id="introMessage"
                        value={introMessage}
                        onChange={(e) => setIntroMessage(e.target.value)}
                        rows={4}
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="outroMessage">Conclusion / Note</Label>
                    <Textarea
                        id="outroMessage"
                        value={outroMessage}
                        onChange={(e) => setOutroMessage(e.target.value)}
                        rows={2}
                    />
                </div>

                <h3 className="text-lg font-semibold">2. Select Priority Leads</h3>
                 <div className="space-y-2 h-96 overflow-y-auto border rounded-lg p-4">
                    {openLeads.map(lead => {
                        const isChecked = selectedLeadIds.includes(lead.id);
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
                
                 <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Total Required Amount</AlertTitle>
                    <AlertDescription>
                        Based on your selection, the total required amount is approximately <span className="font-bold">₹{totalRequired.toLocaleString()}</span>.
                    </AlertDescription>
                </Alert>

                <Button onClick={handleGenerate} disabled={isGenerating || selectedLeadIds.length === 0} className="w-full">
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                    Generate Message
                </Button>
            </div>
             <div className="space-y-6">
                <h3 className="text-lg font-semibold">3. Copy or Share</h3>
                <div className="relative">
                    <Textarea
                        readOnly
                        value={generatedMessage}
                        placeholder="Your generated WhatsApp message will appear here..."
                        rows={20}
                        className="bg-muted pr-12"
                    />
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
