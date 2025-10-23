// src/app/admin/donors/actions.ts
'use server';

import { getInspirationalQuotes } from '@/ai/flows/get-inspirational-quotes-flow';
import type { Quote } from '@/services/types';

export async function getQuotesAction(count: number): Promise<Quote[]> {
  try {
    const quotes = await getInspirationalQuotes(count);
    return JSON.parse(JSON.stringify(quotes));
  } catch (error) {
    console.error("Error in getQuotesAction:", error);
    return [];
  }
}
