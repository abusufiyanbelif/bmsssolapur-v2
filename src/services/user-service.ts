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
} from 'firebase/firestore';
import { db } from './firebase';

const USERS_COLLECTION = 'users';

export interface User {
  id?: string;
  name: string;
  phone: string;
  role: 'Super Admin' | 'Admin' | 'Founder' | 'Finance Team' | 'Member of Organization' | 'Co-Founder';
  createdAt: Date;
}

// Function to create or update a user
export const createUser = async (user: User) => {
  try {
    const userRef = doc(collection(db, USERS_COLLECTION));
    const newUser = { ...user, id: userRef.id, createdAt: new Date() };
    await setDoc(userRef, newUser);
    return newUser;
  } catch (error) {
    console.error('Error creating user: ', error);
    throw new Error('Failed to create user.');
  }
};

// Function to get a user by ID
export const getUser = async (id: string) => {
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, id));
    if (userDoc.exists()) {
      return userDoc.data() as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user: ', error);
    throw new Error('Failed to get user.');
  }
};

// Function to update a user
export const updateUser = async (id: string, updates: Partial<User>) => {
    try {
        const userRef = doc(db, USERS_COLLECTION, id);
        await updateDoc(userRef, updates);
    } catch (error) {
        console.error("Error updating user: ", error);
        throw new Error('Failed to update user.');
    }
};

// Function to delete a user
export const deleteUser = async (id: string) => {
    try {
        const userRef = doc(db, USERS_COLLECTION, id);
        await deleteDoc(userRef);
    } catch (error) {
        console.error("Error deleting user: ", error);
        throw new Error('Failed to delete user.');
    }
}

// Function to get all users
export const getAllUsers = async () => {
    try {
        const usersQuery = query(collection(db, USERS_COLLECTION));
        const querySnapshot = await getDocs(usersQuery);
        const users: User[] = [];
        querySnapshot.forEach((doc) => {
            users.push(doc.data() as User);
        });
        return users;
    } catch (error) {
        console.error("Error getting all users: ", error);
        throw new Error('Failed to get all users.');
    }
}
