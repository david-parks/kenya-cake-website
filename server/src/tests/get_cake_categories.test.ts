
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { cakesTable } from '../db/schema';
import { getCakeCategories } from '../handlers/get_cake_categories';
import { type CreateCakeInput } from '../schema';

describe('getCakeCategories', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no cakes exist', async () => {
    const result = await getCakeCategories();
    expect(result).toEqual([]);
  });

  it('should return unique categories', async () => {
    // Create test cakes with different categories
    const testCakes: CreateCakeInput[] = [
      {
        name: 'Chocolate Cake',
        description: 'Rich chocolate cake',
        image_url: null,
        price: 25.99,
        category: 'Chocolate',
        is_available: true
      },
      {
        name: 'Vanilla Cake',
        description: 'Classic vanilla cake',
        image_url: null,
        price: 22.99,
        category: 'Vanilla',
        is_available: true
      },
      {
        name: 'Double Chocolate',
        description: 'Extra chocolate cake',
        image_url: null,
        price: 29.99,
        category: 'Chocolate',
        is_available: true
      }
    ];

    // Insert test cakes
    for (const cake of testCakes) {
      await db.insert(cakesTable)
        .values({
          ...cake,
          price: cake.price.toString()
        })
        .execute();
    }

    const result = await getCakeCategories();

    expect(result).toHaveLength(2);
    expect(result).toContain('Chocolate');
    expect(result).toContain('Vanilla');
    expect(result).toEqual(['Chocolate', 'Vanilla']); // Should be sorted alphabetically
  });

  it('should return categories in alphabetical order', async () => {
    // Create test cakes with categories in non-alphabetical order
    const testCakes: CreateCakeInput[] = [
      {
        name: 'Zebra Cake',
        description: 'Zebra striped cake',
        image_url: null,
        price: 25.99,
        category: 'Zebra',
        is_available: true
      },
      {
        name: 'Apple Cake',
        description: 'Fresh apple cake',
        image_url: null,
        price: 22.99,
        category: 'Apple',
        is_available: true
      },
      {
        name: 'Mint Cake',
        description: 'Refreshing mint cake',
        image_url: null,
        price: 24.99,
        category: 'Mint',
        is_available: true
      }
    ];

    // Insert test cakes
    for (const cake of testCakes) {
      await db.insert(cakesTable)
        .values({
          ...cake,
          price: cake.price.toString()
        })
        .execute();
    }

    const result = await getCakeCategories();

    expect(result).toEqual(['Apple', 'Mint', 'Zebra']);
  });

  it('should include categories from unavailable cakes', async () => {
    // Create test cakes with one unavailable
    const testCakes: CreateCakeInput[] = [
      {
        name: 'Available Cake',
        description: 'This cake is available',
        image_url: null,
        price: 25.99,
        category: 'Available',
        is_available: true
      },
      {
        name: 'Unavailable Cake',
        description: 'This cake is not available',
        image_url: null,
        price: 22.99,
        category: 'Unavailable',
        is_available: false
      }
    ];

    // Insert test cakes
    for (const cake of testCakes) {
      await db.insert(cakesTable)
        .values({
          ...cake,
          price: cake.price.toString()
        })
        .execute();
    }

    const result = await getCakeCategories();

    expect(result).toHaveLength(2);
    expect(result).toContain('Available');
    expect(result).toContain('Unavailable');
    expect(result).toEqual(['Available', 'Unavailable']);
  });
});
