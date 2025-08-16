
// src/app/admin/user-management/actions.ts
"use server";

import { deleteUser, updateUser } from "@/services/user-service";
import { revalidatePath } from "next/cache";
import { writeBatch, doc } from "firebase/firestore";
import { db } from "@/services/firebase";

export async function handleDeleteUser(userId: string) {
    // Add check to prevent deleting super admin or other critical users if needed
    try {
        await deleteUser(userId);
        revalidatePath("/admin/user-management");
        revalidatePath("/admin/beneficiaries");
        revalidatePath("/admin/donors");
        return { success: true };
    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred";
        return { success: false, error };
    }
}

export async function handleBulkDeleteUsers(userIds: string[]) {
    try {
        const batch = writeBatch(db);
        for (const id of userIds) {
            const userDocRef = doc(db, "users", id);
            batch.delete(userDocRef);
        }
        await batch.commit();
        revalidatePath("/admin/user-management");
        revalidatePath("/admin/beneficiaries");
        revalidatePath("/admin/donors");
        return { success: true };
    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred";
        return { success: false, error };
    }
}


export async function handleToggleUserStatus(userId: string, isActive: boolean) {
    try {
        await updateUser(userId, { isActive });
        revalidatePath("/admin/user-management");
        revalidatePath("/admin/beneficiaries");
        revalidatePath("/admin/donors");
        return { success: true };
    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred";
        return { success: false, error };
    }
}
