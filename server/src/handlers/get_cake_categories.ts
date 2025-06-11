
import { db } from '../db';
import { cakesTable } from '../db/schema';
import { sql } from 'drizzle-orm';

export const getCakeCategories = async (): Promise<string[]> => {
  try {
    // Get distinct categories from cakes table
    const result = await db
      .selectDistinct({ category: cakesTable.category })
      .from(cakesTable)
      .orderBy(cakesTable.category)
      .execute();

    return result.map(row => row.category);
  } catch (error) {
    console.error('Failed to get cake categories:', error);
    throw error;
  }
};
