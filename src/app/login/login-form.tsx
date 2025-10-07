
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { KeyRound, LogIn, MessageSquare, Loader2, CheckCircle, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useCallback } from "react";
import { handleLogin, handleSendOtp, handleVerifyOtp, handleFirebaseOtpLogin } from "./actions";
import { auth } from "@/services/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
    confirmationResult: ConfirmationResult;
  }
}

export function LoginForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOtpSending, setIsOtpSending] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpPhoneNumber, setOtpPhoneNumber] = useState("");
  const [otpProvider, setOtpProvider] = useState<'firebase' | 'twilio' | null>(null);

  const handleLoginSuccess = (userId: string) => {
    toast({
      variant: "success",
      title: "Login Successful",
      description: "Welcome! Redirecting you...",
      icon: <CheckCircle />,
    });
    
    // Key change: Save userId and set a flag to show the role switcher.
    localStorage.setItem('userId', userId);
    localStorage.setItem('showRoleSwitcher', 'true');
    
    // Key change: Use a hard redirect to ensure AppShell re-initializes.
    window.location.href = '/home';
  };
  
  const initializeRecaptcha = useCallback(() => {
    if (typeof window !== 'undefined' && auth && !window.recaptchaVerifier?.['id']) {
      const recaptchaContainer = document.getElementById('recaptcha-container');
      if (recaptchaContainer) {
        try {
          window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainer, {
            'size': 'invisible',
            'callback': () => {},
          });
          window.recaptchaVerifier.render();
        } catch (error) {
          console.error("Error creating RecaptchaVerifier:", error);
        }
      }
    }
  }, []);

  useEffect(() => {
    initializeRecaptcha();
  }, [initializeRecaptcha]);

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
    setOtpProvider(result.provider || null);
    
    if (result.success && result.provider === 'firebase') {
      try {
        if (!window.recaptchaVerifier) {
          initializeRecaptcha();
        }
        const fullPhoneNumber = `+91${phoneNumber}`;
        const confirmation = await signInWithPhoneNumber(auth, fullPhoneNumber, window.recaptchaVerifier);
        window.confirmationResult = confirmation;
        setIsOtpSent(true);
        toast({ variant: "success", title: "OTP Sent", description: "An OTP has been sent to your phone via Firebase."});
      } catch (error) {
        console.error("Firebase signInWithPhoneNumber error:", error);
        toast({ variant: "destructive", title: "Firebase Error", description: "Could not send OTP. Please ensure this app's domain is authorized in the Firebase console for phone authentication." });
        if(window.recaptchaVerifier) {
            window.recaptchaVerifier.clear();
            initializeRecaptcha();
        }
      }
    } else if (!result.success) {
      toast({ variant: "destructive", title: "Failed to Send OTP", description: result.error });
    }

    setIsOtpSending(false);
  }

  const onVerifyOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const code = formData.get('otp') as string;
    
    if (otpProvider === 'firebase' && window.confirmationResult) {
      try {
        const result = await window.confirmationResult.confirm(code);
        const user = result.user;
        const loginResult = await handleFirebaseOtpLogin(user.uid, user.phoneNumber);
        if (loginResult.success && loginResult.userId) {
          handleLoginSuccess(loginResult.userId);
        } else {
          toast({ variant: "destructive", title: "Login Finalization Failed", description: loginResult.error });
          setIsSubmitting(false);
        }
      } catch(error) {
        toast({ variant: "destructive", title: "Firebase OTP Verification Failed", description: "The code you entered was incorrect or has expired. Please try again." });
        setIsSubmitting(false);
      }
    } else {
      toast({ variant: "destructive", title: "OTP Error", description: "Could not verify OTP. Please try sending a new one." });
      setIsSubmitting(false);
    }
  }
  
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <div id="recaptcha-container"></div>
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-primary">Account Login</CardTitle>
          <CardDescription>
            Choose your preferred method to access your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="password" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="password"><KeyRound className="mr-2" />User ID</TabsTrigger>
              <TabsTrigger value="otp"><MessageSquare className="mr-2" />OTP</TabsTrigger>
            </TabsList>
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
            <TabsContent value="password">
              <form className="space-y-6 pt-4" onSubmit={onPasswordSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="identifier">User ID</Label>
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
          </Tabs>
        </CardContent>
        <CardFooter className="flex-col gap-4 pt-6">
          <Separator />
          <div className="text-center text-sm text-muted-foreground">
            <p>Don't have an account?</p>
            <Button variant="link" asChild className="text-accent text-base">
              <Link href="/register">Register Now</Link>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
