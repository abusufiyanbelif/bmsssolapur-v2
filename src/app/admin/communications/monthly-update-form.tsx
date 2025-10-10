
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Copy, Loader2, Share2, Wand2 } from "lucide-react";
import { generateMonthlyUpdate } from "./actions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

export function MonthlyUpdateForm() {
    const { toast } = useToast();
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedMessage, setGeneratedMessage] = useState("");

    const handleGenerate = async () => {
        setIsGenerating(true);
        const result = await generateMonthlyUpdate();
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

    return (
        <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
                <h3 className="text-lg font-semibold text-primary">1. Generate Monthly Summary</h3>
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>How it Works</AlertTitle>
                    <AlertDescription>
                        Clicking the button will gather statistics from the last 30 days (donations, closed cases, etc.) and use AI to generate a summary message suitable for sharing with your donors and community.
                    </AlertDescription>
                </Alert>
                <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                    Generate Monthly Update
                </Button>
            </div>
            <div className="space-y-6">
                <h3 className="text-lg font-semibold text-primary">2. Copy or Share</h3>
                <div className="relative">
                    <ScrollArea className="h-96 w-full rounded-md border">
                        <Textarea
                            readOnly
                            value={generatedMessage}
                            placeholder="Your generated monthly update will appear here..."
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
