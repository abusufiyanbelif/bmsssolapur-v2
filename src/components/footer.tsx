
import Link from 'next/link';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';
import Image from 'next/image';
import { Logo } from './logo';

export function Footer() {
  return (
    <footer className="border-t bg-card text-card-foreground">
      <div className="container mx-auto px-4 lg:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* Column 1: Organization Info */}
          <div className="space-y-4 lg:col-span-2">
             <div className="flex items-center gap-3">
                <Logo className="h-20 w-20" />
                <h3 className="text-xl font-bold font-headline text-foreground">
                    <span className="text-primary font-bold">Baitul Mal</span><br/>
                    <span className="text-accent font-bold">Samajik Sanstha</span><br/>
                    <span className="text-primary font-bold">(Solapur)</span>
                </h3>
             </div>
            <p className="text-sm text-muted-foreground max-w-lg">
              Baitul Mal Samajik Sanstha (Solapur) provides life-saving and life-enriching humanitarian aid to underserved populations in the Solapur region, regardless of faith or nationality.
            </p>
             <p className="text-xs text-muted-foreground">
              Registered under the Societies Registration Act, 1860. All donations are tax-deductible under section 80G.
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              Reg No: (Solapur)/0000373/2025
            </p>
          </div>

          {/* Column 2: Contact Us & Socials */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold font-headline text-primary">Contact Us</h4>
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
                    <Mail className="h-4 w-4 text-primary" />
                     <a href="mailto:info@baitulmalsolapur.org" className="text-muted-foreground hover:text-primary">info@baitulmalsolapur.org</a>
                </div>
            </div>
             <div className="space-y-3 pt-4">
                <h5 className="font-semibold text-primary text-sm">Key Contacts</h5>
                 <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-primary" />
                    <div className="text-sm">
                        <span className="text-muted-foreground">Maaz Shaikh: </span>
                        <a href="tel:+919372145889" className="font-medium text-foreground hover:text-primary">9372145889</a>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-primary" />
                     <div className="text-sm">
                        <span className="text-muted-foreground">Abu Rehan Bedrekar: </span>
                        <a href="tel:+917276224160" className="font-medium text-foreground hover:text-primary">7276224160</a>
                    </div>
                </div>
                 <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-primary" />
                    <div className="text-sm">
                        <span className="text-muted-foreground">Moosa Shaikh: </span>
                        <a href="tel:+918421708907" className="font-medium text-foreground hover:text-primary">8421708907</a>
                    </div>
                </div>
             </div>
             <div className="space-y-2 text-sm pt-4">
                <h4 className="font-semibold text-primary text-sm">Connect With Us</h4>
                <ul className="flex items-center gap-4">
                    <li><a href="#" className="flex items-center gap-2 text-muted-foreground hover:text-primary"><Facebook /></a></li>
                    <li><a href="#" className="flex items-center gap-2 text-muted-foreground hover:text-primary"><Instagram /></a></li>
                    <li><a href="#" className="flex items-center gap-2 text-muted-foreground hover:text-primary"><Twitter /></a></li>
                </ul>
             </div>
          </div>
          
          {/* Column 3: Our Commitment */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold font-headline text-primary">Our Commitment</h4>
            <p className="text-sm text-muted-foreground">
               We are dedicated to complete transparency and accountability in all our endeavors. Our work is guided by core principles that ensure your contributions directly and meaningfully impact those in need.
            </p>
            <Link href="/organization#principles" className="text-sm font-semibold text-primary hover:underline">
                Read Our Principles →
            </Link>
          </div>

        </div>
        
        <div className="mt-12 text-center text-xs text-muted-foreground border-t pt-8">
          <p>&copy; {new Date().getFullYear()} Baitul Mal Samajik Sanstha (Solapur). All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
