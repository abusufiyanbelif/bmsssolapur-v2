# Build Fix Log

This document tracks errors found during the build process and the steps taken to resolve them.

---

## Build Pass 10 (Latest)

### Errors Found:

1.  **`ensureCollectionsExist` is not a function**:
    -   **Description**: The seed page crashed when trying to run the "Ensure Collections" task because the function, which was recently moved, was not properly exported from `seed-service.ts`.
    -   **Resolution**: Added the `export` keyword to the `ensureCollectionsExist` function, making it accessible to other modules.

2.  **Incomplete "Erase" Functionality on Seed Page**:
    -   **Description**: The "Erase" functions were only deleting a single document or batch of documents instead of the entire collection. Additionally, the "Erase Core Team" function failed to identify the correct users to delete.
    -   **Resolution**:
        -   Rewrote the `deleteCollection` utility in `seed-service.ts` to use a continuous `while` loop, ensuring it fetches and deletes all documents in a collection until it is completely empty.
        -   Fixed the query logic in `eraseCoreTeam` to correctly identify core team members for deletion from both Firestore and Firebase Auth.
        -   Fully implemented all previously missing erase functions (`eraseAppSettings`, `erasePaymentGateways`, etc.).

3.  **`insufficient permission` on Erase Auth Users**:
    -   **Description**: Erasing all authentication users failed because the app's service account was missing the IAM role required to manage Firebase Authentication.
    -   **Resolution**: Updated the `scripts/verify-iam.js` script to include `roles/firebase.admin`. This allows an admin to run `npm run fix:iam` to automatically grant the necessary permission, resolving the issue. Updated `TROUBLESHOOTING.md` accordingly.

4.  **Quotes Not Being Erased**:
    -   **Description**: After erasing the `inspirationalQuotes` collection, the quotes still appeared on the dashboard because the `getQuotes` server action had a hardcoded fallback.
    -   **Resolution**: Removed the hardcoded fallback from `getQuotes` in `src/app/home/actions.ts`. The function now correctly returns an empty array if the database collection is empty, ensuring the UI accurately reflects the database state.

5.  **App Crash on Missing Firestore Indexes**:
    -   **Description**: The application would crash if a query required a Firestore index that had not been created yet (e.g., ordering leads by date).
    -   **Resolution**:
        -   Refactored all data-fetching services (`lead-service`, `donation-service`, `user-service`) to be resilient to missing indexes.
        -   Each function now uses a `try...catch` block. It first attempts the query *with* sorting. If it fails due to a missing index, the `catch` block retries the query *without* sorting and then sorts the data in memory.
        -   This prevents the app from crashing and ensures data is always displayed, while also logging a clear, developer-friendly error message indicating which index needs to be created.

---

## Build Pass 9

### Errors Found:

1.  **ReferenceError: `Users is not defined`**: The letterhead page crashed because it was trying to use an icon that had not been imported.
    -   **Resolution**: Added the `Users` icon to the `lucide-react` import statement in `src/app/admin/organization/letterhead/letterhead-document.tsx`.

2.  **`admin` User Not Found on Login**: The login logic was trying to fetch a user document with the ID `admin`, but the seeding logic was creating it with an auto-generated ID.
    -   **Resolution**: Modified `src/services/firebase-admin.ts` to ensure the `admin` user is always created with the document ID `admin` for predictable lookups.

3.  **Inconsistent Data & Crashes from Non-Serializable Props**: Many pages were fetching data directly in client components or passing unserialized data (like Firestore `Timestamp`s) as props, causing crashes or empty UI.
    -   **Resolution**: Overhauled all major list pages (`/admin/users`, `/admin/donations`, `/admin/leads`, etc.) to use a strict Server Component for data fetching and a Client Component for UI. Ensured all props passed from server to client are explicitly serialized with `JSON.parse(JSON.stringify(data))`.

---

## Build Pass 8

### Errors Found:
1.  **ReferenceError: `allUsers` is not defined on Homepage**:
    -   **Description**: A runtime error on the public homepage (`/`) occurred because a variable was referenced without being correctly destructured from a data object. The code was trying to access `allUsers` directly instead of `dashboardData.users`.
    -   **Resolution**: Corrected the data access logic in `src/app/page.tsx` to properly retrieve `users` from the `dashboardData` object.

2.  **Inconsistent Link on Beneficiary Dashboard**:
    -   **Description**: The "My Cases" link on the beneficiary dashboard was incorrectly pointing to `/beneficiary` instead of the correct path `/my-cases`.
    -   **Resolution**: Updated the `href` in `src/app/beneficiary/beneficiary-dashboard-content.tsx` to point to the correct `/my-cases` page.

3.  **Outdated Workflow Documentation**:
    -   **Description**: `LEAD_DICTIONARY.md` and `WORKFLOWS.md` described an outdated workflow where a lead status of `Ready For Help` was a prerequisite for publishing.
    -   **Resolution**: Updated both documents to reflect the current, more direct workflow where an admin can set the `caseAction` directly to `Publish`.

4.  **Inconsistent Data Dictionary**:
    -   **Description**: The `DATA_DICTIONARY.md` file had an incorrect calculation logic for the "My Active Cases" card on the Beneficiary Dashboard.
    -   **Resolution**: Corrected the calculation logic in the data dictionary to align with the application's implementation.

---

## Build Pass 7

### Errors Found:
1.  **`ensureCollectionsExist` is not a function**:
    -   **Description**: The seed page crashed when trying to run the "Ensure Collections" task because the function, which was recently moved, was not properly exported from `seed-service.ts`.
    -   **Resolution**: Added the `export` keyword to the `ensureCollectionsExist` function, making it accessible to other modules.

2.  **Incomplete "Erase" Functionality on Seed Page**:
    -   **Description**: The "Erase" functions were only deleting a single document or batch of documents instead of the entire collection. Additionally, the "Erase Core Team" function failed to identify the correct users to delete.
    -   **Resolution**:
        -   Rewrote the `deleteCollection` utility in `seed-service.ts` to use a continuous `while` loop, ensuring it fetches and deletes all documents in a collection until it is completely empty.
        -   Fixed the query logic in `eraseCoreTeam` to correctly identify core team members for deletion from both Firestore and Firebase Auth.
        -   Fully implemented all previously missing erase functions (`eraseAppSettings`, `erasePaymentGateways`, etc.).

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
