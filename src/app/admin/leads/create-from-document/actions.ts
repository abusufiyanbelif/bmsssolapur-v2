// src/app/admin/leads/create-from-document/actions.ts
'use server';

import { getAllUsers as getAllUsersService } from "@/services/user-service";
import { getAllCampaigns as getAllCampaignsService } from "@/services/campaign-service";
import { getAppSettings as getAppSettingsService } from "@/services/app-settings-service";

export async function getAllUsers() {
    const users = await getAllUsersService();
    return JSON.parse(JSON.stringify(users));
}

export async function getAllCampaigns() {
    const campaigns = await getAllCampaignsService();
    return JSON.parse(JSON.stringify(campaigns));
}

export async function getAppSettings() {
    const settings = await getAppSettingsService();
    return JSON.parse(JSON.stringify(settings));
}
