
# Troubleshooting Guide

This document provides solutions to common issues encountered during development.

---

## 1. "UNAUTHENTICATED" / "PERMISSION_DENIED" / "Could not reach Cloud Firestore backend" (Local & Deployed)

**Error Message(s):**
- `16 UNAUTHENTICATED: Request had invalid authentication credentials.`
- `Could not reach Cloud Firestore backend.`
- `7 PERMISSION_DENIED: Missing or insufficient permissions.`
- `Seeding Failed - UNKNOWN: Getting metadata from plugin failed with error: Could not refresh access token`

**Cause:**
This is the most common category of errors. It means your application's environment—whether it's your local machine or the deployed Firebase App Hosting server—is not authorized to communicate with your Google Cloud services, especially Firestore.

---

### Solution for Deployed App (Firebase App Hosting)

If you see this error in your deployed application, it means the App Hosting service account needs to be granted permission to access other Google Cloud services.

#### What is the App Hosting Service Account?
Think of a service account as a special, non-human "user" that represents your application. When your Next.js code runs on Firebase's servers, it uses the **"Firebase App Hosting compute engine default service account"** as its identity.

When this backend code tries to access Firestore or Cloud Storage, it tells Google Cloud, "I am the App Hosting service account for project 'baitul-mal-connect'." Google Cloud then checks what permissions (IAM roles) that account has. By default, it doesn't have permission to access other services, which is why you see the `UNAUTHENTICATED` error.

#### The Fix: Granting Permissions (IAM Roles)

To fix this, you must grant the necessary roles to this service account. This is a one-time setup for your project.

1.  Go to the **[IAM & Admin page](https://console.cloud.google.com/iam-admin/iam)** in your Google Cloud Console.
2.  Make sure you have selected the correct project (`baitul-mal-connect`).
3.  Find the service account (the "principal") with the name **"Firebase App Hosting compute engine default service account"**. Its email will look like `[PROJECT_NUMBER]-compute@developer.gserviceaccount.com`.
4.  Click the **pencil icon** (Edit principal) for that row.
5.  In the slide-out panel, click **+ ADD ANOTHER ROLE**.
6.  Search for and add the following roles, one by one:
    *   **`Cloud Datastore User`**: **Required**. Allows reading from and writing to Firestore.
    *   **`Storage Admin`**: **Required**. Allows uploading, reading, and deleting files in Firebase Storage.
    *   **`Firebase Admin`**: A broader role that often covers most necessary permissions if the others don't work.
7.  Click **SAVE**.
8.  The change should take effect within a minute or two. The application will then have the correct permissions to access all backend services.

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
