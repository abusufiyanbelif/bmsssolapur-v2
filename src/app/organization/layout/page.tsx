
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentOrganization } from "@/app/admin/settings/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Palette } from "lucide-react";
import { LayoutSettingsForm } from "@/app/admin/organization/layout/layout-settings-form";

export default async function LayoutSettingsPage() {
    const organization = await getCurrentOrganization();

     if (!organization) {
        return (
              
                 
                    
                    No Organization Found
                    No organization details have been configured in the database.
                
            
        )
    }
    
    return (
         
             
                Layout Configuration
            
             
                
                    
                        
                        Header & Footer Configuration
                    
                     
                       Manage the content displayed in the header and footer across the public-facing pages of the website.
                    
                
                 
                    
                
            
        
    );
}

    