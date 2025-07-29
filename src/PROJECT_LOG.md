# Project Log - Baitul Mal Samajik Sanstha (Solapur)

This document tracks the features and changes requested for the project.

## Initial Setup & Configuration

- **Development Mode**: AI assistant to write all code on behalf of the user.
- **Application Name**: Set to "Baitul Mal Samajik Sanstha (Solapur)".
- **Technology Stack**: 
  - **Frontend**: Next.js with React and TypeScript.
  - **UI**: ShadCN UI.
  - **Styling**: Tailwind CSS.
  - **Generative AI**: Genkit with Google AI models.
- **Backend Platform**: Firebase (Serverless).
  - **Project ID**: baitul-mal-connect.
- **Firebase Services**:
  - Firestore for users, leads, and donations.
  - Firebase Authentication.
  - An `activityLogService.ts` for logging user actions.
  - A `seedService.ts` to populate the database with initial data, including a "Super Admin" user.

## Feature Implementation

### AI-Powered Features (Genkit Flows)

- **Email**: Created a Genkit flow (`send-email-flow.ts`) using Nodemailer to send emails.
- **OTP**: Created Genkit flows for sending (`send-otp-flow.ts`) and verifying (`verify-otp-flow.ts`) one-time passwords via Twilio.

### User Interface
- **Organization Page**: Created a public page at `/organization` to display verifiable details of the registered organization.
- **Services Summary**: Created a page (`/services`) to display a list of all configured backend and external services.
- **Dependency Map**: Created a page (`/dependencies`) to visualize the connections between the application's services.
- **User Profile**: Created a page (`/profile`) for users to manage their settings, including notification preferences.
- **Admin Dashboard**: Created at `/admin` to show key stats. The dashboard includes widgets for "Total Raised," "Total Distributed," "Pending to Disburse," "Total Beneficiaries Helped," "Cases Fully Closed," and "Cases Pending."
- **Donation Management**: Created a page at `/admin/donations` to list all donations with their status.
- **Leads Management**: Created a page at `/admin/leads` to list all help cases (leads).
- **Fundraising Page**: A page for users to create fundraising campaigns, subject to admin approval.

### User Roles & Permissions

- Defined user roles: Donor, Beneficiary, Referral, Super Admin, Admin (with sub-categories: Normal admin, Founder, Co-founder, Finance).
- **Flexible Roles**: Users can hold multiple roles (e.g., a Donor can also be a Beneficiary).
- Added Privileges and Groups to the user model.
- Specified access levels for Admin, Donor, and Guest roles.
- **Conflict of Interest**: Admins cannot approve their own beneficiary applications. If a finance admin is a beneficiary, another admin must approve.
- **Account Recovery**: Admins and Super Admins can add a secondary phone number for account recovery.

### Organization Management
- **City-wise Management**: Organizations are managed on a city-by-city basis, starting with Solapur.
- **Duplicate Prevention**: The system prevents the creation of organizations with a duplicate name or registration number.
- **Approval Workflow**: Edits to organization details by an Admin must be approved by a Super Admin.

### Donation Management

- **Statuses**: "Pending verification", "Verified", "Failed/Incomplete", "Allocated"
- **Categories**: 'Zakat', 'Sadaqah', 'Fitr', 'Lillah', 'Kaffarah'
- **Purposes**: 'Education', 'Deen', 'Hospital', 'Loan and Relief Fund', 'To Organization Use'
- **Anonymous Donations**: Implemented a feature to allow for anonymous donations, linking them to a predefined "Anonymous Donor" profile.
- **Traceability**: Donations can be linked to specific leads they helped fund via an `allocations` array on the donation object.
- **Donation Splitting**: A single donation can be split across multiple leads. A "Split" donation type is available.

### Leads/Cases Management
- **Leads Table**: Created a "Leads" table in Firestore to track help cases with the following fields:
    - `Lead ID`: Unique case ID.
    - `Name`: Optional name of the recipient (can be "Anonymous").
    - `Category`: Zakat / Sadaqah / Fitr etc.
    - `Amount Requested`: The requested help amount.
    - `Amount Given`: Total funds given so far.
    - `Status`: "Pending", "Partial", "Closed".
    - `Case Details`: Details about the need (reason for support).
    - `Date Created`: Timestamp when the lead was logged.
    - `Admin Added By`: ID of the admin who entered the lead.
    - `Verification Document`: URL to an uploaded verification file (PDF, JPG, etc.).
    - `Verified Status`: "Pending", "Verified", "Rejected".
    - `Verifiers`: An array of users who have verified the lead (can be multiple).
    - `Verification Notes`: Comments from the reviewers.
- **Lead Statuses**: "Pending", "Partial", "Closed".
- **Permissions**: Only users with "Admin" or "Super Admin" privileges can add or update leads.
- **Business Rule**: Leads must have a `Verified Status` of "Verified" before any funds can be allocated to them. Leads without a verification document cannot be approved.

### Fund Flow Dashboard & Reporting
- **Summary Dashboard**: Admin view with key metrics.
- **Charts**: Visualizations for "Raised vs. Distributed" funds.
- **Dashboard Filtering**: Admins can filter fundraising leads by status (Approved/Rejected) and type.
- **Data Export**: Functionality to export donation and lead data to CSV/Excel. Access restricted to Admins (all) and optionally Donors/Beneficiaries.

### Direct Payments
- **Beneficiary Bank Details**: Functionality to store verified beneficiary bank/UPI details.
- **Payment Options**: Admins can choose to send funds directly to a beneficiary's account or to the main organization account.

## Optional Add-Ons (Later Stages)

- PDF donation receipt (auto-send)
- Donation target tracker (e.g., Zakat obligation calculator)
- Multilingual UI (Arabic, Urdu, English, Hindi, Marathi)
