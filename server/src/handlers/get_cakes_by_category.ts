
import { db } from '../db';
import { cakesTable } from '../db/schema';
import { type Cake } from '../schema';
import { eq } from 'drizzle-orm';

export const getCakesByCategory = async (category: string): Promise<Cake[]> => {
  try {
    const results = await db.select()
      .from(cakesTable)
      .where(eq(cakesTable.category, category))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(cake => ({
      ...cake,
      price: parseFloat(cake.price)
    }));
  } catch (error) {
    console.error('Get cakes by category failed:', error);
    throw error;
  }
};
