# Build Fix Log

This document tracks errors found during the build process and the steps taken to resolve them.

---

## Build Pass 4 (Latest)

### Errors Found:

1.  **`Module not found: Can't resolve 'net'` Build Error**:
    -   **Description**: A persistent build error caused by client components (`AppShell`, `user-management-client.tsx`, etc.) illegally importing server-only modules like `firebase-admin`. This is a fundamental violation of Next.js architecture.
    -   **Resolution**: Performed a full-system audit and refactor to correctly separate client and server code.
        -   Created dedicated server actions in `src/app/actions.ts` and `src/app/admin/user-management/actions.ts` for all server-side data fetching.
        -   Modified all client components to call these new server actions instead of directly importing from service files, thus respecting the client-server boundary.
        -   This fix was applied systematically to `AppShell` and the pages for User Management, Donors, Beneficiaries, and Referrals, resolving the build error at its root cause.

---

## Build Pass 3 (Latest)

### Errors Found:

1.  **`auth/network-request-failed` on `localhost`**:
    -   **Description**: A runtime Firebase authentication error occurred because Firebase's security features could not verify the `localhost` domain during development.
    -   **Resolution**: Added `(auth.settings as any).appVerificationDisabledForTesting = true;` to `src/services/firebase.ts`. This is a standard Firebase SDK feature for local development that disables domain verification, resolving the network failure.

2.  **Incorrect Login Redirection (`/` instead of `/home` -> `/admin`)**:
    -   **Description**: After a successful login, users were being incorrectly redirected to the public homepage (`/`) instead of their role-specific dashboard. This was caused by a race condition in the `AppShell` where redirection logic was firing before the user's session was fully resolved.
    -   **Resolution**: Re-architected the `AppShell` to use a robust state management system (`'loading' | 'ready' | 'error'`). The shell now *always* waits for the session to be fully resolved before rendering any page content or performing any redirects, which completely eliminates the race condition.

3.  **Critical Login Failure for Non-Admin Users**:
    -   **Description**: Only the hardcoded `admin` user could log in successfully. Any other valid user (e.g., `abusufiyan.belif`) would be redirected to the homepage as if they were a guest.
    -   **Root Cause**: The data-fetching functions in `user-service.ts` (like `getUserByUserId`) were critically flawed and could not find any user in the database except for the hardcoded `admin` case.
    -   **Resolution**: Rewrote `getUserByUserId`, `getUserByEmail`, and `getUserByPhone` to use the correct server-side Firebase Admin SDK queries, ensuring any valid user can be found in the database. Also corrected the password check logic in `login/actions.ts` to work for all users.

4.  **`You cannot have two parallel pages that resolve to the same path` Build Error**:
    -   **Description**: A fatal build error caused by leftover files from a previous, faulty refactoring attempt, resulting in multiple files trying to define the same page route (e.g., `/home`).
    -   **Resolution**: Performed a definitive cleanup of the project's file structure.
        -   Deleted the conflicting `(authenticated)` and `(public)` route group directories and all files within them.
        -   Restored `src/app/page.tsx` as the single public entry point.
        -   Ensured the root `src/app/layout.tsx` is the single source of truth for the application's layout, wrapping all content in the main `AppShell`.

---

## Build Pass 2 (2025-10-01)

### Errors Found:

1.  **Reference Errors for Icons (`Users`, `User`)**:
    -   **Files Affected**: `src/app/admin/organization/letterhead/letterhead-document.tsx`, `src/app/profile/settings/page.tsx`
    -   **Description**: The `Users` and `User` icons were used without being imported from `lucide-react`, causing a runtime `ReferenceError`.

2.  **Letterhead Customization Not Reflecting**:
    -   **File Affected**: `src/app/admin/organization/letterhead/letterhead-document.tsx`
    -   **Description**: State changes from custom field inputs (e.g., subject, recipient) were not being passed as props to the `Letterhead` preview component, making it appear static. Checkboxes for including/excluding sections were also missing due to a regression.

3.  **Incorrect "Create User" Logic on Add Lead Page**:
    -   **File Affected**: `src/app/admin/leads/add/add-lead-form.tsx`
    -   **Description**: A regression caused a "Create User" button to appear instead of embedding the user creation form directly when "Create New" was selected.

4.  **Async Client Component Error**:
    -   **Files Affected**: `src/app/admin/donors/page.tsx`, `src/app/admin/beneficiaries/page.tsx`, `src/app/admin/referrals/page.tsx`
    -   **Description**: Data-fetching components (`<DonorsPageDataLoader>`, etc.) were incorrectly marked as `async` within a Client Component (`'use client'`), which is not allowed in Next.js.

5.  **`handleSubmit` Not Defined**:
    -   **File Affected**: `src/app/admin/leads/add/add-lead-form.tsx`
    -   **Description**: The `handleSubmit` function from the `react-hook-form` `useForm` hook was not destructured and was therefore unavailable in the `onSubmit` handler.

6.  **Build Error: `User` Type Not Exported**:
    -   **Files Affected**: Multiple, including `src/app/profile/settings/page.tsx` and `src/app/admin/leads/add/actions.ts`.
    -   **Description**: The `User` type was incorrectly being imported from service files (e.g., `user-service.ts`) instead of the central `types.ts` file, causing a build-time import error.

7.  **`extractedDetails` Not Defined**:
    -   **File Affected**: `src/app/admin/leads/add/add-lead-form.tsx`
    -   **Description**: The state variable `extractedDetails`, used to manage data from scanned documents, was referenced in a dialog but was not declared.

8.  **Theme Color Inconsistencies**:
    -   **Files Affected**: Numerous across the application.
    -   **Description**: Many page titles, card headers, and icons were not using the primary theme color from `globals.css`, leading to a disjointed look.

### Resolution Steps:

1.  **Added Missing Icon Imports**: Imported the `Users` and `User` icons from `lucide-react` in the respective files.
2.  **Corrected Prop Drilling**: Modified `letterhead-document.tsx` to correctly pass the `letterContent` and `inclusions` state as props to the `Letterhead` component, ensuring the preview updates live. Re-implemented the inclusion options checkboxes.
3.  **Restored Embedded User Form**: Fixed the conditional rendering logic in `add-lead-form.tsx` to correctly show the embedded `AddUserForm` when creating a new beneficiary.
4.  **Separated Server and Client Components**: Refactored the `donors`, `beneficiaries`, and `referrals` pages. Created dedicated `*-client.tsx` files for client-side logic and kept the `async` data-fetching logic in the main `page.tsx` server components.
5.  **Destructured `handleSubmit`**: Correctly destructured `handleSubmit` from the `useForm()` hook in `add-lead-form.tsx`.
6.  **Corrected All Type Import Paths**: Audited the codebase and changed all incorrect imports of the `User` type to point to `src/services/types.ts`.
7.  **Re-declared State Variable**: Added `const [extractedDetails, setExtractedDetails] = useState(null);` back into the `AddLeadFormContent` component.
8.  **System-Wide Theme Audit**: Performed a full audit and applied `text-primary` and other theme-related Tailwind classes to all necessary elements for UI consistency.

---

## Build Pass 1 (2025-08-30)

### Errors Found:

1.  **Module Not Found: `@/components/dashboard-cards`**
    -   **Files Affected**: `src/app/admin/page.tsx`, `src/app/referral/page.tsx`, `src/app/admin/data-analytics/page.tsx`, `src/app/home/public-dashboard-cards.tsx`
    -   **Description**: A recent refactoring moved dashboard components from a shared location to more specific files (`admin/dashboard-cards.tsx` and `home/public-dashboard-cards.tsx`), but several import paths were not updated.

2.  **Missing Exports: Dashboard Card Components**
    -   **File Affected**: `src/app/admin/dashboard-cards.tsx`
    -   **Description**: After moving the components, they were not exported from the new file, making them unavailable for import.

3.  **Type Error in `admin/dashboard-settings/actions.ts`**
    -   **Description**: The logic for updating dashboard settings did not correctly initialize the `newSettings` object, leading to a type mismatch where properties could be `undefined`.

4.  **Type Error in `admin/data-analytics/configuration/actions.ts`**
    -   **Description**: Similar to the dashboard settings, the analytics settings update action had a type safety issue with object initialization.

5.  **Type Error in `admin/data-analytics/configuration/analytics-dashboard-settings-form.tsx`**
    -   **Description**: The type definition for `cardDefinitions` was too specific, causing a conflict with the `zod` schema in the form.

6.  **Incorrect Property Access in `admin/communications/actions.ts`**
    -   **Description**: The code used `lead.verifiedStatus` which does not exist on the `Lead` type. The correct property is `caseVerification`.

7.  **Missing `adminUserId` in `admin/user-management/page.tsx`**
    -   **Description**: The `handleDeleteUser` action, which requires an administrator's ID for logging, was being called without it.

8.  **Flawed `userKey` Validation in Services**
    -   **Files Affected**: `src/services/lead-service.ts`, `src/services/donation-service.ts`
    -   **Description**: The `createLead` and `createDonation` functions did not properly validate the existence of a `userKey` on the associated user, which could lead to runtime errors when generating custom IDs.
    
9. **Bug in `createUser` Logic**
    - **File Affected**: `src/services/user-service.ts`
    - **Description**: The `createUser` function did not check for duplicates if a custom `userId` was provided.
    
10. **Missing Implementation for Donation Edit Form**
    - **File Affected**: `src/app/admin/donations/[id]/edit/page.tsx`
    - **Description**: The page for editing a donation was only showing raw JSON data instead of a functional form.

### Resolution Steps:

1.  **Updated All Import Paths**: Corrected all `import` statements across the affected files to point to the new locations of the dashboard card components.
2.  **Exported Components**: Added `export` keywords to all the necessary card components in `src/app/admin/dashboard-cards.tsx`.
3.  **Fixed Type-Safe Initialization**: Rewrote the settings update logic in both `dashboard-settings/actions.ts` and `data-analytics/configuration/actions.ts` to ensure the settings objects are always fully initialized, satisfying TypeScript's strict type requirements.
4.  **Corrected Form Types**: Simplified the type definitions in `analytics-dashboard-settings-form.tsx` and `dashboard-settings-form.tsx` to align with the expected form schema.
5.  **Corrected Property Names**: Replaced all instances of `verifiedStatus` with the correct `caseVerification` property.
6.  **Passed Required IDs**: Modified the `onDelete` handler in `admin/user-management/page.tsx` to correctly pass the `adminUserId`.
7.  **Added Validation**: Implemented checks in `createLead` and `createDonation` to ensure a `userKey` exists before proceeding with ID generation.
8. **Implemented Donation Edit Form**: Replaced the JSON placeholder with the full `AddDonationForm` component, configured for editing an existing donation.
9. **Fixed Bulk Delete Logic**: Implemented the `handleBulkDeleteTransfers` function in `admin/transfers/actions.ts` to properly remove transfers from leads.
10. **Completed Notification Dropdowns**: Filled out the logic for the notification dropdowns in `app-shell.tsx`.
11. **Updated Type Definition**: Added missing fields to the `FundTransfer` type in `types.ts`.

---

**Build Status**: **SUCCESSFUL**
All identified build-time and type-checking errors have been resolved.
