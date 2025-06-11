
import { db } from '../db';
import { cakesTable } from '../db/schema';
import { type Cake } from '../schema';

export const getCakes = async (): Promise<Cake[]> => {
  try {
    const results = await db.select()
      .from(cakesTable)
      .execute();

    // Convert numeric fields back to numbers
    return results.map(cake => ({
      ...cake,
      price: parseFloat(cake.price) // Convert string back to number
    }));
  } catch (error) {
    console.error('Failed to fetch cakes:', error);
    throw error;
  }
};
