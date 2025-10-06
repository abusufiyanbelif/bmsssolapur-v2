
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { KeyRound, LogIn, MessageSquare, Loader2, CheckCircle, User, Mail, Phone, UserPlus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { handleLogin, handleSendOtp, handleVerifyOtp, handleGoogleLogin, handleFirebaseOtpLogin } from "./actions";
import { auth } from "@/services/firebase";
import { GoogleAuthProvider, signInWithPopup, User as FirebaseUser, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Link from "next/link";
import { useRouter } from 'next/navigation';


export function LoginForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOtpSending, setIsOtpSending] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpPhoneNumber, setOtpPhoneNumber] = useState("");
  const [loginSuccessData, setLoginSuccessData] = useState<{userId?: string, redirectTo?: string} | null>(null);
  const [otpProvider, setOtpProvider] = useState<'firebase' | 'twilio' | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  useEffect(() => {
    // This is to ensure the reCAPTCHA verifier is only initialized once.
    if (typeof window !== 'undefined' && !window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
      });
    }
  }, []);

  useEffect(() => {
    if (loginSuccessData?.userId && loginSuccessData?.redirectTo) {
      toast({
        variant: "success",
        title: "Login Successful",
        description: "Welcome! Redirecting you...",
        icon: <CheckCircle />,
      });
      // Clear any previous role selection
      localStorage.removeItem('activeRole'); 
      localStorage.setItem('userId', loginSuccessData.userId);
      // Set a flag to show the role switcher on the next page load
      localStorage.setItem('showRoleSwitcher', 'true');
      
      const redirectPath = sessionStorage.getItem('redirectAfterLogin') || loginSuccessData.redirectTo;
      sessionStorage.removeItem('redirectAfterLogin'); // Clean up the stored path

      // Dispatch a custom event to notify AppShell that login was successful
      window.dispatchEvent(new CustomEvent('loginSuccess'));

      router.push(redirectPath);
    }
  }, [loginSuccessData, toast, router]);

  const onPasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);

    const result = await handleLogin(formData);

    if (result.success) {
      setLoginSuccessData({userId: result.userId, redirectTo: result.redirectTo});
    } else {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: result.error || "An unknown error occurred.",
      });
    }
    setIsSubmitting(false);
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
      
      if (result.success) {
          if (result.provider === 'firebase') {
             try {
                const fullPhoneNumber = `+91${phoneNumber}`;
                const confirmation = await signInWithPhoneNumber(auth, fullPhoneNumber, window.recaptchaVerifier);
                setConfirmationResult(confirmation);
                setIsOtpSent(true);
                toast({ variant: "success", title: "OTP Sent", description: "An OTP has been sent to your phone via Firebase."});
            } catch (error) {
                console.error("Firebase signInWithPhoneNumber error:", error);
                toast({ variant: "destructive", title: "Firebase Error", description: "Could not send OTP via Firebase. Please check console." });
            }
          } else { // Twilio
            toast({ 
              variant: "success",
              title: "OTP Sent", 
              description: "An OTP has been sent to your phone.",
              icon: <CheckCircle />
            });
            setIsOtpSent(true);
          }
      } else {
          toast({ variant: "destructive", title: "Failed to Send OTP", description: result.error });
      }

      setIsOtpSending(false);
  }

  const onVerifyOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setIsSubmitting(true);

      const formData = new FormData(event.currentTarget);
      const code = formData.get('otp') as string;
      
      if (otpProvider === 'firebase' && confirmationResult) {
          try {
              const result = await confirmationResult.confirm(code);
              const user = result.user;
              // Now we need to get our app-specific user ID
              const loginResult = await handleFirebaseOtpLogin(user.uid, user.phoneNumber);
              if (loginResult.success) {
                  setLoginSuccessData({ userId: loginResult.userId, redirectTo: loginResult.redirectTo });
              } else {
                  toast({ variant: "destructive", title: "Login Failed", description: loginResult.error });
              }
          } catch(error) {
               toast({ variant: "destructive", title: "Firebase OTP Verification Failed", description: "The code you entered was incorrect. Please try again." });
          }
      } else if (otpProvider === 'twilio') {
          formData.append('phone', otpPhoneNumber);
          const result = await handleVerifyOtp(formData);
          if (result.success) {
            setLoginSuccessData({userId: result.userId, redirectTo: result.redirectTo});
          } else {
            toast({ variant: "destructive", title: "OTP Login Failed", description: result.error || "An unknown error occurred." });
          }
      }
      
      setIsSubmitting(false);
  }
  
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
          <Tabs defaultValue="password" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="password"><KeyRound className="mr-2" />Password</TabsTrigger>
              <TabsTrigger value="otp"><MessageSquare className="mr-2" />OTP</TabsTrigger>
            </TabsList>

            <TabsContent value="otp">
                <form className="space-y-6 pt-4" onSubmit={onVerifyOtpSubmit}>
                    <div id="recaptcha-container"></div>
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
                      <Label htmlFor="identifier">User ID, Email, or Phone</Label>
                      <Input 
                        id="identifier" 
                        name="identifier" 
                        type="text"
                        placeholder="e.g., john.doe or user@example.com"
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input id="password" name="password" type="password" required />
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <LogIn className="mr-2 h-4 w-4" />
                        )}
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
                    <Link href="/register">
                         Register Now
                    </Link>
                </Button>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}

// Add a declaration for the reCAPTCHA verifier on the window object
declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
  }
}
