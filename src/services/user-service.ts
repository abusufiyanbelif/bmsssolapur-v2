

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
import type { User, UserRole } from './types';

const USERS_COLLECTION = 'users';

// Re-export types for backward compatibility if other services import from here
export type { User, UserRole };
export { updateLead } from './lead-service';


// Helper to remove duplicates from an array
const getUniqueRoles = (roles: UserRole[] = []): UserRole[] => {
    // This handles cases where roles might be null or undefined, and ensures uniqueness
    if (!Array.isArray(roles)) return [];
    return [...new Set(roles.filter(Boolean))];
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
    if (!isConfigValid) {
        console.warn("Firebase not configured. Skipping user fetch by userId.");
        return null;
    }
    try {
        if (!userId) return null;
        const q = query(collection(db, USERS_COLLECTION), where("userId", "==", userId), limit(1));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const data = userDoc.data();
            return {
              id: userDoc.id,
              ...data,
              roles: getUniqueRoles(data.roles),
              createdAt: (data.createdAt as Timestamp)?.toDate(),
              updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
            } as User;
        }
        return null;
    } catch (error) {
        console.error(`Error getting user by userId: ${userId}`, error);
        throw new Error(`Failed to get user by userId. This could be due to a missing Firestore index on the 'userId' field in the 'users' collection.`);
    }
};


// Function to create or update a user
export const createUser = async (userData: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>) => {
  if (!isConfigValid) throw new Error('Firebase is not configured.');
  
  try {
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
        const idExists = await getUserByUserId(finalUserId);
        if (idExists) {
           finalUserId = `${finalUserId}${Date.now().toString().slice(-4)}`;
        }
    }

    // Generate a new userKey.
    const usersCollection = collection(db, USERS_COLLECTION);
    const countSnapshot = await getCountFromServer(usersCollection);
    const userNumber = countSnapshot.data().count + 1;
    const userKey = `USR${userNumber.toString().padStart(2, '0')}`;

    // --- On-demand Anonymous ID Generation ---
    const assignedRoles = getUniqueRoles(userData.roles || ['Donor']);
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
        enableMonthlyDonationReminder: userData.enableMonthlyDonationReminder || false,
        monthlyPledgeEnabled: userData.monthlyPledgeEnabled || false,
        monthlyPledgeAmount: userData.monthlyPledgeAmount || 0,
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
  if (!isConfigValid) {
    console.warn("Firebase not configured. Skipping user fetch.");
    return null;
  }
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, id));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return { 
        id: userDoc.id, 
        ...data,
        roles: getUniqueRoles(data.roles),
        createdAt: (data.createdAt as Timestamp)?.toDate(),
        updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
      } as User;
    }
    return null;
  } catch (error) {
    console.error(`Error getting user with ID ${id}:`, error);
    throw new Error(`Failed to get user with ID ${id}.`);
  }
};

// Function to get a user by name (for the special 'admin' case)
export const getUserByName = async (name: string): Promise<User | null> => {
  if (!isConfigValid) {
    console.warn("Firebase not configured. Skipping user fetch by name.");
    return null;
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
        roles: getUniqueRoles(data.roles),
        createdAt: (data.createdAt as Timestamp)?.toDate(),
        updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
      } as User;
    }
    return null;
  } catch (error) {
    console.error(`Error getting user by name: ${name}`, error);
    throw new Error(`Failed to get user by name. This could be due to a missing Firestore index on the 'name' field in the 'users' collection.`);
  }
}

// Function to get a user by userKey
export const getUserByUserKey = async (userKey: string): Promise<User | null> => {
    if (!isConfigValid) return null;
    try {
        const q = query(collection(db, USERS_COLLECTION), where("userKey", "==", userKey), limit(1));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            const data = doc.data();
            return {
                id: doc.id, ...data, roles: getUniqueRoles(data.roles), createdAt: (data.createdAt as Timestamp)?.toDate(),
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
    if (!isConfigValid) return null;
    try {
        const q = query(collection(db, USERS_COLLECTION), where("name", "==", name), limit(1));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
             const data = doc.data();
            return {
                id: doc.id, ...data, roles: getUniqueRoles(data.roles), createdAt: (data.createdAt as Timestamp)?.toDate(),
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
    console.warn("Firebase not configured. Skipping user fetch by phone.");
    return null;
  }
  const standardizedPhone = phone.replace(/\D/g, '').slice(-10);
  if (standardizedPhone.length !== 10) return null;

  try {
    const q = query(collection(db, USERS_COLLECTION), where("phone", "==", standardizedPhone), limit(1));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const data = userDoc.data();
       return {
        id: userDoc.id,
        ...data,
        roles: getUniqueRoles(data.roles),
        createdAt: (data.createdAt as Timestamp)?.toDate(),
        updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
      } as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user by phone: ', error);
    // This could be due to a missing index. Log a helpful message.
    if (error instanceof Error && error.message.includes('index')) {
        const detailedError = `Firestore query error. This likely indicates a missing index. Please create a single-field index on 'phone' in the 'users' collection.`;
        console.error(detailedError);
        throw new Error(detailedError);
    }
    throw new Error('Failed to get user by phone.');
  }
}

// Function to get a user by email
export const getUserByEmail = async (email: string): Promise<User | null> => {
  if (!isConfigValid) {
    console.warn("Firebase not configured. Skipping user fetch by email.");
    return null;
  }
  try {
    if (!email) return null;
    const q = query(collection(db, USERS_COLLECTION), where("email", "==", email), limit(1));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const data = userDoc.data();
      return {
        id: userDoc.id,
        ...data,
        roles: getUniqueRoles(data.roles),
        createdAt: (data.createdAt as Timestamp)?.toDate(),
        updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
      } as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user by email: ', error);
    throw new Error('Failed to get user by email.');
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
        roles: getUniqueRoles(data.roles),
        createdAt: (data.createdAt as Timestamp)?.toDate(),
        updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
      } as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user by UPI ID: ', error);
     if (error instanceof Error && error.message.includes('index')) {
        const detailedError = `Firestore query error. This indicates a missing index. Please create an array-contains index in Firestore on the 'users' collection for the 'upiIds' field.`;
        console.error(detailedError);
        return null; // Return null to prevent crash
    }
    return null; // Return null on any other error
  }
}

// Function to get a user by Bank Account Number
export const getUserByBankAccountNumber = async (accountNumber: string): Promise<User | null> => {
  if (!isConfigValid) {
    console.warn("Firebase not configured. Skipping user fetch by bank account.");
    return null;
  }
  try {
    if (!accountNumber) return null;
    const q = query(collection(db, USERS_COLLECTION), where("bankAccountNumber", "==", accountNumber), limit(1));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const data = userDoc.data();
       return {
        id: userDoc.id,
        ...data,
        roles: getUniqueRoles(data.roles),
        createdAt: (data.createdAt as Timestamp)?.toDate(),
        updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
      } as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user by bank account number: ', error);
    if (error instanceof Error && error.message.includes('index')) {
        const detailedError = `Firestore query error. This indicates a missing index. Please create a single-field index in Firestore on the 'users' collection for 'bankAccountNumber' (ascending).`;
        console.error(detailedError);
        throw new Error(detailedError);
    }
    throw new Error('Failed to get user by bank account number.');
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
      return { id: doc.id, ...doc.data() } as User;
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
      return { id: doc.id, ...doc.data() } as User;
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
            finalUpdates.roles = getUniqueRoles(updates.roles);

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

        // Clean out undefined values before sending to Firestore
        Object.keys(finalUpdates).forEach(key => {
            const typedKey = key as keyof User;
            if (finalUpdates[typedKey] === undefined) {
                delete finalUpdates[typedKey];
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
        const usersQuery = query(collection(db, USERS_COLLECTION));
        const querySnapshot = await getDocs(usersQuery);
        const users: User[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            users.push({ 
                id: doc.id,
                ...data,
                roles: getUniqueRoles(data.roles),
                createdAt: (data.createdAt as Timestamp)?.toDate(),
                updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
            } as User);
        });
        return users;
    } catch (error) {
        console.error("Error getting all users: ", error);
        throw new Error('Failed to get all users.');
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
                roles: getUniqueRoles(data.roles),
                createdAt: (data.createdAt as Timestamp)?.toDate(),
                updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
            } as User);
        });
        return users;
    } catch (error) {
        console.error('Error getting referred beneficiaries: ', error);
        throw new Error('Failed to get referred beneficiaries.');
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
