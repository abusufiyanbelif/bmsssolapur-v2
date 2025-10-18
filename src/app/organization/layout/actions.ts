
'use server';

import { updateOrganizationFooter } from "@/services/organization-service";
import { getUser } from "@/services/user-service";
import { revalidatePath } from "next/cache";
import type { OrganizationFooter } from "@/services/types";

interface FormState {
    success: boolean;
    error?: string;
}

export async function handleUpdateFooterSettings(
  orgId: string,
  formData: FormData
): Promise<FormState> {
  
  const adminUserId = formData.get("adminUserId") as string;
  if (!adminUserId) {
    return { success: false, error: "Admin user ID is missing." };
  }
  
  try {
    const adminUser = await getUser(adminUserId);
    if (!adminUser) {
        return { success: false, error: "Admin user not found." };
    }

    const keyContacts = JSON.parse(formData.get("keyContacts") as string || '[]');
    const socialLinks = JSON.parse(formData.get("socialLinks") as string || '[]');

    const updates: OrganizationFooter = {
      organizationInfo: {
        titleLine1: formData.get("orgInfo.titleLine1") as string,
        titleLine2: formData.get("orgInfo.titleLine2") as string,
        titleLine3: formData.get("orgInfo.titleLine3") as string,
        description: formData.get("orgInfo.description") as string,
        registrationInfo: formData.get("orgInfo.registrationInfo") as string,
        taxInfo: formData.get("orgInfo.taxInfo") as string,
      },
      contactUs: {
        title: formData.get("contactUs.title") as string,
        address: formData.get("contactUs.address") as string,
        email: formData.get("contactUs.email") as string,
      },
      keyContacts: {
        title: formData.get("keyContacts.title") as string,
        contacts: keyContacts,
      },
      connectWithUs: {
        title: formData.get("connectWithUs.title") as string,
        socialLinks: socialLinks,
      },
      ourCommitment: {
        title: formData.get("ourCommitment.title") as string,
        text: formData.get("ourCommitment.text") as string,
        linkText: formData.get("ourCommitment.linkText") as string,
        linkUrl: formData.get("ourCommitment.linkUrl") as string,
      },
      copyright: {
        text: formData.get("copyright.text") as string,
      }
    };
    
    await updateOrganizationFooter(orgId, updates, { id: adminUser.id!, name: adminUser.name });
    
    revalidatePath("/admin/organization/layout");
    revalidatePath("/", "layout"); // Revalidate all pages using the layout

    return { success: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    console.error("Error updating footer settings:", error);
    return {
      success: false,
      error: error,
    };
  }
}
