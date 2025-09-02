

import { Suspense } from "react";
import { DonorDashboardContent } from './donor-dashboard-content';
import { Loader2, AlertCircle } from "lucide-react";
import { getUser, User } from "@/services/user-service";
import { getDonationsByUserId, getAllDonations } from "@/services/donation-service";
import { getAllLeads } from "@/services/lead-service";
import { getAppSettings } from "@/services/app-settings-service";
import { getInspirationalQuotes } from "@/ai/flows/get-inspirational-quotes-flow";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


async function DonorPageLoader({ userId }: { userId: string | null }) {
    if (!userId) {
        return (
             <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Access Denied</AlertTitle>
                <AlertDescription>You must be logged in to view the Donor Dashboard.</AlertDescription>
            </Alert>
        );
    }
    
    const [user, donations, allLeads, quotes, settings] = await Promise.all([
        getUser(userId),
        getDonationsByUserId(userId),
        getAllLeads(),
        getInspirationalQuotes(3),
        getAppSettings(),
    ]);

    if (!user || !user.roles.includes('Donor') || !settings) {
         return (
             <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Access Denied</AlertTitle>
                <AlertDescription>You do not have permission to view this page or settings could not be loaded.</AlertDescription>
            </Alert>
        );
    }
    
    return <DonorDashboardContent user={user} donations={donations} allLeads={allLeads} quotes={quotes} settings={settings} />
}

export default function DonorDashboardPage() {
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUserId = localStorage.getItem('userId');
        setUserId(storedUserId);
        setLoading(false);
    }, []);

    if (loading) {
        return <div className="flex justify-center items-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    }

    return (
        <Suspense fallback={<div className="flex justify-center items-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>}>
            <DonorPageLoader userId={userId} />
        </Suspense>
    );
}
