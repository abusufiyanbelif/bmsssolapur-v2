
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
  getCountFromServer,
  orderBy,
} from 'firebase/firestore';
import { db, isConfigValid } from './firebase';
import { adminDb } from './firebase-admin';
import type { User, UserRole } from './types';

const USERS_COLLECTION = 'users';

// Re-export types for backward compatibility if other services import from here
export type { User, UserRole };
export { updateLead } from './lead-service';


// Hardcoded Super Admin User for dev purposes
const hardcodedSuperAdmin: User = {
    id: 'ADMIN_USER_ID', // A static, predictable ID
    userKey: "USR01",
    name: "admin",
    userId: "admin",
    firstName: "Admin",
    lastName: "User",
    fatherName: "System",
    email: "admin@example.com",
    phone: "9999999999",
    password: "admin",
    roles: ["Super Admin"],
    privileges: ["all"],
    isActive: true,
    gender: 'Other',
    source: 'Seeded',
    createdAt: new Date('2024-01-01'),
};


// Helper to remove duplicates from an array
const getUnique = <T>(arr: T[] = []): T[] => {
    if (!Array.isArray(arr)) return [];
    return [...new Set(arr.filter(Boolean))];
}

/**
 * Generates the next available sequential ID for a given anonymous role prefix.
 * e.g., if the highest DONOR ID is DONOR05, it will return DONOR06.
 * @param prefix The prefix for the ID (e.g., "DONOR", "BENFCRY").
 * @param field The field to check in Firestore (e.g., "anonymousDonorId").
 * @returns The next sequential ID string.
 */
const generateNextAnonymousId = async (prefix: string, field: keyof User): Promise<string> => {
    const q = query(
        collection(db, USERS_COLLECTION),
        where(field, '>=', prefix),
        where(field, '<', prefix + 'Z'), // A trick to query for strings starting with the prefix
        orderBy(field, 'desc'),
        limit(1)
    );

    const querySnapshot = await getDocs(q);
    let lastNumber = 0;
    if (!querySnapshot.empty) {
        const lastUser = querySnapshot.docs[0].data() as User;
        const lastId = lastUser[field] as string;
        if(lastId) {
           const numberPart = lastId.replace(prefix, '');
           lastNumber = parseInt(numberPart, 10);
        }
    }
    const nextNumber = lastNumber + 1;
    return `${prefix}${nextNumber.toString().padStart(2, '0')}`;
}


// Function to get a user by their custom userId field
export const getUserByUserId = async (userId: string): Promise<User | null> => {
    if (!isConfigValid || !userId) {
        return null;
    }
     // Hardcoded check for the default admin user
    if (userId === hardcodedSuperAdmin.userId) {
        return hardcodedSuperAdmin;
    }
    try {
        const q = query(collection(db, USERS_COLLECTION), where("userId", "==", userId), limit(1));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const data = userDoc.data();
            return {
              id: userDoc.id,
              ...data,
              roles: getUnique(data.roles),
              createdAt: (data.createdAt as Timestamp)?.toDate(),
              updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
            } as User;
        }
        return null;
    } catch (error) {
        console.error(`Error getting user by userId: ${userId}`, error);
        return null;
    }
};


// Function to create or update a user
export const createUser = async (userData: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>) => {
  if (!isConfigValid) throw new Error('Firebase is not configured.');
  
  try {
    // Generate a new Firestore document reference with a unique ID
    const userRef = doc(collection(db, USERS_COLLECTION));
    
    // Standardize phone number
    const standardizedPhone = userData.phone?.replace(/\D/g, '').slice(-10) || '';
    if (standardizedPhone.length !== 10) {
        throw new Error("Invalid phone number provided. Must be 10 digits.");
    }

    // Check for duplicate email if one is provided
    if (userData.email) {
      const emailExists = await getUserByEmail(userData.email);
      if (emailExists) {
          throw new Error(`A user with the email ${userData.email} already exists (Name: ${emailExists.name}).`);
      }
    }
    // Check for duplicate phone number
    const phoneExists = await getUserByPhone(standardizedPhone);
    if(phoneExists) {
        throw new Error(`A user with the phone number ${standardizedPhone} already exists (Name: ${phoneExists.name}).`);
    }
    
    // Generate a unique userId if not provided
    let finalUserId = userData.userId;
    if (!finalUserId) {
        finalUserId = `${userData.firstName?.toLowerCase() || 'user'}.${userData.lastName?.toLowerCase() || Date.now()}`.replace(/\s+/g, '');
    }
    const idExists = await getUserByUserId(finalUserId);
    if (idExists) {
        throw new Error(`User ID "${finalUserId}" is already taken.`);
    }

    // Generate a new userKey.
    const usersCollection = collection(db, USERS_COLLECTION);
    const countSnapshot = await getCountFromServer(usersCollection);
    const userNumber = countSnapshot.data().count + 1;
    const userKey = `USR${userNumber.toString().padStart(2, '0')}`;

    // --- On-demand Anonymous ID Generation ---
    const assignedRoles = getUnique(userData.roles || ['Donor']);
    let anonymousDonorId: string | undefined;
    let anonymousBeneficiaryId: string | undefined;
    let anonymousReferralId: string | undefined;
    let anonymousAdminId: string | undefined;

    if (assignedRoles.includes('Donor')) {
        anonymousDonorId = await generateNextAnonymousId('DONOR', 'anonymousDonorId');
    }
    if (assignedRoles.includes('Beneficiary')) {
        anonymousBeneficiaryId = await generateNextAnonymousId('BENFCRY', 'anonymousBeneficiaryId');
    }
     if (assignedRoles.includes('Referral')) {
        anonymousReferralId = await generateNextAnonymousId('REF', 'anonymousReferralId');
    }
    if (assignedRoles.some(r => ['Admin', 'Super Admin', 'Finance Admin'].includes(r))) {
         anonymousAdminId = await generateNextAnonymousId('ADM', 'anonymousAdminId');
    }
    // --- End On-demand ID Generation ---

    const newUser: User = { 
        id: userRef.id,
        userKey: userKey,
        name: userData.name || `${userData.firstName || ''} ${userData.middleName || ''} ${userData.lastName || ''}`.replace(/\s+/g, ' ').trim(),
        userId: finalUserId,
        firstName: userData.firstName!,
        middleName: userData.middleName,
        lastName: userData.lastName!,
        fatherName: userData.fatherName,
        email: userData.email,
        phone: standardizedPhone,
        password: userData.password,
        isActive: userData.isActive !== undefined ? userData.isActive : true,
        address: {
            addressLine1: userData.address?.addressLine1 || '',
            city: userData.address?.city || 'Solapur',
            state: userData.address?.state || 'Maharashtra',
            country: userData.address?.country || 'India',
            pincode: userData.address?.pincode || '',
        },
        gender: userData.gender || 'Other',
        beneficiaryType: userData.beneficiaryType,
        isAnonymousAsBeneficiary: userData.isAnonymousAsBeneficiary || false,
        isAnonymousAsDonor: userData.isAnonymousAsDonor || false,
        anonymousBeneficiaryId: anonymousBeneficiaryId,
        anonymousDonorId: anonymousDonorId,
        anonymousReferralId: anonymousReferralId,
        anonymousAdminId: anonymousAdminId,
        occupation: userData.occupation,
        familyMembers: userData.familyMembers,
        isWidow: userData.isWidow,
        secondaryPhone: userData.secondaryPhone,
        aadhaarNumber: userData.aadhaarNumber,
        panNumber: userData.panNumber,
        bankAccountName: userData.bankAccountName,
        bankAccountNumber: userData.bankAccountNumber,
        bankIfscCode: userData.bankIfscCode,
        upiPhone: userData.upiPhone,
        upiIds: userData.upiIds || [],
        roles: assignedRoles,
        privileges: userData.privileges || [],
        groups: userData.groups || [],
        referredByUserId: userData.referredByUserId,
        referredByUserName: userData.referredByUserName,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        source: userData.source || 'Manual Entry',
    };

    // Remove undefined fields to prevent Firestore errors
    Object.keys(newUser).forEach(key => {
        const typedKey = key as keyof User;
        if ((newUser as any)[typedKey] === undefined) {
            delete (newUser as any)[typedKey];
        }
    });

    await setDoc(userRef, newUser);
    return newUser;

  } catch (error) {
    console.error('Error creating user: ', error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error('An unknown error occurred while creating the user.');
  }
};

// Function to get a user by ID
export const getUser = async (id: string): Promise<User | null> => {
  if (!isConfigValid || !id) {
    return null;
  }
   // Hardcoded check for the default admin user
  if (id === hardcodedSuperAdmin.id || id === hardcodedSuperAdmin.userId) {
        return hardcodedSuperAdmin;
  }
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, id));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return { 
        id: userDoc.id, 
        ...data,
        roles: getUnique(data.roles),
        groups: getUnique(data.groups),
        privileges: getUnique(data.privileges),
        createdAt: (data.createdAt as Timestamp)?.toDate(),
        updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
      } as User;
    }
    return null;
  } catch (error) {
    console.error(`Error getting user with ID ${id}:`, error);
    return null;
  }
};

// Function to get a user by name (for the special 'admin' case)
export const getUserByName = async (name: string): Promise<User | null> => {
    if (!isConfigValid || !name) {
        return null;
    }
     if (name === hardcodedSuperAdmin.name) {
        return hardcodedSuperAdmin;
    }
    try {
        const q = query(collection(db, USERS_COLLECTION), where("name", "==", name), limit(1));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const data = userDoc.data();
        return {
            id: userDoc.id,
            ...data,
            roles: getUnique(data.roles),
            createdAt: (data.createdAt as Timestamp)?.toDate(),
            updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
        } as User;
        }
        return null;
    } catch (error) {
        console.error(`Error getting user by name: ${name}`, error);
        return null;
    }
}

// Function to get a user by userKey
export const getUserByUserKey = async (userKey: string): Promise<User | null> => {
    if (!isConfigValid || !userKey) {
        return null;
    }
     if (userKey === hardcodedSuperAdmin.userKey) {
        return hardcodedSuperAdmin;
    }
    try {
        const q = query(collection(db, USERS_COLLECTION), where("userKey", "==", userKey), limit(1));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            const data = doc.data();
            return {
                id: doc.id, ...data, roles: getUnique(data.roles), createdAt: (data.createdAt as Timestamp)?.toDate(),
                updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
            } as User;
        }
        return null;
    } catch (e) {
        console.error("Error getting user by userKey: ", e);
        return null;
    }
};

// Function to get a user by full name
export const getUserByFullName = async (name: string): Promise<User | null> => {
    if (!isConfigValid || !name) {
        return null;
    }
     if (name === hardcodedSuperAdmin.name) {
        return hardcodedSuperAdmin;
    }
    try {
        const q = query(collection(db, USERS_COLLECTION), where("name", "==", name), limit(1));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
             const data = doc.data();
            return {
                id: doc.id, ...data, roles: getUnique(data.roles), createdAt: (data.createdAt as Timestamp)?.toDate(),
                updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
            } as User;
        }
        return null;
    } catch (e) {
        console.error("Error getting user by name: ", e);
        return null;
    }
};


// Function to get a user by phone number
export const getUserByPhone = async (phone: string): Promise<User | null> => {
  if (!isConfigValid) {
    return null;
  }
  const standardizedPhone = phone?.replace(/\D/g, '').slice(-10);
  if (!standardizedPhone || standardizedPhone.length !== 10) return null;
  
   if (standardizedPhone === hardcodedSuperAdmin.phone) {
        return hardcodedSuperAdmin;
    }

  try {
    const q = query(collection(db, USERS_COLLECTION), where("phone", "==", standardizedPhone), limit(1));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const data = userDoc.data();
       return {
        id: userDoc.id,
        ...data,
        roles: getUnique(data.roles),
        createdAt: (data.createdAt as Timestamp)?.toDate(),
        updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
      } as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user by phone: ', error);
    return null;
  }
}

// Function to get a user by email
export const getUserByEmail = async (email: string): Promise<User | null> => {
  if (!isConfigValid || !email) {
    return null;
  }
   if (email === hardcodedSuperAdmin.email) {
        return hardcodedSuperAdmin;
    }
  try {
    const q = query(collection(db, USERS_COLLECTION), where("email", "==", email), limit(1));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const data = userDoc.data();
      return {
        id: userDoc.id,
        ...data,
        roles: getUnique(data.roles),
        createdAt: (data.createdAt as Timestamp)?.toDate(),
        updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
      } as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user by email: ', error);
    return null;
  }
}

// Function to get a user by UPI ID
export const getUserByUpiId = async (upiId: string): Promise<User | null> => {
  if (!isConfigValid || !upiId) return null;
  try {
    const q = query(collection(db, USERS_COLLECTION), where("upiIds", "array-contains", upiId), limit(1));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const data = userDoc.data();
       return {
        id: userDoc.id,
        ...data,
        roles: getUnique(data.roles),
        createdAt: (data.createdAt as Timestamp)?.toDate(),
        updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
      } as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user by UPI ID: ', error);
    return null;
  }
}

// Function to get a user by Bank Account Number
export const getUserByBankAccountNumber = async (accountNumber: string): Promise<User | null> => {
  if (!isConfigValid || !accountNumber) {
    return null;
  }
  try {
    const q = query(collection(db, USERS_COLLECTION), where("bankAccountNumber", "==", accountNumber), limit(1));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const data = userDoc.data();
       return {
        id: userDoc.id,
        ...data,
        roles: getUnique(data.roles),
        createdAt: (data.createdAt as Timestamp)?.toDate(),
        updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
      } as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user by bank account number: ', error);
    return null;
  }
}

// Function to get a user by PAN Number
export const getUserByPan = async (pan: string): Promise<User | null> => {
  if (!isConfigValid || !pan) return null;
  try {
    const q = query(collection(db, USERS_COLLECTION), where("panNumber", "==", pan.toUpperCase()), limit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const data = doc.data();
      return { 
        id: doc.id,
        ...data,
        roles: getUnique(data.roles),
        createdAt: (data.createdAt as Timestamp)?.toDate(),
        updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
      } as User;
    }
    return null;
  } catch (e) {
    console.error("Error getting user by PAN:", e);
    return null;
  }
};

// Function to get a user by Aadhaar Number
export const getUserByAadhaar = async (aadhaar: string): Promise<User | null> => {
  if (!isConfigValid || !aadhaar) return null;
  try {
    const q = query(collection(db, USERS_COLLECTION), where("aadhaarNumber", "==", aadhaar), limit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const data = doc.data();
      return { 
        id: doc.id,
        ...data,
        roles: getUnique(data.roles),
        createdAt: (data.createdAt as Timestamp)?.toDate(),
        updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
      } as User;
    }
    return null;
  } catch (e) {
    console.error("Error getting user by Aadhaar:", e);
    return null;
  }
};


// Function to update a user
export const updateUser = async (id: string, updates: Partial<User>) => {
    if (!isConfigValid) throw new Error('Firebase is not configured.');
    try {
        const userRef = doc(db, USERS_COLLECTION, id);
        
        const finalUpdates: Partial<User> = { ...updates };
        if (updates.roles) {
            finalUpdates.roles = getUnique(updates.roles);

            const originalUser = await getUser(id);
            if(originalUser) {
                // Check if new roles were added and generate anonymous IDs if needed
                if (!originalUser.anonymousDonorId && finalUpdates.roles.includes('Donor')) {
                    finalUpdates.anonymousDonorId = await generateNextAnonymousId('DONOR', 'anonymousDonorId');
                }
                if (!originalUser.anonymousBeneficiaryId && finalUpdates.roles.includes('Beneficiary')) {
                    finalUpdates.anonymousBeneficiaryId = await generateNextAnonymousId('BENFCRY', 'anonymousBeneficiaryId');
                }
                if (!originalUser.anonymousReferralId && finalUpdates.roles.includes('Referral')) {
                    finalUpdates.anonymousReferralId = await generateNextAnonymousId('REF', 'anonymousReferralId');
                }
                if (!originalUser.anonymousAdminId && finalUpdates.roles.some(r => ['Admin', 'Super Admin', 'Finance Admin'].includes(r))) {
                     finalUpdates.anonymousAdminId = await generateNextAnonymousId('ADM', 'anonymousAdminId');
                }
            }
        }
        
        if (updates.groups) {
            finalUpdates.groups = getUnique(updates.groups);
        }

        // Clean out undefined values before sending to Firestore
        Object.keys(finalUpdates).forEach(key => {
            const typedKey = key as keyof User;
            if (finalUpdates[typedKey] === undefined) {
                delete (finalUpdates as any)[typedKey];
            }
        });

        await updateDoc(userRef, {
            ...finalUpdates,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error(`Error updating user ${id}:`, error);
        throw new Error(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

// Function to delete a user
export const deleteUser = async (id: string) => {
    if (!isConfigValid) throw new Error('Firebase is not configured.');
    try {
        const userRef = doc(db, USERS_COLLECTION, id);
        await deleteDoc(userRef);
    } catch (error) {
        console.error(`Error deleting user ${id}:`, error);
        throw new Error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Function to get all users
export const getAllUsers = async (): Promise<User[]> => {
    if (!isConfigValid) {
      console.warn("Firebase not configured. Skipping fetching all users.");
      return [];
    }
    try {
        const usersQuery = query(collection(db, USERS_COLLECTION), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(usersQuery);
        const users: User[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            users.push({ 
                id: doc.id,
                ...data,
                roles: getUnique(data.roles),
                createdAt: (data.createdAt as Timestamp)?.toDate(),
                updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
            } as User);
        });
        return users;
    } catch (error) {
        console.error("Error getting all users: ", error);
        if (error instanceof Error && error.message.includes('index')) {
             console.error("Firestore index missing. Please create a descending index on 'createdAt' for the 'users' collection.");
        }
        return []; // Return empty array on error
    }
}


export const getReferredBeneficiaries = async (referrerId: string): Promise<User[]> => {
    if (!isConfigValid) {
        console.warn("Firebase not configured. Skipping user fetch.");
        return [];
    }
    try {
        const q = query(
            collection(db, USERS_COLLECTION), 
            where("referredByUserId", "==", referrerId)
        );
        const querySnapshot = await getDocs(q);
        const users: User[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            users.push({ 
                id: doc.id,
                ...data,
                roles: getUnique(data.roles),
                createdAt: (data.createdAt as Timestamp)?.toDate(),
                updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
            } as User);
        });
        return users;
    } catch (error) {
        console.error('Error getting referred beneficiaries: ', error);
        return [];
    }
}

interface AvailabilityResult {
    isAvailable: boolean;
    suggestions?: string[];
    existingUserName?: string;
}

export async function checkAvailability(field: string, value: string): Promise<AvailabilityResult> {
    if (!value) return { isAvailable: true };

    try {
        let existingUser: User | null = null;
        switch (field) {
            case 'userId':
                existingUser = await getUserByUserId(value);
                break;
            case 'email':
                existingUser = await getUserByEmail(value);
                break;
            case 'phone':
                existingUser = await getUserByPhone(value);
                break;
            case 'panNumber':
                existingUser = await getUserByPan(value);
                break;
            case 'aadhaarNumber':
                existingUser = await getUserByAadhaar(value);
                break;
            case 'bankAccountNumber':
                existingUser = await getUserByBankAccountNumber(value);
                break;
            case 'upiId':
                 existingUser = await getUserByUpiId(value);
                 break;
            default:
                return { isAvailable: true };
        }

        if (existingUser) {
            let suggestions: string[] = [];
            if (field === 'userId') {
                for (let i = 1; i <= 3; i++) {
                    const suggestionId = `${value}${i}`;
                    const isSuggestionTaken = await getUserByUserId(suggestionId);
                    if (!isSuggestionTaken) {
                        suggestions.push(suggestionId);
                    }
                }
            }
            return { isAvailable: false, suggestions, existingUserName: existingUser.name };
        }
        return { isAvailable: true };
    } catch(e) {
        console.error(`Error checking ${field} availability:`, e);
        return { isAvailable: false }; // Fail closed to prevent duplicates
    }
}

/**
 * Performs a lightweight, low-cost read operation against Firestore using the Admin SDK
 * to check if the current environment has the necessary permissions.
 * This function should be called from the server, typically in a root component.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const performPermissionCheck = async (): Promise<{success: boolean, error?: string}> => {
    try {
        const nonExistentDocRef = adminDb.collection("permission-check").doc("heartbeat");
        await nonExistentDocRef.get();
        return { success: true };
    } catch (e) {
        if (e instanceof Error) {
            if (e.message.includes("Could not load the default credentials")) {
                 return { success: false, error: 'permission-denied' };
            }
             if (e.message.includes("offline")) {
                return { success: false, error: "The client is offline." };
            }
        }
        console.error("An unexpected error occurred during permission check:", e);
        return { success: false, error: "An unexpected error occurred during the initial permission check." };
    }
};
