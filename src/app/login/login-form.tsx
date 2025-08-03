
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { KeyRound, LogIn, MessageSquare, Loader2, CheckCircle, User, Mail, Phone } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { handleLogin, handleSendOtp, handleVerifyOtp, handleGoogleLogin } from "./actions";
import { auth } from "@/services/firebase";
import { GoogleAuthProvider, signInWithPopup, User as FirebaseUser } from "firebase/auth";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
        <path fill="#4285F4" d="M21.35 11.1h-9.2v2.8h5.3c-.2 1.9-1.6 3.3-3.5 3.3-2.1 0-3.8-1.7-3.8-3.8s1.7-3.8 3.8-3.8c1.1 0 2.1.4 2.8 1.1l2.1-2.1C16.5 4.7 14.4 4 12 4c-4.4 0-8 3.6-8 8s3.6 8 8 8c4.1 0 7.5-3.1 7.8-7.2-1.3-.9-2.2-2.3-2.45-3.7z"/>
    </svg>
);

export function LoginForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOtpSending, setIsOtpSending] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpPhoneNumber, setOtpPhoneNumber] = useState("");
  const [loginMethod, setLoginMethod] = useState<'username' | 'email' | 'phone'>('username');
  const [loginSuccessData, setLoginSuccessData] = useState<{userId?: string} | null>(null);

  useEffect(() => {
    if (loginSuccessData?.userId) {
      toast({
        variant: "success",
        title: "Login Successful",
        description: "Welcome back! Redirecting you...",
        icon: <CheckCircle />,
      });
      // Clear any previous role selection
      localStorage.removeItem('activeRole'); 
      localStorage.setItem('userId', loginSuccessData.userId);
      // Set a flag to show the role switcher on the next page load
      localStorage.setItem('showRoleSwitcher', 'true');
      
      const redirectPath = sessionStorage.getItem('redirectAfterLogin');
      sessionStorage.removeItem('redirectAfterLogin'); // Clean up the stored path

      // Use a standard redirect to avoid router issues in this context
      window.location.href = redirectPath || '/home';
    }
  }, [loginSuccessData, toast]);

  const onPasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    formData.append('loginMethod', loginMethod);

    const result = await handleLogin(formData);

    if (result.success) {
      setLoginSuccessData({userId: result.userId});
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
      
      if (result.success) {
          toast({ 
            variant: "success",
            title: "OTP Sent", 
            description: "An OTP has been sent to your phone.",
            icon: <CheckCircle />
          });
          setIsOtpSent(true);
      } else {
          toast({ variant: "destructive", title: "Failed to Send OTP", description: result.error });
      }

      setIsOtpSending(false);
  }

  const onVerifyOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setIsSubmitting(true);
      const formData = new FormData(event.currentTarget);
      formData.append('phone', otpPhoneNumber);
      
      const result = await handleVerifyOtp(formData);

       if (result.success) {
            setLoginSuccessData({userId: result.userId});
        } else {
            toast({
                variant: "destructive",
                title: "Login Failed",
                description: result.error || "An unknown error occurred.",
            });
        }
      
      setIsSubmitting(false);
  }
  
  const onGoogleSignIn = async () => {
    setIsSubmitting(true);
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const firebaseUser = result.user;

        const serverResult = await handleGoogleLogin(firebaseUser);
        
        if(serverResult.success && serverResult.userId) {
            setLoginSuccessData({userId: serverResult.userId});
        } else {
             toast({
                variant: "destructive",
                title: "Login Failed",
                description: serverResult.error || "An unknown error occurred.",
            });
        }
    } catch(error: any) {
        toast({
            variant: "destructive",
            title: "Google Sign-In Error",
            description: error.message || "Failed to sign in with Google.",
        });
    } finally {
        setIsSubmitting(false);
    }
  }


  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Login / Register</CardTitle>
          <CardDescription>
            Choose your preferred method to access your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="password" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="otp">
                <MessageSquare className="mr-2" />
                OTP
              </TabsTrigger>
              <TabsTrigger value="password">
                <KeyRound className="mr-2" />
                Password
              </TabsTrigger>
            </TabsList>
            <TabsContent value="otp">
                <form className="space-y-6 pt-4" onSubmit={onVerifyOtpSubmit}>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number (10 digits)</Label>
                      <Input id="phone" name="phone" type="tel" placeholder="9876543210" maxLength={10} required disabled={isOtpSent || isOtpSending} />
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
                    <div className="space-y-4">
                        <Label>Login Method</Label>
                        <RadioGroup defaultValue="username" onValueChange={(value) => setLoginMethod(value as any)} className="grid grid-cols-3 gap-2">
                            <Label htmlFor="method-username" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                <RadioGroupItem value="username" id="method-username" className="sr-only" />
                                <User className="mb-2"/>
                                Username
                            </Label>
                             <Label htmlFor="method-email" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                <RadioGroupItem value="email" id="method-email" className="sr-only" />
                                <Mail className="mb-2"/>
                                Email
                            </Label>
                             <Label htmlFor="method-phone" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                <RadioGroupItem value="phone" id="method-phone" className="sr-only" />
                                <Phone className="mb-2"/>
                                Phone
                            </Label>
                        </RadioGroup>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="identifier">{
                        loginMethod === 'username' ? 'Username' :
                        loginMethod === 'email' ? 'Email Address' : 'Phone Number (10 digits)'
                      }</Label>
                      <Input 
                        id="identifier" 
                        name="identifier" 
                        type={loginMethod === 'email' ? 'email' : loginMethod === 'phone' ? 'tel' : 'text'}
                        placeholder={
                            loginMethod === 'username' ? 'e.g., Abusufiyan Belif' :
                            loginMethod === 'email' ? 'user@example.com' : '9876543210'
                        }
                        required 
                        maxLength={loginMethod === 'phone' ? 10 : undefined}
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
        <CardFooter className="flex-col gap-4">
            <div className="relative w-full">
                <Separator />
                <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-card px-2 text-xs text-muted-foreground">OR</span>
            </div>
            <Button variant="outline" className="w-full" onClick={onGoogleSignIn} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
                Sign in with Google
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
