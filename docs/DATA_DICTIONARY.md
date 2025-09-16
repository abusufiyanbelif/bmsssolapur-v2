# Data Dictionary - Dashboard Cards & Metrics

This document explains what each data card on the various dashboards represents, what data it uses, and the specific logic behind its calculations.

---

## 1. Admin Dashboard (`/admin`)

This is the most comprehensive dashboard, visible to **Admin**, **Super Admin**, and **Finance Admin** roles.

### "Main Metrics" Cards

These cards provide a high-level overview of the entire organization's activity.

| Card Title | What It Shows | Data Source(s) | Calculation Logic |
| :--- | :--- | :--- | :--- |
| **Total Verified Funds** | The total amount of all money successfully received and verified. | `donations` | `SUM(donation.amount)` where `donation.status` is 'Verified' OR 'Allocated'. |
| **Total Distributed** | The total amount of money that has been transferred to beneficiaries. | `leads` | `SUM(lead.helpGiven)`. This is the sum of all fund transfers made against all leads. |
| **Total Required** | The total pending amount needed to fully fund all open and published help cases. | `leads` | `SUM(lead.helpRequested - lead.helpGiven)` where `lead.caseStatus` is 'Open' OR 'Partial' OR 'Publish'. |
| **Cases Closed** | The total number of help cases that have been successfully completed and closed. | `leads` | `COUNT(leads)` where `lead.caseAction` is 'Closed'. |
| **Published Leads** | The number of help cases currently visible to the public for donations. | `leads` | `COUNT(leads)` where `lead.caseAction` is 'Publish'. |
| **Beneficiaries Helped**| The total number of unique individuals who have received at least some financial aid. | `leads` | `COUNT(UNIQUE lead.beneficiaryId)` where `lead.helpGiven` > 0. |

### Other Key Admin Cards

| Card Title | What It Shows | Data Source(s) | Calculation Logic |
| :--- | :--- | :--- | :--- |
| **Funds in Hand** | The pool of verified, unallocated funds available for disbursement. | `donations`, `leads` | `(Total Verified Funds) - (Total Distributed)`. |
| **Organization Support Funds** | Funds specifically donated "To Organization Use" for operational costs. | `donations` | `SUM(donation.amount)` where `donation.purpose` is 'To Organization Use'. |
| **Monthly Contributors**| A count of users who have opted-in for monthly pledges. (Contribution tracking is a future feature). | `users` | `COUNT(users)` where `user.monthlyPledgeEnabled` is `true`. |
| **Total Monthly Pledge**| The total amount promised per month by all contributors who have opted-in. | `users` | `SUM(user.monthlyPledgeAmount)` where `user.monthlyPledgeEnabled` is `true`. |

### "Pending Actions" Cards

These are accordion sections designed to draw an admin's attention to tasks that require their immediate action.

| Card Title | What It Shows | Data Source(s) | Calculation Logic |
| :--- | :--- | :--- | :--- |
| **Pending Lead Verifications** | A list of new help requests that are awaiting verification. | `leads` | `COUNT(leads)` where `lead.caseVerification` is 'Pending'. |
| **Pending Donation Verifications** | A list of manually recorded donations that need to be verified against bank records. | `donations` | `COUNT(donations)` where `donation.status` is 'Pending verification' or 'Pending'. |
| **Leads Ready for Publishing** | A list of verified leads that are ready to be made public. | `leads` | `COUNT(leads)` where `lead.caseAction` is 'Ready For Help'. |

---

## 2. Donor Dashboard (`/donor`)

This dashboard is personalized for the logged-in **Donor**.

| Card Title | What It Shows | Data Source(s) | Calculation Logic |
| :--- | :--- | :--- | :--- |
| **My Total Contributions**| The total amount of money *you* have personally donated that has been verified. | `donations` | `SUM(donation.amount)` where `donation.donorId` matches your user ID and `status` is 'Verified' or 'Allocated'. |
| **Total Donations Made**| The total number of individual donations *you* have made. | `donations` | `COUNT(donations)` where `donation.donorId` matches your user ID. |
| **Leads Supported** | The number of unique help cases your donations have been allocated to. | `donations` | `COUNT(UNIQUE donation.leadId)` where your donations have been linked to a lead. |
| **Beneficiaries Helped**| The number of unique people your donations have helped support. | `donations`, `leads`| `COUNT(UNIQUE lead.beneficiaryId)` for all leads linked to your donations. |
| **Campaigns Supported**| The number of unique campaigns you have contributed to. | `donations` | `COUNT(UNIQUE donation.campaignId)` where your donations are linked to a campaign. |

---

## 3. Beneficiary Dashboard (`/beneficiary`)

This dashboard is personalized for the logged-in **Beneficiary**.

| Card Title | What It Shows | Data Source(s) | Calculation Logic |
| :--- | :--- | :--- | :--- |
| **My Total Aid Received**| The total amount of money you have received across all your help requests. | `leads` | `SUM(lead.helpGiven)` where `lead.beneficiaryId` matches your user ID. |
| **My Total Requested**| The total amount you have requested across all your help requests. | `leads` | `SUM(lead.helpRequested)` where `lead.beneficiaryId` matches your user ID. |
| **My Active Cases** | The number of your help requests that are still open or partially funded. | `leads` | `COUNT(leads)` where `beneficiaryId` matches your ID and `caseStatus` is 'Pending', 'Partial', or 'Open'. |
| **My Closed Cases** | The number of your help requests that have been successfully completed. | `leads` | `COUNT(leads)` where `beneficiaryId` matches your ID and `caseStatus` is 'Closed'. |

---

## 4. Public Home Page (`/`)

This dashboard is visible to all **Guest** users (not logged in).

| Card Title | What It Shows | Data Source(s) | Calculation Logic |
| :--- | :--- | :--- | :--- |
| **Total Verified Funds**| Same as Admin Dashboard: Total verified funds received by the organization. | `donations` | `SUM(donation.amount)` where `status` is 'Verified' OR 'Allocated'. |
| **Total Distributed** | Same as Admin Dashboard: Total funds given to beneficiaries. | `leads` | `SUM(lead.helpGiven)`. |
| **Cases Closed** | Same as Admin Dashboard: Total help requests successfully completed. | `leads` | `COUNT(leads)` where `caseAction` is 'Closed'. |
| **Published Leads** | Same as Admin Dashboard: Leads currently visible to the public. | `leads` | `COUNT(leads)` where `caseAction` is 'Publish'. |
| **Beneficiaries Helped**| Same as Admin Dashboard: Unique individuals who have received aid. | `leads` | `COUNT(UNIQUE lead.beneficiaryId)` where `lead.helpGiven` > 0. |
| **Top Donations** | A list of the largest individual verified donations. **Donor names are anonymized if they have chosen to be an anonymous donor.** | `donations` | Top 5 donations sorted by `amount` where `status` is 'Verified' or 'Allocated'. |
| **Recent Campaigns** | A table listing the most recently started campaigns. | `campaigns` | Most recent 5 campaigns sorted by `startDate`. |
| **Beneficiary Breakdown**| Breakdown of unique beneficiaries who have received aid, categorized by type. | `users`, `leads` | `COUNT(UNIQUE users)` where a user is a beneficiary on a lead where `helpGiven` > 0, grouped by `beneficiaryType`. |
| **Donation Type Breakdown**| Total amounts received, categorized by donation type. | `donations` | `SUM(donation.amount)` grouped by `donation.type`, where `status` is 'Verified' or 'Allocated'. |
| **Campaigns Overview**| A summary of campaigns by their status. | `campaigns` | `COUNT(campaigns)` grouped by `status` ('Active', 'Completed', 'Upcoming'). |
