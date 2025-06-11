
import { db } from '../db';
import { cakesTable } from '../db/schema';
import { type CreateCakeInput, type Cake } from '../schema';

export const createCake = async (input: CreateCakeInput): Promise<Cake> => {
  try {
    // Insert cake record
    const result = await db.insert(cakesTable)
      .values({
        name: input.name,
        description: input.description,
        image_url: input.image_url,
        price: input.price.toString(), // Convert number to string for numeric column
        category: input.category,
        is_available: input.is_available // Boolean column - no conversion needed
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const cake = result[0];
    return {
      ...cake,
      price: parseFloat(cake.price) // Convert string back to number
    };
  } catch (error) {
    console.error('Cake creation failed:', error);
    throw error;
  }
};
