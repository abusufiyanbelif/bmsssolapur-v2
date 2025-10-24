# Build Fix Log

This document tracks errors found during the build process and the steps taken to resolve them.

---

## Build Pass 11 (Latest)

### Errors Found:
1.  **`ReferenceError: Separator is not defined`**: A component was used in the `edit-organization-form.tsx` file without being imported, causing a runtime crash.
    -   **Resolution**: Added the missing import statement for the `Separator` component from `@/components/ui/separator`.

2.  **`Error: require.extensions is not supported by webpack`**: A critical build error caused by an improper dependency chain where a client component (`/app/page.tsx`) was indirectly importing server-only Genkit code.
    -   **Resolution**: Performed a significant refactor to enforce client/server separation. All AI flow definitions were moved to a dedicated, server-only `src/ai/dev.ts` file, and shared Zod schemas were moved to `src/ai/schemas.ts`, breaking the invalid import chain.

3.  **`Error: 'ensureCollectionsExist' is not exported`**: A build error caused by an incorrect import path in the `seed-sample-data.ts` script after a previous refactor.
    -   **Resolution**: Corrected the import path in the seed script to point to `src/services/firebase-admin.ts` and ensured the function was properly exported from its source file.

4.  **`Error: Invalid src prop (gs://...) on next/image`**: The application was still using an invalid Google Storage URI for the organization logo in several default data objects, particularly for seeding.
    -   **Resolution**: Conducted a full audit and replaced all instances of the `gs://` URI with the correct, public `https://firebasestorage.googleapis.com/...` URL in `seed-service.ts` and all related fallback objects.

5.  **Data Mismatch for Guiding Principles**: The "Guiding Principles" on the organization edit page were not loading from the database.
    -   **Root Cause**: The form expected an array of objects (`{ value: string }[]`) while the database stored a simple array of strings (`string[]`).
    -   **Resolution**: Updated the form logic in `edit-organization-form.tsx` and the submission logic in `actions.ts` to correctly handle the simple `string[]` format, ensuring data loads and saves correctly.

---

## Build Pass 10

### Errors Found:
1.  **Multiple Critical Data Integrity & Navigation Regressions**: A deep scan revealed several issues after recent refactoring, including broken "Edit" links, incorrect navigation paths, and inconsistent data-loading patterns on admin pages.
    -   **Resolution**:
        1.  Deleted the redundant `src/components/nav.tsx` file to consolidate navigation logic into `src/app/nav.tsx`.
        2.  Reorganized `nav.tsx` into logical collapsible sections for better usability.
        3.  Refactored all admin list pages (`donors`, `beneficiaries`, `referrals`) to use a standardized and robust Server Component data-fetching pattern.
        4.  Corrected the `isAdmin` check to include all administrative roles.
        5.  Updated `APP_PAGES.md` to reflect the corrected navigation structure.
        6.  Fixed the broken "Add Donation" link on the `/donate` page.

---

## Build Pass 9

### Errors Found:
1.  **Inconsistent UI Theme**: Headings and other UI elements were not consistently applying the selected theme colors, leading to a disjointed user experience. Toast notifications for success/info/warning were unreadable.
    -   **Resolution**:
        1.  Performed a full-system audit and applied `text-primary` and `text-muted-foreground` utility classes consistently across all pages and components.
        2.  Updated `globals.css` to add new HSL CSS variables for status colors (`--success`, `--warning`, `--info`).
        3.  Refactored the `Alert` and `Toast` components to use these new CSS variables, ensuring that their background and text colors are derived from the theme and are always legible.
        4.  Applied the new "Ocean Teal" theme as the application default.

---

## Build Pass 8

### Errors Found:
1.  **`ReferenceError: allUsers is not defined` on Homepage**: A runtime error on the public homepage (`/`) occurred because a variable was referenced without being correctly destructured from a data object.
    -   **Resolution**: Corrected the data access logic in `src/app/page.tsx` to properly retrieve `users` from the `dashboardData` object.

2.  **Inconsistent Link on Beneficiary Dashboard**: The "My Cases" link on the beneficiary dashboard was incorrectly pointing to `/beneficiary` instead of `/my-cases`.
    -   **Resolution**: Updated the `href` in `src/app/beneficiary/beneficiary-dashboard-content.tsx` to point to the correct `/my-cases` page.

3.  **Outdated Workflow Documentation**: `LEAD_DICTIONARY.md` and `WORKFLOWS.md` described an outdated workflow.
    -   **Resolution**: Updated both documents to reflect the current, more direct workflow where an admin can set the `caseAction` directly to `Publish`.

4.  **Inconsistent Data Dictionary**: The `DATA_DICTIONARY.md` file had an incorrect calculation logic for "My Active Cases".
    -   **Resolution**: Corrected the calculation logic in the data dictionary to align with the application's implementation.
