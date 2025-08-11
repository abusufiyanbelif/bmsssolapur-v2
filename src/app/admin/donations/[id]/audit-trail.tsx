
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { History, ListChecks, Trash2, Upload } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import type { ActivityLog } from "@/services/types";
import { Timestamp } from "firebase/firestore";

interface ActivityItemProps {
  log: ActivityLog;
}

const ActivityItem = ({ log }: ActivityItemProps) => {
  let timeAgo = "Just now";
  let fullDate = "Pending timestamp...";

  if (log.timestamp instanceof Timestamp) {
    timeAgo = formatDistanceToNow(log.timestamp.toDate(), { addSuffix: true });
    fullDate = format(log.timestamp.toDate(), 'PPP p');
  }

  const renderDetails = () => {
    let icon = <ListChecks className="h-4 w-4 text-primary" />;
    let message = 'An action was performed.';

    switch (log.activity) {
      case 'Donation Created':
        message = `Donation of ₹${log.details.amount?.toLocaleString()} created by ${log.userName}.`;
        break;
      case 'Status Changed':
        message = `Status changed from "${log.details.from}" to "${log.details.to}" by ${log.userName}.`;
        break;
      case 'Donation Updated':
        message = `Details updated by ${log.userName}.`;
        break;
      case 'Donation Allocated':
        message = `₹${log.details.amount?.toLocaleString()} allocated to ${log.details.allocations?.length} lead(s) by ${log.userName}.`;
        break;
      case 'Donation Deleted':
        icon = <Trash2 className="h-4 w-4 text-destructive" />;
        message = `Donation record deleted by ${log.userName}.`;
        break;
      case 'Proof Uploaded':
        icon = <Upload className="h-4 w-4 text-blue-600" />;
        message = `Payment proof uploaded by ${log.userName}.`;
        break;
      default:
        message = 'An action was performed.';
    }
    
    return (
      <div className="flex items-start gap-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 mt-1">
          {icon}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm">{message}</p>
          <p className="text-xs text-muted-foreground" title={fullDate}>
            As <span className="font-semibold">{log.role}</span> &middot; {timeAgo}
          </p>
        </div>
      </div>
    );
  };

  return renderDetails();
};


interface AuditTrailProps {
    activityLogs: ActivityLog[];
}

export function AuditTrail({ activityLogs }: AuditTrailProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <History />
                    Audit Trail
                </CardTitle>
                <CardDescription>
                    A log of key actions performed on this donation.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {activityLogs.length > 0 ? (
                    activityLogs.map(log => <ActivityItem key={log.id} log={log} />)
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No activities recorded for this donation yet.</p>
                )}
            </CardContent>
        </Card>
    );
}
