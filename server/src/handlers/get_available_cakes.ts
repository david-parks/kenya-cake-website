
import { db } from '../db';
import { cakesTable } from '../db/schema';
import { type Cake } from '../schema';
import { eq } from 'drizzle-orm';

export const getAvailableCakes = async (): Promise<Cake[]> => {
  try {
    const results = await db.select()
      .from(cakesTable)
      .where(eq(cakesTable.is_available, true))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(cake => ({
      ...cake,
      price: parseFloat(cake.price)
    }));
  } catch (error) {
    console.error('Failed to get available cakes:', error);
    throw error;
  }
};
