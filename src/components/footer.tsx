
'use client';

import Link from 'next/link';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';
import { Logo } from './logo';
import type { Organization, OrganizationFooter } from '@/services/types';
import { Skeleton } from './ui/skeleton';


const defaultFooter: OrganizationFooter = {
    organizationInfo: { titleLine1: 'Baitul Mal (System Default)', titleLine2: 'Samajik Sanstha (System Default)', titleLine3: '(Solapur) (System Default)', description: 'Default description text. Please seed or create an organization profile to update this.', registrationInfo: 'Reg. No. (System Default)', taxInfo: 'PAN: (System Default)' },
    contactUs: { title: 'Contact Us (System Default)', address: 'Default Address, Solapur', email: 'contact@example.com' },
    keyContacts: { title: 'Key Contacts', contacts: [{name: 'Default Contact', phone: '0000000000'}] },
    connectWithUs: { title: 'Connect With Us (System Default)', socialLinks: [] },
    ourCommitment: { title: 'Our Commitment (System Default)', text: 'Default commitment text. Please update this in the layout settings.', linkText: 'Learn More', linkUrl: '#' },
    copyright: { text: `© ${new Date().getFullYear()} Organization Name. All Rights Reserved. (System Default)` }
};


interface FooterProps {
  organization: Organization | null;
}

export function Footer({ organization }: FooterProps) {
  const footerData = organization?.footer || defaultFooter;

  return (
    <footer className="border-t bg-card text-card-foreground">
      <div className="container mx-auto px-4 lg:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* Column 1: Organization Info */}
          <div className="space-y-4 lg:col-span-2">
             <div className="flex items-center gap-3">
                <Logo className="h-24 w-24" logoUrl={organization?.logoUrl} />
                <div className="font-headline text-foreground">
                    <h3 className="text-xl font-bold text-primary">{footerData.organizationInfo.titleLine1}</h3>
                    <h3 className="text-xl font-bold text-accent">{footerData.organizationInfo.titleLine2}</h3>
                    <h3 className="text-lg font-bold text-primary">{footerData.organizationInfo.titleLine3}</h3>
                </div>
             </div>
            <p className="text-sm text-muted-foreground max-w-lg">
                {footerData.organizationInfo.description}
            </p>
             <p className="text-xs text-muted-foreground font-mono">
                {footerData.organizationInfo.registrationInfo}
            </p>
            <p className="text-xs text-muted-foreground font-mono">
                {footerData.organizationInfo.taxInfo}
            </p>
          </div>

          {/* Column 2: Contact Us & Socials */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold font-headline text-primary">{footerData.contactUs.title}</h4>
            <div className="space-y-2 text-sm">
                <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <p className="text-muted-foreground whitespace-pre-line">
                        {footerData.contactUs.address}
                    </p>
                </div>
                 <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-primary" />
                     <a href={`mailto:${footerData.contactUs.email}`} className="text-muted-foreground hover:text-primary">{footerData.contactUs.email}</a>
                </div>
            </div>
             <div className="space-y-3 pt-4">
                <h5 className="font-semibold text-primary text-sm">{footerData.keyContacts.title}</h5>
                 {footerData.keyContacts.contacts.map((contact: {name: string, phone: string}, i: number) => (
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
                <h5 className="font-semibold text-primary text-sm">{footerData.connectWithUs.title}</h5>
                <ul className="flex items-center gap-4">
                     {footerData.connectWithUs.socialLinks.map((social: {platform: string, url: string}, i: number) => (
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
            <h4 className="text-lg font-semibold font-headline text-primary">{footerData.ourCommitment.title}</h4>
            <p className="text-sm text-muted-foreground">
                {footerData.ourCommitment.text}
            </p>
            <Link href={footerData.ourCommitment.linkUrl} className="text-sm font-semibold text-primary hover:underline">
                {footerData.ourCommitment.linkText}
            </Link>
          </div>

        </div>
        
        <div className="mt-12 text-center text-xs text-muted-foreground border-t pt-8">
          <p>{footerData.copyright.text}</p>
        </div>
      </div>
    </footer>
  );
}
