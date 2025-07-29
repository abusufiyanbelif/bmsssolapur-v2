import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] text-center p-4">
      <div className="max-w-3xl">
        <h1 className="text-5xl font-bold tracking-tighter font-headline sm:text-6xl md:text-7xl">
          Baitul Mal Samajik Sanstha (Solapur)
        </h1>
        <p className="mt-4 text-lg text-muted-foreground md:text-xl">
          A non-profit organization dedicated to serving the community through various social welfare activities.
        </p>
        <div className="mt-8">
          <Button asChild size="lg">
            <Link href="/admin">
              Go to Admin Dashboard <ArrowRight className="ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
