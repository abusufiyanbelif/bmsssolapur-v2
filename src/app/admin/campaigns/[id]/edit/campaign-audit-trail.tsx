
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { History, ListChecks } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
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
    fullDate = log.timestamp.toDate().toLocaleString();
  }

  const renderDetails = () => {
    let message = 'An action was performed.';

    switch (log.activity) {
      case 'Donation Created':
        message = `Donation of ₹${log.details.amount?.toLocaleString()} created by ${log.userName}.`;
        break;
      case 'Lead Created':
         message = `Lead for ${log.details.leadName} created by ${log.userName}.`;
        break;
      default:
        message = `${log.activity} by ${log.userName}.`;
    }
    
    return (
      <div className="flex items-start gap-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 mt-1">
          <ListChecks className="h-4 w-4 text-primary" />
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


interface CampaignAuditTrailProps {
    activityLogs: ActivityLog[];
}

export function CampaignAuditTrail({ activityLogs }: CampaignAuditTrailProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <History />
                    Audit Trail
                </CardTitle>
                <CardDescription>
                    A log of key actions performed on this campaign.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {activityLogs.length > 0 ? (
                    activityLogs.map(log => <ActivityItem key={log.id} log={log} />)
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No activities recorded for this campaign yet.</p>
                )}
            </CardContent>
        </Card>
    );
}
