
"use client";

import { useState, useEffect, useMemo } from "react";
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
import { ActivityLog } from "@/services/activity-log-service";
import { format, formatDistanceToNow } from "date-fns";
import { Loader2, AlertCircle, FilterX, ChevronLeft, ChevronRight, Search, ArrowUpDown } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


type SortableColumn = 'timestamp' | 'userName' | 'activity';
type SortDirection = 'asc' | 'desc';

interface AuditTrailPageClientProps {
    initialLogs: ActivityLog[];
    error?: string;
}


export function AuditTrailClient({ initialLogs, error: initialError }: AuditTrailPageClientProps) {
    const [logs, setLogs] = useState<ActivityLog[]>(initialLogs);
    const [loading, setLoading] = useState(false); // Initially false as we have initial data
    const [error, setError] = useState<string | null>(initialError || null);

    // Input states
    const [searchInput, setSearchInput] = useState('');
    
    // Applied filter states
    const [appliedFilters, setAppliedFilters = useState({
        search: '',
    });
    
    // Sorting state
    const [sortColumn, setSortColumn = useState('timestamp');
    const [sortDirection, setSortDirection = useState('desc');

    // Pagination states
    const [currentPage, setCurrentPage = useState(1);
    const [itemsPerPage, setItemsPerPage = useState(25);

    const handleSearch = () => {
        setCurrentPage(1);
        setAppliedFilters({
            search: searchInput,
        });
    };
    
     const handleSort = (column: SortableColumn) => {
        if (sortColumn === column) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    }

    const filteredLogs = useMemo(() => {
        let filtered = logs.filter(log => {
            const searchMatch = appliedFilters.search === '' || 
                              log.userName.toLowerCase().includes(appliedFilters.search.toLowerCase()) ||
                              log.activity.toLowerCase().includes(appliedFilters.search.toLowerCase()) ||
                              (log.details.donationId && log.details.donationId.toLowerCase().includes(appliedFilters.search.toLowerCase())) ||
                              (log.details.leadId && log.details.leadId.toLowerCase().includes(appliedFilters.search.toLowerCase()));
            
            return searchMatch;
        });

        return filtered.sort((a, b) => {
            const aValue = a[sortColumn];
            const bValue = b[sortColumn];

            let comparison = 0;
            if (aValue instanceof Date && bValue instanceof Date) {
                comparison = aValue.getTime() - bValue.getTime();
            } else if (String(aValue) > String(bValue)) {
                comparison = 1;
            } else if (String(aValue) < String(bValue)) {
                comparison = -1;
            }

            return sortDirection === 'asc' ? comparison : -comparison;
        });

    }, [logs, appliedFilters, sortColumn, sortDirection]);

    const paginatedLogs = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredLogs, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
    
    useEffect(() => {
        setCurrentPage(1);
    }, [itemsPerPage]);

    const resetFilters = () => {
        setSearchInput('');
        setAppliedFilters({ search: '' });
        setCurrentPage(1);
    };

    const renderSortIcon = (column: SortableColumn) => {
        if (sortColumn !== column) return  className="ml-2 h-4 w-4 opacity-30" />;
        return sortDirection === 'asc' ?  className="ml-2 h-4 w-4" /> :  className="ml-2 h-4 w-4" />;
    };

    const renderDetails = (log: ActivityLog) => {
        const details = log.details || {};
        switch(log.activity) {
            case 'User Logged In': return `Logged in via ${details.method}.`;
            case 'Switched Role': return `Switched role from ${details.from} to ${details.to}.`;
            case 'Donation Created': return `Created donation of ₹${details.amount} from ${details.donorName}.`;
            case 'Donation Verified (Razorpay)': return `Verified donation of ₹${details.amount} from ${details.donorName} via Razorpay.`;
            case 'Donation Allocated': return `Allocated ₹${details.amount} to ${details.allocations?.length} lead(s).`;
            case 'Lead Created': return `Created lead for ${details.leadName}.`;
            case 'Status Changed': return `Status changed from "${details.from}" to "${details.to}".`;
            default: return JSON.stringify(details);
        }
    };
    
    const renderTable = () => (
         
             
                
                    
                       Timestamp {renderSortIcon('timestamp')}
                    
                
                 
                    
                       User {renderSortIcon('userName')}
                    
                
                
                    
                       Activity {renderSortIcon('activity')}
                    
                
                 Details
            
             
             {paginatedLogs.map((log) => {
                    return (
                         
                            
                                {format(new Date(log.timestamp), "dd MMM yyyy, p")}
                                {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                            
                            
                                {log.userName}
                                {log.role}
                            
                             
                                {log.activity}
                            
                             
                                {renderDetails(log)}
                            
                        
                    );
                })}
            
        
    );

    const renderPaginationControls = () => (
         
             Showing {paginatedLogs.length} of {filteredLogs.length} log entries.
            
             
                 
                    Rows per page
                    
                        
                            
                            {setItemsPerPage(Number(value))
                        }}
                    >
                        
                            {itemsPerPage}
                        
                        
                            {[10, 25, 50, 100].map((pageSize) => (
                                {pageSize}
                            
                        ))}
                        
                    
                
                 Page {currentPage} of {totalPages}
                 
                    
                        
                         
                        Previous
                    
                    
                        
                         
                        Next
                    
                
            
        
    );

    const renderContent = () => {
        if (loading) {
            return (
                 
                    
                    Loading audit trail...
                
            );
        }

        if (error) {
            return (
                 
                    
                    Error
                    {error}
                
            );
        }
        
        if (filteredLogs.length === 0) {
             return (
                 
                    No logs match your current filters.
                    
                        
                        Clear Filters
                    
                
            )
        }

        return (
            <>
                {renderTable()}
                {totalPages > 1 && renderPaginationControls()}
            
        );
    }
    
  return (
     
         
             Audit Trail
        
         
             
                User Activity Logs
                A chronological record of all significant actions taken by users across the application.
            
             
                 
                     
                        Search by User, Activity, or ID
                        
                            
                            placeholder="Start typing to search..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        
                    
                     
                        
                           
                            Search
                        
                        
                            
                            Clear
                        
                    
                
                {renderContent()}
            
        
    
  )
}

    