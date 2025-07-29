# Project Log - Baitul Mal Samajik Sanstha (Solapur)

This document tracks the features and changes requested for the project.

## Project Status & Next Steps

### Pending Configurations (Blocked)
- **OTP Login**: The Twilio integration for sending OTPs via SMS is built but requires a live Account SID, Auth Token, and Verify Service SID to be functional.
- **Email Notifications**: The Nodemailer setup for sending emails is ready but needs valid SMTP credentials (host, user, password) to be enabled.

### Pending Feature Development (In Progress)
- **Core Business Logic**: The foundational services for creating users, donations, and leads are in place. The next step is to build the UI and workflows for admins to manage them (e.g., verifying a donation, allocating funds to a lead).
- **Dynamic User Home Page**: The authenticated user's home page (`/home`) is currently static. The next major task is to make this page dynamic by fetching and displaying real, user-specific data (e.g., a donor's donation history, a beneficiary's case status).


---

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
- **User Profile**: Created a page (`/profile`) for users to manage their settings, including notification preferences and viewing their activity history.
- **Admin Dashboard**: Created at `/admin` to show key stats.
- **Donation Management**: Created a page at `/admin/donations` to list all donations with their status.

### User Roles & Permissions

- **Defined a clear RBAC model**:
  - **Privileges**: Granular permissions for individual actions (e.g., `canVerifyDonations`).
  - **Roles**: Collections of privileges that define a user's capabilities (e.g., `Finance Admin`, `Super Admin`).
  - **Groups**: Collections of users for organizational purposes (e.g., `Founders`, `Finance Team`).
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