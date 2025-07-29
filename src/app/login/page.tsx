
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { KeyRound, LogIn, MessageSquare } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const { toast } = useToast();

  const handleFeatureInProgress = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // Prevent form submission
    toast({
        title: "In Progress",
        description: "This feature is currently in development and will be available soon.",
    });
  };

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
          <Tabs defaultValue="otp" className="w-full">
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
                <form className="space-y-6 pt-4">
                    <div className="space-y-2">
                    <Label htmlFor="phone-otp">Phone Number</Label>
                    <div className="flex gap-2">
                        <Select defaultValue="+91">
                            <SelectTrigger className="w-[80px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="+91">+91 (IN)</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input id="phone-otp" type="tel" placeholder="12345 67890" maxLength={10} required />
                    </div>
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="otp">One-Time Password (OTP)</Label>
                    <Input id="otp" type="text" placeholder="Enter your OTP" />
                    </div>
                    <Button type="submit" className="w-full" onClick={handleFeatureInProgress}>
                        <LogIn className="mr-2 h-4 w-4" />
                        Login with OTP
                    </Button>
                    <div className="text-center">
                        <Button variant="link" size="sm" type="button" onClick={handleFeatureInProgress}>Send OTP</Button>
                    </div>
                </form>
            </TabsContent>
            <TabsContent value="password">
                 <form className="space-y-6 pt-4">
                    <div className="space-y-2">
                    <Label htmlFor="phone-password">Phone Number</Label>
                    <div className="flex gap-2">
                        <Select defaultValue="+91">
                            <SelectTrigger className="w-[80px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="+91">+91 (IN)</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input id="phone-password" type="tel" placeholder="12345 67890" maxLength={10} required />
                    </div>
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" placeholder="Enter your password" />
                    </div>
                    <Button type="submit" className="w-full" onClick={handleFeatureInProgress}>
                        <LogIn className="mr-2 h-4 w-4" />
                        Login with Password
                    </Button>
                     <div className="text-center">
                        <Button variant="link" size="sm" type="button" onClick={handleFeatureInProgress}>Forgot Password?</Button>
                    </div>
                </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
