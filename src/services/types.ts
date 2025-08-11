

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
  userKey?: string; // e.g., USR01, USR02
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
  referredByUserId?: string; // ID of the user who referred this person
  referredByUserName?: string; // Name of the user who referred this person
  enableMonthlyDonationReminder?: boolean;
  monthlyPledgeEnabled?: boolean;
  monthlyPledgeAmount?: number;
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
  source?: 'Seeded' | 'Manual Entry';
}

// Donation-related types
export type DonationStatus = 'Pending verification' | 'Verified' | 'Failed/Incomplete' | 'Partially Allocated' | 'Allocated';
export type DonationType = 'Zakat' | 'Sadaqah' | 'Fitr' | 'Lillah' | 'Kaffarah' | 'Split' | 'Any';
export type DonationPurpose = 'Education' | 'Deen' | 'Hospital' | 'Loan and Relief Fund' | 'To Organization Use' | 'Loan Repayment';
export type PaymentMethod = 'Online (UPI/Card)' | 'Bank Transfer' | 'Cash' | 'Other';

export interface Allocation {
  leadId: string;
  amount: number;
  allocatedAt: Timestamp;
  allocatedByUserId: string;
  allocatedByUserName: string;
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
  source?: 'Seeded' | 'Manual Entry';
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
    allocatedAt: Timestamp;
}

export interface FundTransfer {
    transferredByUserId: string;
    transferredByUserName: string;
    amount: number;
    transferredAt: Timestamp | Date;
    proofUrl: string;
    notes?: string;
    transactionId?: string;
    utrNumber?: string;
    senderName?: string;
    senderAccountNumber?: string;
    recipientName?: string;
    recipientPhone?: string;
    recipientUpiId?: string;
    recipientAccountNumber?: string;
    paymentApp?: string;
    paymentMethod?: string;
    status?: string;
}

export interface Lead {
    id: string; // Now a custom-generated string
    name: string; // Beneficiary name for easy access
    beneficiaryId: string;
    campaignId?: string;
    campaignName?: string;
    purpose: LeadPurpose;
    otherPurposeDetail?: string;
    donationType: DonationType;
    acceptableDonationTypes?: DonationType[];
    category?: string;
    otherCategoryDetail?: string;
    priority?: LeadPriority;
    helpRequested: number;
    helpGiven: number;
    status: LeadStatus;
    verifiedStatus: LeadVerificationStatus;
    verifiers: Verifier[];
    donations: LeadDonationAllocation[];
    fundTransfers?: FundTransfer[];
    caseDetails?: string;
    verificationDocumentUrl?: string;
    adminAddedBy: {
        id: string;
        name: string;
    }
    referredByUserId?: string;
    referredByUserName?: string;
    dateCreated: Timestamp;
    dueDate?: Timestamp;
    closedAt?: Timestamp;
    isLoan: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    source?: 'Seeded' | 'Manual Entry';
}

export interface Organization {
    id: string;
    name: string;
    address: string;
    city: string;
    registrationNumber: string;
    panNumber?: string;
    contactEmail: string;
    contactPhone: string;
    website?: string;
    upiId?: string;
    qrCodeUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Quote {
    id: string;
    text: string;
    source: string;
    category: "Quran" | "Hadith" | "Scholar";
}

export interface AppSettings {
    id: string;
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
    paymentMethods?: {
        bankTransfer: { enabled: boolean };
        cash: { enabled: boolean };
        upi: { enabled: boolean };
        other: { enabled: boolean };
    };
    paymentGateway?: {
        razorpay: {
            enabled: boolean;
            keyId?: string;
            keySecret?: string;
        };
        phonepe: {
            enabled: boolean;
            merchantId?: string;
            saltKey?: string;
            saltIndex?: number;
        };
    };
    leadConfiguration?: {
        disabledPurposes: string[];
    };
    dashboard?: {
        mainMetrics: { visibleTo: UserRole[] };
        monthlyContributors: { visibleTo: UserRole[] };
        monthlyPledge: { visibleTo: UserRole[] };
        pendingLeads: { visibleTo: UserRole[] };
        pendingDonations: { visibleTo: UserRole[] };
        leadsReadyToPublish: { visibleTo: UserRole[] };
        beneficiaryBreakdown: { visibleTo: UserRole[] };
        campaignBreakdown: { visibleTo: UserRole[] };
        donationsChart: { visibleTo: UserRole[] };
        topDonors: { visibleTo: UserRole[] };
        recentCampaigns: { visibleTo: UserRole[] };
        donationTypeBreakdown: { visibleTo: UserRole[] };
    };
    updatedAt?: FieldValue;
}

export interface ActivityLog {
    id: string;
    userId: string;
    userName: string;
    userEmail?: string;
    role: UserRole;
    activity: string;
    details: Record<string, any>;
    timestamp: Timestamp | Date;
}
