
"use server";

import { deleteUser, updateUser } from "@/services/user-service";
import { revalidatePath } from "next/cache";

export async function handleDeleteUser(userId: string) {
    // Add check to prevent deleting super admin or other critical users if needed
    try {
        await deleteUser(userId);
        revalidatePath("/admin/user-management");
        revalidatePath("/admin/beneficiaries");
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
        return { success: true };
    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred";
        return { success: false, error };
    }
}
