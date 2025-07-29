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

- **Services Summary**: Created a page (`/services`) to display a list of all configured backend and external services.
- **Dependency Map**: Created a page (`/dependencies`) to visualize the connections between the application's services.
- **User Profile**: Created a page (`/profile`) for users to manage their settings, including notification preferences.
- **Admin Dashboard**: Created at `/admin` to show key stats. The dashboard includes widgets for "Total Raised," "Total Distributed," "Pending to Disburse," "Total Beneficiaries Helped," "Cases Fully Closed," and "Cases Pending."
- **Donation Management**: Created a page at `/admin/donations` to list all donations with their status.
- **Leads Management**: Created a page at `/admin/leads` to list all help cases (leads).

### User Roles & Permissions

- Defined user roles: Donor, Beneficiary, Referral, Super Admin, Admin (with sub-categories: Normal admin, Founder, Co-founder, Finance).
- Added Privileges and Groups to the user model.
- Specified access levels for Admin, Donor, and Guest roles.

### Donation Management

- **Statuses**: "Pending verification", "Verified", "Failed/Incomplete", "Allocated"
- **Categories**: 'Zakat', 'Sadaqah', 'Fitr', 'Lillah', 'Kaffarah'
- **Purposes**: 'Education', 'Deen', 'Hospital', 'Loan and Relief Fund', 'To Organization Use'
- **Anonymous Donations**: Implemented a feature to allow for anonymous donations, linking them to a predefined "Anonymous Donor" profile.
- **Traceability**: Donations can be linked to specific leads they helped fund via an `allocatedToLeadId`.

### Leads/Cases Management
- **Leads Table**: Created a "Leads" table in Firestore to track help cases with the following fields:
    - `Lead ID`: Unique case ID.
    - `Name`: Optional name of the recipient (can be "Anonymous").
    - `Category`: Zakat / Sadaqah / Fitr etc.
    - `Amount Requested`: The requested help amount.
    - `Amount Given`: Total funds given so far.
    - `Status`: "Pending", "Partial", "Closed".
    - `Notes`: Details about the need.
    - `Date Created`: Timestamp when the lead was logged.
    - `Admin Added By`: ID of the admin who entered the lead.
- **Lead Statuses**: "Pending", "Partial", "Closed".
- **Permissions**: Only users with "Admin" or "Super Admin" privileges can add or update leads.

### Fund Flow Dashboard & Reporting
- **Summary Dashboard**: Admin view with key metrics.
- **Charts**: Visualizations for "Raised vs. Distributed" funds.
- **Data Export**: Functionality to export donation and lead data to CSV/Excel. Access restricted to Admins (all) and optionally Donors/Beneficiaries.

## Optional Add-Ons (Later Stages)

- PDF donation receipt (auto-send)
- Donation target tracker (e.g., Zakat obligation calculator)
- Multilingual UI (Arabic, Urdu, English, Hindi, Marathi)
