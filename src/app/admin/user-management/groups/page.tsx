
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { Group, Users, ShieldCheck, Banknote, ChevronLeft, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


type UserGroup = {
  name: string;
  description: string;
  icon: React.ElementType;
  typicalRoles: string[];
};

const allGroups: UserGroup[] = [
    { 
        name: "Founder",
        description: "The primary founding members of the organization. They typically have the highest level of administrative access.",
        icon: Users,
        typicalRoles: ["Super Admin"]
    },
    { 
        name: "Co-Founder",
        description: "Core leadership members who were part of the founding team.",
        icon: Users,
        typicalRoles: ["Super Admin", "Admin"]
    },
    { 
        name: "Finance",
        description: "A group of users responsible for managing donations, verifying financial transactions, and viewing financial reports.",
        icon: Banknote,
        typicalRoles: ["Finance Admin", "Super Admin"]
    },
    { 
        name: "Member of Organization",
        description: "General members of the core team who are involved in day-to-day operations and decision-making.",
        icon: Group,
        typicalRoles: ["Admin", "Super Admin"]
    },
    { 
        name: "Lead Approver",
        description: "A designated team of trusted individuals responsible for verifying and approving new help requests (leads) before they become active.",
        icon: ShieldCheck,
        typicalRoles: ["Admin", "Super Admin"]
    },
    { 
        name: "Mandatory Lead Approver",
        description: "A subgroup of Lead Approvers whose approval is mandatory for a lead to be verified.",
        icon: ShieldCheck,
        typicalRoles: ["Admin", "Super Admin"]
    }
];

export default function UserGroupsPage() {
    const [currentPage, setCurrentPage = useState(1);
    const [itemsPerPage, setItemsPerPage = useState(5);

    const paginatedGroups = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return allGroups.slice(startIndex, startIndex + itemsPerPage);
    }, [currentPage, itemsPerPage]);

    const totalPages = Math.ceil(allGroups.length / itemsPerPage);

    const renderPaginationControls = () => (
         
             Showing {paginatedGroups.length} of {allGroups.length} groups.
            
             
                 
                    Rows per page
                    
                        
                            {setItemsPerPage(Number(value)); setCurrentPage(1); }}
                        >
                            
                                {itemsPerPage}
                            
                            
                                {[5, 10, 20].map(pageSize => {pageSize}</SelectItem>)}
                            
                        
                    
                
                 Page {currentPage} of {totalPages}
                 
                    
                        
                         
                        Previous
                    
                    
                        
                         
                        Next
                    
                
            
        
    );


  return (
     
         
             User Groups
        
         
             
                
                    Manage User Groups
                
                 
                       In this application, Roles define a user&apos;s function (e.g., Admin, Donor), while Groups define their organizational title or team (e.g., Founder, Finance).
                  
                  
                       This page provides a read-only view of the groups used to organize users and grant special permissions. To assign a user to a group, edit their profile in the User Management section.
                  
                
            
             
                
                    
                        
                            Sr. No.
                            Group Name
                            Description
                            Typical Roles
                        
                    
                    
                        {paginatedGroups.map((group, index) => (
                             
                                {(currentPage - 1) * itemsPerPage + index + 1}
                                
                                     
                                        {group.name}
                                    
                                
                                {group.description}
                                
                                     {role}</Badge>
                                    ))}
                                
                            
                        
                    ))}
                
                 {totalPages > 1 && renderPaginationControls()}
            
        
    
  );
}

    