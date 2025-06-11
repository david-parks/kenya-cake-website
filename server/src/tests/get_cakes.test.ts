
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { cakesTable } from '../db/schema';
import { getCakes } from '../handlers/get_cakes';

describe('getCakes', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no cakes exist', async () => {
    const result = await getCakes();
    expect(result).toEqual([]);
  });

  it('should return all cakes', async () => {
    // Create test cakes
    await db.insert(cakesTable).values([
      {
        name: 'Chocolate Cake',
        description: 'Rich chocolate cake',
        price: '25.99',
        category: 'chocolate',
        is_available: true
      },
      {
        name: 'Vanilla Cake',
        description: 'Classic vanilla cake',
        price: '22.50',
        category: 'vanilla',
        is_available: false
      }
    ]).execute();

    const result = await getCakes();

    expect(result).toHaveLength(2);
    
    // Verify first cake
    const chocolateCake = result.find(cake => cake.name === 'Chocolate Cake');
    expect(chocolateCake).toBeDefined();
    expect(chocolateCake!.description).toEqual('Rich chocolate cake');
    expect(chocolateCake!.price).toEqual(25.99);
    expect(typeof chocolateCake!.price).toBe('number');
    expect(chocolateCake!.category).toEqual('chocolate');
    expect(chocolateCake!.is_available).toBe(true);
    expect(chocolateCake!.id).toBeDefined();
    expect(chocolateCake!.created_at).toBeInstanceOf(Date);
    expect(chocolateCake!.updated_at).toBeInstanceOf(Date);

    // Verify second cake
    const vanillaCake = result.find(cake => cake.name === 'Vanilla Cake');
    expect(vanillaCake).toBeDefined();
    expect(vanillaCake!.description).toEqual('Classic vanilla cake');
    expect(vanillaCake!.price).toEqual(22.50);
    expect(typeof vanillaCake!.price).toBe('number');
    expect(vanillaCake!.category).toEqual('vanilla');
    expect(vanillaCake!.is_available).toBe(false);
  });

  it('should handle cakes with null image_url', async () => {
    await db.insert(cakesTable).values({
      name: 'Test Cake',
      description: 'Test description',
      image_url: null,
      price: '15.00',
      category: 'test',
      is_available: true
    }).execute();

    const result = await getCakes();

    expect(result).toHaveLength(1);
    expect(result[0].image_url).toBeNull();
    expect(result[0].name).toEqual('Test Cake');
    expect(result[0].price).toEqual(15.00);
  });
});
