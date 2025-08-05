
'use client';

import { useEffect, useState } from "react";
import { getUserActivity, type ActivityLog } from "@/services/activity-log-service";
import { Loader2, AlertCircle, ListChecks } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format, formatDistanceToNow } from "date-fns";
import { Timestamp } from "firebase/firestore";

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

  const renderDetails = () => {
    switch(log.activity) {
      case 'Switched Role':
        return `Switched from "${log.details.from}" to "${log.details.to}" profile.`;
      case 'Donation Created':
        return `${log.details.details}`;
      case 'Status Changed':
          return `Donation status changed from "${log.details.from}" to "${log.details.to}".`;
      case 'Donation Updated':
          return `Donation details updated. Fields changed: ${log.details.updates}.`;
      default:
        return 'Performed an action.';
    }
  }

  return (
    <div className="flex items-start gap-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
        <ListChecks className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-sm">
          {renderDetails()}
        </p>
        <p className="text-xs text-muted-foreground" title={fullDate}>
          As <span className="font-semibold">{log.role}</span> &middot; {timeAgo}
        </p>
      </div>
    </div>
  );
};

export default function ActivityHistoryPage() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
        setUserId(storedUserId);
    } else {
        setError("You must be logged in to view activity history.");
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchActivities = async () => {
      if (!userId) return;
      try {
        setLoading(true);
        setError(null);
        const userActivities = await getUserActivity(userId);
        setActivities(userActivities);
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
      return <p className="text-center text-muted-foreground py-10">No activities recorded yet.</p>;
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
            <CardTitle>Activity History</CardTitle>
            <CardDescription>A log of actions you have performed in the system.</CardDescription>
        </CardHeader>
        <CardContent>
           {renderContent()}
        </CardContent>
    </Card>
  )
}
