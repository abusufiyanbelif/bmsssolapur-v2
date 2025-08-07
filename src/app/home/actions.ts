

'use server';

import type { User } from '@/services/types';
import { updateUser as updateUserService } from '@/services/user-service';

export async function updateUser(userId: string, updates: Partial<User>) {
    return await updateUserService(userId, updates);
}
