/**
 * @fileOverview User service for interacting with Firestore.
 * This service should only be called from server-side components or server actions.
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  Timestamp,
  where,
  limit,
  serverTimestamp,
  getCountFromServer,
  writeBatch,
  arrayUnion,
  arrayRemove,
  orderBy,
  FieldValue
} from 'firebase-admin/firestore';
import { getAdminDb, getAdminAuth } from './firebase-admin';
import type { User, UserRole } from './types';
import { logActivity } from './activity-log-service';

// Re-export types for backward compatibility
export type { User, UserRole };

const USERS_COLLECTION = 'users';

// Helper to remove duplicates from an array
const getUnique = <T>(arr: T[] = []): T[] => {
    if (!Array.isArray(arr)) return [];
    return [...new Set(arr.filter(Boolean))];
}

const convertToUser = (doc: admin.firestore.DocumentSnapshot): User | null => {
    if (!doc.exists) return null;
    const data = doc.data()!;
    return {
        id: doc.id,
        ...data,
        roles: getUnique(data.roles),
        groups: getUnique(data.groups),
        privileges: getUnique(data.privileges),
        createdAt: (data.createdAt as Timestamp)?.toDate(),
        updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
        dateOfBirth: data.dateOfBirth ? (data.dateOfBirth as Timestamp).toDate() : undefined,
    } as User;
};

// Function to get a user by their document ID
export const getUser = async (id?: string): Promise<User | null> => {
  if (!id) return null;
  try {
    const adminDb = getAdminDb();
    const userDoc = await adminDb.collection(USERS_COLLECTION).doc(id).get();
    return convertToUser(userDoc);
  } catch (error) {
    console.error(`Error getting user with ID ${id}:`, error);
    return null;
  }
};


// CORRECTED: Function to get a user by their custom userId field
export const getUserByUserId = async (userId: string): Promise<User | null> => {
    if (!userId) return null;
    
    try {
        const adminDb = getAdminDb();
        const q = adminDb.collection(USERS_COLLECTION).where("userId", "==", userId).limit(1);
        const querySnapshot = await q.get();
        if (!querySnapshot.empty) {
            return convertToUser(querySnapshot.docs[0]);
        }
        return null;
    } catch (error) {
        console.error(`Error getting user by userId: ${userId}`, error);
        return null;
    }
};

// CORRECTED: Function to get a user by phone number
export const getUserByPhone = async (phone: string): Promise<User | null> => {
  const standardizedPhone = phone?.replace(/\D/g, '').slice(-10) || '';
  if (!standardizedPhone || standardizedPhone.length !== 10) return null;

  try {
    const adminDb = getAdminDb();
    const q = adminDb.collection(USERS_COLLECTION).where("phone", "==", standardizedPhone).limit(1);
    const querySnapshot = await q.get();
    if (!querySnapshot.empty) {
      return convertToUser(querySnapshot.docs[0]);
    }
    return null;
  } catch (error) {
    console.error('Error getting user by phone: ', error);
    return null;
  }
}

// CORRECTED: Function to get a user by email
export const getUserByEmail = async (email: string): Promise<User | null> => {
  if (!email) return null;

  try {
    const adminDb = getAdminDb();
    const q = adminDb.collection(USERS_COLLECTION).where("email", "==", email).limit(1);
    const querySnapshot = await q.get();
    if (!querySnapshot.empty) {
        return convertToUser(querySnapshot.docs[0]);
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
    const adminDb = getAdminDb();
    const q = adminDb.collection(USERS_COLLECTION).where("upiIds", "array-contains", upiId).limit(1);
    const querySnapshot = await q.get();
    if (!querySnapshot.empty) {
      return convertToUser(querySnapshot.docs[0]);
    }
    return null;
  } catch (error) {
    console.error('Error getting user by UPI ID: ', error);
    return null;
  }
}

// The rest of the file remains largely the same, but the core issue was in the functions above.
// For completeness, here is the rest of the file with minor consistency adjustments.

/**
 * Generates the next available sequential user key (e.g., USR01, USR02).
 * @returns The next user key string.
 */
export async function generateNextUserKey(): Promise<string> {
    const adminDb = getAdminDb();
    const q = adminDb.collection(USERS_COLLECTION).orderBy("userKey", "desc").limit(1);
    const snapshot = await q.get();
    let lastNumber = 0;
    if (!snapshot.empty) {
        const lastUser = snapshot.docs[0].data() as User;
        if (lastUser.userKey && lastUser.userKey.startsWith('USR')) {
            const numberPart = lastUser.userKey.substring(3);
            if (!isNaN(parseInt(numberPart))) {
                lastNumber = parseInt(numberPart, 10);
            }
        }
    }
    const nextNumber = lastNumber + 1;
    return `USR${nextNumber.toString().padStart(2, '0')}`;
}

/**
 * Generates the next available sequential ID for a given anonymous role prefix.
 * e.g., if the highest DONOR ID is DONOR05, it will return DONOR06.
 * @param prefix The prefix for the ID (e.g., "DONOR", "BENFCRY").
 * @param field The field to check in Firestore (e.g., "anonymousDonorId").
 * @returns The next sequential ID string.
 */
const generateNextAnonymousId = async (prefix: string, field: keyof User): Promise<string> => {
    const adminDb = getAdminDb();
    const q = adminDb.collection(USERS_COLLECTION)
        .where(field, '>=', prefix)
        .where(field, '<', prefix + 'Z') // A trick to query for strings starting with the prefix
        .orderBy(field, 'desc')
        .limit(1);

    const querySnapshot = await q.get();
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


// Function to create or update a user
export const createUser = async (userData: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>): Promise<User> => {
  const adminDb = getAdminDb();
  
  try {
    const standardizedPhone = userData.phone?.replace(/\D/g, '').slice(-10) || '';
    const isAnonymousSystemUser = userData.userId === 'anonymous_donor';

    // Role validation, with an exception for our special system user
    if (!isAnonymousSystemUser && (!userData.roles || userData.roles.length === 0)) {
        throw new Error("User must have at least one role assigned.");
    }
    
    if (!isAnonymousSystemUser && (!userData.firstName || !userData.lastName || !standardizedPhone)) {
        throw new Error("Critical fields are missing: First Name, Last Name, and Phone are required.");
    }


    // Check for duplicates using the corrected functions
    if (userData.userId && (await getUserByUserId(userData.userId))) {
      throw new Error(`User ID "${userData.userId}" is already taken.`);
    }
    if (userData.email && (await getUserByEmail(userData.email))) {
      throw new Error(`A user with the email ${userData.email} already exists.`);
    }
    if (standardizedPhone && (await getUserByPhone(standardizedPhone))) {
      throw new Error(`A user with the phone number ${standardizedPhone} already exists.`);
    }
    
    const finalUserId = userData.userId || `${userData.firstName?.toLowerCase() || 'user'}.${userData.lastName?.toLowerCase() || Date.now()}`.replace(/\s+/g, '');
    const userKey = await generateNextUserKey();

    const assignedRoles = getUnique(userData.roles || []);
    let anonymousDonorId: string | undefined;
    let anonymousBeneficiaryId: string | undefined;

    if (assignedRoles.includes('Donor') && !userData.anonymousDonorId) {
        anonymousDonorId = await generateNextAnonymousId('DONOR', 'anonymousDonorId');
    }
    if (assignedRoles.includes('Beneficiary') && !userData.anonymousBeneficiaryId) {
        anonymousBeneficiaryId = await generateNextAnonymousId('BENFCRY', 'anonymousBeneficiaryId');
    }
    
    const userRef = adminDb.collection(USERS_COLLECTION).doc(); // Generate ID upfront
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
        gender: userData.gender || 'Other',
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
        createdAt: Timestamp.now() as any,
        updatedAt: Timestamp.now() as any,
        source: userData.source || 'Manual Entry',
    };
    
    const dataToWrite: any = newUser;
    Object.keys(dataToWrite).forEach(key => { if ((dataToWrite as any)[key] === undefined) delete (dataToWrite as any)[key]; });

    await userRef.set(dataToWrite);
    
    const finalUser = { ...newUser, id: userRef.id } as User;
    return JSON.parse(JSON.stringify(finalUser));

  } catch (error) {
    console.error('Error creating user: ', error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error('An unknown error occurred while creating the user.');
  }
};


// Function to get a user by full name
export const getUserByFullName = async (name: string): Promise<User | null> => {
    if (!name) return null;
    if (name === 'admin') return getUser('admin');

    try {
        const adminDb = getAdminDb();
        const q = adminDb.collection(USERS_COLLECTION).where("name", "==", name).limit(1);
        const snapshot = await q.get();
        if (!snapshot.empty) {
            return convertToUser(snapshot.docs[0]);
        }
        return null;
    } catch (e) {
        console.error("Error getting user by name: ", e);
        return null;
    }
};


// Function to get a user by userKey
export const getUserByUserKey = async (userKey: string): Promise<User | null> => {
    if (!userKey) return null;
    if (userKey === 'USR01') return getUser('admin');

    try {
        const adminDb = getAdminDb();
        const q = adminDb.collection(USERS_COLLECTION).where("userKey", "==", userKey).limit(1);
        const snapshot = await q.get();
        if (!snapshot.empty) {
            return convertToUser(snapshot.docs[0]);
        }
        return null;
    } catch (e) {
        console.error("Error getting user by userKey: ", e);
        return null;
    }
};

// Function to get a user by Bank Account Number
export const getUserByBankAccountNumber = async (accountNumber: string): Promise<User | null> => {
  if (!accountNumber) {
    return null;
  }
  try {
    const adminDb = getAdminDb();
    const q = adminDb.collection(USERS_COLLECTION).where("bankAccountNumber", "==", accountNumber).limit(1);
    const querySnapshot = await q.get();
    if (!querySnapshot.empty) {
      return convertToUser(querySnapshot.docs[0]);
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
    const adminDb = getAdminDb();
    const q = adminDb.collection(USERS_COLLECTION).where("panNumber", "==", pan.toUpperCase()).limit(1);
    const snapshot = await q.get();
    if (!snapshot.empty) {
        return convertToUser(snapshot.docs[0]);
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
    const adminDb = getAdminDb();
    const q = adminDb.collection(USERS_COLLECTION).where("aadhaarNumber", "==", aadhaar).limit(1);
    const snapshot = await q.get();
    if (!snapshot.empty) {
      return convertToUser(snapshot.docs[0]);
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
        const adminDb = getAdminDb();
        const userRef = adminDb.collection(USERS_COLLECTION).doc(id);
        
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
                delete (finalUpdates as any)[key];
            }
        });

        await userRef.update({
            ...finalUpdates,
            updatedAt: FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error(`Error updating user ${id}:`, error);
        throw new Error(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

/**
 * Deletes a user from both Firestore and Firebase Authentication.
 * Also handles reassigning associated data like donations.
 * @param id The Firestore document ID of the user to delete.
 * @param adminUser The user performing the delete action.
 * @param isBulkOperation A flag to suppress individual logging during bulk deletes.
 */
export const deleteUser = async (id: string, adminUser: User, isBulkOperation: boolean = false) => {
    try {
        const adminDb = getAdminDb();
        const adminAuth = getAdminAuth();
        const batch = adminDb.batch();
        
        const userToDelete = await getUser(id);
        if (!userToDelete) throw new Error("User to delete not found.");

        // Safety checks
        if (userToDelete.userId === 'admin') {
            throw new Error("The default 'admin' user cannot be deleted.");
        }
        if (userToDelete.userKey === 'SYSTEM01' || userToDelete.userId === 'anonymous_donor') {
            throw new Error("The 'Anonymous Donor' system user cannot be deleted.");
        }
        const leadsQuery = adminDb.collection('leads').where("beneficiaryId", "==", id).limit(1);
        const leadsSnapshot = await leadsQuery.get();
        if (!leadsSnapshot.empty && leadsSnapshot.docs.some(d => d.data().helpGiven > 0)) {
            throw new Error(`User ${userToDelete.name} cannot be deleted because they are a beneficiary on at least one lead that has received funds.`);
        }

        // 1. Delete from Firebase Authentication
        // The UID in Firebase Auth is the same as the document ID in Firestore
        await adminAuth.deleteUser(id).catch(error => {
            // It's okay if the user doesn't exist in Auth (e.g., never logged in via OTP)
            if (error.code !== 'auth/user-not-found') {
                throw error; // Re-throw other auth errors
            }
            console.log(`User ${id} not found in Firebase Auth, proceeding with Firestore deletion.`);
        });

        // 2. Reassign donations to "Anonymous Donor"
        const donationsQuery = adminDb.collection('donations').where("donorId", "==", id);
        const donationsSnapshot = await donationsQuery.get();
        let anonymousDonor: User | null = null;
        if (!donationsSnapshot.empty) {
            anonymousDonor = await getUserByUserId('anonymous_donor');
            if (!anonymousDonor || !anonymousDonor.id) {
                throw new Error("Could not find the 'anonymous_donor' system user to re-assign donations to.");
            }
            donationsSnapshot.forEach(donationDoc => {
                batch.update(donationDoc.ref, { 
                    donorId: anonymousDonor!.id,
                    donorName: anonymousDonor!.name,
                    notes: FieldValue.arrayUnion(`Original donor (${userToDelete.name}, ID: ${id}) deleted by ${adminUser.name}.`)
                });
            });
        }
        
        // 3. Delete the user document from Firestore
        const userRef = adminDb.collection(USERS_COLLECTION).doc(id);
        batch.delete(userRef);
        
        // Commit all batched writes
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
                },
            });
        }
        
    } catch (error) {
        console.error(`Error during cascading delete for user ${id}:`, error);
        throw new Error(`Failed to delete user and associated data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}


// Function to get all users
export const getAllUsers = async (): Promise<User[]> => {
    try {
        const adminDb = getAdminDb();
        const usersQuery = adminDb.collection(USERS_COLLECTION).orderBy("createdAt", "desc");
        const querySnapshot = await usersQuery.get();
        const users: User[] = [];
        querySnapshot.forEach((doc) => {
            users.push(convertToUser(doc) as User);
        });
        return users;
    } catch (error) {
        if (error instanceof Error && (error.message.includes('Could not load the default credentials') || error.message.includes('Could not refresh access token'))) {
            console.error("Critical Firestore permission error in getAllUsers. Check server environment setup.", error);
            // Re-throwing a more specific error for the server action to catch.
            throw new Error('permission-denied');
        }
        if (error instanceof Error && error.message.includes('index')) {
             console.error("Firestore index missing. Please create a descending index on 'createdAt' for the 'users' collection.");
        } else {
             console.error("Error getting all users: ", error);
        }
        return [];
    }
}


export const getReferredBeneficiaries = async (referrerId: string): Promise<User[]> => {
    try {
        const adminDb = getAdminDb();
        const q = adminDb.collection(USERS_COLLECTION).where("referredByUserId", "==", referrerId);
        const querySnapshot = await q.get();
        const users: User[] = [];
        querySnapshot.forEach((doc) => {
            users.push(convertToUser(doc) as User);
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
