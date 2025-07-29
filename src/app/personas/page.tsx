import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

const personas = [
  { name: "Friendly Assistant", description: "A helpful and cheerful assistant for general user interactions.", isDefault: true },
  { name: "Formal Correspondent", description: "A professional and formal persona for official email communications.", isDefault: false },
  { name: "Creative Writer", description: "A creative persona for generating engaging content and marketing materials.", isDefault: false },
];

export default function PersonaManagementPage() {
  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight font-headline">AI Persona Management</h2>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Persona
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Manage Personas</CardTitle>
          <CardDescription>
            Define and manage the AI personas used throughout the application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {personas.map((persona) => (
              <Card key={persona.name}>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{persona.name}</CardTitle>
                    <CardDescription className="mt-1">{persona.description}</CardDescription>
                  </div>
                   <div className="flex items-center gap-2">
                    {persona.isDefault && (
                      <span className="text-xs font-semibold text-primary">(Default)</span>
                    )}
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
