# Troubleshooting Guide

This document provides solutions to common issues encountered during development.

---

## 1. "API key not valid" for Gemini / Google AI

**Error Message:** `[400 Bad Request] API key not valid. Please pass a valid API key.`

**Cause:**
This is the most common issue. It means the application is trying to use a generative AI feature (like scanning a receipt or generating text), but it cannot authenticate with the Google AI service. The `GEMINI_API_KEY` is either missing, incorrect, or not properly configured for your project.

**Solution:**

You must obtain a free API key from Google AI Studio and add it as a secret to your Firebase project.

**Step 1: Get Your API Key**

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

---

## 2. "Could not reach Cloud Firestore backend" or "Could not refresh access token"

**Error Message:** `Firestore (11.9.0): Could not reach Cloud Firestore backend.` or `Could not refresh access token`.

**Cause:**
This error means the server environment itself (Firebase App Hosting) doesn't have the necessary permission to access the database (Firestore). This is an infrastructure-level permission issue. The App Hosting service account needs to be explicitly granted permission to read from and write to the database.

**Solution:**

You need to grant the **"Cloud Datastore User"** role to your App Hosting service account.

1.  Go to the **[IAM & Admin page](https://console.cloud.google.com/iam-admin/iam)** in your Google Cloud Console.
2.  Make sure you have selected the correct project (`baitul-mal-connect`).
3.  Find the service account with the name **"Firebase App Hosting compute engine default service account"**. Its email will look like `[PROJECT_NUMBER]-compute@developer.gserviceaccount.com`.
4.  Click the **pencil icon** (Edit principal) for that row.
5.  In the slide-out panel, click **+ ADD ANOTHER ROLE**.
6.  In the "Select a role" search box, type **`Cloud Datastore User`**.
7.  Select the **Cloud Datastore User** role from the results.
8.  Click **SAVE**.
9.  The application should now have the correct permissions to access the database. The error should resolve within a minute or two.
