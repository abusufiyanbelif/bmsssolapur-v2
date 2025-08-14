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
        -   The AI model scans the image (OCR) and parses the text to extract structured data (e.g., amount, transaction ID, sender's name, sender's UPI/phone number).

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
