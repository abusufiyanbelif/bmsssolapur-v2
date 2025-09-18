# Application Workflows

This document explains the step-by-step processes for key features in the application.

---

## "Scan Screenshot" Donation Workflow

This workflow is designed to take a payment screenshot, automatically find the donor (or help you create one), and pre-fill the donation form, saving significant manual data entry.

**Actors**: Administrator

**Trigger**: Administrator clicks the "Scan Screenshot" button on the Donation Management page.

---

### Step-by-Step Process:

1.  **Start Scan**: The administrator clicks the "Scan Screenshot" button. This opens a dialog prompting for a file upload.

2.  **Upload Image**: The admin selects a payment screenshot image from their local device. A preview of the image is shown in the dialog.

3.  **"Scan and Continue"**: The admin clicks the "Scan and Continue" button. This initiates the core logic:

    a.  **AI Processing (Server-Side)**:
        -   The browser sends the image file to the server.
        -   The server calls the `extractDonationDetails` AI flow.
        -   The AI model (`gemini-1.5-flash-latest`) scans the image (OCR) and parses the text to extract structured data (e.g., amount, transaction ID, sender's name, sender's UPI/phone number).

    b.  **Donor Matching**:
        -   The system takes the extracted identifiers (UPI ID, phone number, bank account) and queries the user database to find a matching donor profile.

4.  **Automatic Redirect**: Based on the donor search result, the system automatically redirects the administrator:

    -   **Scenario A: Donor is Found**
        -   The user is redirected to the **`/admin/donations/add`** page.
        -   All extracted details (amount, transaction ID) and the found `donorId` are passed as URL query parameters.
        -   The screenshot image itself is temporarily stored in the browser's `sessionStorage` to be displayed on the form.

    -   **Scenario B: No Donor is Found**
        -   The user is redirected to the **`/admin/user-management/add`** page.
        -   Extracted contact information (name, phone number) is passed as URL query parameters to pre-fill the "Add User" form.
        -   The screenshot is also stored in `sessionStorage` to be displayed on the subsequent "Add Donation" page after the user is created.

5.  **Final Review and Submission**:
    -   The admin lands on either the "Add Donation" or "Add User" form, which is now pre-filled with the data from the scan.
    -   The uploaded screenshot is displayed on the page for easy reference.
    -   The admin can review all the auto-filled information, make any necessary corrections, and formally submit the new user or donation record.

---

## Manual Donation Creation Workflow

This workflow is for administrators to manually record donations received outside the app's online payment system (e.g., direct bank transfer, cash). It can be done with or without an accompanying payment proof.

**Actors**: Administrator

**Trigger**: Administrator navigates to the `/admin/donations/add` page directly.

### Step-by-Step Process:

1.  **Select Donor**: The administrator searches for and selects an existing user from the "Donor" dropdown. This is a mandatory step to link the donation to a user profile. If the donor does not exist, the admin must first go to "User Management" to create them.

2.  **Upload Proof (Optional but Recommended)**: The admin can upload a payment screenshot, PDF receipt, or bank statement.
    *   If a file is uploaded, they can click **"Get Text from Document"** to run OCR and extract the raw text.
    *   After text is extracted, they can click **"Auto-fill Form"** to have the AI parse the text and populate fields like amount, transaction ID, and dates.

3.  **Enter Donation Details**: The admin manually fills in (or reviews the auto-filled) information for the donation:
    *   **Total Transaction Amount**: The full amount shown on the receipt.
    *   **Primary Donation Category & Purpose**: How the main portion of the donation should be categorized (e.g., Zakat, Sadaqah).
    *   **Transaction ID**: The unique reference number for the payment. The system checks for duplicates to prevent recording the same donation twice.
    *   **Donation Date**: The date the transaction occurred.

4.  **Link to Cause (Optional)**: The admin can link the donation to a specific ongoing `Campaign` or an open `Lead` (help request). This helps in tracking funds for specific causes.

5.  **Submit Donation**: The admin clicks the **"Add Donation"** button.
    *   The `handleAddDonation` server action is triggered.
    *   A new document is created in the `donations` collection with a default status of **"Pending verification"**.
    *   If a proof file was uploaded, it's saved to Firebase Storage under a path like `donations/[donor_user_key]/[donation_id]/proofs/`.
    *   The action is logged in the audit trail for accountability.

6.  **Confirmation**: The admin is redirected to a success page confirming the donation has been recorded and is now awaiting verification from the finance team.
