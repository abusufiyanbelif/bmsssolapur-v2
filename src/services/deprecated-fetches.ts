
/**
 * @fileOverview This file contains deprecated data fetching functions.
 * They fetch from private collections and should only be used in client components
 * on public pages where data is needed for display and proper security rules
 * have not yet been established. This is a temporary solution.
 */
import { getAllDonations as getAllDonationsPrivate } from './donation-service';
import { getAllUsers as getAllUsersPrivate } from './user-service';
import { getAllLeads as getAllLeadsPrivate } from './lead-service';
import { getAllCampaigns as getAllCampaignsPrivateService } from './campaign-service';

export const getAllDonations = async () => {
    return getAllDonationsPrivate();
};

export const getAllUsers = async () => {
    return getAllUsersPrivate();
};

export const getAllLeads = async () => {
    return getAllLeadsPrivate();
};

export const getAllCampaigns = async () => {
    return getAllCampaignsPrivateService();
};
