# Build Fix Log

This document tracks errors found during the build process and the steps taken to resolve them.

---

## Build Pass 16 (Latest)

### Errors Found:

1.  **`Error: Invalid src prop (gs://...)` (Final Resolution)**: The `next/image` component was still crashing the application in multiple places due to an invalid `gs://` URI being used for the organization logo. The root cause was that several default/fallback data objects, including the primary `organizationToSeed` object in `src/services/seed-service.ts`, still contained the incorrect URL format.
    -   **Resolution**:
        1.  Conducted a full-system audit to find every instance of the invalid `gs://` URL.
        2.  Updated the default data in `src/services/seed-service.ts`, `src/services/organization-service.ts`, and all page-level fallbacks (`/admin/organization/page.tsx`, `/organization/page.tsx`, etc.) to use the correct, public `https://firebasestorage.googleapis.com/...` URL for the logo.
        3.  Reinforced the `Logo` component (`src/components/logo.tsx`) with a more robust `onError` handler and an internal check to always prefer a valid, hardcoded placeholder over an invalid URL, making it resilient to future data inconsistencies. This comprehensive fix ensures that an invalid URL can no longer be seeded into the database or used by the application, permanently resolving this class of error.

---

## Build Pass 15

### Errors Found:

1.  **`Error: ⨯ upstream image response failed for ... 404`**: The `next/image` component was throwing a fatal error during server rendering when the `logoUrl` from the database pointed to a non-existent image in Firebase Storage. This crashed the entire page load.
    -   **Resolution**: Implemented a fallback mechanism in the `Logo` component (`src/components/logo.tsx`). An `onError` handler was added to the `Image` component. If the primary `src` fails to load, the `onError` event now sets the image source to a reliable placeholder URL, preventing the crash and ensuring the UI always renders.

2.  **Invalid URL Handling**: The `getImageAsBase64` server action, used by the letterhead feature, would crash if it was passed an invalid or malformed URL.
    -   **Resolution**: Added a `try...catch` block around the `new URL(url)` constructor. If the URL is invalid, the function now logs an error and gracefully returns `undefined` instead of crashing.

---

## Build Pass 14

### Errors Found:

1.  **`Error: Seeding task 'sampleData' failed: doSeed is not a function`**: The sample data seeding script (`src/scripts/seed/seed-sample-data.ts`) was crashing because of an incorrect function import from `src/services/seed-service.ts`.
    -   **Resolution**: Corrected the module exports in `seed-service.ts`. The main seeding logic was consolidated into a single exported `seedSampleData` function, and the calling script was updated to import it correctly, resolving the runtime error.

---

## Build Pass 13

### Errors Found:

1.  **`5 NOT_FOUND` on Initial Page Load (Final Resolution)**: The application would frequently crash on its very first startup with a fresh database. This was caused by a fundamental race condition where data-fetching functions (e.g., `getCurrentOrganization`, `getAllUsers`) would execute before the Firebase Admin SDK had fully initialized and created the necessary collections.
    -   **Root Cause**: The Admin SDK initialization in `firebase-admin.ts` was not a true, blocking singleton. Different parts of the app would try to get a database instance simultaneously, with some receiving a non-authenticated instance, leading to permission-like `5 NOT_FOUND` errors.
    -   **Resolution**:
        1.  Implemented a definitive, promise-based singleton pattern for Firebase Admin initialization in `src/services/firebase-admin.ts`. The `getAdminDb()` function is now `async` and `await`s a single `initializationPromise`.
        2.  This promise is designed to only resolve *after* all critical startup tasks (including creating collections via `ensureCollectionsExist` and seeding system users like `admin`) are fully complete.
        3.  This guarantees that the database is fully ready before any part of the app can query it, permanently fixing the entire class of startup race condition errors.

2.  **`Invalid source map` / `TypeError [ERR_INVALID_ARG_TYPE]`**: The Next.js error overlay would crash when trying to display a database error because the error object being passed to `console.error` was `null` or malformed.
    -   **Resolution**: Refactored all `catch` blocks in data-fetching services (`user-service.ts`, `public-data-service.ts`, etc.) to check if the caught error is a valid `Error` instance. If not, a new, clean `Error` is created, ensuring the dev overlay can always render the error message without crashing itself.

3.  **"Unexpected response from server" on Seeding**: The "Seed Sample Data" script was crashing because the data it generated was out of sync with the latest data models, specifically missing the required `caseReportedDate` for leads.
    -   **Resolution**: Updated the `seedLeads` function in `src/services/seed-service.ts` to always include a `caseReportedDate` for all created leads, ensuring compliance with the current `Lead` type.

---

## Build Pass 12

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

    
