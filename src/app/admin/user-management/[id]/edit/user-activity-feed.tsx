
"use client";

import { useEffect, useState } from "react";
import { getUserActivity, type ActivityLog } from "@/services/activity-log-service";
import { Loader2, AlertCircle, ListChecks, History } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format, formatDistanceToNow } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ActivityFeedProps {
  userId: string;
}

const ActivityItem = ({ log }: { log: ActivityLog }) => {
  let timeAgo = "Just now";
  let fullDate = "Pending timestamp...";

  if (log.timestamp instanceof Timestamp) {
    timeAgo = formatDistanceToNow(log.timestamp.toDate(), { addSuffix: true });
    fullDate = format(log.timestamp.toDate(), 'PPP p');
  }
  
  const changes = log.details.changes || {};

  return (
    <div className="flex items-start gap-4">
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
        <div className="mt-2 border rounded-lg overflow-hidden">
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="bg-muted/50">Field</TableHead>
                        <TableHead className="bg-muted/50">Previous Value</TableHead>
                        <TableHead className="bg-muted/50">New Value</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Object.entries(changes).map(([key, value]: [string, any]) => (
                         <TableRow key={key}>
                            <TableCell className="font-medium capitalize text-xs">{key.replace(/([A-Z])/g, ' $1')}</TableCell>
                            <TableCell className="text-muted-foreground text-xs">{String(value.from)}</TableCell>
                            <TableCell className="text-foreground font-semibold text-xs">{String(value.to)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
      </div>
    </div>
  );
};

export function UserActivityFeed({ userId }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          <ActivityItem key={log.id} log={log} />
        ))}
      </div>
    );
  }

  return (
     <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <History />
                User Profile Audit Trail
            </CardTitle>
            <CardDescription>A log of all changes made to this user&apos;s profile. (Visible to Super Admins only)</CardDescription>
        </CardHeader>
        <CardContent>
           {renderContent()}
        </CardContent>
    </Card>
  )
}
