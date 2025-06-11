
import { db } from '../db';
import { customCakeRequestsTable } from '../db/schema';
import { type UpdateCustomCakeRequestInput, type CustomCakeRequest } from '../schema';
import { eq } from 'drizzle-orm';

export const updateCustomCakeRequest = async (input: UpdateCustomCakeRequestInput): Promise<CustomCakeRequest> => {
  try {
    // Prepare update data with numeric conversion for quoted_price
    const updateData: any = {
      status: input.status,
      updated_at: new Date()
    };

    if (input.admin_notes !== undefined) {
      updateData.admin_notes = input.admin_notes;
    }

    if (input.quoted_price !== undefined) {
      updateData.quoted_price = input.quoted_price !== null ? input.quoted_price.toString() : null;
    }

    // Update the custom cake request
    const result = await db.update(customCakeRequestsTable)
      .set(updateData)
      .where(eq(customCakeRequestsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Custom cake request with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const customRequest = result[0];
    return {
      ...customRequest,
      quoted_price: customRequest.quoted_price ? parseFloat(customRequest.quoted_price) : null
    };
  } catch (error) {
    console.error('Custom cake request update failed:', error);
    throw error;
  }
};
