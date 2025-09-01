

import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { config as appConfig } from '@/lib/config';

// --- Client-side Firebase SDK Initialization ---

const firebaseConfig = {
  apiKey: appConfig.firebase.apiKey,
  authDomain: appConfig.firebase.authDomain,
  projectId: appConfig.firebase.projectId,
  storageBucket: appConfig.firebase.storageBucket,
  messagingSenderId: appConfig.firebase.messagingSenderId,
  appId: appConfig.firebase.appId,
};

export const isConfigValid = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

let clientApp: FirebaseApp;
if (isConfigValid && !getApps().length) {
  clientApp = initializeApp(firebaseConfig);
} else {
  clientApp = getApps()[0];
}

const auth: Auth = getAuth(clientApp);
const db: Firestore = getFirestore(clientApp);
const storage = isConfigValid ? getStorage(clientApp) : null;


export { clientApp as app, auth, db, storage };
