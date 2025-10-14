// src/app/login/page.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { KeyRound, LogIn, MessageSquare, Loader2, CheckCircle, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useCallback, useRef } from "react";
import { handleLogin, handleSendOtp, handleVerifyOtp } from "./actions";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { getAppSettings } from "@/app/admin/settings/actions";
import type { AppSettings } from "@/services/types";

export default function LoginPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOtpSending, setIsOtpSending] = useState(false);
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [otpPhoneNumber, setOtpPhoneNumber] = useState("");
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [loadingSettings, setLoadingSettings] = useState(true);

    const handleLoginSuccess = (userId: string) => {
        localStorage.setItem('userId', userId);
        localStorage.setItem('showRoleSwitcher', 'true');
        // Force a full page reload to ensure the AppShell re-initializes with the new session
        window.location.href = '/home';
    };
    
    useEffect(() => {
        getAppSettings().then(s => {
        setSettings(s);
        setLoadingSettings(false);
        });
    }, []);

    const onPasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(event.currentTarget);
        const result = await handleLogin(formData);

        if (result.success && result.userId) {
            handleLoginSuccess(result.userId);
        } else {
            toast({
                variant: "destructive",
                title: "Login Failed",
                description: result.error || "An unknown error occurred.",
            });
            setIsSubmitting(false);
        }
    };
    
    const onSendOtp = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        const phoneInput = (event.currentTarget.form?.elements.namedItem('phone') as HTMLInputElement);
        const phoneNumber = phoneInput?.value;

        if (!phoneNumber || !/^[0-9]{10}$/.test(phoneNumber)) {
            toast({ variant: "destructive", title: "Invalid Phone Number", description: "Please enter a valid 10-digit phone number." });
            return;
        }
        
        setOtpPhoneNumber(phoneNumber);
        setIsOtpSending(true);

        const result = await handleSendOtp(phoneNumber);
        
        if (result.success) {
            setIsOtpSent(true);
            toast({ variant: "success", title: "OTP Sent", description: `An OTP has been sent to your phone via ${result.provider}.`});
        } else {
            toast({ variant: "destructive", title: "Failed to Send OTP", description: result.error });
        }

        setIsOtpSending(false);
    }

    const onVerifyOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(event.currentTarget);
        const result = await handleVerifyOtp(formData);
        if (result.success && result.userId) {
            handleLoginSuccess(result.userId);
        } else {
             toast({ variant: "destructive", title: "OTP Verification Failed", description: result.error });
             setIsSubmitting(false);
        }
    }
    
    if (loadingSettings) {
        return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    const isPasswordLoginEnabled = settings?.loginMethods.password.enabled ?? true;
    const isOtpLoginEnabled = settings?.loginMethods.otp.enabled ?? true;
    const loginMethodsCount = [isPasswordLoginEnabled, isOtpLoginEnabled].filter(Boolean).length;
    const defaultTab = isPasswordLoginEnabled ? 'password' : 'otp';

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <Card className="w-full max-w-sm">
            <CardHeader className="text-center">
                <CardTitle className="text-primary">Account Login</CardTitle>
                <CardDescription>
                Choose your preferred method to access your account.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue={defaultTab} className="w-full">
                {loginMethodsCount > 1 && (
                    <TabsList className={`grid w-full grid-cols-${loginMethodsCount}`}>
                        {isPasswordLoginEnabled && <TabsTrigger value="password"><KeyRound className="mr-2" />User ID</TabsTrigger>}
                        {isOtpLoginEnabled && <TabsTrigger value="otp"><MessageSquare className="mr-2" />OTP</TabsTrigger>}
                    </TabsList>
                )}
                {isOtpLoginEnabled && (
                    <TabsContent value="otp">
                    <form className="space-y-6 pt-4" onSubmit={onVerifyOtpSubmit}>
                        <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <div className="flex items-center">
                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-background text-muted-foreground sm:text-sm h-10">
                                +91
                            </span>
                            <Input id="phone" name="phone" type="tel" placeholder="9876543210" maxLength={10} required disabled={isOtpSent || isOtpSending} className="rounded-l-none" />
                        </div>
                        </div>
                        {isOtpSent && (
                        <div className="space-y-2">
                            <Label htmlFor="otp">One-Time Password (OTP)</Label>
                            <Input id="otp" name="otp" type="text" placeholder="Enter your OTP" required />
                        </div>
                        )}
                        {!isOtpSent ? (
                        <Button type="button" className="w-full" onClick={onSendOtp} disabled={isOtpSending}>
                            {isOtpSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageSquare className="mr-2 h-4 w-4" />}
                            Send OTP
                        </Button>
                        ) : (
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                            Login with OTP
                        </Button>
                        )}
                    </form>
                    </TabsContent>
                )}
                {isPasswordLoginEnabled && (
                    <TabsContent value="password">
                    <form className="space-y-6 pt-4" onSubmit={onPasswordSubmit}>
                        <div className="space-y-2">
                        <Label htmlFor="identifier">User ID / Phone / Email</Label>
                        <Input id="identifier" name="identifier" type="text" placeholder="e.g., abusufiyan.belif or admin" required />
                        </div>
                        <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" name="password" type="password" required />
                        </div>
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? (<Loader2 className="mr-2 h-4 w-4 animate-spin" />) : (<LogIn className="mr-2 h-4 w-4" />)}
                        Login
                        </Button>
                    </form>
                    </TabsContent>
                )}
                </Tabs>
            </CardContent>
            <CardFooter className="flex-col gap-4 pt-6">
                <Separator />
                <div className="text-center text-sm text-muted-foreground">
                <p>Don&apos;t have an account?</p>
                <Button variant="link" asChild className="text-accent text-base">
                    <Link href="/register">Register Now</Link>
                </Button>
                </div>
            </CardFooter>
            </Card>
        </div>
    );
}
