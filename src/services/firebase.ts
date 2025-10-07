
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

// This is the key change to fix the network request failed error on localhost.
// It disables the app verification for testing environments.
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    // This property does not exist on the Auth type definition by default.
    // We cast to any to set it. It's a valid Firebase JS SDK property.
    try {
      (auth.settings as any).appVerificationDisabledForTesting = true;
    } catch(e) {
      console.error("Could not disable app verification for testing. This may happen in some environments.", e);
    }
}


const isConfigValid = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

export { clientApp as app, auth, db, storage, isConfigValid };
