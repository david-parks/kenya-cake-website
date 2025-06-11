
import { db } from '../db';
import { customCakeRequestsTable } from '../db/schema';
import { type CustomCakeRequest } from '../schema';
import { eq } from 'drizzle-orm';

export const getCustomCakeRequestById = async (id: number): Promise<CustomCakeRequest | null> => {
  try {
    const result = await db.select()
      .from(customCakeRequestsTable)
      .where(eq(customCakeRequestsTable.id, id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    const request = result[0];
    return {
      ...request,
      quoted_price: request.quoted_price ? parseFloat(request.quoted_price) : null
    };
  } catch (error) {
    console.error('Failed to get custom cake request by id:', error);
    throw error;
  }
};
