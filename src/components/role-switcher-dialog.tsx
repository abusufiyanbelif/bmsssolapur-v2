
"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { User, Shield, HandHeart } from 'lucide-react';
import { cn } from '@/lib/utils';

const roles = [
    {
        name: "Super Admin",
        icon: Shield,
        description: "Full access to all features and settings."
    },
    {
        name: "Donor",
        icon: HandHeart,
        description: "View campaigns and manage your donations."
    },
    {
        name: "Beneficiary",
        icon: User,
        description: "Manage your cases and view their status."
    }
]

export function RoleSwitcherDialog() {
  const [isOpen, setIsOpen] = useState(true); // Default to open for demonstration
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  // In a real app, this would come from the user's profile
  const availableRoles = ["Super Admin", "Donor", "Beneficiary"]; 

  const handleSelectRole = () => {
    if (selectedRole) {
        // Here you would typically set the role in your app's state/context
        // and navigate the user to the appropriate dashboard.
        console.log(`Selected role: ${selectedRole}`);
        setIsOpen(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Select Your Profile</DialogTitle>
          <DialogDescription>
            Choose which profile you want to use for this session.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            {roles.filter(r => availableRoles.includes(r.name)).map(role => (
                <Card 
                    key={role.name}
                    className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        selectedRole === role.name && "ring-2 ring-primary shadow-lg"
                    )}
                    onClick={() => setSelectedRole(role.name)}
                >
                    <CardContent className="p-4 flex items-center gap-4">
                        <role.icon className="h-8 w-8 text-primary" />
                        <div>
                            <h3 className="font-semibold">{role.name}</h3>
                            <p className="text-sm text-muted-foreground">{role.description}</p>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
        <DialogFooter>
            <Button onClick={handleSelectRole} disabled={!selectedRole} className="w-full">
                Continue as {selectedRole || '...'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
