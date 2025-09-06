
// src/app/admin/leads/page.tsx
"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from 'next/navigation'
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
import { Button, buttonVariants } from "@/components/ui/button";
import { format } from "date-fns";
import { Loader2, AlertCircle, PlusCircle, ShieldCheck, ShieldAlert, ShieldX, FilterX, ChevronLeft, ChevronRight, Eye, Search, HeartHandshake, Baby, PersonStanding, Home, ArrowUpDown, Ban, MoreHorizontal, Clock, CheckCircle, Package, Edit, UploadCloud, DownloadCloud, AlertTriangle, ChevronsUpDown, Check, Trash2, Share2, Clipboard } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuSub, DropdownMenuSubTrigger } from "@/components/ui/dropdown-menu";
import type { LeadPriority, LeadPurpose, LeadVerificationStatus, LeadStatus, LeadAction, AppSettings, User, Lead } from "@/services/types";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { handleBulkUpdateLeadStatus, handleBulkDeleteLeads } from "./[id]/actions";
import { getInspirationalQuotes } from "@/ai/flows/get-inspirational-quotes-flow";
import { updateLeadStatus, updateLeadVerificationStatus, getAllLeads } from "@/services/lead-service";
import { getUser, getAllUsers } from "@/services/user-service";
import { getAppSettings } from "@/app/admin/settings/actions";
import { LeadsPageClient } from "./leads-client";


// This is now a Server Component responsible for data fetching.
export default function LeadsPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
            <LeadsPageDataLoader />
        </Suspense>
    );
}

async function LeadsPageDataLoader() {
  try {
    const [initialLeads, initialUsers, initialSettings] = await Promise.all([
      getAllLeads(),
      getAllUsers(),
      getAppSettings(),
    ]);

    return (
      <LeadsPageClient
        initialLeads={initialLeads}
        initialUsers={initialUsers}
        initialSettings={initialSettings}
      />
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return (
      <LeadsPageClient
        initialLeads={[]}
        initialUsers={[]}
        initialSettings={null}
        error={errorMessage}
      />
    );
  }
}
