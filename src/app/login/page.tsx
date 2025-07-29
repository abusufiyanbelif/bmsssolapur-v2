
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
              <div className="flex gap-2">
                 <Select defaultValue="+91">
                    <SelectTrigger className="w-[80px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="+91">+91 (IN)</SelectItem>
                    </SelectContent>
                </Select>
                <Input id="phone" type="tel" placeholder="12345 67890" maxLength={10} required />
              </div>
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
