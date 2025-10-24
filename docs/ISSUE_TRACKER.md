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
| 04 | 2024-07-29    | AI Assistant| Core business logic for donation/lead/user management was not implemented. | Created pages and server actions for admins to add users, leads, and donations. | AI Assistant | 2024-07-30    |
| 05 | 2024-07-29    | AI Assistant| The authenticated user home page (`/home`) was static and had data fetching bugs. | Made the page dynamic by fetching and displaying real user-specific data based on the active role. | AI Assistant | 2024-07-30    |
| 06 | 2024-07-30    | AI Assistant| Login flow was broken; role-switcher dialog was not appearing. | Corrected session initialization logic in the app shell and fixed phone number formatting. | AI Assistant | 2024-07-30    |
| 07 | 2024-07-30    | AI Assistant| `use server` files were exporting non-function objects, causing a Next.js runtime error. | Refactored Genkit flows to move Zod schemas into a separate `src/ai/schemas.ts` file. | AI Assistant | 2024-07-30    |
| 08 | 2024-07-30    | AI Assistant| `ReferenceError` in navigation component because `Database` icon was not imported. | Added the `Database` icon to the `lucide-react` import statement in `src/components/nav.tsx`. | AI Assistant | 2024-07-30    |
| 09 | 2024-07-30    | User          | Navigating to a donation edit page with a special character ID resulted in a 404 error. | Wrapped the dynamic ID segment in `encodeURIComponent()` when creating the `<Link>` `href`. | AI Assistant | 2024-07-30    |
| 10 | 2024-07-31    | User          | `Cannot read properties of null (reading 'useContext')` in `src/app/services/page.tsx` | The `CardFooter` component was used without being imported. Added it to the import statement. | AI Assistant | 2024-07-31    |
| 11 | 2024-07-31    | User          | Inconsistent UI/UX, missing features like linking beneficiaries, and confusing error messages. | Performed a full-system audit and fixed UI, error handling, and data models. | AI Assistant | 2024-07-31    |
| 12 | 2024-07-31    | User          | Inconsistent toast UI and incorrect role-checking for header notifications. | Standardized toast UI and fixed `app-shell` logic for admin notifications. | AI Assistant | 2024-07-31    |
| 13 | 2024-08-01    | User          | "Publish" lead action was not working, and dashboard cards were inaccurate. | Fixed `handleQuickStatusChange` action and updated dashboard card logic. | AI Assistant | 2024-08-01    |
| 14 | 2024-08-01    | User          | Vague error message "Failed to update lead" appeared when editing a lead. | Corrected `catch` block in the update lead action to return a more specific error message. | AI Assistant | 2024-08-01    |
| 15 | 2024-08-01    | User          | Leads without a linked beneficiary were not appearing in the "All Leads" table. | Made filtering logic in `leads-client.tsx` more robust to handle leads without a beneficiary object. | AI Assistant | 2024-08-01    |
| 16 | 2024-08-01    | User          | "Unexpected response from server" runtime error on `/admin/leads` page. | Modified `leads-client.tsx` to handle cases where initial settings from the server might be null. | AI Assistant | 2024-08-01    |
| 17 | 2024-08-01    | User          | Admin-specific notifications were showing for non-admin active roles. | Implemented an intelligent notification system with role-switching prompts. | AI Assistant | 2024-08-01    |
| 18 | 2025-10-01    | User          | `ReferenceError: Users is not defined` in letterhead document. | Added missing `Users` icon import to `letterhead-document.tsx`. | AI Assistant | 2025-10-01    |
| 19 | 2025-10-01    | User          | Letterhead preview was not updating with custom field content. | Refactored `letterhead-document.tsx` to pass props correctly to the preview component. | AI Assistant | 2025-10-01    |
| 20 | 2025-10-01    | User          | Letterhead customization checkboxes were missing. | Re-implemented the "Inclusion Options" section with checkboxes in `letterhead-document.tsx`. | AI Assistant | 2025-10-01    |
| 21 | 2025-10-01    | User          | "Create User" button incorrectly shown on "Add Lead" page. | Fixed logic in `add-lead-form.tsx` to display the user creation form inline correctly. | AI Assistant | 2025-10-01    |
| 22 | 2025-10-01    | User          | Build error: `DonorsPageDataLoader` was an async client component. | Refactored `donors`, `beneficiaries`, and `referrals` pages to separate server-side data fetching. | AI Assistant | 2025-10-01    |
| 23 | 2025-10-01    | User          | Runtime error: `handleSubmit is not defined` on the Add Lead page. | Added missing `handleSubmit` function from `useForm` hook in `add-lead-form.tsx`. | AI Assistant | 2025-10-01    |
| 24 | 2025-10-01    | User          | Runtime error: `Element type is invalid...` due to missing `User` icon import. | Added the `User` icon import from `lucide-react` to `/profile/settings/page.tsx`. | AI Assistant | 2025-10-01    |
| 25 | 2025-10-01    | User          | Build error: `User is not exported from @/services/user-service`. | Corrected all invalid import paths for the `User` type to point to `types.ts`. | AI Assistant | 2025-10-01    |
| 26 | 2025-10-01    | User          | Runtime error: `extractedDetails is not defined`. | Re-declared the `extractedDetails` state variable in `add-lead-form.tsx`. | AI Assistant | 2025-10-01    |
| 27 | 2025-10-01    | User          | Build error during `/admin/leads/add` compilation. | Fixed an incorrect import path for the `User` type in `src/app/admin/leads/add/actions.ts`. | AI Assistant | 2025-10-01    |
| 28 | 2025-10-01    | User          | Inconsistent theme colors on UI elements. | Audited and applied `text-primary` and `text-muted-foreground` classes consistently. | AI Assistant | 2025-10-01    |
| 29 | 2025-10-01    | User          | Repository link in `README.md` was broken. | Corrected the `href` for the GitHub repository link. | AI Assistant | 2025-10-01    |
| 30 | 2025-10-02    | User          | Build error: `Element type is invalid` because `LeadsPageClient` was not correctly imported. | Corrected the file structure and import paths for all admin list pages. | AI Assistant | 2025-10-02    |
| 31 | 2025-10-23    | User          | Build error: `require.extensions is not supported by webpack`. | Refactored AI flows and Zod schemas into separate, dedicated files to enforce client/server boundary. | AI Assistant | 2025-10-23    |
| 32 | 2025-10-23    | User          | Build error: `ensureCollectionsExist is not exported`. | Corrected the import path for the function in `seed-sample-data.ts`. | AI Assistant | 2025-10-23    |
| 33 | 2025-10-23    | User          | Inconsistent Navigation and broken links. | Deleted `src/components/nav.tsx`, reorganized `src/app/nav.tsx`, and updated all page structures. | AI Assistant | 2025-10-23    |
