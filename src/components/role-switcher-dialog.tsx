
"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogProps
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { User, Shield, HandHeart, UserCog, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const roleMap: Record<string, { icon: LucideIcon; description: string }> = {
    "Super Admin": {
        icon: Shield,
        description: "Full access to all features and settings."
    },
    "Admin": {
        icon: UserCog,
        description: "Manage leads, donations, and approvals."
    },
    "Donor": {
        icon: HandHeart,
        description: "View campaigns and manage your donations."
    },
    "Beneficiary": {
        icon: User,
        description: "Manage your cases and view their status."
    }
};

interface RoleSwitcherDialogProps extends DialogProps {}

export function RoleSwitcherDialog({ open, onOpenChange }: RoleSwitcherDialogProps) {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  // In a real app, this would come from the user's profile after they log in
  const user = {
    name: "Abusufiyan Belif",
    availableRoles: ["Super Admin", "Admin", "Donor", "Beneficiary"],
  };

  const handleContinue = () => {
    if (selectedRole) {
        // Here you would typically set the role in your app's state/context
        // and navigate the user to the appropriate dashboard.
        console.log(`Continuing as ${selectedRole}`);
        if (onOpenChange) {
            onOpenChange(false);
        }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Select Your Profile</DialogTitle>
          <DialogDescription>
            You have multiple roles. Choose which profile you want to use for this session.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            {user.availableRoles.map(roleName => {
                const roleInfo = roleMap[roleName];
                if (!roleInfo) return null;
                const Icon = roleInfo.icon;
                
                return (
                    <Card 
                        key={roleName}
                        className={cn(
                            "cursor-pointer transition-all hover:shadow-md",
                            selectedRole === roleName && "ring-2 ring-primary shadow-lg"
                        )}
                        onClick={() => setSelectedRole(roleName)}
                    >
                        <CardContent className="p-4 flex items-center gap-4">
                            <Icon className="h-8 w-8 text-primary" />
                            <div>
                                <h3 className="font-semibold">{roleName}</h3>
                                <p className="text-sm text-muted-foreground">{roleInfo.description}</p>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
        <DialogFooter>
            <Button onClick={handleContinue} disabled={!selectedRole} className="w-full">
                Continue as {selectedRole || '...'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
