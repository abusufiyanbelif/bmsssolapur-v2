
import Link from 'next/link';
import { Package2 } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-card text-card-foreground">
      <div className="container mx-auto px-4 lg:px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Package2 className="h-6 w-6 text-primary" />
            <span className="font-headline text-lg">Baitul Mal Samajik Sanstha (Solapur)</span>
          </div>
          <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-center text-sm text-muted-foreground">
            <Link href="/organization" className="hover:text-primary">About Us</Link>
            <Link href="/campaigns" className="hover:text-primary">Campaigns</Link>
            <Link href="#" className="hover:text-primary">Contact</Link>
          </div>
        </div>
        <div className="mt-8 text-center text-xs text-muted-foreground border-t pt-4">
          <p>&copy; {new Date().getFullYear()} Baitul Mal Samajik Sanstha (Solapur). All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
