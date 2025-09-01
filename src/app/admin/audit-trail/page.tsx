

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button";
import { getAllActivityLogs, ActivityLog } from "@/services/activity-log-service";
import { format, formatDistanceToNow } from "date-fns";
import { Loader2, AlertCircle, FilterX, ChevronLeft, ChevronRight, Search, ArrowUpDown } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AuditTrailClient } from "./audit-trail-client";


export default async function AuditTrailPage() {
    const initialLogs = await getAllActivityLogs();
    
    return (
        <AuditTrailClient initialLogs={initialLogs} />
    );
}

    