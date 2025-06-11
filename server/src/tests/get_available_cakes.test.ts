
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { cakesTable } from '../db/schema';
import { type CreateCakeInput } from '../schema';
import { getAvailableCakes } from '../handlers/get_available_cakes';

const testCake1: CreateCakeInput = {
  name: 'Chocolate Cake',
  description: 'Rich chocolate cake with frosting',
  image_url: 'https://example.com/chocolate.jpg',
  price: 25.99,
  category: 'chocolate',
  is_available: true
};

const testCake2: CreateCakeInput = {
  name: 'Vanilla Cake',
  description: 'Classic vanilla cake',
  image_url: 'https://example.com/vanilla.jpg',
  price: 19.99,
  category: 'vanilla',
  is_available: false
};

const testCake3: CreateCakeInput = {
  name: 'Strawberry Cake',
  description: 'Fresh strawberry cake',
  image_url: null,
  price: 29.99,
  category: 'fruit',
  is_available: true
};

describe('getAvailableCakes', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return only available cakes', async () => {
    // Create test cakes
    await db.insert(cakesTable).values([
      {
        ...testCake1,
        price: testCake1.price.toString()
      },
      {
        ...testCake2,
        price: testCake2.price.toString()
      },
      {
        ...testCake3,
        price: testCake3.price.toString()
      }
    ]).execute();

    const result = await getAvailableCakes();

    // Should only return available cakes (cake1 and cake3)
    expect(result).toHaveLength(2);
    
    const cakeNames = result.map(cake => cake.name);
    expect(cakeNames).toContain('Chocolate Cake');
    expect(cakeNames).toContain('Strawberry Cake');
    expect(cakeNames).not.toContain('Vanilla Cake');
  });

  it('should return empty array when no cakes are available', async () => {
    // Create only unavailable cakes
    await db.insert(cakesTable).values({
      ...testCake2,
      price: testCake2.price.toString()
    }).execute();

    const result = await getAvailableCakes();

    expect(result).toHaveLength(0);
  });

  it('should convert numeric price fields correctly', async () => {
    // Create test cake
    await db.insert(cakesTable).values({
      ...testCake1,
      price: testCake1.price.toString()
    }).execute();

    const result = await getAvailableCakes();

    expect(result).toHaveLength(1);
    expect(typeof result[0].price).toBe('number');
    expect(result[0].price).toEqual(25.99);
  });

  it('should return all cake fields correctly', async () => {
    // Create test cake
    await db.insert(cakesTable).values({
      ...testCake1,
      price: testCake1.price.toString()
    }).execute();

    const result = await getAvailableCakes();

    expect(result).toHaveLength(1);
    const cake = result[0];
    
    expect(cake.name).toEqual('Chocolate Cake');
    expect(cake.description).toEqual('Rich chocolate cake with frosting');
    expect(cake.image_url).toEqual('https://example.com/chocolate.jpg');
    expect(cake.price).toEqual(25.99);
    expect(cake.category).toEqual('chocolate');
    expect(cake.is_available).toEqual(true);
    expect(cake.id).toBeDefined();
    expect(cake.created_at).toBeInstanceOf(Date);
    expect(cake.updated_at).toBeInstanceOf(Date);
  });

  it('should handle null image_url correctly', async () => {
    // Create test cake with null image_url
    await db.insert(cakesTable).values({
      ...testCake3,
      price: testCake3.price.toString()
    }).execute();

    const result = await getAvailableCakes();

    expect(result).toHaveLength(1);
    expect(result[0].image_url).toBeNull();
    expect(result[0].name).toEqual('Strawberry Cake');
  });
});
