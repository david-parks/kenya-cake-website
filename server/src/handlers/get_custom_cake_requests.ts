
import { db } from '../db';
import { customCakeRequestsTable } from '../db/schema';
import { type CustomCakeRequest } from '../schema';
import { desc } from 'drizzle-orm';

export const getCustomCakeRequests = async (): Promise<CustomCakeRequest[]> => {
  try {
    const results = await db.select()
      .from(customCakeRequestsTable)
      .orderBy(desc(customCakeRequestsTable.created_at))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(request => ({
      ...request,
      quoted_price: request.quoted_price ? parseFloat(request.quoted_price) : null
    }));
  } catch (error) {
    console.error('Failed to get custom cake requests:', error);
    throw error;
  }
};
