
import { db } from '../db';
import { cakesTable } from '../db/schema';
import { type UpdateCakeInput, type Cake } from '../schema';
import { eq } from 'drizzle-orm';

export const updateCake = async (input: UpdateCakeInput): Promise<Cake> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {};
    
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.image_url !== undefined) updateData.image_url = input.image_url;
    if (input.price !== undefined) updateData.price = input.price.toString();
    if (input.category !== undefined) updateData.category = input.category;
    if (input.is_available !== undefined) updateData.is_available = input.is_available;
    
    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // Update cake record
    const result = await db.update(cakesTable)
      .set(updateData)
      .where(eq(cakesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Cake with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const cake = result[0];
    return {
      ...cake,
      price: parseFloat(cake.price)
    };
  } catch (error) {
    console.error('Cake update failed:', error);
    throw error;
  }
};
