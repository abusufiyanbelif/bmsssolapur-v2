
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
  writeBatch,
  arrayUnion,
  arrayRemove,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import { adminDb } from './firebase-admin';
import type { User, UserRole } from './types';
import { uploadFile } from './storage-service';
import { logActivity } from './activity-log-service';

const USERS_COLLECTION = 'users';

// Re-export types for backward compatibility if other services import from here
export type { User, UserRole };


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
    gender: 'Male',
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
    if (!userId) {
        return null;
    }
     // Hardcoded check for the default admin user by their specific User ID.
    if (userId === 'admin') {
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
              dateOfBirth: data.dateOfBirth ? (data.dateOfBirth as Timestamp).toDate() : undefined,
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
  const userRef = doc(collection(db, USERS_COLLECTION)); // Generate ID upfront
  
  try {
    const standardizedPhone = userData.phone?.replace(/\D/g, '').slice(-10) || '';
    if (standardizedPhone.length !== 10) {
        throw new Error("Invalid phone number provided. Must be 10 digits.");
    }

    if (userData.userId && (await getUserByUserId(userData.userId))) {
      throw new Error(`User ID "${userData.userId}" is already taken.`);
    }
    if (userData.email && (await getUserByEmail(userData.email))) {
      throw new Error(`A user with the email ${userData.email} already exists.`);
    }
    if (await getUserByPhone(standardizedPhone)) {
      throw new Error(`A user with the phone number ${standardizedPhone} already exists.`);
    }
    
    const finalUserId = userData.userId || `${userData.firstName?.toLowerCase() || 'user'}.${userData.lastName?.toLowerCase() || Date.now()}`.replace(/\s+/g, '');

    const usersCollection = collection(db, USERS_COLLECTION);
    const countSnapshot = await getCountFromServer(usersCollection);
    const userNumber = countSnapshot.data().count + 1;
    const userKey = `USR${userNumber.toString().padStart(2, '0')}`;

    const assignedRoles = getUnique(userData.roles || ['Donor']);
    let anonymousDonorId: string | undefined;
    let anonymousBeneficiaryId: string | undefined;

    if (assignedRoles.includes('Donor') && !userData.anonymousDonorId) {
        anonymousDonorId = await generateNextAnonymousId('DONOR', 'anonymousDonorId');
    }
    if (assignedRoles.includes('Beneficiary') && !userData.anonymousBeneficiaryId) {
        anonymousBeneficiaryId = await generateNextAnonymousId('BENFCRY', 'anonymousBeneficiaryId');
    }
    
    const newUser: Omit<User, 'id'> = {
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
        address: userData.address || {},
        gender: userData.gender!,
        dateOfBirth: userData.dateOfBirth,
        beneficiaryType: userData.beneficiaryType,
        isAnonymousAsBeneficiary: userData.isAnonymousAsBeneficiary || false,
        isAnonymousAsDonor: userData.isAnonymousAsDonor || false,
        anonymousBeneficiaryId,
        anonymousDonorId,
        occupation: userData.occupation,
        fatherOccupation: userData.fatherOccupation,
        motherOccupation: userData.motherOccupation,
        familyMembers: userData.familyMembers || 0,
        earningMembers: userData.earningMembers || 0,
        totalFamilyIncome: userData.totalFamilyIncome || 0,
        isWidow: userData.isWidow,
        panNumber: userData.panNumber,
        aadhaarNumber: userData.aadhaarNumber,
        bankAccountName: userData.bankAccountName,
        bankName: userData.bankName,
        bankAccountNumber: userData.bankAccountNumber,
        bankIfscCode: userData.bankIfscCode,
        upiPhoneNumbers: userData.upiPhoneNumbers || [],
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
    
    const dataToWrite: any = { ...newUser };
    Object.keys(dataToWrite).forEach(key => { if ((dataToWrite as any)[key] === undefined) delete (dataToWrite as any)[key]; });

    await setDoc(userRef, dataToWrite);

    // --- Transactional File Upload ---
    // Now that the user exists, try to upload files. If this fails, delete the user.
    const docUpdates: Partial<User> = {};
    const uploadPath = `users/${userKey}/documents/`;
    
    try {
        const [aadhaarUrl] = await Promise.all([
            userData.aadhaarCard ? uploadFile(userData.aadhaarCard as File, uploadPath) : Promise.resolve(null),
        ]);

        if (aadhaarUrl) docUpdates.aadhaarCardUrl = aadhaarUrl;
        
        if (Object.keys(docUpdates).length > 0) {
          await updateDoc(userRef, docUpdates);
        }
    } catch (uploadError) {
        console.error("File upload failed during user creation, rolling back user creation.", uploadError);
        await deleteDoc(userRef); // Rollback: delete the created user
        throw new Error("File upload failed, user creation was rolled back.");
    }
    
    const finalUser = { ...newUser, ...docUpdates, id: userRef.id } as User;
    return finalUser;

  } catch (error) {
    console.error('Error creating user: ', error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error('An unknown error occurred while creating the user.');
  }
};

// Function to get a user by ID
export const getUser = async (id?: string): Promise<User | null> => {
  if (!id) {
    return null;
  }
   // Hardcoded check for the default admin user
  if (id === hardcodedSuperAdmin.id) {
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
        dateOfBirth: data.dateOfBirth ? (data.dateOfBirth as Timestamp).toDate() : undefined,
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
    if (!name) {
        return null;
    }
     if (name === 'admin') {
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
            dateOfBirth: data.dateOfBirth ? (data.dateOfBirth as Timestamp).toDate() : undefined,
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
    if (!userKey) {
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
                dateOfBirth: data.dateOfBirth ? (data.dateOfBirth as Timestamp).toDate() : undefined,
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
    if (!name) {
        return null;
    }
     if (name === 'admin') {
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
                dateOfBirth: data.dateOfBirth ? (data.dateOfBirth as Timestamp).toDate() : undefined,
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
        dateOfBirth: data.dateOfBirth ? (data.dateOfBirth as Timestamp).toDate() : undefined,
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
  if (!email) {
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
        dateOfBirth: data.dateOfBirth ? (data.dateOfBirth as Timestamp).toDate() : undefined,
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
  if (!upiId) return null;
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
        dateOfBirth: data.dateOfBirth ? (data.dateOfBirth as Timestamp).toDate() : undefined,
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
  if (!accountNumber) {
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
        dateOfBirth: data.dateOfBirth ? (data.dateOfBirth as Timestamp).toDate() : undefined,
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
  if (!pan) return null;
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
        dateOfBirth: data.dateOfBirth ? (data.dateOfBirth as Timestamp).toDate() : undefined,
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
  if (!aadhaar) return null;
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
        dateOfBirth: data.dateOfBirth ? (data.dateOfBirth as Timestamp).toDate() : undefined,
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

// Function to delete a user and handle related data
export const deleteUser = async (id: string, adminUser: User, isBulkOperation: boolean = false) => {
    try {
        const batch = writeBatch(db);
        const userRef = doc(db, USERS_COLLECTION, id);
        const userToDelete = await getUser(id);
        if (!userToDelete) throw new Error("User to delete not found.");

        const anonymousDonor = await getUserByUserId('anonymous_donor');
        if (!anonymousDonor) throw new Error("Could not find the 'anonymous_donor' system user to re-assign donations to. Please run the seeder.");

        // 1. Reassign donations from this user to "Anonymous Donor"
        const donationsQuery = query(collection(db, 'donations'), where("donorId", "==", id));
        const donationsSnapshot = await getDocs(donationsQuery);
        donationsSnapshot.forEach(donationDoc => {
            batch.update(donationDoc.ref, { 
                donorId: anonymousDonor.id,
                donorName: anonymousDonor.name,
                notes: arrayUnion(`Original donor (${userToDelete.name}, ID: ${id}) deleted by ${adminUser.name}.`)
            });
        });

        // 2. Anonymize leads referred by this user
        const referredLeadsQuery = query(collection(db, 'leads'), where("referredByUserId", "==", id));
        const referredLeadsSnapshot = await getDocs(referredLeadsQuery);
        referredLeadsSnapshot.forEach(leadDoc => {
            batch.update(leadDoc.ref, {
                referredByUserId: null,
                referredByUserName: 'Deleted User',
            });
        });
        
        // 3. Anonymize leads created by this user
        const createdLeadsQuery = query(collection(db, 'leads'), where("adminAddedBy.id", "==", id));
        const createdLeadsSnapshot = await getDocs(createdLeadsQuery);
        createdLeadsSnapshot.forEach(leadDoc => {
            batch.update(leadDoc.ref, {
                'adminAddedBy.id': anonymousDonor.id,
                'adminAddedBy.name': 'Deleted User'
            });
        });

        // 4. Delete the user document
        batch.delete(userRef);
        await batch.commit();
        
        if (!isBulkOperation) {
             await logActivity({
                userId: adminUser.id!,
                userName: adminUser.name,
                userEmail: adminUser.email,
                role: 'Admin',
                activity: 'User Deleted',
                details: { 
                    deletedUserId: id,
                    deletedUserName: userToDelete.name,
                    reassignedDonations: donationsSnapshot.size,
                    anonymizedLeads: referredLeadsSnapshot.size + createdLeadsSnapshot.size
                },
            });
        }
        
    } catch (error) {
        console.error(`Error during cascading delete for user ${id}:`, error);
        throw new Error(`Failed to delete user and clean up related data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Function to get all users
export const getAllUsers = async (): Promise<User[]> => {
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
                dateOfBirth: data.dateOfBirth ? (data.dateOfBirth as Timestamp).toDate() : undefined,
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
                dateOfBirth: data.dateOfBirth ? (data.dateOfBirth as Timestamp).toDate() : undefined,
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
