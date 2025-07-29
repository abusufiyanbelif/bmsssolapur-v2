
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
import { User, Shield, HandHeart, UserCog, LucideIcon, CheckCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

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
    requiredRole?: string | null;
}

export function RoleSwitcherDialog({ open, onOpenChange, availableRoles, onRoleChange, currentUserRole, requiredRole }: RoleSwitcherDialogProps) {
  const [selectedRole, setSelectedRole] = useState<string | null>(currentUserRole);
  
  useEffect(() => {
    setSelectedRole(requiredRole || currentUserRole);
  }, [requiredRole, currentUserRole, open]);


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
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => {
          // Prevent closing if a specific role is required
          if(requiredRole) {
              e.preventDefault();
          }
      }}>
        <DialogHeader>
          <DialogTitle>Switch Your Profile</DialogTitle>
          <DialogDescription>
            {requiredRole 
                ? `This action requires the "${requiredRole}" profile.`
                : "You have multiple roles. Choose which profile you want to use for this session."
            }
          </DialogDescription>
        </DialogHeader>

        {requiredRole && (
             <Alert variant="default" className="border-amber-500/50 text-amber-900 dark:text-amber-300">
                <AlertTriangle className="h-4 w-4 !text-amber-500" />
                <AlertTitle>Privilege Required</AlertTitle>
                <AlertDescription>
                   Please switch to the <span className='font-semibold'>{requiredRole}</span> role to continue.
                </AlertDescription>
            </Alert>
        )}

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
