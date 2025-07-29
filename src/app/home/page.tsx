
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, HandHeart, FileText } from "lucide-react";

export default function UserHomePage() {
  // In a real app, user data would come from an auth context
  const user = {
    name: "Aisha Khan",
    activeRole: "Donor", // This could be 'Donor' or 'Beneficiary'
  };

  return (
    <div className="flex-1 space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline">Welcome, {user.name}!</h2>
        <p className="text-muted-foreground">
          You are currently viewing the dashboard as a <span className="font-semibold text-primary">{user.activeRole}</span>.
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Card for Donors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HandHeart className="text-primary" />
              My Donations
            </CardTitle>
            <CardDescription>
              View your donation history and download receipts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/my-donations">
                View My Donations <ArrowRight className="ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Card for Beneficiaries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="text-primary" />
              My Cases
            </CardTitle>
            <CardDescription>
              Track the status of your help requests and upload documents.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/my-cases">
                View My Cases <ArrowRight className="ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
