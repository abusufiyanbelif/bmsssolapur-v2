
// src/services/firebase.ts
import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { config } from '@/lib/config';

const firebaseConfig = {
  apiKey: config.firebase.apiKey,
  authDomain: config.firebase.authDomain,
  projectId: config.firebase.projectId,
  storageBucket: config.firebase.storageBucket,
  messagingSenderId: config.firebase.messagingSenderId,
  appId: config.firebase.appId,
};

// A simple check to see if the config values are placeholders
const isConfigPotentiallyValid = (config: typeof firebaseConfig) => {
  if (!config.apiKey || config.apiKey.includes("YOUR_")) return false;
  if (!config.projectId || config.projectId.includes("YOUR_")) return false;
  return true;
}

// Check if all required firebase config values are present and not placeholders
export const isConfigValid = isConfigPotentiallyValid(firebaseConfig);

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

if (isConfigValid) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    auth = getAuth(app);
} else {
    console.warn("Firebase configuration is missing, incomplete, or contains placeholder values. Firebase services will not be initialized.");
    // Provide dummy objects to prevent app from crashing when firebase is not configured
    app = {} as FirebaseApp;
    db = {} as Firestore;
    auth = {} as Auth;
}


export { app, db, auth };
