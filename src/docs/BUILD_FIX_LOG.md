# Build Fix Log

This document tracks errors found during the build process and the steps taken to resolve them.

---

## Build Pass 6 (Latest)

### Errors Found:

1.  **`Runtime Error: Only plain objects...`**:
    -   **Description**: A persistent hydration error caused by passing non-serializable objects (like Firestore `Timestamp`s or `Date` objects) from Server Components to Client Components without proper serialization.
    -   **Root Cause**: While several pages were fixed, a full audit revealed that the data-fetching loaders for pages like `/admin/donations/[id]/edit` and `/admin/leads/[id]/edit` were still passing raw data with complex objects.
    -   **Resolution**:
        -   Performed a final, comprehensive audit of every single data loader and server action in the application.
        -   Applied a strict `JSON.parse(JSON.stringify(data))` to all data being passed as props from a Server Component to a Client Component.
        -   This ensures that complex objects like Firestore `Timestamp`s are converted to simple strings before crossing the server-client boundary, permanently resolving this class of error. This fix was applied to the edit pages for donations and leads, and the "My Cases" page.

2.  **`Server action getQuotes failed: {}`**:
    -   **Description**: A recurring error where the server action would fail with an empty object `{}`, making it impossible to debug. This happened when the `inspirationalQuotes` collection did not exist in a fresh database.
    -   **Root Cause**: Errors from Firestore (like "collection not found" or "permission denied") were not being properly serialized and passed from the `getInspirationalQuotesFlow` back to the `getQuotes` server action.
    -   **Resolution**:
        -   Modified `getAllQuotes` in `quotes-service.ts` to gracefully return an empty array `[]` if the collection doesn't exist.
        -   Modified `getInspirationalQuotesFlow` to re-throw a standard `Error` object if the database call fails, ensuring a proper error message is always available for logging in the server action.

3.  **App Crash on Missing Firestore Indexes**:
    -   **Description**: The application would crash if a query required a Firestore index that had not been created yet (e.g., ordering leads by date).
    -   **Resolution**:
        -   Refactored all data-fetching services (`lead-service`, `donation-service`, `user-service`) to be resilient to missing indexes.
        -   Each function now uses a `try...catch` block. It first attempts the query *with* sorting. If it fails due to a missing index, the `catch` block retries the query *without* sorting and then sorts the data in memory.
        -   This prevents the app from crashing and ensures data is always displayed, while also logging a clear, developer-friendly error message indicating which index needs to be created.

---

## Build Pass 5

### Errors Found:

1.  **Incomplete Data Deletion**:
    -   **Description**: The "Erase" functions on the seed page were only deleting a single document or batch of documents from each collection instead of clearing them completely. This was due to a flawed `while` loop in the `deleteCollection` utility.
    -   **Resolution**: Corrected the loop in `seed-service.ts` to continuously fetch and delete batches of documents until the collection is empty, ensuring a full and proper erase operation every time.

2.  **Core Team Deletion Failure**:
    -   **Description**: The "Erase Core Team" function consistently reported "Erased 0 core team member(s)" because it was failing to correctly query for the users to be deleted.
    -   **Resolution**: Fixed the query logic in `eraseCoreTeam` within `seed-service.ts` to correctly identify and delete the specified user accounts from both Firestore and Firebase Authentication.

3.  **Auth Deletion Permission Error**:
    -   **Description**: The "Erase All Auth Users" function failed with an "insufficient permission" error because the application's service account lacked the necessary IAM role to manage Firebase Authentication.
    -   **Resolution**:
        1.  Updated the `scripts/verify-iam.js` file to include `roles/firebase.admin` in its list of required roles.
        2.  Updated `docs/TROUBLESHOOTING.md` to reflect this new requirement, ensuring users can fix this permission issue by running `npm run fix:iam`.

---

## Build Pass 4

### Errors Found:
1.  **Orphaned Firebase Auth Records on User Deletion**:
    -   **Description**: Deleting a user from the application only removed their Firestore document, leaving behind their authentication record in Firebase Auth. This could lead to login errors if the user tried to re-register or log in with the same credentials.
    -   **Resolution**: Modified `user-service.ts` to ensure that when a user is deleted, the function first deletes them from Firebase Authentication and *then* deletes their Firestore document, ensuring a complete and clean removal.

2.  **Inconsistent Dashboard Data**:
    -   **Description**: Different dashboards (e.g., Public vs. Admin) were fetching campaign data from different Firestore collections (`publicCampaigns` vs. `campaigns`), leading to discrepancies in what was displayed.
    -   **Resolution**: Standardized data fetching across all dashboard components (`admin/dashboard-cards.tsx`, `home/public-dashboard-cards.tsx`, `donor/donor-dashboard-content.tsx`, `beneficiary/beneficiary-dashboard-content.tsx`) to pull from the same, reliable server actions, ensuring data consistency for all user roles.

3.  **Idempotency Bug in Seeding**:
    -   **Description**: The "Seed Sample Data" function would create duplicate campaigns and leads every time it was run, as it did not check for pre-existing data.
    -   **Resolution**: Refactored the `seed-service.ts` to be fully idempotent. It now assigns static, predictable IDs to all seeded campaigns and uses `setDoc` with `{ merge: true }`. This ensures that running the script multiple times will only create or overwrite the same records, preventing any duplication.

4.  **Missing "Erase" Functionality on Seed Page**:
    -   **Description**: The `/admin/seed` page was missing buttons and logic to erase "Application Settings" and "Firebase Auth Users".
    -   **Resolution**: Implemented the `eraseAppSettings` and `eraseFirebaseAuthUsers` functions in `seed-service.ts` and added corresponding "Erase" buttons to the UI, providing full control over the seeding process.

5.  **Build Failure due to Unterminated Template**:
    -   **Description**: A stray ` ```` ` character at the end of `seed-service.ts` was causing the Next.js build to fail with a syntax error.
    -   **Resolution**: Removed the invalid character from the file.

6.  **Build Failure: `LeadsPageClient` Not Found**:
    -   **Description**: A build error "Element type is invalid" occurred because `src/app/admin/leads/leads-client.tsx` was an empty file, causing the import in `page.tsx` to resolve to `undefined`.
    -   **Resolution**: Restored the correct and complete content for the `LeadsPageClient` component.

---

## Build Pass 3

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

4.  **`Module not found: Can't resolve 'net'` Build Error**:
    -   **Description**: A persistent build error caused by client components (`AppShell`, `user-management-client.tsx`, etc.) illegally importing server-only modules like `firebase-admin`.
    -   **Resolution**: Performed a full-system audit and refactor.
        -   Created dedicated server actions in `src/app/actions.ts` and `src/app/admin/user-management/actions.ts` for all server-side data fetching.
        -   Modified all client components to call these server actions instead of directly importing from service files, thus respecting the client-server boundary.
        -   This fix was applied systematically to `AppShell` and the pages for User Management, Donors, Beneficiaries, and Referrals.

5.  **`You cannot have two parallel pages that resolve to the same path` Build Error**:
    -   **Description**: A fatal build error caused by leftover files from a previous, faulty refactoring attempt, resulting in multiple files trying to define the same page route (e.g., `/home`).
    -   **Resolution**: Performed a definitive cleanup of the project's file structure.
        -   Deleted the conflicting `(authenticated)` and `(public)` route group directories and all files within them.
        -   Restored `src/app/page.tsx` as the single public entry point.
        -   Ensured the root `src/app/layout.tsx` is the single source of truth for the application's layout, wrapping all content in the main `AppShell`.
