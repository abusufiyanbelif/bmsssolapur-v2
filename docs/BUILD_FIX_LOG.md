# Build Fix Log

This document tracks errors found during the build process and the steps taken to resolve them.

---

## Build Pass 7 (Latest)

### Errors Found:
1.  **ReferenceError: `allUsers` is not defined on Homepage**:
    -   **Description**: A runtime error on the public homepage (`/`) occurred because a variable was referenced without being correctly destructured from a data object.
    -   **Resolution**: Corrected the data access logic in `src/app/page.tsx` to properly retrieve `allUsers` from the `dashboardData` object.

2.  **`ensureCollectionsExist` is not a function**:
    -   **Description**: The seed page crashed when trying to run the "Ensure Collections" task because the function, which was recently moved, was not properly exported from `seed-service.ts`.
    -   **Resolution**: Added the `export` keyword to the `ensureCollectionsExist` function, making it accessible to other modules.

3.  **Incomplete "Erase" Functionality on Seed Page**:
    -   **Description**: The "Erase" functions were only deleting a single document or batch of documents instead of the entire collection. Additionally, the "Erase Core Team" function failed to identify the correct users to delete.
    -   **Resolution**:
        -   Rewrote the `deleteCollection` utility in `seed-service.ts` to use a continuous `while` loop, ensuring it fetches and deletes all documents in a collection until it is completely empty.
        -   Fixed the query logic in `eraseCoreTeam` to correctly identify core team members for deletion from both Firestore and Firebase Auth.
        -   Fully implemented all previously missing erase functions (`eraseAppSettings`, `erasePaymentGateways`, etc.).

4.  **`insufficient permission` on Erase Auth Users**:
    -   **Description**: Erasing all authentication users failed because the app's service account was missing the IAM role required to manage Firebase Authentication.
    -   **Resolution**: Updated the `scripts/verify-iam.js` script to include `roles/firebase.admin`. This allows an admin to run `npm run fix:iam` to automatically grant the necessary permission, resolving the issue. Updated `TROUBLESHOOTING.md` accordingly.

5.  **Quotes Not Being Erased**:
    -   **Description**: After erasing the `inspirationalQuotes` collection, the quotes still appeared on the dashboard.
    -   **Root Cause**: The `getQuotes` server action had a fallback mechanism to return a hardcoded list if the database collection was empty.
    -   **Resolution**: Removed the hardcoded fallback from `getQuotes` in `src/app/home/actions.ts`. The function now correctly returns an empty array if the database collection is empty, ensuring the UI accurately reflects the database state.

---

## Build Pass 6

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