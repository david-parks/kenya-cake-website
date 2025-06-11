
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { cakesTable } from '../db/schema';
import { getCakesByCategory } from '../handlers/get_cakes_by_category';

describe('getCakesByCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return cakes for specified category', async () => {
    // Create test cakes in different categories
    await db.insert(cakesTable).values([
      {
        name: 'Chocolate Birthday Cake',
        description: 'Rich chocolate cake for birthdays',
        price: '25.99',
        category: 'birthday',
        is_available: true
      },
      {
        name: 'Vanilla Wedding Cake',
        description: 'Elegant vanilla cake for weddings',
        price: '89.99',
        category: 'wedding',
        is_available: true
      },
      {
        name: 'Red Velvet Birthday Cake',
        description: 'Classic red velvet for birthdays',
        price: '29.99',
        category: 'birthday',
        is_available: true
      }
    ]).execute();

    const birthdayCakes = await getCakesByCategory('birthday');

    expect(birthdayCakes).toHaveLength(2);
    expect(birthdayCakes[0].category).toEqual('birthday');
    expect(birthdayCakes[1].category).toEqual('birthday');
    expect(birthdayCakes[0].name).toEqual('Chocolate Birthday Cake');
    expect(birthdayCakes[1].name).toEqual('Red Velvet Birthday Cake');
  });

  it('should return empty array for non-existent category', async () => {
    // Create a cake in a different category
    await db.insert(cakesTable).values({
      name: 'Test Cake',
      description: 'Test description',
      price: '19.99',
      category: 'birthday',
      is_available: true
    }).execute();

    const result = await getCakesByCategory('nonexistent');

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should convert numeric price field correctly', async () => {
    await db.insert(cakesTable).values({
      name: 'Price Test Cake',
      description: 'Testing price conversion',
      price: '45.50',
      category: 'test',
      is_available: true
    }).execute();

    const result = await getCakesByCategory('test');

    expect(result).toHaveLength(1);
    expect(typeof result[0].price).toBe('number');
    expect(result[0].price).toEqual(45.50);
  });

  it('should include all cake fields in response', async () => {
    await db.insert(cakesTable).values({
      name: 'Complete Cake',
      description: 'Full field test',
      image_url: 'https://example.com/cake.jpg',
      price: '15.99',
      category: 'test',
      is_available: false
    }).execute();

    const result = await getCakesByCategory('test');

    expect(result).toHaveLength(1);
    const cake = result[0];
    expect(cake.id).toBeDefined();
    expect(cake.name).toEqual('Complete Cake');
    expect(cake.description).toEqual('Full field test');
    expect(cake.image_url).toEqual('https://example.com/cake.jpg');
    expect(cake.price).toEqual(15.99);
    expect(cake.category).toEqual('test');
    expect(cake.is_available).toBe(false);
    expect(cake.created_at).toBeInstanceOf(Date);
    expect(cake.updated_at).toBeInstanceOf(Date);
  });

  it('should return multiple cakes in same category with correct ordering', async () => {
    // Insert cakes with different names to test natural ordering
    await db.insert(cakesTable).values([
      {
        name: 'Apple Cake',
        description: 'First cake',
        price: '20.00',
        category: 'fruit',
        is_available: true
      },
      {
        name: 'Banana Cake',
        description: 'Second cake',
        price: '22.00',
        category: 'fruit',
        is_available: true
      },
      {
        name: 'Cherry Cake',
        description: 'Third cake',
        price: '24.00',
        category: 'fruit',
        is_available: true
      }
    ]).execute();

    const result = await getCakesByCategory('fruit');

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('Apple Cake');
    expect(result[1].name).toEqual('Banana Cake');
    expect(result[2].name).toEqual('Cherry Cake');
    
    // Verify all prices are converted correctly
    expect(result[0].price).toEqual(20.00);
    expect(result[1].price).toEqual(22.00);
    expect(result[2].price).toEqual(24.00);
  });
});
