
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import type { ActivityLog } from "@/services/types";

interface ActivityDetailDialogProps {
  log: ActivityLog;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ActivityDetailDialog({ log, open, onOpenChange }: ActivityDetailDialogProps) {
  const changes = log.details.changes || {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Activity Details: {log.activity}</DialogTitle>
          <DialogDescription>
            On {format(log.timestamp as Date, 'PPP p')} by {log.userName}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <h4 className="font-semibold mb-2">Fields Changed</h4>
            <div className="border rounded-lg">
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Field</TableHead>
                            <TableHead>Previous Value</TableHead>
                            <TableHead>New Value</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Object.entries(changes).map(([key, value]: [string, any]) => (
                             <TableRow key={key}>
                                <TableCell className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</TableCell>
                                <TableCell className="text-muted-foreground">{String(value.from)}</TableCell>
                                <TableCell className="text-foreground font-semibold">{String(value.to)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
