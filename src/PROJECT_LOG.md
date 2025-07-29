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
- **Role-Based Navigation**: Implemented a dynamic navigation menu that displays different modules based on the logged-in user's role (Guest, Super Admin, Admin, Donor, Beneficiary).
- **Public Campaigns Page**: Created a public page at `/campaigns` to display verified and open leads to potential donors.
- **Organization Page**: Created a public page at `/organization` to display verifiable details of the registered organization.
- **Services Summary**: Created a page (`/services`) to display a list of all configured backend and external services.
- **Dependency Map**: Created a page (`/dependencies`) to visualize the connections between the application's services.
- **User Profile**: Created a page (`/profile`) for users to manage their settings, including notification preferences.
- **Admin Dashboard**: Created at `/admin` to show key stats.
- **Donation Management**: Created a page at `/admin/donations` to list all donations with their status.

### User Roles & Permissions

- Defined user roles: Guest, Donor, Beneficiary, Referral, Super Admin, Admin (with sub-categories: Normal admin, Founder, Co-founder, Finance).
- **Flexible Roles**: Users can hold multiple roles (e.g., a Donor can also be a Beneficiary) and can switch between profiles.
- Added Privileges and Groups to the user model.

### Donation Management

- **Statuses**: "Pending verification", "Verified", "Failed/Incomplete", "Allocated"
- **Categories**: 'Zakat', 'Sadaqah', 'Fitr', 'Lillah', 'Kaffarah'
- **Purposes**: 'Education', 'Deen', 'Hospital', 'Loan and Relief Fund', 'To Organization Use'


## Optional Add-Ons (Later Stages)

- PDF donation receipt (auto-send)
- Donation target tracker (e.g., Zakat obligation calculator)
- Anonymous donation toggle
- Multilingual UI (Arabic, Urdu, English, Hindi, Marathi)
