
// src/app/admin/user-management/actions.ts
"use server";

import { deleteUser as deleteUserService, updateUser, getUser, getAllUsers as getAllUsersService } from "@/services/user-service";
import { revalidatePath } from "next/cache";
import { writeBatch, doc } from "firebase/firestore";
import { db } from "@/services/firebase";
import { logActivity } from "@/services/activity-log-service";

export async function getAllUsersAction() {
    // This server action wraps the server-only service function.
    const users = await getAllUsersService();
    return JSON.parse(JSON.stringify(users));
}

export async function handleDeleteUser(userId: string, adminUserId: string) {
    try {
        const adminUser = await getUser(adminUserId);
        if (!adminUser) {
             throw new Error("Admin user performing the action could not be found.");
        }
        
        // The core deletion logic (including cascading effects) is now in the service layer.
        await deleteUserService(userId, adminUser);
        
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

export async function handleBulkDeleteUsers(userIds: string[], adminUserId: string) {
    try {
        const adminUser = await getUser(adminUserId);
        if (!adminUser) {
             throw new Error("Admin user performing the action could not be found.");
        }
        
        // Using the service layer to handle each deletion properly
        for (const userId of userIds) {
            await deleteUserService(userId, adminUser, true); // Pass a flag to indicate bulk operation
        }

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

    