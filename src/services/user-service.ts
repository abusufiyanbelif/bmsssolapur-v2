

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
import type { User, UserRole } from './types';

const USERS_COLLECTION = 'users';

// Re-export types for backward compatibility if other services import from here
export type { User, UserRole };


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
    
    let anonymousId: string | undefined = user.anonymousId;
    if (user.isAnonymous && !anonymousId) {
        // Generate a unique anonymous ID if it doesn't exist
        anonymousId = `Beneficiary-${userRef.id.substring(0, 6).toUpperCase()}`;
    }

    // Ensure createdAt is a Firestore Timestamp
    const finalUserData: User = { 
        name: user.name,
        email: user.email,
        phone: user.phone,
        password: user.password,
        isActive: user.isActive,
        address: {
            addressLine1: user.address?.addressLine1 || '',
            city: user.address?.city || 'Solapur',
            state: user.address?.state || 'Maharashtra',
            country: user.address?.country || 'India',
            pincode: user.address?.pincode || '',
        },
        gender: user.gender,
        isAnonymous: user.isAnonymous || false,
        anonymousId: anonymousId,
        occupation: user.occupation,
        familyMembers: user.familyMembers,
        isWidow: user.isWidow,
        secondaryPhone: user.secondaryPhone,
        aadhaarNumber: user.aadhaarNumber,
        panNumber: user.panNumber,
        roles: user.roles || [],
        privileges: user.privileges || [],
        groups: user.groups || [],
        enableMonthlyDonationReminder: user.enableMonthlyDonationReminder || false,
        id: userRef.id,
        createdAt: user.createdAt || Timestamp.now(),
        updatedAt: user.updatedAt || Timestamp.now(),
    };

    // Remove undefined fields to prevent Firestore errors
    Object.keys(finalUserData).forEach(key => {
        const typedKey = key as keyof User;
        if (finalUserData[typedKey] === undefined) {
            delete finalUserData[typedKey];
        }
    });

    await setDoc(userRef, finalUserData, { merge: true }); // Use merge to avoid overwriting on OAuth creation
    
    // Fetch the potentially merged document to return the full user object
    const savedUserDoc = await getDoc(userRef);
    return { id: savedUserDoc.id, ...savedUserDoc.data() } as User;

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
    if (!email) return null;
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
        
        let finalUpdates = { ...updates };
        if (updates.isAnonymous && !updates.anonymousId) {
            const existingUser = await getDoc(userRef);
            if (existingUser.exists() && !existingUser.data().anonymousId) {
                finalUpdates.anonymousId = `Beneficiary-${id.substring(0, 6).toUpperCase()}`;
            }
        }

        await updateDoc(userRef, {
            ...finalUpdates,
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
