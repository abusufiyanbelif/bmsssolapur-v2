

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


// Function to get a user by their custom userId field
export const getUserByUserId = async (userId: string): Promise<User | null> => {
    if (!isConfigValid) {
        console.warn("Firebase not configured. Skipping user fetch by userId.");
        return null;
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
              createdAt: (data.createdAt as Timestamp).toDate(),
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
export const createUser = async (user: Omit<User, 'id'> & { id?: string }) => {
  if (!isConfigValid) throw new Error('Firebase is not configured.');
  try {
    // Check for duplicate User ID
    if (user.userId) {
      const idExists = await getUserByUserId(user.userId);
      if (idExists && idExists.id !== user.id) {
        throw new Error(`A user with the ID '${user.userId}' already exists.`);
      }
    } else {
        throw new Error("User ID is a mandatory field.");
    }

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

    const userRef = user.id ? doc(db, USERS_COLLECTION, user.id) : doc(db, USERS_COLLECTION, user.userId);
    
    // Use provided userKey or auto-generate one
    let userKey = user.userKey;
    if (!userKey) {
        const usersCollection = collection(db, USERS_COLLECTION);
        const countSnapshot = await getCountFromServer(usersCollection);
        const userNumber = countSnapshot.data().count + 1;
        userKey = `USR${userNumber.toString().padStart(2, '0')}`;
    }


    // Always generate an anonymous ID for every user upon creation
    const anonymousBeneficiaryId = user.anonymousBeneficiaryId || `Beneficiary-${userRef.id.substring(0, 6).toUpperCase()}`;
    const anonymousDonorId = user.anonymousDonorId || `Donor-${userRef.id.substring(0, 6).toUpperCase()}`;

    // Ensure createdAt is a Firestore Timestamp
    const finalUserData: User = { 
        userKey: userKey,
        name: user.name || `${user.firstName || ''} ${user.middleName || ''} ${user.lastName || ''}`.replace(/\s+/g, ' ').trim(),
        userId: user.userId,
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
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
        beneficiaryType: user.beneficiaryType,
        isAnonymousAsBeneficiary: user.isAnonymousAsBeneficiary || false,
        isAnonymousAsDonor: user.isAnonymousAsDonor || false,
        anonymousBeneficiaryId,
        anonymousDonorId,
        occupation: user.occupation,
        familyMembers: user.familyMembers,
        isWidow: user.isWidow,
        secondaryPhone: user.secondaryPhone,
        aadhaarNumber: user.aadhaarNumber,
        panNumber: user.panNumber,
        bankAccountName: user.bankAccountName || '',
        bankAccountNumber: user.bankAccountNumber || '',
        bankIfscCode: user.bankIfscCode || '',
        upiPhone: user.upiPhone || '',
        upiIds: user.upiIds || [],
        roles: user.roles || [],
        privileges: user.privileges || [],
        groups: user.groups || [],
        referredByUserId: user.referredByUserId,
        referredByUserName: user.referredByUserName,
        enableMonthlyDonationReminder: user.enableMonthlyDonationReminder || false,
        monthlyPledgeEnabled: user.monthlyPledgeEnabled || false,
        monthlyPledgeAmount: user.monthlyPledgeAmount || 0,
        id: userRef.id,
        createdAt: user.createdAt || Timestamp.now(),
        updatedAt: user.updatedAt || Timestamp.now(),
    };

    // Remove undefined fields to prevent Firestore errors
    Object.keys(finalUserData).forEach(key => {
        const typedKey = key as keyof User;
        if (finalUserData[typedKey] === undefined) {
            delete (finalUserData as any)[typedKey];
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
        createdAt: (data.createdAt as Timestamp).toDate(),
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
        createdAt: (data.createdAt as Timestamp).toDate(),
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
                id: doc.id, ...data, createdAt: (data.createdAt as Timestamp).toDate(),
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
                id: doc.id, ...data, createdAt: (data.createdAt as Timestamp).toDate(),
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
        createdAt: (data.createdAt as Timestamp).toDate(),
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
        createdAt: (data.createdAt as Timestamp).toDate(),
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
  if (!isConfigValid) {
    console.warn("Firebase not configured. Skipping user fetch by UPI ID.");
    return null;
  }
  try {
    if (!upiId) return null;
    const q = query(collection(db, USERS_COLLECTION), where("upiIds", "array-contains", upiId), limit(1));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const data = userDoc.data();
       return {
        id: userDoc.id,
        ...data,
        createdAt: (data.createdAt as Timestamp).toDate(),
        updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
      } as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user by UPI ID: ', error);
    // This could be due to a missing index. Log a helpful message.
    if (error instanceof Error && error.message.includes('index')) {
        console.error("Firestore index missing. Please create a composite index in Firestore on the 'users' collection for 'upiIds' (array-contains).");
    }
    throw new Error('Failed to get user by UPI ID.');
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
        createdAt: (data.createdAt as Timestamp).toDate(),
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
        
        const finalUpdates = { ...updates };

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
                createdAt: (data.createdAt as Timestamp).toDate(),
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
                createdAt: (data.createdAt as Timestamp).toDate(),
                updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
            } as User);
        });
        return users;
    } catch (error) {
        console.error('Error getting referred beneficiaries: ', error);
        throw new Error('Failed to get referred beneficiaries.');
    }
}
