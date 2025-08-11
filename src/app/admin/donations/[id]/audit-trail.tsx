
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { History, ListChecks } from "lucide-react";
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
    switch (log.activity) {
      case 'Donation Created':
        return `Donation of ₹${log.details.amount?.toLocaleString()} created by ${log.userName}.`;
      case 'Status Changed':
        return `Status changed from "${log.details.from}" to "${log.details.to}" by ${log.userName}.`;
      case 'Donation Updated':
        return `Details updated by ${log.userName}.`;
      case 'Donation Allocated':
        return `₹${log.details.amount?.toLocaleString()} allocated to ${log.details.allocations?.length} lead(s) by ${log.userName}.`;
      default:
        return 'An action was performed.';
    }
  };

  return (
    <div className="flex items-start gap-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 mt-1">
        <ListChecks className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-sm">{renderDetails()}</p>
        <p className="text-xs text-muted-foreground" title={fullDate}>
          As <span className="font-semibold">{log.role}</span> &middot; {timeAgo}
        </p>
      </div>
    </div>
  );
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
