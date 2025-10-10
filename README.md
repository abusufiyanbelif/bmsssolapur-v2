
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

## Application Documentation

- **[Settings Guide](./docs/SETTINGS_GUIDE.md)**: A comprehensive guide to all administrative settings.
- **[Troubleshooting Guide](./docs/TROUBLESHOOTING.md)**: Solutions for common issues like API keys and permissions.
- **[Workflows Guide](./docs/WORKFLOWS.md)**: Step-by-step explanations of key application processes.
- **[Data Dictionary](./docs/DATA_DICTIONARY.md)**: An explanation of all dashboard metrics.
- **[Lead Dictionary](./docs/LEAD_DICTIONARY.md)**: An explanation of the Lead data model and workflow.
- **[Application Pages](./docs/APP_PAGES.md)**: A sitemap of all pages by user role.
- **[UI Style Guide](./docs/UI_STYLE_GUIDE.md)**: A reference for the application's design system.
