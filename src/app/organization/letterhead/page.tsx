
import { getCurrentOrganization } from "@/app/admin/settings/actions";
import { notFound } from "next/navigation";
import { LetterheadDocument } from "./letterhead-document";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

/**
 * Fetches an image from a URL and converts it to a Base64 data URI.
 * This is done on the server to avoid client-side CORS issues.
 * @param url The public URL of the image to fetch.
 * @returns A promise that resolves with the Base64 data URI or undefined.
 */
async function getImageAsBase64(url?: string): Promise<string | undefined> {
  if (!url) return undefined;
  try {
    const response = await fetch(url, { cache: 'no-store' }); // Disable cache for this fetch
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    const blob = await response.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());
    const base64 = buffer.toString('base64');
    return `data:${blob.type};base64,${base64}`;
  } catch (error) {
    console.error("Error converting image to Base64:", error);
    return undefined;
  }
}

export default async function LetterheadPage() {
    const organization = await getCurrentOrganization();

    if (!organization) {
         return (
            <div className="flex-1 space-y-4">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Organization Found</AlertTitle>
                    <AlertDescription>
                        Organization details must be configured before a letterhead can be generated. Please set up the organization profile first.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }
    
    // Fetch and convert the logo on the server before rendering the client component
    const logoDataUri = await getImageAsBase64(organization.logoUrl);

    return <LetterheadDocument organization={organization} logoDataUri={logoDataUri} />;
}
