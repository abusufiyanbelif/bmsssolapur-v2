
"use server";

import { updateOrganization, Organization, createOrganization, getOrganization } from "@/services/organization-service";
import { revalidatePath } from "next/cache";
import { uploadFile } from "@/services/storage-service";
import { getUser } from "@/services/user-service";
import { updatePublicOrganization } from "@/services/public-data-service";


interface FormState {
    success: boolean;
    error?: string;
}


export async function handleUpdateOrganization(
  orgId: string,
  formData: FormData,
  isCreating: boolean,
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

    const qrCodeFile = formData.get("qrCodeFile") as File | null;
    let qrCodeUrl = formData.get('qrCodeUrl') as string;
    
    const logoFile = formData.get("logoFile") as File | null;
    let logoUrl = formData.get('logoUrl') as string;

    if (logoFile && logoFile.size > 0) {
        const uploadPath = `organization/assets/logo/`;
        logoUrl = await uploadFile(logoFile, uploadPath);
    }
    
    if (qrCodeFile && qrCodeFile.size > 0) {
        const uploadPath = `organization/assets/qr-codes/`;
        qrCodeUrl = await uploadFile(qrCodeFile, uploadPath);
    }
    
    // Correctly parse the JSON strings for arrays of objects
    const keyContacts = JSON.parse(formData.get("keyContacts") as string || '[]');
    const socialLinks = JSON.parse(formData.get("socialLinks") as string || '[]');

    const orgData: Partial<Organization> = {
        name: formData.get('name') as string,
        logoUrl: logoUrl,
        address: formData.get('address') as string,
        city: formData.get('city') as string,
        registrationNumber: formData.get('registrationNumber') as string,
        panNumber: formData.get('panNumber') as string,
        contactEmail: formData.get('contactEmail') as string,
        contactPhone: formData.get('contactPhone') as string,
        website: formData.get('website') as string,
        bankAccountName: formData.get('bankAccountName') as string,
        bankAccountNumber: formData.get('bankAccountNumber') as string,
        bankIfscCode: formData.get('bankIfscCode') as string,
        upiId: formData.get('upiId') as string,
        qrCodeUrl: qrCodeUrl,
        hero: {
            title: formData.get('hero.title') as string,
            description: formData.get('hero.description') as string,
        },
        footer: {
            organizationInfo: {
                titleLine1: formData.get("footer.organizationInfo.titleLine1") as string,
                titleLine2: formData.get("footer.organizationInfo.titleLine2") as string,
                titleLine3: formData.get("footer.organizationInfo.titleLine3") as string,
                description: formData.get("footer.organizationInfo.description") as string,
                registrationInfo: formData.get("footer.organizationInfo.registrationInfo") as string,
                taxInfo: formData.get("footer.organizationInfo.taxInfo") as string,
            },
            contactUs: {
                title: formData.get("footer.contactUs.title") as string,
                address: formData.get("footer.contactUs.address") as string,
                email: formData.get("footer.contactUs.email") as string,
            },
            keyContacts: {
                title: formData.get("footer.keyContacts.title") as string,
                contacts: keyContacts,
            },
            connectWithUs: {
                title: formData.get("footer.connectWithUs.title") as string,
                socialLinks: socialLinks,
            },
            ourCommitment: {
                title: formData.get("footer.ourCommitment.title") as string,
                text: formData.get("footer.ourCommitment.text") as string,
                linkText: formData.get("footer.ourCommitment.linkText") as string,
                linkUrl: formData.get("footer.ourCommitment.linkUrl") as string,
            },
            copyright: {
                text: formData.get("footer.copyright.text") as string,
            }
        },
        updatedBy: { id: adminUser.id!, name: adminUser.name },
    };
    
    let finalOrgData: Organization;

    if(isCreating) {
        finalOrgData = await createOrganization(orgData as Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>);
    } else {
        await updateOrganization(orgId, orgData);
        const updatedOrg = await getOrganization(orgId);
        if(!updatedOrg) throw new Error("Could not retrieve updated organization data.");
        finalOrgData = updatedOrg;
    }
    
    // After updating the private data, sync it to the public document
    await updatePublicOrganization(finalOrgData);

    revalidatePath("/", "layout");

    return { success: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    console.error("Error updating organization settings:", error);
    return {
      success: false,
      error: error,
    };
  }
}
