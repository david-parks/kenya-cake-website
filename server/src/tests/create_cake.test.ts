
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { cakesTable } from '../db/schema';
import { type CreateCakeInput } from '../schema';
import { createCake } from '../handlers/create_cake';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateCakeInput = {
  name: 'Chocolate Cake',
  description: 'Rich chocolate cake with frosting',
  image_url: 'https://example.com/chocolate-cake.jpg',
  price: 25.99,
  category: 'Chocolate',
  is_available: true
};

describe('createCake', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a cake', async () => {
    const result = await createCake(testInput);

    // Basic field validation
    expect(result.name).toEqual('Chocolate Cake');
    expect(result.description).toEqual(testInput.description);
    expect(result.image_url).toEqual('https://example.com/chocolate-cake.jpg');
    expect(result.price).toEqual(25.99);
    expect(typeof result.price).toBe('number');
    expect(result.category).toEqual('Chocolate');
    expect(result.is_available).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save cake to database', async () => {
    const result = await createCake(testInput);

    // Query using proper drizzle syntax
    const cakes = await db.select()
      .from(cakesTable)
      .where(eq(cakesTable.id, result.id))
      .execute();

    expect(cakes).toHaveLength(1);
    expect(cakes[0].name).toEqual('Chocolate Cake');
    expect(cakes[0].description).toEqual(testInput.description);
    expect(cakes[0].image_url).toEqual('https://example.com/chocolate-cake.jpg');
    expect(parseFloat(cakes[0].price)).toEqual(25.99);
    expect(cakes[0].category).toEqual('Chocolate');
    expect(cakes[0].is_available).toEqual(true);
    expect(cakes[0].created_at).toBeInstanceOf(Date);
    expect(cakes[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create cake with null image_url', async () => {
    const inputWithNullImage: CreateCakeInput = {
      ...testInput,
      image_url: null
    };

    const result = await createCake(inputWithNullImage);

    expect(result.image_url).toBeNull();
    expect(result.name).toEqual('Chocolate Cake');
    expect(result.price).toEqual(25.99);
  });

  it('should create cake with default availability', async () => {
    const inputWithDefaultAvailability: CreateCakeInput = {
      name: 'Vanilla Cake',
      description: 'Classic vanilla cake',
      image_url: null,
      price: 20.00,
      category: 'Vanilla',
      is_available: true // Include all required fields
    };

    const result = await createCake(inputWithDefaultAvailability);

    expect(result.is_available).toEqual(true);
    expect(result.name).toEqual('Vanilla Cake');
    expect(result.price).toEqual(20.00);
  });

  it('should handle different price values correctly', async () => {
    const expensiveCakeInput: CreateCakeInput = {
      name: 'Premium Wedding Cake',
      description: 'Multi-tier wedding cake with decorations',
      image_url: null,
      price: 299.99,
      category: 'Wedding',
      is_available: true
    };

    const result = await createCake(expensiveCakeInput);

    expect(result.price).toEqual(299.99);
    expect(typeof result.price).toBe('number');

    // Verify in database
    const cakes = await db.select()
      .from(cakesTable)
      .where(eq(cakesTable.id, result.id))
      .execute();

    expect(parseFloat(cakes[0].price)).toEqual(299.99);
  });
});
