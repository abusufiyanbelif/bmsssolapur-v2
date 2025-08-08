
"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { ShieldCheck, UserCheck, UserX, Clock, Users, CheckCircle } from "lucide-react";
import type { Lead, User } from "@/services/types";
import { useMemo } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


interface VerificationStatusCardProps {
    lead: Lead;
    allApprovers: User[];
}

// User IDs of mandatory approvers
const mandatoryApproverUserIds = ['moosa.shaikh', 'aburehan.bedrekar', 'maaz.shaikh'];


export function VerificationStatusCard({ lead, allApprovers }: VerificationStatusCardProps) {

    const {
        mandatory,
        optional,
        allLeadApprovers,
        approvedCount,
        mandatoryApprovedCount,
        optionalApprovedCount,
        pendingApprovers,
        approvalProgress
    } = useMemo(() => {
        const verifierIds = new Set(lead.verifiers?.map(v => v.verifierId) || []);

        const allLeadApprovers = allApprovers.filter(u => u.groups?.includes('Lead Approver'));
        
        const mandatory = allLeadApprovers.filter(u => mandatoryApproverUserIds.includes(u.userId!));
        const optional = allLeadApprovers.filter(u => !mandatoryApproverUserIds.includes(u.userId!));

        const mandatoryApproved = mandatory.filter(u => verifierIds.has(u.id!));
        const optionalApproved = optional.filter(u => verifierIds.has(u.id!));
        
        const approvedCount = mandatoryApproved.length + optionalApproved.length;
        
        const pendingApprovers = allLeadApprovers.filter(u => !verifierIds.has(u.id!));
        
        const approvalProgress = allLeadApprovers.length > 0 ? (approvedCount / allLeadApprovers.length) * 100 : 0;

        return {
            mandatory,
            optional,
            allLeadApprovers,
            approvedCount,
            mandatoryApprovedCount: mandatoryApproved.length,
            optionalApprovedCount: optionalApproved.length,
            pendingApprovers,
            approvalProgress,
        };
    }, [lead, allApprovers]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ShieldCheck />
                    Verification Status
                </CardTitle>
                <CardDescription>
                    Tracking approvals from the Lead Approver group.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div>
                    <div className="text-xs text-muted-foreground flex justify-between mb-1">
                        <span>
                            {approvedCount} of {allLeadApprovers.length} approvers have verified.
                        </span>
                        <span>
                           {approvalProgress.toFixed(0)}%
                        </span>
                    </div>
                    <Progress value={approvalProgress} />
                </div>

                <div>
                    <h4 className="font-semibold text-sm mb-2">Mandatory Approvers ({mandatoryApprovedCount}/{mandatory.length})</h4>
                    <div className="flex flex-wrap gap-2">
                        <TooltipProvider>
                        {mandatory.map(approver => (
                            <Tooltip key={approver.id}>
                                <TooltipTrigger>
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={`https://placehold.co/100x100.png?text=${approver.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}`} data-ai-hint="male portrait" />
                                        <AvatarFallback>{approver.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}</AvatarFallback>
                                        {lead.verifiers?.some(v => v.verifierId === approver.id) ? (
                                            <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-0.5 border-2 border-background">
                                                <CheckCircle className="h-3 w-3 text-white" />
                                            </div>
                                        ) : (
                                            <div className="absolute bottom-0 right-0 bg-gray-400 rounded-full p-0.5 border-2 border-background">
                                                <Clock className="h-3 w-3 text-white" />
                                            </div>
                                        )}
                                    </Avatar>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{approver.name}</p>
                                </TooltipContent>
                            </Tooltip>
                        ))}
                        </TooltipProvider>
                    </div>
                </div>

                {optional.length > 0 && (
                     <div>
                        <h4 className="font-semibold text-sm mb-2">Optional Approvers ({optionalApprovedCount}/{optional.length})</h4>
                        <div className="flex flex-wrap gap-2">
                             <TooltipProvider>
                            {optional.map(approver => (
                                <Tooltip key={approver.id}>
                                    <TooltipTrigger>
                                        <Avatar className="h-9 w-9">
                                             <AvatarImage src={`https://placehold.co/100x100.png?text=${approver.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}`} data-ai-hint="male portrait" />
                                             <AvatarFallback>{approver.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}</AvatarFallback>
                                             {lead.verifiers?.some(v => v.verifierId === approver.id) ? (
                                                <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-0.5 border-2 border-background">
                                                    <CheckCircle className="h-3 w-3 text-white" />
                                                </div>
                                            ) : (
                                                <div className="absolute bottom-0 right-0 bg-gray-400 rounded-full p-0.5 border-2 border-background">
                                                    <Clock className="h-3 w-3 text-white" />
                                                </div>
                                            )}
                                        </Avatar>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{approver.name}</p>
                                    </TooltipContent>
                                </Tooltip>
                            ))}
                             </TooltipProvider>
                        </div>
                    </div>
                )}

                 {pendingApprovers.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-sm text-destructive mb-2">Pending Verification From:</h4>
                         <ul className="list-disc pl-5 text-sm text-muted-foreground">
                            {pendingApprovers.map(user => (
                                <li key={user.id}>{user.name}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
