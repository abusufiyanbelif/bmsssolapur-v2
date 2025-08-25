

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
  | 'Super Admin'
  | 'Organization Member';

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
  fatherName?: string;
  fatherContact?: string;
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
  beneficiaryType?: 'Adult' | 'Old Age' | 'Kid' | 'Family' | 'Widow';
  isAnonymousAsBeneficiary?: boolean;
  isAnonymousAsDonor?: boolean;
  anonymousBeneficiaryId?: string; // e.g. BENFCRY01
  anonymousDonorId?: string; // e.g. DONOR01
  anonymousReferralId?: string; // e.g. REF01
  anonymousAdminId?: string; // e.g. ADM01
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
export type DonationPurpose = 'Education' | 'Medical' | 'Relief Fund' | 'Deen' | 'Loan' | 'To Organization Use' | 'Loan Repayment' | 'Other';
export type PaymentMethod = 'Online (UPI/Card)' | 'Bank Transfer' | 'Cash' | 'Other';

export interface Allocation {
  leadId: string;
  amount: number;
  allocatedAt: Timestamp | Date;
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
  category?: string;
  status: DonationStatus;
  isAnonymous?: boolean;
  leadId?: string;
  campaignId?: string;
  campaignName?: string;
  paymentScreenshotUrls?: string[];
  transactionId?: string;
  utrNumber?: string;
  googlePayTransactionId?: string;
  phonePeTransactionId?: string;
  paytmUpiReferenceNo?: string;
  donationDate: Timestamp | Date;
  paymentApp?: string;
  senderPaymentApp?: string;
  recipientPaymentApp?: string;
  donorUpiId?: string;
  donorPhone?: string;
  donorBankAccount?: string;
  senderName?: string;
  phonePeSenderName?: string;
  googlePaySenderName?: string;
  paytmSenderName?: string;
  recipientName?: string;
  phonePeRecipientName?: string;
  googlePayRecipientName?: string;
  paytmRecipientName?: string;
  recipientId?: string;
  recipientRole?: 'Beneficiary' | 'Referral' | 'Organization Member' | 'To Organization';
  recipientPhone?: string;
  recipientUpiId?: string;
  recipientAccountNumber?: string;
  paymentMethod?: PaymentMethod;
  createdAt: Timestamp | Date;
  verifiedAt?: Timestamp | Date;
  allocations?: Allocation[];
  notes?: string;
  rawText?: string;
  source?: 'Seeded' | 'Manual Entry';
}

// Lead-related types
export type LeadStatus = 'Open' | 'Pending' | 'Complete' | 'On Hold' | 'Cancelled' | 'Closed' | 'Partial';
export type LeadAction = 'Pending' | 'Ready For Help' | 'Publish' | 'Partial' | 'Complete' | 'Closed' | 'On Hold' | 'Cancelled';
export type LeadVerificationStatus = 'Pending' | 'Verified' | 'Rejected' | 'More Info Required' | 'Duplicate' | 'Other';
export type LeadPurpose = 'Education' | 'Medical' | 'Relief Fund' | 'Deen' | 'Loan' | 'Other';
export type LeadPriority = 'Urgent' | 'High' | 'Medium' | 'Low';

export interface Verifier {
    verifierId: string;
    verifierName: string;
    verifiedAt: Timestamp | Date;
    notes?: string;
}

export interface LeadDonationAllocation {
    donationId: string;
    amount: number;
    allocatedByUserId: string;
    allocatedByUserName: string;
    allocatedAt: Timestamp | Date;
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
    googlePayTransactionId?: string;
    phonePeTransactionId?: string;
    paytmUpiReferenceNo?: string;
    senderName?: string; // General sender name
    senderPhone?: string;
    phonePeSenderName?: string;
    googlePaySenderName?: string;
    paytmSenderName?: string;
    senderAccountNumber?: string;
    senderUpiId?: string;
    recipientName?: string; // General recipient name
    phonePeRecipientName?: string;
    googlePayRecipientName?: string;
    paytmRecipientName?: string;
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
    headline?: string;
    story?: string;
    purpose: LeadPurpose;
    otherPurposeDetail?: string;
    donationType: DonationType;
    acceptableDonationTypes?: DonationType[];
    category?: string;
    otherCategoryDetail?: string;
    priority?: LeadPriority;
    helpRequested: number;
    helpGiven: number;
    caseStatus: LeadStatus;
    caseAction?: LeadAction;
    caseVerification: LeadVerificationStatus;
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
    dateCreated: Timestamp | Date;
    dueDate?: Timestamp | Date;
    verificationDueDate?: Timestamp | Date;
    closedAt?: Timestamp | Date;
    verifiedAt?: Timestamp | Date; // Date of the latest verification
    lastAllocatedAt?: Timestamp | Date; // Date of the latest donation allocation
    isLoan: boolean;
    createdAt: Timestamp | Date;
    updatedAt?: Timestamp | Date;
    source?: 'Seeded' | 'Manual Entry';
}

export interface Campaign {
    id: string;
    name: string;
    description: string;
    goal: number;
    startDate: Timestamp | Date;
    endDate: Timestamp | Date;
    status: 'Upcoming' | 'Active' | 'Completed' | 'Cancelled';
    acceptableDonationTypes?: DonationType[];
    createdAt: Timestamp | Date;
    updatedAt: Timestamp | Date;
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
    bankAccountName?: string;
    bankAccountNumber?: string;
    bankIfscCode?: string;
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

interface PaymentGatewayCredentials {
  keyId?: string;
  keySecret?: string;
  merchantId?: string;
  merchantKey?: string;
  saltKey?: string;
  saltIndex?: number;
  appId?: string;
  secretKey?: string;
  apiKey?: string;
  authToken?: string;
  publishableKey?: string;
}

interface GatewayConfig {
    enabled: boolean;
    mode: 'test' | 'live';
    test: PaymentGatewayCredentials;
    live: PaymentGatewayCredentials;
}

interface CardVisibility {
    visibleTo: UserRole[];
}

export interface PurposeCategory {
  id: string;
  name: string;
  enabled: boolean;
}

export interface LeadPurpose {
    id: string;
    name: string;
    enabled: boolean;
    categories?: PurposeCategory[];
}

export interface DashboardSettings {
    mainMetrics: CardVisibility;
    fundsInHand: CardVisibility;
    monthlyContributors: CardVisibility;
    monthlyPledge: CardVisibility;
    pendingLeads: CardVisibility;
    pendingDonations: CardVisibility;
    leadsReadyToPublish: CardVisibility;
    beneficiaryBreakdown: CardVisibility;
    campaignBreakdown: CardVisibility;
    leadBreakdown: CardVisibility;
    donationsChart: CardVisibility;
    topDonors: CardVisibility;
    recentCampaigns: CardVisibility;
    donationTypeBreakdown: CardVisibility;
    // Role-specific dashboards
    donorContributionSummary: CardVisibility;
    donorImpactSummary: CardVisibility;
    beneficiarySummary: CardVisibility;
    referralSummary: CardVisibility;
}

export interface AnalyticsDashboardSettings {
    financialPerformance?: CardVisibility;
    [key: string]: CardVisibility | undefined;
}

export interface AppSettings {
    id: string;
    loginMethods: {
        password: { enabled: boolean };
        otp: { enabled: boolean };
        google: { enabled: boolean };
    };
    notificationSettings?: {
        sms: {
            provider: 'twilio';
            twilio: {
                accountSid: string;
                authToken: string;
                verifySid: string;
                fromNumber: string;
            }
        };
        whatsapp: {
            provider: 'twilio';
            twilio: {
                accountSid: string;
                authToken: string;
                fromNumber: string;
            }
        };
        email: {
            provider: 'nodemailer';
            nodemailer: {
                host: string;
                port: number;
                secure: boolean;
                user: string;
                pass: string;
                from: string;
            }
        };
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
        razorpay: GatewayConfig;
        phonepe: GatewayConfig;
        paytm: GatewayConfig;
        cashfree: GatewayConfig;
        instamojo: GatewayConfig;
        stripe: GatewayConfig;
    };
    leadConfiguration?: {
        purposes: LeadPurpose[];
        workflow?: Record<LeadStatus, LeadStatus[]>;
        approvalProcessDisabled?: boolean;
        roleBasedCreationEnabled?: boolean;
        leadCreatorRoles?: UserRole[];
        allowBeneficiaryRequests?: boolean;
    };
    dashboard?: DashboardSettings;
    analyticsDashboard?: AnalyticsDashboardSettings;
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
