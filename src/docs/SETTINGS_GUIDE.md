# Application Settings Guide

This document provides a comprehensive guide to all the administrative settings available in the application. Use this guide to customize functionality, manage integrations, and tailor the user experience.

---

## Table of Contents

1.  [General Settings (Login & Features)](#1-general-settings-login--features)
2.  [Notification Settings (Email & SMS)](#2-notification-settings-email--sms)
3.  [Payment Gateway Settings (Razorpay)](#3-payment-gateway-settings-razorpay)
4.  [Theme Customization](#4-theme-customization)
5.  [Dashboard Visibility Settings](#5-dashboard-visibility-settings)
6.  [User Profile Configuration](#6-user-profile-configuration)
7.  [Lead Management Configuration](#7-lead-management-configuration)

---

## 1. General Settings (Login & Features)

**Location:** `Admin Dashboard > App Settings > General Settings`  
**Direct URL:** `/admin/settings`

This page contains master switches for core application features.

### Login Methods

-   **Password Login**: Enable/disable the ability for users to log in with a phone/email and password.
-   **OTP (SMS) Login**: Enable/disable the ability for users to log in with a one-time password sent via SMS. This requires either Firebase Phone Auth or Twilio to be configured (see Notification Settings).
-   **Google Sign-In**: Enable/disable the ability for users to log in with their Google account.

### Feature Flags

-   **Online Payment Gateways**: The master switch for all online payment systems (e.g., Razorpay). If this is disabled, no online payment options will appear on the "Donate" page.
-   **Direct Payment to Beneficiary**: (Future Feature) When enabled, this would show a beneficiary's direct payment details to donors.

---

## 2. Notification Settings (Email & SMS)

**Location:** `Admin Dashboard > App Settings > Notification Settings`  
**Direct URL:** `/admin/settings/notifications`

This page is for configuring third-party services that send communications.

### OTP Provider

-   **Firebase Phone Authentication (Recommended)**:
    -   **Configuration**: No credentials are needed in the app. You must enable it in your Firebase Console under `Authentication > Sign-in method`. For testing, add your phone number to the "Phone numbers for testing" section in Firebase.
    -   **Cost**: Free tier includes 10,000 verifications/month.
-   **Twilio**:
    -   **Configuration**: Requires your **Account SID**, **Auth Token**, and **Verify Service SID**.
    -   **Testing**: Use the **"Test Connection"** button within its section to verify credentials.
    -   **How to find Verify Service SID**: In your Twilio Console, go to **Verify > Services**. Copy the SID (starts with "VA...").

### Twilio for WhatsApp

-   **Configuration**: Requires your Twilio Account SID, Auth Token, and a Twilio-enabled WhatsApp "From" number.
-   **Testing**: Use the "Test Connection" button.

### Nodemailer for Email

-   **Configuration**: Requires your SMTP server details (host, port, user, password).
-   **Testing**: Use the "Test Connection" button.

---

## 3. Payment Gateway Settings (Razorpay)

**Location:** `Admin Dashboard > App Settings > Payment Gateways`  
**Direct URL:** `/admin/payment-gateways`

Configure credentials for processing online donations.

-   **Master Switch**: The "Enable Online Payment Gateways" switch on the `General Settings` page must be turned on first.
-   **Configuration**:
    1.  Expand the "Razorpay" accordion.
    2.  Enable the gateway with the switch.
    3.  Select the **Mode** ('Test' or 'Live').
    4.  Enter the corresponding **Key ID** and **Key Secret** for the selected mode.
    5.  Save your changes.
-   **Testing**: After saving, use the **"Test Connection"** button to verify that the app can communicate with Razorpay using your credentials.

---

## 4. Theme Customization

**Location:** `Admin Dashboard > App Settings > Theme Settings`  
**Direct URL:** `/admin/settings/theme`

This page allows you to change the application's entire color scheme.

-   **How it Works**: The settings on this page directly modify the HSL color variables in `src/app/globals.css`.
-   **Customization**:
    1.  Click **"Edit Theme"**.
    2.  Use the color pickers or manually enter HSL values for each color type (Primary, Accent, etc.).
    3.  A live preview section shows how your changes will look on various components.
    4.  Click **"Save Changes"**. You may need to perform a hard refresh (Ctrl+Shift+R or Cmd+Shift+R) for the browser to load the new stylesheet.

---

## 5. Dashboard Visibility Settings

**Location:** `Admin Dashboard > App Settings > Dashboard Settings`  
**Direct URL:** `/admin/dashboard-settings`

This section lets you control which dashboard cards are visible to which user roles.

-   **How it Works**: Each card (e.g., "Main Metrics", "Pending Leads") has a set of checkboxes corresponding to user roles (Admin, Donor, Beneficiary, etc.).
-   **Configuration**:
    1.  Click **"Edit Settings"**.
    2.  For each card, check the boxes for the roles that should be able to see it.
    3.  Use the "View Visibility For Role" filter at the top to easily see which cards a specific role will have on their dashboard.
    4.  Click **"Save Changes"**.

---

## 6. User Profile Configuration

**Location:** `Admin Dashboard > User Management > User Page Configuration`  
**Direct URL:** `/admin/user-management/configuration`

This page lets you enforce data collection rules for different user types during registration and profile updates.

-   **How it Works**: For each role (Donor, Beneficiary, etc.), you can set specific fields as mandatory.
-   **Configuration**:
    1.  Expand the accordion for the role you want to configure (e.g., "Beneficiary Settings").
    2.  Use the switches to toggle whether fields like "Aadhaar Number" or "Bank Account" are mandatory.
    3.  Click **"Save All Settings"** at the bottom. The system will now enforce these rules on the `/register` and `/admin/user-management/add` pages.

---

## 7. Lead Management Configuration

**Location:** `Admin Dashboard > Lead Management > Configuration`  
**Direct URL:** `/admin/leads/configuration`

This is the central hub for customizing the lead creation and approval process.

### General Settings

-   **Allow Beneficiaries to Request Help**: Master switch to enable or disable the `/request-help` page for all beneficiaries.
-   **Disable Approval Process**: If enabled, all new leads are automatically marked as "Verified". Only users with override permissions can create leads in this mode.
-   **Enable Role-based Creation**: Restricts lead creation access only to the roles selected in the "Lead Creator Roles" section below it.

### Lead Purposes & Categories

-   **Functionality**: Allows you to create, edit, and delete the `Purpose` and `Category` dropdown options that appear on the "Add Lead" form. This ensures data consistency.
-   **Usage**: Use the "Create Purpose" button to add a new main purpose. Expand a purpose to add or edit its sub-categories.

### Lead Approvers

-   **Functionality**: Designate which `Admin` or `Super Admin` users are responsible for verifying new leads.
-   **Mandatory vs. Optional**:
    -   **Mandatory**: A lead cannot be verified until ALL mandatory approvers have approved it.
    -   **Optional**: At least one optional approver's approval is required (if no mandatory approvers are set).
-   **Usage**: Click "Add Approver" to select users and assign them to a group. You can move users between "Mandatory" and "Optional" from within the lists.