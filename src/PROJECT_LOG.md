# Project Log - Baitul Mal Samajik Sanstha (Solapur)

This document tracks the features and changes requested for the project.

## Guiding Principles

- **Interactive Dashboards**: All dashboard cards and metrics should be clickable links that navigate the user to a relevant, pre-filtered view of the underlying data. This makes the dashboard an interactive entry point for data exploration and management, not just a static display.
- **Robust Error Handling & User Feedback**: The system must provide clear, specific, and actionable feedback for errors.
    - **No Generic Errors**: Avoid vague messages like "An error occurred." Instead, propagate and display the specific error message from the server (e.g., "Duplicate transaction ID found").
    - **UI Feedback**: Invalid form fields should be clearly highlighted (e.g., red border/label) with an inline message explaining the requirement.
    - **Actionable Guidance**: When possible, errors should guide the user toward a solution (e.g., "A user with this email already exists. Please try logging in.").
    - **Developer-Friendly Logging**: Server-side logs must contain sufficient context to facilitate Root Cause Analysis (RCA) and debugging.
- **URL Encoding for Dynamic Routes**: To prevent 404 errors, any dynamic segment in a URL (e.g., `[id]`) must be properly encoded if the ID might contain special characters (such as `_`, `/`, `?`). When creating a `Link` component for a path like `/items/[id]/edit`, the `href` must be constructed as `` `/items/${encodeURIComponent(item.id)}/edit` ``. This is a critical step for ensuring routing reliability.
- **Secure Data Access Model**: The application employs a two-collection strategy to enforce security and privacy.
    - **Private Collections (`users`, `leads`, `donations`)**: These contain sensitive data and are protected by Firestore Security Rules, allowing access only to authenticated users with specific roles (e.g., an admin, or a user accessing their own data).
    - **Public Collections (`publicLeads`, `publicCampaigns`)**: These contain sanitized, non-sensitive subsets of data intended for public display. Security rules on these collections permit read-only access for all users, including unauthenticated guests.
    - **Server-Side Logic**: Server-side functions are responsible for populating the public collections based on the status of items in the private collections (e.g., a lead is copied to `publicLeads` only when its status is set to "Publish").

---

## Project Status & Next Steps

### Pending Configurations (Blocked)
- **OTP Login**: The Twilio integration for sending OTPs via SMS is built but requires a live Account SID, Auth Token, and Verify Service SID to be functional.
- **Email Notifications**: The Nodemailer setup for sending emails is ready but needs valid SMTP credentials (host, user, password) to be enabled.

### Core Features (Complete)
- **User Management**: Admins can create, view, and manage users with multiple roles from the `/admin/user-management` dashboard.
- **Lead/Case Management**: Admins can create new help cases (leads) for beneficiaries from the `/admin/leads` dashboard. Beneficiaries can submit their own help requests from the `/request-help` page.
- **Donation Management**: Admins can manually record new donations from the `/admin/donations` dashboard.
- **Dynamic User Dashboards**: The user home page (`/home`) and specific pages like `/my-donations` and `/my-cases` now dynamically load and display data relevant to the logged-in user's active role.
- **Authentication**: A robust login system is in place, supporting both password and OTP methods. A role-switcher dialog correctly prompts users with multiple roles to select a profile for their session.

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
- **User Profile**: Created a page at `/profile` to manage settings and view activity history.
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

- **Statuses**: "Pending", "Verified", "Failed/Incomplete", "Allocated"
- **Categories**: 'Zakat', 'Sadaqah', 'Fitr', 'Lillah', 'Kaffarah'
- **Purposes**: 'Education', 'Deen', 'Hospital', 'Loan and Relief Fund', 'To Organization Use'


## Optional Add-Ons (Later Stages)

- PDF donation receipt (auto-send)
- Donation target tracker (e.g., Zakat obligation calculator)
- Anonymous donation toggle
- Multilingual UI (Arabic, Urdu, English, Hindi, Marathi)
