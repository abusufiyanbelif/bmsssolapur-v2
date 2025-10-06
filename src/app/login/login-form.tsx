
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


// Add a declaration for the reCAPTCHA verifier on the window object
declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
  }
}

export function LoginForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOtpSending, setIsOtpSending] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpPhoneNumber, setOtpPhoneNumber] = useState("");
  const [otpProvider, setOtpProvider] = useState<'firebase' | 'twilio' | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const handleLoginSuccess = (userId: string, redirectTo: string) => {
    toast({
      variant: "success",
      title: "Login Successful",
      description: "Welcome! Redirecting you...",
      icon: <CheckCircle />,
    });
    
    // Clear previous role and set the new user ID
    localStorage.removeItem('activeRole'); 
    localStorage.setItem('userId', userId);
    localStorage.setItem('showRoleSwitcher', 'true');
    
    const redirectPath = sessionStorage.getItem('redirectAfterLogin') || redirectTo;
    sessionStorage.removeItem('redirectAfterLogin');

    // Use a full page reload to ensure all state is correctly initialized
    window.location.href = redirectPath;
  };
  
  const initializeRecaptcha = useCallback(() => {
    // This function will only run on the client side
    if (typeof window !== 'undefined') {
        // To avoid re-creating the verifier, we clear the old one if it exists,
        // especially important for dev environments with hot-reloading.
        if (window.recaptchaVerifier) {
            window.recaptchaVerifier.clear();
        }

        const recaptchaContainer = document.getElementById('recaptcha-container');
        if (recaptchaContainer) {
            try {
                window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainer, {
                    'size': 'invisible',
                    'callback': () => {},
                    'expired-callback': () => {
                        console.log("reCAPTCHA expired. Re-initializing...");
                        initializeRecaptcha(); // Re-initialize on expiration
                    }
                });
                window.recaptchaVerifier.render().catch((error) => {
                    console.error("reCAPTCHA render error:", error);
                    toast({
                        variant: "destructive",
                        title: "reCAPTCHA Error",
                        description: "Could not initialize reCAPTCHA. Please refresh the page.",
                    });
                });
            } catch (error) {
                console.error("Error creating RecaptchaVerifier:", error);
            }
        }
    }
  }, [toast]);


  useEffect(() => {
      initializeRecaptcha();
  }, [initializeRecaptcha]);


  const onPasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);

    const result = await handleLogin(formData);

    if (result.success && result.userId && result.redirectTo) {
      handleLoginSuccess(result.userId, result.redirectTo);
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
      
      if (result.success) {
          if (result.provider === 'firebase' && window.recaptchaVerifier) {
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
          } else if (result.provider === 'twilio') {
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
              const loginResult = await handleFirebaseOtpLogin(user.uid, user.phoneNumber);
              if (loginResult.success && loginResult.userId && loginResult.redirectTo) {
                  handleLoginSuccess(loginResult.userId, loginResult.redirectTo);
              } else {
                  toast({ variant: "destructive", title: "Login Failed", description: loginResult.error });
                  setIsSubmitting(false);
              }
          } catch(error) {
               toast({ variant: "destructive", title: "Firebase OTP Verification Failed", description: "The code you entered was incorrect. Please try again." });
               setIsSubmitting(false);
          }
      } else {
          toast({ variant: "destructive", title: "OTP Error", description: "Could not verify OTP. Please try sending a new one." });
          setIsSubmitting(false);
      }
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
              <TabsTrigger value="password"><KeyRound className="mr-2" />User ID</TabsTrigger>
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
                      <Label htmlFor="identifier">User ID</Label>
                      <Input 
                        id="identifier" 
                        name="identifier" 
                        type="text"
                        placeholder="e.g., abusufiyan.belif or admin"
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
