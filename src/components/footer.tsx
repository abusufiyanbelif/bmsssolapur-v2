

'use client';

import Link from 'next/link';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';
import { Logo } from './logo';
import type { Organization } from '@/services/types';
import { useEffect, useState } from 'react';
import { Skeleton } from './ui/skeleton';
import { getCurrentOrganization } from '@/app/admin/settings/actions';

export function Footer() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    getCurrentOrganization().then(org => {
      setOrganization(org);
      setLoading(false);
    });
  }, []);

  if (loading) {
      return (
          <footer className="border-t bg-card text-card-foreground">
              <div className="container mx-auto px-4 lg:px-6 py-12">
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                        <div className="space-y-4 lg:col-span-2">
                             <Skeleton className="h-24 w-full" />
                             <Skeleton className="h-6 w-3/4" />
                        </div>
                        <div className="space-y-4">
                            <Skeleton className="h-8 w-1/2" />
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-full" />
                        </div>
                        <div className="space-y-4">
                            <Skeleton className="h-8 w-1/2" />
                            <Skeleton className="h-16 w-full" />
                        </div>
                   </div>
              </div>
          </footer>
      )
  }
  
  if (!organization || !organization.footer) {
      return <footer className="border-t bg-card text-card-foreground"><div className="container p-4 text-center text-sm text-muted-foreground">Footer data not configured.</div></footer>;
  }
  
  const { footer } = organization;

  return (
    <footer className="border-t bg-card text-card-foreground">
      <div className="container mx-auto px-4 lg:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* Column 1: Organization Info */}
          <div className="space-y-4 lg:col-span-2">
             <div className="flex items-center gap-3">
                <Logo className="h-24 w-24" />
                <h3 className="text-xl font-bold font-headline text-foreground">
                    <span className="text-primary font-bold">{footer.organizationInfo.titleLine1}</span><br/>
                    <span className="text-accent font-bold">{footer.organizationInfo.titleLine2}</span><br/>
                    <span className="text-primary font-bold">{footer.organizationInfo.titleLine3}</span>
                </h3>
             </div>
            <p className="text-sm text-muted-foreground max-w-lg">
                {footer.organizationInfo.description}
            </p>
             <p className="text-xs text-muted-foreground">
                {footer.organizationInfo.taxInfo}
            </p>
            <p className="text-xs text-muted-foreground font-mono">
                {footer.organizationInfo.registrationInfo}
            </p>
          </div>

          {/* Column 2: Contact Us & Socials */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold font-headline text-primary">{footer.contactUs.title}</h4>
            <div className="space-y-2 text-sm">
                <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <p className="text-muted-foreground whitespace-pre-line">
                        {footer.contactUs.address}
                    </p>
                </div>
                 <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-primary" />
                     <a href={`mailto:${footer.contactUs.email}`} className="text-muted-foreground hover:text-primary">{footer.contactUs.email}</a>
                </div>
            </div>
             <div className="space-y-3 pt-4">
                <h5 className="font-semibold text-primary text-sm">{footer.keyContacts.title}</h5>
                 {footer.keyContacts.contacts.map((contact, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-primary" />
                        <div className="text-sm">
                            <span className="text-muted-foreground">{contact.name}: </span>
                            <a href={`tel:+91${contact.phone}`} className="font-medium text-foreground hover:text-primary">{contact.phone}</a>
                        </div>
                    </div>
                 ))}
             </div>
             <div className="space-y-2 text-sm pt-4">
                <h4 className="font-semibold text-primary text-sm">{footer.connectWithUs.title}</h4>
                <ul className="flex items-center gap-4">
                     {footer.connectWithUs.socialLinks.map((social, i) => (
                        <li key={i}>
                            <a href={social.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-primary">
                                {social.platform === 'Facebook' && <Facebook />}
                                {social.platform === 'Instagram' && <Instagram />}
                                {social.platform === 'Twitter' && <Twitter />}
                            </a>
                        </li>
                     ))}
                </ul>
             </div>
          </div>
          
          {/* Column 3: Our Commitment */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold font-headline text-primary">{footer.ourCommitment.title}</h4>
            <p className="text-sm text-muted-foreground">
                {footer.ourCommitment.text}
            </p>
            <Link href={footer.ourCommitment.linkUrl} className="text-sm font-semibold text-primary hover:underline">
                {footer.ourCommitment.linkText}
            </Link>
          </div>

        </div>
        
        <div className="mt-12 text-center text-xs text-muted-foreground border-t pt-8">
          <p>{footer.copyright.text}</p>
        </div>
      </div>
    </footer>
  );
}
