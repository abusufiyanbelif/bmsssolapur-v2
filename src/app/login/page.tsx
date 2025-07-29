
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Login / Register</CardTitle>
          <CardDescription>
            Enter your phone number to receive a one-time password (OTP).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" placeholder="+91 12345 67890" required />
            </div>
             <div className="space-y-2">
              <Label htmlFor="otp">One-Time Password (OTP)</Label>
              <Input id="otp" type="text" placeholder="Enter your OTP" />
            </div>
            <Button type="submit" className="w-full">
                <LogIn className="mr-2 h-4 w-4" />
                Login with OTP
            </Button>
            <div className="text-center">
                 <Button variant="link" size="sm" type="button">Send OTP</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
