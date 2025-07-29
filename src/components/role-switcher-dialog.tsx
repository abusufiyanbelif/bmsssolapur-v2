
"use client";

import { useState, useEffect } from 'react';
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
import { User, Shield, HandHeart, UserCog, LucideIcon, CheckCircle } from 'lucide-react';
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
    currentUserRole: string;
}

export function RoleSwitcherDialog({ open, onOpenChange, availableRoles, onRoleChange, currentUserRole }: RoleSwitcherDialogProps) {
  const [selectedRole, setSelectedRole] = useState<string | null>(currentUserRole);
  
  useEffect(() => {
    setSelectedRole(currentUserRole);
  }, [currentUserRole, open]);


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
          <DialogTitle>Switch Your Profile</DialogTitle>
          <DialogDescription>
            You have multiple roles. Choose which profile you want to use for this session.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            {availableRoles.map(roleName => {
                const roleInfo = roleMap[roleName];
                if (!roleInfo) return null;
                const Icon = roleInfo.icon;
                const isSelected = selectedRole === roleName;
                
                return (
                    <Card 
                        key={roleName}
                        className={cn(
                            "cursor-pointer transition-all hover:shadow-md relative",
                            isSelected && "ring-2 ring-primary shadow-lg"
                        )}
                        onClick={() => setSelectedRole(roleName)}
                    >
                        {isSelected && (
                            <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                                <CheckCircle className="h-4 w-4" />
                            </div>
                        )}
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
            <Button onClick={handleContinue} disabled={!selectedRole || selectedRole === currentUserRole} className="w-full">
                Continue as {selectedRole || '...'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
