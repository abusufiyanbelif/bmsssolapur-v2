
import Link from 'next/link';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, Shield, Building } from 'lucide-react';
import Image from 'next/image';

const LogoPlaceholder = () => (
    <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
        <rect width="100" height="100" rx="12" fill="currentColor" fillOpacity="0.1"/>
        <path d="M50 25L25 43.3L25 79.9L50 98.2L75 79.9L75 43.3L50 25Z" stroke="currentColor" strokeWidth="5"/>
        <path d="M50 54.1L25 72.4V35.8L50 17.5L75 35.8V72.4L50 54.1Z" stroke="currentColor" strokeWidth="5" strokeOpacity="0.5"/>
    </svg>
)


export function Footer() {
  return (
    <footer className="border-t bg-card text-card-foreground">
      <div className="container mx-auto px-4 lg:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* Column 1: Organization Info */}
          <div className="space-y-4">
             <div className="flex items-center gap-3">
                <LogoPlaceholder />
                <h3 className="text-xl font-bold font-headline text-foreground">Baitul Mal Samajik Sanstha (Solapur)</h3>
             </div>
            <p className="text-sm text-muted-foreground">
              Baitul Mal Samajik Sanstha (Solapur) provides life-saving and life-enriching humanitarian aid to underserved populations in the Solapur region, regardless of faith or nationality.
            </p>
             <p className="text-xs text-muted-foreground">
              Registered under the Societies Registration Act, 1860. All donations are tax-deductible under section 80G.
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              Reg No: (Solapur)/0000373/2025
            </p>
          </div>

          {/* Column 2: Contact Us */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold font-headline text-foreground">Contact Us</h4>
            <div className="space-y-2 text-sm">
                <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <p className="text-muted-foreground">
                        123 Muslim Peth, <br/>
                        (Solapur), Maharashtra 413001 <br/>
                        India
                    </p>
                </div>
                 <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-primary" />
                    <a href="tel:+919876543210" className="text-muted-foreground hover:text-primary">+91 98765 43210</a>
                </div>
                 <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-primary" />
                     <a href="mailto:info@baitulmalsolapur.org" className="text-muted-foreground hover:text-primary">info@baitulmalsolapur.org</a>
                </div>
            </div>
          </div>

          {/* Column 3: Quick Links */}
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
                <h4 className="text-lg font-semibold font-headline text-foreground">Connect With Us</h4>
                <ul className="space-y-2 text-sm">
                    <li><a href="#" className="flex items-center gap-2 text-muted-foreground hover:text-primary"><Facebook />Facebook</a></li>
                    <li><a href="#" className="flex items-center gap-2 text-muted-foreground hover:text-primary"><Instagram />Instagram</a></li>
                    <li><a href="#" className="flex items-center gap-2 text-muted-foreground hover:text-primary"><Twitter />Twitter</a></li>
                </ul>
            </div>
             <div className="space-y-4">
                <h4 className="text-lg font-semibold font-headline text-foreground">More</h4>
                <ul className="space-y-2 text-sm">
                     <li><Link href="/organization" className="text-muted-foreground hover:text-primary">About Us</Link></li>
                     <li><Link href="/campaigns" className="text-muted-foreground hover:text-primary">Campaigns</Link></li>
                     <li><Link href="/login" className="text-muted-foreground hover:text-primary">Admin Login</Link></li>
                </ul>
            </div>
          </div>
          
          {/* Column 4: Our Commitment */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold font-headline text-foreground">Our Commitment</h4>
            <div className="flex flex-col gap-4">
                 <Image src="https://placehold.co/200x100.png" alt="Commitment 1" width={200} height={100} className="rounded-md" data-ai-hint="charity community" />
                 <Image src="https://placehold.co/200x100.png" alt="Commitment 2" width={200} height={100} className="rounded-md" data-ai-hint="donation help" />
            </div>
          </div>

        </div>
        
        <div className="mt-12 text-center text-xs text-muted-foreground border-t pt-8">
          <p>&copy; {new Date().getFullYear()} Baitul Mal Samajik Sanstha (Solapur). All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
