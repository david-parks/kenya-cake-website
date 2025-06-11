
import { db } from '../db';
import { cakesTable } from '../db/schema';
import { type Cake } from '../schema';
import { eq } from 'drizzle-orm';

export const getCakeById = async (id: number): Promise<Cake | null> => {
  try {
    const result = await db.select()
      .from(cakesTable)
      .where(eq(cakesTable.id, id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    // Convert numeric fields back to numbers
    const cake = result[0];
    return {
      ...cake,
      price: parseFloat(cake.price) // Convert string back to number
    };
  } catch (error) {
    console.error('Get cake by ID failed:', error);
    throw error;
  }
};
