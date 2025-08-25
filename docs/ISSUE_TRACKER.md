# Issue Tracker - Baitul Mal Samajik Sanstha

This document tracks bugs, issues, and their resolution status for the project.

## How to Use

When a new issue is identified, add a new row to the "Open Issues" table. Once the issue is resolved, move it to the "Resolved Issues" table and fill in the resolution details.

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
| 10 | 2024-07-31    | AI Assistant| `Cannot read properties of null (reading 'useContext')` in `src/app/services/page.tsx` | The `CardFooter` component was used without being imported. Added it to the import statement. | AI Assistant | 2024-07-31    |
