
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { cakesTable } from '../db/schema';
import { type CreateCakeInput } from '../schema';
import { getCakeById } from '../handlers/get_cake_by_id';

// Test cake input
const testCakeInput: CreateCakeInput = {
  name: 'Chocolate Cake',
  description: 'Rich chocolate cake with ganache',
  image_url: 'https://example.com/chocolate-cake.jpg',
  price: 25.99,
  category: 'Chocolate',
  is_available: true
};

describe('getCakeById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return cake when found', async () => {
    // Create a test cake first
    const insertResult = await db.insert(cakesTable)
      .values({
        name: testCakeInput.name,
        description: testCakeInput.description,
        image_url: testCakeInput.image_url,
        price: testCakeInput.price.toString(), // Convert to string for insert
        category: testCakeInput.category,
        is_available: testCakeInput.is_available
      })
      .returning()
      .execute();

    const createdCake = insertResult[0];

    // Test the handler
    const result = await getCakeById(createdCake.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdCake.id);
    expect(result!.name).toEqual('Chocolate Cake');
    expect(result!.description).toEqual('Rich chocolate cake with ganache');
    expect(result!.image_url).toEqual('https://example.com/chocolate-cake.jpg');
    expect(result!.price).toEqual(25.99);
    expect(typeof result!.price).toEqual('number');
    expect(result!.category).toEqual('Chocolate');
    expect(result!.is_available).toEqual(true);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when cake not found', async () => {
    const result = await getCakeById(999);

    expect(result).toBeNull();
  });

  it('should handle cake with nullable image_url', async () => {
    // Create cake without image_url
    const insertResult = await db.insert(cakesTable)
      .values({
        name: 'Simple Cake',
        description: 'A simple cake',
        image_url: null,
        price: '15.50',
        category: 'Plain',
        is_available: true
      })
      .returning()
      .execute();

    const createdCake = insertResult[0];

    const result = await getCakeById(createdCake.id);

    expect(result).not.toBeNull();
    expect(result!.image_url).toBeNull();
    expect(result!.price).toEqual(15.5);
    expect(typeof result!.price).toEqual('number');
  });
});
