
# Application Pages by Role

This document provides a complete sitemap of the application, categorized by the user roles that can access each page.

---

## 1. Guest (Unauthenticated Users)

These pages are accessible to anyone visiting the site without logging in.

| Page | Path | Description |
| :--- | :--- | :--- |
| **Home** | `/` | The public landing page with overview dashboard cards. |
| **General Cases** | `/public-leads` | A list of all published help requests open for public donation. |
| **Campaigns** | `/campaigns` | A list of all special fundraising campaigns. |
| **Organization Details** | `/organization` | Public-facing details about the organization, including legal and contact info. |
| **Login** | `/login` | The user login page. |
| **Register** | `/register` | The new user registration page. |

---

## 2. Authenticated User (All Roles)

This is the common entry point for any logged-in user. The system then redirects them based on their active role.

| Page | Path | Description |
| :--- | :--- | :--- |
| **Dashboard** | `/home` | The central dashboard that redirects to a role-specific view. |
| **Profile** | `/profile/settings` | The user's personal profile and settings management page. |
| **Activity History** | `/profile/history` | A log of the user's own activities. |

---

## 3. Donor

| Page | Path | Description |
| :--- | :--- | :--- |
| **Donate Now** | `/donate` | The main page for making online donations or recording past ones. |
| **My Donations** | `/my-donations` | A history of the donor's personal contributions. |
| **My Uploads** | `/my-uploads` | A page for uploading documents like donation proofs. |

---

## 4. Beneficiary

| Page | Path | Description |
| :--- | :--- | :--- |
| **My Cases** | `/my-cases` | A history of the beneficiary's personal help requests. |
| **Request Help** | `/request-help` | A form for a beneficiary to submit a new help request. |

---

## 5. Referral

| Page | Path | Description |
| :--- | :--- | :--- |
| **My Referrals** | `/referral/my-beneficiaries` | A list of all beneficiaries referred by the current user. |

---

## 6. Admin, Super Admin, Finance Admin

These pages are for administrative and management tasks. Access may vary slightly between admin types.

### Communications
| Page | Path | Description |
| :--- | :--- | :--- |
| **Generate Messages** | `/admin/communications` | AI-powered tool to create formatted messages for WhatsApp and other platforms. |

### Organization
| Page | Path | Description |
| :--- | :--- | :--- |
| **Organization Profile** | `/admin/organization` | Edit the organization's public details, contact info, and payment settings. |
| **Board Members** | `/admin/board-management` | View and manage the list of official board members. |
| **Letterhead** | `/admin/organization/letterhead` | Generate and download official organization letterhead. |
| **Layout & Footer** | `/admin/organization/layout` | Customize the content of the main site header and footer. |

### Campaign Management
| Page | Path | Description |
| :--- | :--- | :--- |
| **All Campaigns** | `/admin/campaigns` | View, manage, and track all fundraising campaigns. |
| **Create Campaign** | `/admin/campaigns/add` | Form to create a new fundraising campaign. |
| **Campaign Configuration**| `/admin/campaigns/configuration`| Configure settings related to campaigns. **(Super Admin only)** |

### Lead Management
| Page | Path | Description |
| :--- | :--- | :--- |
| **All Leads** | `/admin/leads` | View and manage all help requests (leads). |
| **Create Lead** | `/admin/leads/add` | Form to create a new lead for a beneficiary. |
| **Create from Document**| `/admin/leads/create-from-document`| AI-powered workflow to scan documents and create a lead. |
| **Lead Configuration**| `/admin/leads/configuration`| Configure lead purposes, categories, and the approval workflow. **(Super Admin only)** |

### Donations Management
| Page | Path | Description |
| :--- | :--- | :--- |
| **All Donations** | `/admin/donations` | View and manage all donation records. |
| **Create Donation** | `/admin/donations/add` | Form to manually record a new donation. |
| **Donation Configuration**| `/admin/donations/configuration`| Configure settings related to donations. **(Super Admin only)** |

### Transfers Management
| Page | Path | Description |
| :--- | :--- | :--- |
| **All Transfers** | `/admin/transfers` | A complete log of all funds transferred to beneficiaries. |
| **Transfer Configuration**| `/admin/transfers/configuration`| Configure settings related to fund transfers. **(Super Admin only)** |

---

## 7. Super Admin & Finance Admin

These roles have access to more sensitive data and settings.

### Data Profiling & Analytics
| Page | Path | Description |
| :--- | :--- | :--- |
| **Analytics Dashboard** | `/admin/data-analytics` | A dashboard with in-depth financial and system performance metrics. |
| **Database Health** | `/admin/data-analytics/database-health` | An overview of Firestore collection sizes and data integrity checks. |
| **Storage Analytics** | `/admin/data-analytics/storage-analytics` | An overview of Firebase Storage usage, including file counts and total size. |
| **Analytics Configuration**| `/admin/data-analytics/configuration`| Configure visibility for the analytics dashboard. **(Super Admin only)** |

---

## 8. Super Admin Only

These pages are for the highest level of system administration and configuration.

### User Management
| Page | Path | Description |
| :--- | :--- | :--- |
| **All Users** | `/admin/user-management` | View and manage every user account in the system. |
| **User Configuration**| `/admin/user-management/configuration`| Configure global user settings, like mandatory fields. |
| **User Roles** | `/admin/user-management/roles` | View the different user roles and their associated privileges. |
| **User Groups** | `/admin/user-management/groups` | View the different organizational groups (e.g., Founder, Finance). |
| **User Privileges** | `/admin/user-management/privileges` | View a list of all granular permissions in the system. |

### App Settings
| Page | Path | Description |
| :--- | :--- | :--- |
| **General Settings** | `/admin/settings` | Manage global feature flags and login methods. |
| **Theme Settings** | `/admin/settings/theme` | Customize the application's color scheme. |
| **Dashboard Settings** | `/admin/dashboard-settings` | Configure visibility for all dashboard cards. |
| **Payment Gateways** | `/admin/payment-gateways` | Configure credentials for payment gateways like Razorpay. |
| **Notification Settings** | `/admin/settings/notifications`| Configure credentials for SMS and email providers. |
| **Audit Trail** | `/admin/audit-trail` | A complete, searchable log of all significant user and system actions. |
| **Seed Database** | `/admin/seed` | A utility page to populate the database with initial or sample data. |
| **Services Summary** | `/services` | An overview of all connected services and their status. |
| **Dependency Map** | `/dependencies` | A visual diagram of how services are interconnected. |
| **Configuration Validator**| `/validator` | An AI-powered tool to check configurations for errors. |
| **Available AI Models** | `/admin/diagnostics/models` | A live list of AI models available via the API key. |
| **AI Personas** | `/personas` | Manage the different AI personalities used in the application. |
