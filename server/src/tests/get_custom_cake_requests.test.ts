
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customCakeRequestsTable } from '../db/schema';
import { getCustomCakeRequests } from '../handlers/get_custom_cake_requests';

describe('getCustomCakeRequests', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no requests exist', async () => {
    const result = await getCustomCakeRequests();
    expect(result).toEqual([]);
  });

  it('should return all custom cake requests', async () => {
    // Create test data
    const testRequests = [
      {
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        customer_phone: '123-456-7890',
        cake_description: 'Birthday cake for my daughter',
        occasion: 'Birthday',
        size: 'Large',
        flavor_preferences: 'Chocolate',
        design_preferences: 'Princess theme',
        budget_range: '$50-100',
        required_date: new Date('2024-12-25'),
        status: 'pending' as const,
        admin_notes: null,
        quoted_price: null
      },
      {
        customer_name: 'Jane Smith',
        customer_email: 'jane@example.com',
        customer_phone: '987-654-3210',
        cake_description: 'Wedding cake for 100 guests',
        occasion: 'Wedding',
        size: 'Extra Large',
        flavor_preferences: 'Vanilla',
        design_preferences: 'Elegant white roses',
        budget_range: '$200-300',
        required_date: new Date('2024-11-15'),
        status: 'quoted' as const,
        admin_notes: 'Discussed design details',
        quoted_price: '250.00'
      }
    ];

    await db.insert(customCakeRequestsTable)
      .values(testRequests)
      .execute();

    const result = await getCustomCakeRequests();

    expect(result).toHaveLength(2);
    
    // Find requests by name since order may vary
    const johnRequest = result.find(r => r.customer_name === 'John Doe');
    const janeRequest = result.find(r => r.customer_name === 'Jane Smith');

    // Check John's request
    expect(johnRequest).toBeDefined();
    expect(johnRequest!.customer_email).toEqual('john@example.com');
    expect(johnRequest!.cake_description).toEqual('Birthday cake for my daughter');
    expect(johnRequest!.status).toEqual('pending');
    expect(johnRequest!.quoted_price).toBeNull();
    expect(johnRequest!.id).toBeDefined();
    expect(johnRequest!.created_at).toBeInstanceOf(Date);
    expect(johnRequest!.updated_at).toBeInstanceOf(Date);

    // Check Jane's request
    expect(janeRequest).toBeDefined();
    expect(janeRequest!.customer_email).toEqual('jane@example.com');
    expect(janeRequest!.cake_description).toEqual('Wedding cake for 100 guests');
    expect(janeRequest!.status).toEqual('quoted');
    expect(janeRequest!.quoted_price).toEqual(250);
    expect(typeof janeRequest!.quoted_price).toEqual('number');
    expect(janeRequest!.id).toBeDefined();
    expect(janeRequest!.created_at).toBeInstanceOf(Date);
    expect(janeRequest!.updated_at).toBeInstanceOf(Date);
  });

  it('should return requests ordered by created_at descending', async () => {
    // Create requests with different timestamps by inserting separately
    const firstRequest = {
      customer_name: 'First Customer',
      customer_email: 'first@example.com',
      customer_phone: '111-111-1111',
      cake_description: 'First cake request',
      occasion: null,
      size: null,
      flavor_preferences: null,
      design_preferences: null,
      budget_range: null,
      required_date: null,
      status: 'pending' as const,
      admin_notes: null,
      quoted_price: null
    };

    const secondRequest = {
      customer_name: 'Second Customer',
      customer_email: 'second@example.com',
      customer_phone: '222-222-2222',
      cake_description: 'Second cake request',
      occasion: null,
      size: null,
      flavor_preferences: null,
      design_preferences: null,
      budget_range: null,
      required_date: null,
      status: 'pending' as const,
      admin_notes: null,
      quoted_price: null
    };

    // Insert first request
    await db.insert(customCakeRequestsTable)
      .values(firstRequest)
      .execute();

    // Wait a moment to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Insert second request
    await db.insert(customCakeRequestsTable)
      .values(secondRequest)
      .execute();

    const result = await getCustomCakeRequests();

    expect(result).toHaveLength(2);
    // Most recent should be first
    expect(result[0].customer_name).toEqual('Second Customer');
    expect(result[1].customer_name).toEqual('First Customer');
    
    // Verify ordering by checking timestamps
    expect(result[0].created_at >= result[1].created_at).toBe(true);
  });

  it('should handle requests with null quoted_price correctly', async () => {
    const testRequest = {
      customer_name: 'Test Customer',
      customer_email: 'test@example.com',
      customer_phone: '555-555-5555',
      cake_description: 'Test cake request',
      occasion: null,
      size: null,
      flavor_preferences: null,
      design_preferences: null,
      budget_range: null,
      required_date: null,
      status: 'pending' as const,
      admin_notes: null,
      quoted_price: null
    };

    await db.insert(customCakeRequestsTable)
      .values(testRequest)
      .execute();

    const result = await getCustomCakeRequests();

    expect(result).toHaveLength(1);
    expect(result[0].quoted_price).toBeNull();
  });
});
