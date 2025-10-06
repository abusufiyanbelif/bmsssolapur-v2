
"use client";

import { useEffect, useState } from "react";
import { getUserActivity, type ActivityLog } from "@/services/activity-log-service";
import { Loader2, AlertCircle, ListChecks, History } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format, formatDistanceToNow } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ActivityDetailDialog } from "@/app/admin/leads/[id]/activity-detail-dialog";

interface ActivityFeedProps {
  userId: string;
}

const ActivityItem = ({ log, onSelect }: { log: ActivityLog, onSelect: () => void }) => {
  let timeAgo = "Just now";
  let fullDate = "Pending timestamp...";

  if (log.timestamp instanceof Timestamp) {
    timeAgo = formatDistanceToNow(log.timestamp.toDate(), { addSuffix: true });
    fullDate = format(log.timestamp.toDate(), 'PPP p');
  } else if (log.timestamp instanceof Date) {
     timeAgo = formatDistanceToNow(log.timestamp, { addSuffix: true });
     fullDate = format(log.timestamp, 'PPP p');
  }
  
  const hasChanges = log.details.changes && Object.keys(log.details.changes).length > 0;

  return (
    <div 
      className={`flex items-start gap-4 ${hasChanges ? 'cursor-pointer hover:bg-muted/50 p-2 -m-2 rounded-lg' : ''}`}
      onClick={hasChanges ? onSelect : undefined}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 mt-1">
        <ListChecks className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-sm">
          Profile updated by <span className="text-primary">{log.userName}</span>
        </p>
        <p className="text-xs text-muted-foreground" title={fullDate}>
          As <span className="font-semibold">{log.role}</span> &middot; {timeAgo}
        </p>
        {hasChanges && <p className="text-xs text-blue-600 mt-1">Click to see details</p>}
      </div>
    </div>
  );
};

export function UserProfileAuditTrail({ userId }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      if (!userId) return;
      try {
        setLoading(true);
        setError(null);
        // We need a specific query for this, let's filter client-side for now
        const allUserActivities = await getUserActivity(userId);
        const profileUpdates = allUserActivities.filter(
            log => log.activity === 'User Profile Updated' && log.details.targetUserId === userId
        );
        setActivities(profileUpdates);
      } catch (e) {
        setError("Failed to load activity history.");
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (userId) {
        fetchActivities();
    }
  }, [userId]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="ml-2">Loading activity...</p>
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }

    if (activities.length === 0) {
      return <p className="text-center text-muted-foreground py-10">No profile update activities recorded yet.</p>;
    }

    return (
      <div className="space-y-6">
        {activities.map((log) => (
          <ActivityItem key={log.id} log={log} onSelect={() => setSelectedLog(log)} />
        ))}
      </div>
    );
  }

  return (
    <>
     <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
                <History />
                User Profile Audit Trail
            </CardTitle>
            <CardDescription className="text-muted-foreground">A log of all changes made to this user&apos;s profile. (Visible to Super Admins only)</CardDescription>
        </CardHeader>
        <CardContent>
           {renderContent()}
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
