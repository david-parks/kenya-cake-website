
import { db } from '../db';
import { cakesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteCake = async (id: number): Promise<void> => {
  try {
    await db.delete(cakesTable)
      .where(eq(cakesTable.id, id))
      .execute();
  } catch (error) {
    console.error('Cake deletion failed:', error);
    throw error;
  }
};
