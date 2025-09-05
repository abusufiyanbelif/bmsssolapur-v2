
"use client";

import { useFormState, useFormStatus } from "react-dom";
import { handleValidation } from "./actions";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Loader2, AlertTriangle, KeySquare } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";

const initialState = {
  isValid: false,
  errors: [],
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full md:w-auto">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AlertTriangle className="mr-2 h-4 w-4" />}
      Validate Configuration
    </Button>
  );
}

const firebasePlaceholder = `{
  "apiKey": "AIzaSy..._...tA",
  "authDomain": "your-project-id.firebaseapp.com",
  "projectId": "your-project-id",
  "storageBucket": "your-project-id.appspot.com",
  "messagingSenderId": "1234567890",
  "appId": "1:1234567890:web:abcdef123456"
}`;

const externalServicesPlaceholder = `{
  "twilio": {
    "accountSid": "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "authToken": "your_auth_token"
  },
  "nodemailer": {
    "service": "gmail",
    "auth": {
      "user": "your-email@gmail.com",
      "pass": "your-password"
    }
  }
}`;

export function ValidatorForm() {
  const [state, formAction] = useFormState(handleValidation, initialState);

  return (
    <form action={formAction} className="space-y-8">
      <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
        <div className="flex items-center gap-2">
            <KeySquare className="h-5 w-5 text-primary" />
            <Label htmlFor="geminiApiKey" className="font-semibold text-base">Gemini API Key (Optional for Testing)</Label>
        </div>
        <p className="text-sm text-muted-foreground">
          If you provide an API key here, the validator will attempt a live connection test with it. This overrides the server-configured key for this one test.
        </p>
        <Input
            id="geminiApiKey"
            name="geminiApiKey"
            type="password"
            placeholder="Paste your Gemini API key here to test it..."
            className="font-mono text-xs bg-background"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="firebaseConfig" className="font-semibold">Firebase Configuration (JSON)</Label>
          <Textarea
            id="firebaseConfig"
            name="firebaseConfig"
            rows={12}
            placeholder={firebasePlaceholder}
            className="font-mono text-xs"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="externalServiceConfigs" className="font-semibold">External Services (JSON)</Label>
          <Textarea
            id="externalServiceConfigs"
            name="externalServiceConfigs"
            rows={12}
            placeholder={externalServicesPlaceholder}
            className="font-mono text-xs"
            required
          />
        </div>
      </div>
      
      <SubmitButton />

      {state && (state.errors.length > 0 || state.isValid) && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {state.isValid ? (
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              ) : (
                <AlertCircle className="h-6 w-6 text-destructive" />
              )}
              Validation Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            {state.isValid ? (
              <Alert variant="default" className="border-green-300 bg-green-50 text-green-800">
                <CheckCircle2 className="h-4 w-4 !text-green-600" />
                <AlertTitle>Configuration Valid!</AlertTitle>
                <AlertDescription>
                  No potential misconfigurations or security vulnerabilities found.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Issues Found!</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-5 space-y-1 mt-2">
                    {state.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </form>
  );
}
