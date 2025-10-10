# Issue Tracker - Baitul Mal Samajik Sanstha

This document tracks bugs, issues, and their resolution status for the project.

---

## Open Issues

| ID | Date Reported | Reported By | Description | Status | Required Input |
| -- | ------------- | ----------- | ----------- | ------ | -------------- |
| 02 | 2024-07-29    | AI Assistant| OTP Login via Twilio is not functional. The UI and Genkit flows are implemented, but live credentials are required to activate the service. | **Blocked** | Twilio Account SID, Auth Token, and Verify Service SID |
| 03 | 2024-07-29    | AI Assistant| Email sending via Nodemailer is not functional. The UI and Genkit flows are implemented, but live credentials are required to activate the service. | **Blocked** | SMTP Host, Port, User, and Password |
|    |               |             |             |        |                |

---

## Resolved Issues

| ID | Date Reported | Reported By | Description | Resolution | Resolved By | Date Resolved |
| -- | ------------- | ----------- | ----------- | ---------- | ----------- | ------------- |
| 01 | 2024-07-29    | AI Assistant| Firebase services (Auth, Firestore) are not connected. | Retrieved config via tool and populated `.env` file. | AI Assistant | 2024-07-29    |
| 04 | 2024-07-29    | AI Assistant| Core business logic for donation/lead/user management was not implemented. | Created pages and server actions for admins to add users, leads, and donations from the dashboard. Also created page for beneficiaries to request help. | AI Assistant | 2024-07-30    |
| 05 | 2024-07-29    | AI Assistant| The authenticated user home page (`/home`) was static and had data fetching bugs. | Made the page dynamic by fetching and displaying real user-specific data (donations for donors, cases for beneficiaries) based on the active role. Fixed all related data fetching bugs. | AI Assistant | 2024-07-30    |
| 06 | 2024-07-30    | AI Assistant| Login flow was broken; role-switcher dialog was not appearing for users with multiple roles after login. | Corrected session initialization logic in the app shell and fixed phone number formatting in login actions to ensure the user is found and the dialog appears correctly. | AI Assistant | 2024-07-30    |
| 07 | 2024-07-30    | AI Assistant| `use server` files were exporting non-function objects, causing a Next.js runtime error. | Refactored Genkit flows to move Zod schemas into a separate `src/ai/schemas.ts` file, ensuring server files only export async functions. | AI Assistant | 2024-07-30    |
| 08 | 2024-07-30    | AI Assistant| `ReferenceError` in navigation component because `Database` icon was not imported. | Added the `Database` icon to the `lucide-react` import statement in `src/components/nav.tsx`. | AI Assistant | 2024-07-30    |
| 09 | 2024-07-30    | User          | Navigating to a donation edit page with an ID containing special characters (e.g., underscores) resulted in a 404 error. | Wrapped the dynamic ID segment in `encodeURIComponent()` when creating the `<Link>` `href`. This ensures Next.js routing handles special characters correctly. | AI Assistant | 2024-07-30    |
| 10 | 2024-07-31    | User          | `Cannot read properties of null (reading 'useContext')` in `src/app/services/page.tsx` | The `CardFooter` component was used without being imported. Added it to the import statement. | AI Assistant | 2024-07-31    |
| 11 | 2024-07-31    | User          | Inconsistent UI/UX, including missing features like linking beneficiaries to existing leads and confusing error messages. | Performed a full-system audit and implemented fixes for UI consistency, error handling, and data models. Added the ability to link beneficiaries on the lead edit page and made error messages more specific. | AI Assistant | 2024-07-31    |
| 12 | 2024-07-31    | User          | Inconsistent UI for toast notifications and incorrect role-checking logic for header notifications. | Standardized toast UI to always include an OK and a conditional Copy button. Fixed `app-shell` logic to correctly show/hide admin notifications based on the user's *active* role. | AI Assistant | 2024-07-31    |
| 13 | 2024-08-01    | User          | "Publish" lead action was not working, and dashboard cards for open/published leads were inaccurate. | Fixed the `handleQuickStatusChange` action and updated dashboard card logic to correctly count leads with `caseAction: 'Publish'`. | AI Assistant | 2024-08-01    |
| 14 | 2024-08-01    | User          | Vague error message "Failed to update lead: Failed to update lead" appeared when editing a lead. | Corrected the `catch` block in the update lead server action to return the original, more specific error message from the service layer. | AI Assistant | 2024-08-01    |
| 15 | 2024-08-01    | User          | Leads without a linked beneficiary were not appearing in the "All Leads" table. | Made the filtering logic in `leads-client.tsx` more robust to handle leads that do not have an associated beneficiary object. | AI Assistant | 2024-08-01    |
| 16 | 2024-08-01    | User          | An "unexpected response from server" runtime error occurred on the `/admin/leads` page. | Modified the `leads-client.tsx` to handle cases where initial settings from the server might be null, preventing the client/server mismatch. | AI Assistant | 2024-08-01    |
| 17 | 2024-08-01    | User          | Admin-specific notifications were showing for non-admin active roles. | Implemented an intelligent notification system that always shows all pending actions to a multi-role user but requires a role switch if the active role lacks permissions. | AI Assistant | 2024-08-01    |
| 18 | 2025-10-01    | User          | `ReferenceError: Users is not defined` in letterhead document. | Added the missing `Users` icon import from `lucide-react` to `src/app/admin/organization/letterhead/letterhead-document.tsx`. | AI Assistant | 2025-10-01    |
| 19 | 2025-10-01    | User          | Letterhead preview was not updating with custom field content. | Refactored the `letterhead-document.tsx` component to pass props correctly to the preview component, ensuring a live preview. | AI Assistant | 2025-10-01    |
| 20 | 2025-10-01    | User          | Letterhead customization checkboxes were missing after a previous regression. | Re-implemented the "Inclusion Options" section with checkboxes in `letterhead-document.tsx` to allow selective display of letterhead elements. | AI Assistant | 2025-10-01    |
| 21 | 2025-10-01    | User          | "Create User" button was incorrectly showing on the "Add Lead" page instead of embedding the form. | Fixed the logic in `src/app/admin/leads/add/add-lead-form.tsx` to correctly display the user creation form inline when "Create New" is selected. | AI Assistant | 2025-10-01    |
| 22 | 2025-10-01    | User          | Build error: `DonorsPageDataLoader` was an async client component. | Refactored `donors`, `beneficiaries`, and `referrals` pages to separate server-side data fetching from client-side UI rendering, resolving the build error. | AI Assistant | 2025-10-01    |
| 23 | 2025-10-01    | User          | Runtime error: `handleSubmit is not defined` on the Add Lead page. | Added the missing `handleSubmit` function from the `useForm` hook in `src/app/admin/leads/add/add-lead-form.tsx`. | AI Assistant | 2025-10-01    |
| 24 | 2025-10-01    | User          | Runtime error: `Element type is invalid...` due to missing `User` icon import on profile page. | Added the `User` icon import from `lucide-react` to `src/app/profile/settings/page.tsx`. | AI Assistant | 2025-10-01    |
| 25 | 2025-10-01    | User          | Build error: `User is not exported from @/services/user-service`. | Corrected all invalid import paths for the `User` type to point to the correct central `types.ts` file across multiple components. | AI Assistant | 2025-10-01    |
| 26 | 2025-10-01    | User          | Runtime error: `extractedDetails is not defined` on the Add Lead page. | Re-declared the `extractedDetails` state variable in `src/app/admin/leads/add/add-lead-form.tsx` to fix the reference error. | AI Assistant | 2025-10-01    |
| 27 | 2025-10-01    | User          | Build error during compilation of `/admin/leads/add`. | Fixed an incorrect import path for the `User` type in `src/app/admin/leads/add/actions.ts`. | AI Assistant | 2025-10-01    |
| 28 | 2025-10-01    | User          | Inconsistent theme colors on page headings and UI elements. | Performed a full-system audit and applied `text-primary` and `text-muted-foreground` classes consistently across all pages and components to enforce the theme. Added new status colors to `globals.css`. | AI Assistant | 2025-10-01    |
| 29 | 2025-10-01    | User          | Repository link in `README.md` was broken. | Corrected the `href` for the GitHub repository link in `README.md`. | AI Assistant | 2025-10-01    |
| 30 | 2025-10-02    | User          | Build error: `Element type is invalid` because `LeadsPageClient` was not correctly imported. | Corrected the file structure and import paths for all admin list pages (`donors`, `leads`, `campaigns`, etc.) to use a proper Server Component (`page.tsx`) for data fetching and a Client Component (`*-client.tsx`) for UI, resolving the build error and a data integrity issue where tables appeared empty. | AI Assistant | 2025-10-02    |


```