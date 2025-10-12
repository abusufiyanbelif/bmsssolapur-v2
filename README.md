
# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Local Development Setup

Before running the application or any database scripts locally, you must authenticate your local environment with Google Cloud. This is a one-time setup.

1.  **Install the Google Cloud CLI**: If you don't have it, [install it from here](https://cloud.google.com/sdk/docs/install).
2.  **Authenticate**: Run the following command in your terminal and follow the login prompts in your browser:
    ```bash
    gcloud auth application-default login
    ```

This command creates a local credential file that the Firebase Admin SDK (used for seeding) can automatically find and use to securely access your project's database.

## Repository

The source code for this project is managed at the following GitHub repository:
[https://github.com/abusufiyanbelif/bmsssolapur-v2](https://github.com/abusufiyanbelif/bmsssolapur-v2)

## Available Scripts

The `package.json` file includes a variety of scripts to help you manage, test, and seed your application.

### Database Seeding

These scripts allow you to populate your Firestore database with initial data. It's recommended to run them in order.

| Command | Description |
| :--- | :--- |
| `npm run seed:initial` | Seeds the main organization profile and a collection of inspirational quotes. |
| `npm run seed:app-settings`| Seeds the default configurations for lead purposes, user fields, and dashboard visibility. **Run this before creating leads.** |
| `npm run seed:core-team` | Creates the user accounts for the organization's founders and core administrators. |
| `npm run seed:payment-gateways` | Seeds placeholder credentials for the Razorpay payment gateway to enable online donations in test mode. |
| `npm run seed:sample-data` | **(Optional)** Populates the database with a wide range of sample campaigns, beneficiaries, leads, and donations for demonstration purposes. |
| `npm run seed:sync-auth` | Syncs existing Firestore users to Firebase Authentication, enabling them for OTP/phone login. This can be run at any time. |

---

### Service & IAM Verification

These scripts help you test your connections to external services and verify your project's IAM permissions.

| Command | Description |
| :--- | :--- |
| `npm run test:db` | Verifies the application's ability to connect to and authenticate with Firestore. |
| `npm run test:gemini` | Verifies the connection to Google AI and checks if the `GEMINI_API_KEY` is valid. |
| `npm run test:twilio` | Tests the connection to Twilio using your configured credentials for sending SMS. |
| `npm run test:nodemailer` | Tests the connection to your SMTP server for sending emails. |
| `npm run verify:iam` | Checks if your deployed App Hosting service account has all the necessary IAM roles. |
| `npm run fix:iam` | Automatically attempts to grant any missing IAM roles to your App Hosting service account. |

---

## Application Documentation

- **[Settings Guide](./docs/SETTINGS_GUIDE.md)**: A comprehensive guide to all administrative settings.
- **[Troubleshooting Guide](./docs/TROUBLESHOOTING.md)**: Solutions for common issues like API keys and permissions.
- **[Workflows Guide](./docs/WORKFLOWS.md)**: Step-by-step explanations of key application processes.
- **[Data Dictionary](./docs/DATA_DICTIONARY.md)**: An explanation of all dashboard metrics.
- **[Lead Dictionary](./docs/LEAD_DICTIONARY.md)**: An explanation of the Lead data model and workflow.
- **[Application Pages](./docs/APP_PAGES.md)**: A sitemap of all pages by user role.
- **[UI Style Guide](./docs/UI_STYLE_GUIDE.md)**: A reference for the application's design system.
