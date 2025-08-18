

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
        throw new Error('Failed to get user by userId.');
    }
};


// Function to create or update a user
export const createUser = async (userData: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>) => {
  if (!isConfigValid) throw new Error('Firebase is not configured.');
  
  try {
    const userRef = doc(collection(db, USERS_COLLECTION));
    
    // Check for duplicate email if one is provided
    if (userData.email) {
      const emailExists = await getUserByEmail(userData.email);
      if (emailExists) {
          throw new Error(`A user with the email ${userData.email} already exists.`);
      }
    }
    // Check for duplicate phone number
    const phoneExists = await getUserByPhone(userData.phone!);
    if(phoneExists) {
        throw new Error(`A user with the phone number ${userData.phone} already exists.`);
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

    // Always generate anonymous IDs
    const anonymousBeneficiaryId = `Beneficiary-${userRef.id.substring(0, 6).toUpperCase()}`;
    const anonymousDonorId = `Donor-${userRef.id.substring(0, 6).toUpperCase()}`;

    const newUser: User = { 
        id: userRef.id,
        userKey: userKey,
        name: userData.name || `${userData.firstName || ''} ${userData.middleName || ''} ${userData.lastName || ''}`.replace(/\s+/g, ' ').trim(),
        userId: finalUserId,
        firstName: userData.firstName!,
        middleName: userData.middleName,
        lastName: userData.lastName!,
        email: userData.email,
        phone: userData.phone!,
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
        anonymousBeneficiaryId,
        anonymousDonorId,
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
        roles: getUniqueRoles(userData.roles || ['Donor']),
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
    console.error('Error getting user: ', error);
    throw new Error('Failed to get user.');
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
    throw new Error('Failed to get user by name.');
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
  try {
    const q = query(collection(db, USERS_COLLECTION), where("phone", "==", phone), limit(1));
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
        console.error("Firestore index missing. Please create a composite index in Firestore on the 'users' collection for 'phone' (ascending). The link in the error message will help you do this.");
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
        console.error("Firestore index missing. Please create an array-contains index in Firestore on the 'users' collection for 'upiIds'.");
    }
    return null; // Return null on any error to avoid crashing the app flow
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
        console.error("Firestore index missing. Please create a single-field index in Firestore on the 'users' collection for 'bankAccountNumber' (ascending).");
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
