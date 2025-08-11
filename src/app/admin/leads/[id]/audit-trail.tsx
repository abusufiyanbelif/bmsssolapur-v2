
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { History, FileUp, Banknote, ShieldCheck, UserPlus, Paperclip, FileCheck, Edit, UploadCloud } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import type { ActivityLog, Lead } from "@/services/types";
import { useState } from "react";
import { ActivityDetailDialog } from "./activity-detail-dialog";

interface AuditTrailProps {
    lead: Lead;
    activityLogs: ActivityLog[];
}

export function AuditTrail({ lead, activityLogs }: AuditTrailProps) {
    const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

    const relevantLogs = activityLogs.filter(log => {
        return log.details.leadId === lead.id || log.details.linkedLeadId === lead.id || log.details.changes?.leadId === lead.id;
    });

    const combinedHistory = [
        { type: 'created', timestamp: lead.dateCreated, user: lead.adminAddedBy?.name || 'Unknown' },
        ...(lead.verifiers || []).map(v => ({ type: 'verified', timestamp: v.verifiedAt, user: v.verifierName, notes: v.notes })),
        ...(lead.fundTransfers || []).map(t => ({ type: 'transfer', timestamp: t.transferredAt, user: t.transferredByUserName, amount: t.amount })),
        ...relevantLogs.map(log => {
            if (log.activity === 'Document Uploaded') {
                return { type: 'document', timestamp: log.timestamp, user: log.userName, fileName: log.details.fileName };
            }
            if (log.activity === 'Lead Updated') {
                return { type: 'updated', timestamp: log.timestamp, user: log.userName, logData: log };
            }
            if (log.activity === 'Lead Status Changed' || log.activity === 'Lead Verification Changed') {
                 return { type: 'statusChange', timestamp: log.timestamp, user: log.userName, details: log.details };
            }
            return null;
        }).filter(Boolean)
    ].sort((a, b) => new Date(b.timestamp as any).getTime() - new Date(a.timestamp as any).getTime());


    const renderLogItem = (item: any, index: number) => {
        let icon: React.ReactNode;
        let title: React.ReactNode;
        let isClickable = false;

        switch(item.type) {
            case 'created':
                icon = <UserPlus className="h-5 w-5 text-blue-600" />;
                title = <>Lead Created by <span className="font-semibold">{item.user}</span></>;
                break;
            case 'verified':
                icon = <ShieldCheck className="h-5 w-5 text-green-600" />;
                title = <>Verified by <span className="font-semibold">{item.user}</span></>;
                break;
            case 'transfer':
                icon = <Banknote className="h-5 w-5 text-emerald-600" />;
                title = <>Fund transfer of <span className="font-semibold">₹{item.amount?.toLocaleString()}</span> recorded by <span className="font-semibold">{item.user}</span></>;
                break;
            case 'document':
                 icon = <Paperclip className="h-5 w-5 text-indigo-600" />;
                 title = <>Document <span className="font-semibold">{item.fileName}</span> uploaded by <span className="font-semibold">{item.user}</span></>;
                 break;
            case 'updated':
                icon = <Edit className="h-5 w-5 text-orange-600" />;
                title = <>Lead details updated by <span className="font-semibold">{item.user}</span></>;
                isClickable = true;
                break;
             case 'statusChange':
                const from = item.details.from;
                const to = item.details.to;
                if (to === 'Publish') {
                    icon = <UploadCloud className="h-5 w-5 text-blue-600" />;
                    title = <>Lead Published by <span className="font-semibold">{item.user}</span></>;
                } else if (to === 'Verified') {
                    icon = <FileCheck className="h-5 w-5 text-green-600" />;
                    title = <>Lead Verified by <span className="font-semibold">{item.user}</span></>;
                } else {
                    icon = <FileUp className="h-5 w-5 text-gray-600" />;
                    title = <>Status changed from "{from}" to "{to}" by <span className="font-semibold">{item.user}</span></>;
                }
                break;
            default:
                return null;
        }

        return (
            <div 
                key={index}
                className={`flex gap-4 items-center ${isClickable ? 'cursor-pointer hover:bg-muted/50 p-2 -m-2 rounded-lg' : ''}`}
                onClick={() => isClickable && item.logData && setSelectedLog(item.logData)}
            >
                {icon}
                <div className="text-sm">
                    <p>{title}</p>
                    <p className="text-xs text-muted-foreground">{format(item.timestamp, 'PPP p')}</p>
                    {item.notes && <p className="text-xs italic text-muted-foreground mt-1">"{item.notes}"</p>}
                </div>
            </div>
        )
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History />
                        Audit Trail
                    </CardTitle>
                        <CardDescription>
                        A log of key actions performed on this lead.
                    </CardDescription>
                </CardHeader>
                    <CardContent className="space-y-4">
                        {combinedHistory.length > 0 ? (
                            combinedHistory.map(renderLogItem)
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">No activities recorded for this lead yet.</p>
                        )}
                    </CardContent>
            </Card>
            {selectedLog && (
                <ActivityDetailDialog
                    log={selectedLog}
                    open={!!selectedLog}
                    onOpenChange={(isOpen) => !isOpen && setSelectedLog(null)}
                />
            )}
        </>
    )
}
