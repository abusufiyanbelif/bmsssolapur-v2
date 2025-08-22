
// src/app/admin/user-management/actions.ts
"use server";

import { deleteUser, updateUser } from "@/services/user-service";
import { revalidatePath } from "next/cache";
import { writeBatch, doc } from "firebase/firestore";
import { db } from "@/services/firebase";

export async function handleDeleteUser(userId: string) {
    try {
        await deleteUser(userId);
        revalidatePath("/admin/user-management");
        revalidatePath("/admin/beneficiaries");
        revalidatePath("/admin/donors");
        revalidatePath("/admin/referrals");
        return { success: true };
    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred while deleting user.";
        console.error("Error deleting user:", error);
        return { success: false, error: `Failed to delete user: ${error}` };
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
        revalidatePath("/admin/referrals");
        return { success: true };
    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred during bulk deletion.";
        console.error("Error bulk deleting users:", error);
        return { success: false, error: `Failed to delete users: ${error}` };
    }
}


export async function handleToggleUserStatus(userId: string, isActive: boolean) {
    try {
        await updateUser(userId, { isActive });
        revalidatePath("/admin/user-management");
        revalidatePath("/admin/beneficiaries");
        revalidatePath("/admin/donors");
        revalidatePath("/admin/referrals");
        return { success: true };
    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred while toggling user status.";
        console.error("Error toggling user status:", error);
        return { success: false, error: `Failed to update user status: ${error}` };
    }
}
