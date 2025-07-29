
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { KeyRound, LogIn, MessageSquare, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { handleLogin, handleSendOtp, handleVerifyOtp } from "./actions";
import { useRouter } from "next/navigation";


export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOtpSending, setIsOtpSending] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpPhoneNumber, setOtpPhoneNumber] = useState("");

  const onSuccessfulLogin = (userId: string) => {
    toast({
      title: "Login Successful",
      description: "Welcome back! Please select your role to continue.",
    });
    // Clear any previous role selection
    localStorage.removeItem('activeRole'); 
    localStorage.setItem('userId', userId);
    
    // Use router to navigate, letting app-shell handle the role switching logic
    router.push('/home'); 
    router.refresh(); // force a refresh to re-trigger the effect in app-shell
  }

  const onPasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const result = await handleLogin(formData);

    if (result.success && result.userId) {
      onSuccessfulLogin(result.userId);
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
      const phoneInput = (event.currentTarget.form?.elements.namedItem('phone-otp') as HTMLInputElement);
      const phoneNumber = phoneInput?.value;

      if (!phoneNumber || phoneNumber.length !== 10) {
          toast({ variant: "destructive", title: "Invalid Phone Number", description: "Please enter a valid 10-digit phone number." });
          return;
      }
      
      setOtpPhoneNumber(phoneNumber);
      setIsOtpSending(true);

      const result = await handleSendOtp(phoneNumber);
      
      if (result.success) {
          toast({ title: "OTP Sent", description: "An OTP has been sent to your phone." });
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

       if (result.success && result.userId) {
            onSuccessfulLogin(result.userId);
        } else {
            toast({
                variant: "destructive",
                title: "Login Failed",
                description: result.error || "An unknown error occurred.",
            });
        }
      
      setIsSubmitting(false);
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
                    <Label htmlFor="phone-otp">Phone Number (10 digits)</Label>
                    <div className="flex gap-2">
                        <Input id="phone-otp" name="phone-otp" type="tel" placeholder="9876543210" maxLength={10} required disabled={isOtpSent || isOtpSending} />
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
                      <Label htmlFor="phone-password">Phone Number (10 digits)</Label>
                      <Input id="phone-password" name="phone" type="tel" placeholder="9876543210" maxLength={10} required defaultValue="7887646583" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input id="password" name="password" type="password" placeholder="Enter your password" required defaultValue="admin" />
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <LogIn className="mr-2 h-4 w-4" />
                        )}
                        Login with Password
                    </Button>
                     <div className="text-center">
                        <Button variant="link" size="sm" type="button" onClick={() => toast({ title: "In Progress", description: "This feature is currently in development and will be available soon."})}>Forgot Password?</Button>
                    </div>
                </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
