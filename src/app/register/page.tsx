
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <Card className="w-full max-w-lg">
                <CardHeader className="text-center">
                    <CardTitle>Create an Account</CardTitle>
                    <CardDescription>
                        Join our community of donors and make a difference today.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <RegisterForm />
                </CardContent>
            </Card>
        </div>
    );
}
