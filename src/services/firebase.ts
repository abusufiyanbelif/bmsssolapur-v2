
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

let clientApp: FirebaseApp;
// Check if Firebase has already been initialized
if (!getApps().length) {
  clientApp = initializeApp(firebaseConfig);
} else {
  clientApp = getApp();
}

const auth: Auth = getAuth(clientApp);
const db: Firestore = getFirestore(clientApp);
const storage = getStorage(clientApp);

const isConfigValid = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

export { clientApp as app, auth, db, storage, isConfigValid };
