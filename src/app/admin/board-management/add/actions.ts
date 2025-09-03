
"use server";

import { getUser, updateUser } from "@/services/user-service";
import { revalidatePath } from "next/cache";

interface FormState {
    success: boolean;
    error?: string;
}

export async function handleAddBoardMember(userId: string, role: string): Promise<FormState> {
  try {
    const user = await getUser(userId);
    if (!user) {
        return { success: false, error: "Selected user not found." };
    }
    
    // Get existing groups or initialize an empty array
    const existingGroups = user.groups || [];
    
    // Create a new set to handle uniqueness and add the new role
    const newGroups = new Set(existingGroups);
    newGroups.add(role);

    // Update the user with the new array of groups
    await updateUser(userId, { groups: Array.from(newGroups) });
    
    revalidatePath("/admin/board-management");
    revalidatePath("/organization");

    return { success: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred while adding the board member.";
    console.error("Error adding board member:", error);
    return {
      success: false,
      error: `Failed to add board member: ${error}`,
    };
  }
}
