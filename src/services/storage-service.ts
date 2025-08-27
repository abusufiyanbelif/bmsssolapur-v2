'use server';
/**
 * @fileOverview Service for interacting with Cloud Storage for Firebase.
 */

import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app, isConfigValid } from './firebase';
import { v4 as uuidv4 } from 'uuid';

if (!isConfigValid) {
  console.warn("Firebase not configured. File storage service will not be available.");
}

const storage = isConfigValid ? getStorage(app) : null;

/**
 * Uploads a file to a specified path in Cloud Storage for Firebase.
 *
 * @param file The file object to upload.
 * @param path The destination path in the storage bucket (e.g., 'donation-proofs/').
 * @returns A promise that resolves with the public download URL of the uploaded file.
 */
export const uploadFile = async (file: File, path: string): Promise<string> => {
  if (!storage) {
    console.error("Firebase Storage is not initialized.");
    // Return a placeholder to prevent app crash, but log error.
    return `https://placehold.co/600x400.png?text=storage_error`;
  }
  
  if (!file) {
    throw new Error("No file provided for upload.");
  }

  try {
    // Create a unique filename to prevent overwrites
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const storageRef = ref(storage, `${path}${uniqueFileName}`);

    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get the public URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    console.log(`File uploaded successfully to ${downloadURL}`);
    return downloadURL;

  } catch (error) {
    console.error("Error uploading file to Firebase Storage: ", error);
    throw new Error("File upload failed.");
  }
};
