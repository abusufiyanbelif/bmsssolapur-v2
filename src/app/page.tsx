import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, LogIn } from "lucide-react";

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
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/campaigns">
              View Campaigns <ArrowRight className="ml-2" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">
              Login / Register <LogIn className="ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
