

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
  isAnonymousAsBeneficiary?: boolean;
  isAnonymousAsDonor?: boolean;
  anonymousBeneficiaryId?: string;
  anonymousDonorId?: string;
  occupation?: string;
  familyMembers?: number;
  isWidow?: boolean;
  secondaryPhone?: string; 
  aadhaarNumber?: string; 
  panNumber?: string; 
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  upiPhone?: string;
  upiIds?: string[];
  roles: UserRole[]; 
  privileges?: Privilege[]; 
  groups?: string[];
  enableMonthlyDonationReminder?: boolean;
  monthlyPledgeEnabled?: boolean;
  monthlyPledgeAmount?: number;
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

// Donation-related types
export type DonationStatus = 'Pending verification' | 'Verified' | 'Failed/Incomplete' | 'Allocated';
export type DonationType = 'Zakat' | 'Sadaqah' | 'Fitr' | 'Lillah' | 'Kaffarah' | 'Split' | 'Any';
export type DonationPurpose = 'Education' | 'Deen' | 'Hospital' | 'Loan and Relief Fund' | 'To Organization Use' | 'Loan Repayment';
export type PaymentMethod = 'Online (UPI/Card)' | 'Bank Transfer' | 'Cash' | 'Other';

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
  leadId?: string;
  campaignId?: string;
  paymentScreenshotUrls?: string[];
  transactionId?: string;
  donationDate: Timestamp | Date;
  donorUpiId?: string;
  donorPhone?: string;
  donorBankAccount?: string;
  paymentMethod?: PaymentMethod;
  createdAt: Timestamp;
  verifiedAt?: Timestamp;
  allocations?: Allocation[];
  notes?: string;
}

// Lead-related types
export type LeadStatus = 'Pending' | 'Ready For Help' | 'Publish' | 'Partial' | 'Complete' | 'Closed' | 'On Hold' | 'Cancelled';
export type LeadVerificationStatus = 'Pending' | 'Verified' | 'Rejected' | 'More Info Required' | 'Duplicate' | 'Other';
export type LeadPurpose = 'Education' | 'Medical' | 'Relief Fund' | 'Deen' | 'Loan' | 'Other';
export type LeadPriority = 'Urgent' | 'High' | 'Medium' | 'Low';

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
al