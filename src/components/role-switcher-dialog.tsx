
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

interface RoleSwitcherDialogProps extends DialogProps {
    availableRoles: string[];
    onRoleChange: (newRole: string) => void;
}

export function RoleSwitcherDialog({ open, onOpenChange, availableRoles, onRoleChange }: RoleSwitcherDialogProps) {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const handleContinue = () => {
    if (selectedRole) {
        onRoleChange(selectedRole);
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
            {availableRoles.map(roleName => {
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
