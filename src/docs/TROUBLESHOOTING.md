# Troubleshooting Guide

This document provides solutions to common issues encountered during development.

---

## 1. "UNAUTHENTICATED" / "PERMISSION_DENIED" / "Could not reach Cloud Firestore backend" (Local & Deployed)

**Error Message(s):**
- `16 UNAUTHENTICATED: Request had invalid authentication credentials.`
- `Could not reach Cloud Firestore backend.`
- `7 PERMISSION_DENIED: Missing or insufficient permissions.`
- `Seeding Failed - UNKNOWN: Getting metadata from plugin failed with error: Could not refresh access token`
- `Credential implementation provided to initializeApp() via the "credential" property has insufficient permission...`

**Cause:**
This is the most common category of errors. It means your application's environment—whether it's your local machine or the deployed Firebase App Hosting server—is not authorized to communicate with your Google Cloud services, especially Firestore and Firebase Authentication.

---

### Solution for Local Development (Your Machine)

If you see this error while running the app on your local computer (e.g., when seeding data from `/admin/seed`), you must authenticate your local environment. This is a **one-time setup**.

1.  **Install the gcloud CLI**: If you don't already have it, [follow the official installation instructions](https://cloud.google.com/sdk/docs/install).
2.  **Run the Login Command**: Open your terminal and run the following command. It will open a browser window for you to log in with your Google account.
    ```bash
    gcloud auth application-default login
    ```
3.  After successful login, a credential file is stored on your local machine. The application's server-side code (Firebase Admin SDK) will automatically use this file to authenticate.
4.  **Restart your application** and retry the action.

---

### Solution for Deployed App (Firebase App Hosting)

If you see this error in your deployed application, it means the App Hosting service account needs to be granted permission to access the database and other services.

1.  **Run the Verification Script**: The easiest way to diagnose and fix this is to use the built-in script. Run the following command in your terminal:
    ```bash
    npm run verify:iam
    ```
    This will check for missing roles.

2.  **Run the Fix Script**: If the verification script reports missing roles, run the auto-fix command:
    ```bash
    npm run fix:iam
    ```
    This script will automatically grant all the necessary roles to your App Hosting service account.

3.  **Manual Steps (If Needed)**: If the script fails, you can perform the steps manually:
    -   Go to the **[IAM & Admin page](https://console.cloud.google.com/iam-admin/iam)** in your Google Cloud Console.
    -   Make sure you have selected the correct project (`baitul-mal-connect`).
    -   Find the service account with the name **"Firebase App Hosting compute engine default service account"**. Its email will look like `[PROJECT_NUMBER]-compute@developer.gserviceaccount.com`.
    -   Click the **pencil icon** (Edit principal) for that row.
    -   In the slide-out panel, click **+ ADD ANOTHER ROLE**.
    -   Search for and add the following roles, one by one:
        *   **Firebase Admin**: **(Critical)** Required for managing users in Firebase Authentication (creating, deleting, or syncing them).
        *   **Cloud Datastore User**: Required for reading from and writing to Firestore.
        *   **AI Platform User**: Required for generative AI features to work.
        *   **Storage Admin**: Required for listing and accessing files in Firebase Storage.
        *   **Logging Viewer**: Recommended for debugging server logs.
    -   Click **SAVE**. The application will then have the correct permissions.

---

## 2. "API key not valid" for Gemini / Google AI

**Error Message:** `[400 Bad Request] API key not valid. Please pass a valid API key.` or a similar message indicating an authentication failure.

**Cause:**
This means the application is trying to use a generative AI feature (like scanning a receipt or generating text), but it cannot authenticate with the Google AI service. The `GEMINI_API_KEY` is either missing, incorrect, or not properly configured for your project.

**Solution:**

You must obtain a free API key from Google AI Studio and add it as a secret to your Firebase project.

**Step 1: Get Your API key**

1.  Go to **[Google AI Studio](https://aistudio.google.com/app/apikey)**.
2.  If you are not already logged in, sign in with your Google account.
3.  Click the "**Create API key in new project**" button.
4.  Copy the generated API key. It will be a long string of letters and numbers.

**Step 2: Add the Key as a Secret in Firebase**

1.  Go to your **[Firebase Console](https://console.firebase.google.com/)** and select your project (`baitul-mal-connect`).
2.  In the left navigation menu, click the **gear icon** next to "Project Overview" and select **Project settings**.
3.  Go to the **App Hosting** tab.
4.  Find your backend and click the **three-dot menu** (⋮) and select **Edit backend**.
5.  Under the "Secrets" section, click **Add secret**.
6.  For the "Secret name", enter **`GEMINI_API_KEY`**.
7.  For the "Secret value", paste the API key you copied from Google AI Studio.
8.  Click **Create secret** and then **Save**.
9.  The application will automatically redeploy with the new secret. The AI features should now work correctly.
