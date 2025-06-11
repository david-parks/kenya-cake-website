
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { cakesTable } from '../db/schema';
import { type CreateCakeInput } from '../schema';
import { deleteCake } from '../handlers/delete_cake';
import { eq } from 'drizzle-orm';

// Test cake data
const testCake: CreateCakeInput = {
  name: 'Test Chocolate Cake',
  description: 'Delicious chocolate cake for testing',
  image_url: 'https://example.com/cake.jpg',
  price: 25.99,
  category: 'Chocolate',
  is_available: true
};

describe('deleteCake', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing cake', async () => {
    // Create a cake first
    const createResult = await db.insert(cakesTable)
      .values({
        name: testCake.name,
        description: testCake.description,
        image_url: testCake.image_url,
        price: testCake.price.toString(),
        category: testCake.category,
        is_available: testCake.is_available
      })
      .returning()
      .execute();

    const cakeId = createResult[0].id;

    // Verify cake exists before deletion
    const beforeDelete = await db.select()
      .from(cakesTable)
      .where(eq(cakesTable.id, cakeId))
      .execute();

    expect(beforeDelete).toHaveLength(1);

    // Delete the cake
    await deleteCake(cakeId);

    // Verify cake no longer exists
    const afterDelete = await db.select()
      .from(cakesTable)
      .where(eq(cakesTable.id, cakeId))
      .execute();

    expect(afterDelete).toHaveLength(0);
  });

  it('should not throw error when deleting non-existent cake', async () => {
    // Try to delete a cake that doesn't exist
    const nonExistentId = 999;

    // Should not throw an error
    await expect(deleteCake(nonExistentId)).resolves.toBeUndefined();

    // Verify no cakes exist in the database
    const allCakes = await db.select()
      .from(cakesTable)
      .execute();

    expect(allCakes).toHaveLength(0);
  });

  it('should delete only the specified cake', async () => {
    // Create multiple cakes
    const cake1Result = await db.insert(cakesTable)
      .values({
        name: 'Cake 1',
        description: 'First cake',
        image_url: null,
        price: '20.00',
        category: 'Vanilla',
        is_available: true
      })
      .returning()
      .execute();

    const cake2Result = await db.insert(cakesTable)
      .values({
        name: 'Cake 2',
        description: 'Second cake',
        image_url: null,
        price: '30.00',
        category: 'Chocolate',
        is_available: true
      })
      .returning()
      .execute();

    const cake1Id = cake1Result[0].id;
    const cake2Id = cake2Result[0].id;

    // Delete only the first cake
    await deleteCake(cake1Id);

    // Verify first cake is deleted
    const cake1Check = await db.select()
      .from(cakesTable)
      .where(eq(cakesTable.id, cake1Id))
      .execute();

    expect(cake1Check).toHaveLength(0);

    // Verify second cake still exists
    const cake2Check = await db.select()
      .from(cakesTable)
      .where(eq(cakesTable.id, cake2Id))
      .execute();

    expect(cake2Check).toHaveLength(1);
    expect(cake2Check[0].name).toEqual('Cake 2');
  });
});
