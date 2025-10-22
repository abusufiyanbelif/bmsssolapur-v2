
/**
 * @fileOverview Client-safe default data for the organization.
 * This file can be safely imported into client components.
 */

import type { Organization } from './types';

// This is now the single source of truth for the default logo.
export const DEFAULT_LOGO = "https://firebasestorage.googleapis.com/v0/b/baitul-mal-connect.firebasestorage.app/o/organization%2Fassets%2Flogo%2FIMG-20250816-WA0000.jpg?alt=media&token=49c54b33-286c-481d-bd33-1a16e8db22c5";

// Single source of truth for default organization data for the CLIENT.
export const defaultOrganization: Organization = {
    id: "main_org",
    name: "Baitul Mal Samajik Sanstha",
    logoUrl: DEFAULT_LOGO,
    address: "Solapur, Maharashtra",
    city: "Solapur",
    registrationNumber: "Not Available",
    contactEmail: "contact@example.com",
    contactPhone: "0000000000",
    createdAt: new Date(),
    updatedAt: new Date(),
    footer: {
      organizationInfo: { titleLine1: 'Baitul Mal', titleLine2: 'Samajik Sanstha', titleLine3: '(Solapur)', description: 'A registered charitable organization dedicated to providing financial assistance for education, healthcare, and relief to the underprivileged, adhering to Islamic principles of charity.', registrationInfo: 'Reg. No. Not Available', taxInfo: 'PAN: Not Available' },
      contactUs: { title: 'Contact Us', address: 'Solapur, Maharashtra, India', email: 'contact@example.com' },
      keyContacts: { title: 'Key Contacts', contacts: [{name: 'Admin', phone: '0000000000'}] },
      connectWithUs: { title: 'Connect With Us', socialLinks: [] },
      ourCommitment: { title: 'Our Commitment', text: 'We are committed to transparency and accountability in all our operations, ensuring that your contributions make a real impact.', linkText: 'Learn More', linkUrl: '/organization' },
      copyright: { text: `© ${new Date().getFullYear()} Baitul Mal Samajik Sanstha (Solapur). All Rights Reserved.` }
    }
};

    
