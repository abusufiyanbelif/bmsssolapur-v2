
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppSettings } from "@/services/app-settings-service";
import { PaymentGatewayForm } from "./payment-gateway-form";
import { CreditCard } from "lucide-react";

export default async function PaymentGatewaySettingsPage() {
    const settings = await getAppSettings();

    return (
        <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Payment Gateway Settings</h2>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard />
                        Manage Payment Gateways
                    </CardTitle>
                    <CardDescription>
                        Configure credentials and enable or disable live payment gateways like Razorpay and PhonePe.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                   <PaymentGatewayForm settings={settings.paymentGateway} />
                </CardContent>
            </Card>
        </div>
    );
}
