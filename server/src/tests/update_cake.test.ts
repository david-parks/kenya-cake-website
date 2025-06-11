
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { cakesTable } from '../db/schema';
import { type CreateCakeInput, type UpdateCakeInput } from '../schema';
import { updateCake } from '../handlers/update_cake';
import { eq } from 'drizzle-orm';

// Test data
const testCakeInput: CreateCakeInput = {
  name: 'Original Cake',
  description: 'Original description',
  image_url: 'https://example.com/original.jpg',
  price: 25.99,
  category: 'Birthday',
  is_available: true
};

const createTestCake = async () => {
  const result = await db.insert(cakesTable)
    .values({
      ...testCakeInput,
      price: testCakeInput.price.toString()
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('updateCake', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a cake with all fields', async () => {
    const testCake = await createTestCake();
    
    const updateInput: UpdateCakeInput = {
      id: testCake.id,
      name: 'Updated Cake',
      description: 'Updated description',
      image_url: 'https://example.com/updated.jpg',
      price: 35.99,
      category: 'Wedding',
      is_available: false
    };

    const result = await updateCake(updateInput);

    expect(result.id).toEqual(testCake.id);
    expect(result.name).toEqual('Updated Cake');
    expect(result.description).toEqual('Updated description');
    expect(result.image_url).toEqual('https://example.com/updated.jpg');
    expect(result.price).toEqual(35.99);
    expect(typeof result.price).toEqual('number');
    expect(result.category).toEqual('Wedding');
    expect(result.is_available).toEqual(false);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > testCake.updated_at).toBe(true);
  });

  it('should update only specified fields', async () => {
    const testCake = await createTestCake();
    
    const updateInput: UpdateCakeInput = {
      id: testCake.id,
      name: 'Partially Updated Cake',
      price: 45.50
    };

    const result = await updateCake(updateInput);

    // Updated fields
    expect(result.name).toEqual('Partially Updated Cake');
    expect(result.price).toEqual(45.50);
    
    // Unchanged fields
    expect(result.description).toEqual(testCakeInput.description);
    expect(result.image_url).toEqual(testCakeInput.image_url);
    expect(result.category).toEqual(testCakeInput.category);
    expect(result.is_available).toEqual(testCakeInput.is_available);
  });

  it('should update cake in database', async () => {
    const testCake = await createTestCake();
    
    const updateInput: UpdateCakeInput = {
      id: testCake.id,
      name: 'Database Updated Cake',
      price: 29.99
    };

    await updateCake(updateInput);

    // Verify database was updated
    const cakes = await db.select()
      .from(cakesTable)
      .where(eq(cakesTable.id, testCake.id))
      .execute();

    expect(cakes).toHaveLength(1);
    expect(cakes[0].name).toEqual('Database Updated Cake');
    expect(parseFloat(cakes[0].price)).toEqual(29.99);
    expect(cakes[0].updated_at > testCake.updated_at).toBe(true);
  });

  it('should handle null image_url', async () => {
    const testCake = await createTestCake();
    
    const updateInput: UpdateCakeInput = {
      id: testCake.id,
      image_url: null
    };

    const result = await updateCake(updateInput);

    expect(result.image_url).toBeNull();
  });

  it('should throw error for non-existent cake', async () => {
    const updateInput: UpdateCakeInput = {
      id: 999999,
      name: 'Non-existent Cake'
    };

    expect(updateCake(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should update is_available status correctly', async () => {
    const testCake = await createTestCake();
    
    // First update to false
    const updateInput1: UpdateCakeInput = {
      id: testCake.id,
      is_available: false
    };

    const result1 = await updateCake(updateInput1);
    expect(result1.is_available).toEqual(false);

    // Then update back to true
    const updateInput2: UpdateCakeInput = {
      id: testCake.id,
      is_available: true
    };

    const result2 = await updateCake(updateInput2);
    expect(result2.is_available).toEqual(true);
  });
});
