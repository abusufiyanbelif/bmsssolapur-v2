
'use server';

import { getStorage } from 'firebase-admin/storage';
import type { File } from '@google-cloud/storage';

export interface StorageAnalytics {
    totalSize: number;
    totalCount: number;
    files: StorageFile[];
    folderSummary: {
        name: string;
        size: number;
        count: number;
    }[];
}

export interface StorageFile {
    name: string;
    size: number;
    contentType: string;
    createdAt: Date;
    updatedAt: Date;
    publicUrl: string;
}

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export async function getStorageAnalytics(): Promise<StorageAnalytics> {
    try {
        const bucket = getStorage().bucket(); // Default bucket
        const [allFiles] = await bucket.getFiles();

        let totalSize = 0;
        const storageFiles: StorageFile[] = [];
        const folderSummary: Record<string, { size: number; count: number }> = {};

        allFiles.forEach(file => {
            const size = parseInt(file.metadata.size as string, 10);
            totalSize += size;

            storageFiles.push({
                name: file.name,
                size: size,
                contentType: file.metadata.contentType || 'N/A',
                createdAt: new Date(file.metadata.timeCreated),
                updatedAt: new Date(file.metadata.updated),
                publicUrl: file.publicUrl(),
            });

            // Summarize by top-level folder
            const folderName = file.name.split('/')[0] || 'root';
            if (!folderSummary[folderName]) {
                folderSummary[folderName] = { size: 0, count: 0 };
            }
            folderSummary[folderName].size += size;
            folderSummary[folderName].count += 1;
        });

        const sortedFolderSummary = Object.entries(folderSummary)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.size - a.size);

        return {
            totalSize,
            totalCount: allFiles.length,
            files: storageFiles.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
            folderSummary: sortedFolderSummary,
        };

    } catch (e) {
        if (e instanceof Error && e.message.toLowerCase().includes('permission-denied')) {
            throw new Error('Permission Denied: The server environment lacks the "Storage Admin" IAM role needed to list files. Please refer to the TROUBLESHOOTING.md guide for instructions on how to grant it.');
        }
        console.error("Error getting storage analytics:", e);
        throw new Error("Failed to retrieve storage analytics data. This may be due to a server configuration issue or missing permissions.");
    }
}
