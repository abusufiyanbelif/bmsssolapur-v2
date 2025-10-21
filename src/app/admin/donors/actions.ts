'use server';

import { getInspirationalQuotes } from '@/ai/flows/get-inspirational-quotes-flow';
import type { Quote } from '@/services/types';

export async function getQuotesAction(count: number): Promise<Quote[]> {
  return getInspirationalQuotes(count);
}
