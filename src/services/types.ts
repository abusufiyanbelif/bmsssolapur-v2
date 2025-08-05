

/**
 * @fileOverview Centralized type definitions for the application's data models.
 */

import type { Timestamp, FieldValue } from 'firebase/firestore';

// User-related types
export type UserRole = 
  | 'Guest'
  | 'Donor'
  | 'Beneficiary'
  | 'Referral'
  | 'Admin'
  | 'Finance Admin'
  | 'Super Admin';

export type Privilege =
  | 'all'
  | 'canManageUsers'
  | 'canManageRoles'
  | 'canManageLeads'
  | 'canVerifyLeads'
  | 'canManageDonations'
  | 'canVerifyDonations'
  | 'canViewFinancials'
  | 'canExportData'
  | 'canManageSettings';

export interface User {
  id?: string;
  userId?: string; // Custom, user-defined ID
  name: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email?: string;
  phone: string;
  password?: string;
  isActive: boolean;
  address?: {
    addressLine1?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
  };
  gender?: 'Male' | 'Female' | 'Other';
  beneficiaryType?: 'Adult' | 'Old Age' | 'Kid' | 'Family';
  isAnonymous?: boolean; 
  anonymousId?: string; 
  occupation?: string;
  familyMembers?: number;
  isWidow?: boolean;
  secondaryPhone?: string; 
  aadhaarNumber?: string; 
  panNumber?: string; 
  roles: UserRole[]; 
  privileges?: Privilege[]; 
  groups?: string[];
  enableMonthlyDonationReminder?: boolean;
  monthlyPledgeEnabled?: boolean;
  monthlyPledgeAmount?: number;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// Donation-related types
export type DonationStatus = 'Pending verification' | 'Verified' | 'Failed/Incomplete' | 'Allocated';
export type DonationType = 'Zakat' | 'Sadaqah' | 'Fitr' | 'Lillah' | 'Kaffarah' | 'Split' | 'Any';
export type DonationPurpose = 'Education' | 'Deen' | 'Hospital' | 'Loan and Relief Fund' | 'To Organization Use' | 'Loan Repayment';

export interface Allocation {
  leadId: string;
  amount: number;
  allocatedAt: Timestamp;
}

export interface Donation {
  id?: string;
  donorId: string;
  donorName: string;
  amount: number;
  type: DonationType;
  purpose?: DonationPurpose;
  status: DonationStatus;
  isAnonymous?: boolean;
  paymentScreenshotUrl?: string;
  transactionId?: string;
  createdAt: Timestamp;
  verifiedAt?: Timestamp;
  allocations?: Allocation[];
  notes?: string;
}

// Lead-related types
export type LeadStatus = 'Pending' | 'Partial' | 'Closed';
export type LeadVerificationStatus = 'Pending' | 'Verified' | 'Rejected';
export type LeadPurpose = 'Education' | 'Medical' | 'Relief Fund' | 'Deen' | 'Loan' | 'Other';

export interface Verifier {
    verifierId: string;
    verifierName: string;
    verifiedAt: Timestamp;
    notes?: string;
}

export interface LeadDonationAllocation {
    donationId: string;
    amount: number;
    allocatedByUserId: string;
    allocatedByUserName: string;
    allocatedAt: Timestamp;
}

export interface Lead {
  id?: string;
  name: string;
  beneficiaryId: string;
  campaignId?: string;
  campaignName?: string;
  donationType: DonationType;
  purpose: LeadPurpose;
  otherPurposeDetail?: string;
  category?: string;
  otherCategoryDetail?: string;
  acceptableDonationTypes?: DonationType[];
  helpRequested: number;
  helpGiven: number;
  dueDate?: Date;
  status: LeadStatus;
  closedAt?: Timestamp;
  isLoan: boolean;
  caseDetails?: string;
  verificationDocumentUrl?: string;
  verifiedStatus: LeadVerificationStatus;
  verifiers: Verifier[];
  donations: LeadDonationAllocation[];
  verificationNotes?: string;
  dateCreated: Timestamp;
  adminAddedBy: {
      id: string;
      name: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Campaign-related types
export type CampaignStatus = 'Upcoming' | 'Active' | 'Completed' | 'Cancelled';

export interface Campaign {
  id?: string;
  name: string;
  description: string;
  startDate: Timestamp;
  endDate: Timestamp;
  goal: number;
  status: CampaignStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}


// Organization-related types
export interface Organization {
  id?: string;
  name: string;
  city: string;
  address: string;
  registrationNumber: string;
  aadhaarNumber?: string;
  panNumber?: string;
  contactEmail: string;
  contactPhone: string;
  website?: string;
  upiId?: string;
  qrCodeUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Quote-related types
export interface Quote {
  id?: string;
  text: string;
  source: string;
  category: 'Quran' | 'Hadith' | 'Scholar';
}

// ActivityLog-related types
export interface ActivityLog {
  id?: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  role: string;
  activity: string;
  details: Record<string, any>;
  timestamp: Timestamp | FieldValue;
}

// AppSettings-related types
export interface AppSettings {
  id?: string;
  loginMethods: {
    password: { enabled: boolean };
    otp: { enabled: boolean };
    google: { enabled: boolean };
  };
  services: {
    twilio: { enabled: boolean };
    nodemailer: { enabled: boolean };
    whatsapp: { enabled: boolean };
  };
  features: {
    directPaymentToBeneficiary: { enabled: boolean };
  };
  paymentMethods: {
    bankTransfer: { enabled: boolean };
    cash: { enabled: boolean };
    upi: { enabled: boolean };
    other: { enabled: boolean };
  };
  updatedAt?: Timestamp;
}
