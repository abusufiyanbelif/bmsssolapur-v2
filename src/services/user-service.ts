/**
 * @fileOverview User service for interacting with Firestore.
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  getDocs,
  Timestamp,
  where,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isConfigValid } from './firebase';

const USERS_COLLECTION = 'users';

export type UserRole = 
  | 'Guest'           // Public user, not logged in
  | 'Donor'           // Logged-in user who can donate
  | 'Beneficiary'     // Logged-in user who can receive aid
  | 'Referral'        // A user who refers beneficiaries (future role)
  | 'Admin'           // A staff member with operational privileges
  | 'Finance Admin'   // An admin with specific financial privileges
  | 'Super Admin';    // A user with all privileges

// A list of granular permissions
export type Privilege =
  | 'all' // Super Admin privilege
  | 'canManageUsers'
  | 'canManageRoles'
  | 'canManageLeads'
  | 'canVerifyLeads'
  | 'canManageDonations'
  | 'canVerifyDonations'
  | 'canViewFinancials'
  | 'canExportData'
  | 'canManageSettings';

export interface User {
  id?: string;
  name: string;
  email?: string;
  phone: string;
  isActive: boolean;
  address?: string;
  gender?: 'Male' | 'Female' | 'Other';
  secondaryPhone?: string; // For account recovery
  aadhaarNumber?: string; // Mandated for Admins
  panNumber?: string; // Mandated for Admins
  roles: UserRole[]; // A user can have multiple roles
  privileges?: Privilege[]; // Specific permissions granted to the user, often derived from roles
  groups?: string[]; // e.g., 'Founders', 'Finance Team', for organizational purposes
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// Function to create or update a user
export const createUser = async (user: Omit<User, 'id'> & { id?: string }) => {
  if (!isConfigValid) throw new Error('Firebase is not configured.');
  try {
    // Check for duplicate email if one is provided
    if (user.email) {
      const emailExists = await getUserByEmail(user.email);
      if (emailExists && emailExists.id !== user.id) {
          throw new Error(`A user with the email ${user.email} already exists.`);
      }
    }
    // Check for duplicate phone number
    const phoneExists = await getUserByPhone(user.phone);
    if(phoneExists && phoneExists.id !== user.id) {
        throw new Error(`A user with the phone number ${user.phone} already exists.`);
    }

    const userRef = user.id ? doc(db, USERS_COLLECTION, user.id) : doc(collection(db, USERS_COLLECTION));
    // Ensure createdAt is a Firestore Timestamp
    const finalUserData: User = { 
        name: user.name,
        email: user.email,
        phone: user.phone,
        isActive: user.isActive,
        address: user.address,
        gender: user.gender,
        secondaryPhone: user.secondaryPhone,
        aadhaarNumber: user.aadhaarNumber,
        panNumber: user.panNumber,
        roles: user.roles || [],
        privileges: user.privileges || [],
        groups: user.groups || [],
        id: userRef.id,
        createdAt: user.createdAt || Timestamp.now(),
    };
    await setDoc(userRef, finalUserData, { merge: true }); // Use merge to avoid overwriting on OAuth creation
    return finalUserData;
  } catch (error) {
    console.error('Error creating user: ', error);
    // Re-throw the specific error message for the client to handle
    if (error instanceof Error) {
        throw error;
    }
    throw new Error('Failed to create user.');
  }
};

// Function to get a user by ID
export const getUser = async (id: string): Promise<User | null> => {
  if (!isConfigValid) {
    console.warn("Firebase is not configured. Skipping user fetch.");
    return null;
  }
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, id));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() } as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user: ', error);
    throw new Error('Failed to get user.');
  }
};

// Function to get a user by name (for the special 'admin' case)
export const getUserByName = async (name: string): Promise<User | null> => {
  if (!isConfigValid) {
    console.warn("Firebase is not configured. Skipping user fetch by name.");
    return null;
  }
  try {
    const q = query(collection(db, USERS_COLLECTION), where("name", "==", name), limit(1));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      return { id: userDoc.id, ...userDoc.data() } as User;
    }
    return null;
  } catch (error) {
    console.error(`Error getting user by name: ${name}`, error);
    throw new Error('Failed to get user by name.');
  }
}

// Function to get a user by phone number
export const getUserByPhone = async (phone: string): Promise<User | null> => {
  if (!isConfigValid) {
    console.warn("Firebase is not configured. Skipping user fetch by phone.");
    return null;
  }
  try {
    const q = query(collection(db, USERS_COLLECTION), where("phone", "==", phone), limit(1));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      return { id: userDoc.id, ...userDoc.data() } as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user by phone: ', error);
    // This could be due to a missing index. Log a helpful message.
    if (error instanceof Error && error.message.includes('index')) {
        console.error("Firestore index missing. Please create a composite index in Firestore on the 'users' collection for 'phone' (ascending). The link in the error message will help you do this.");
    }
    throw new Error('Failed to get user by phone.');
  }
}

// Function to get a user by email
export const getUserByEmail = async (email: string): Promise<User | null> => {
  if (!isConfigValid) {
    console.warn("Firebase is not configured. Skipping user fetch by email.");
    return null;
  }
  try {
    const q = query(collection(db, USERS_COLLECTION), where("email", "==", email), limit(1));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      return { id: userDoc.id, ...userDoc.data() } as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user by email: ', error);
    throw new Error('Failed to get user by email.');
  }
}

// Function to update a user
export const updateUser = async (id: string, updates: Partial<User>) => {
    if (!isConfigValid) throw new Error('Firebase is not configured.');
    try {
        const userRef = doc(db, USERS_COLLECTION, id);
        await updateDoc(userRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error updating user: ", error);
        throw new Error('Failed to update user.');
    }
};

// Function to delete a user
export const deleteUser = async (id: string) => {
    if (!isConfigValid) throw new Error('Firebase is not configured.');
    try {
        const userRef = doc(db, USERS_COLLECTION, id);
        await deleteDoc(userRef);
    } catch (error) {
        console.error("Error deleting user: ", error);
        throw new Error('Failed to delete user.');
    }
}

// Function to get all users
export const getAllUsers = async (): Promise<User[]> => {
    if (!isConfigValid) {
      console.warn("Firebase not configured. Skipping fetching all users.");
      return [];
    }
    try {
        const usersQuery = query(collection(db, USERS_COLLECTION));
        const querySnapshot = await getDocs(usersQuery);
        const users: User[] = [];
        querySnapshot.forEach((doc) => {
            users.push({ id: doc.id, ...(doc.data() as Omit<User, 'id'>) });
        });
        return users;
    } catch (error) {
        console.error("Error getting all users: ", error);
        throw new Error('Failed to get all users.');
    }
}
