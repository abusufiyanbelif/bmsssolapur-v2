

import { AuditTrailClient } from "./audit-trail-client";
import { getAllActivityLogs } from "@/services/activity-log-service";


export default async function AuditTrailPage() {
    const initialLogs = await getAllActivityLogs();
    
    return (
        <AuditTrailClient initialLogs={initialLogs} />
    );
}

    
