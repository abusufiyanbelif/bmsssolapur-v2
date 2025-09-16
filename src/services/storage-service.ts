
'use server';
/**
 * @fileOverview Service for interacting with Cloud Storage for Firebase.
 */

import { getStorage, ref, uploadBytesResumable, getDownloadURL, type UploadTaskSnapshot } from 'firebase/storage';
import { app, isConfigValid } from './firebase';
import { v4 as uuidv4 } from 'uuid';

if (!isConfigValid) {
  console.warn("Firebase not configured. File storage service will not be available.");
}

const storage = isConfigValid ? getStorage(app) : null;

/**
 * Uploads a file to a specified path in Cloud Storage for Firebase with progress tracking.
 *
 * @param file The file object to upload.
 * @param path The destination path in the storage bucket (e.g., 'leads/{leadId}/documents/').
 * @param onProgress A callback function to report upload progress, receiving a percentage (0-100).
 * @returns A promise that resolves with the public download URL of the uploaded file.
 */
export const uploadFile = async (
  file: File, 
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  if (!storage) {
    console.error("Firebase Storage is not initialized.");
    return `https://placehold.co/600x400.png?text=storage_error`;
  }
  
  if (!file) {
    throw new Error("No file provided for upload.");
  }

  return new Promise((resolve, reject) => {
    try {
      const fileExtension = file.name.split('.').pop();
      const uniqueFileName = `${uuidv4()}.${fileExtension}`;
      const finalPath = path.endsWith('/') ? path : `${path}/`;
      const storageRef = ref(storage, `${finalPath}${uniqueFileName}`);

      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        (snapshot: UploadTaskSnapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          console.error("Error uploading file to Firebase Storage: ", error);
          reject(new Error("File upload failed."));
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log(`File uploaded successfully to ${downloadURL}`);
            resolve(downloadURL);
          } catch (error) {
             console.error("Error getting download URL: ", error);
             reject(new Error("Failed to get download URL after upload."));
          }
        }
      );
    } catch (error) {
        console.error("Initial error setting up file upload:", error);
        reject(new Error("File upload setup failed."));
    }
  });
};
