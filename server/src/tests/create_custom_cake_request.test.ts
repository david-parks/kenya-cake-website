
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customCakeRequestsTable } from '../db/schema';
import { type CreateCustomCakeRequestInput } from '../schema';
import { createCustomCakeRequest } from '../handlers/create_custom_cake_request';
import { eq } from 'drizzle-orm';

// Simple test input with all required fields
const testInput: CreateCustomCakeRequestInput = {
  customer_name: 'Jane Smith',
  customer_email: 'jane.smith@example.com',
  customer_phone: '+1234567890',
  cake_description: 'A beautiful three-tier wedding cake with vanilla sponge and buttercream frosting',
  occasion: 'Wedding',
  size: 'Large (serves 100)',
  flavor_preferences: 'Vanilla sponge with strawberry filling',
  design_preferences: 'White fondant with pink roses',
  budget_range: '$300-$500',
  required_date: new Date('2024-06-15')
};

describe('createCustomCakeRequest', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a custom cake request', async () => {
    const result = await createCustomCakeRequest(testInput);

    // Basic field validation
    expect(result.customer_name).toEqual('Jane Smith');
    expect(result.customer_email).toEqual('jane.smith@example.com');
    expect(result.customer_phone).toEqual('+1234567890');
    expect(result.cake_description).toEqual('A beautiful three-tier wedding cake with vanilla sponge and buttercream frosting');
    expect(result.occasion).toEqual('Wedding');
    expect(result.size).toEqual('Large (serves 100)');
    expect(result.flavor_preferences).toEqual('Vanilla sponge with strawberry filling');
    expect(result.design_preferences).toEqual('White fondant with pink roses');
    expect(result.budget_range).toEqual('$300-$500');
    expect(result.required_date).toEqual(new Date('2024-06-15'));
    expect(result.status).toEqual('pending'); // Default status
    expect(result.quoted_price).toBeNull(); // Initially null
    expect(result.admin_notes).toBeNull(); // Initially null
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save custom cake request to database', async () => {
    const result = await createCustomCakeRequest(testInput);

    // Query using proper drizzle syntax
    const requests = await db.select()
      .from(customCakeRequestsTable)
      .where(eq(customCakeRequestsTable.id, result.id))
      .execute();

    expect(requests).toHaveLength(1);
    expect(requests[0].customer_name).toEqual('Jane Smith');
    expect(requests[0].customer_email).toEqual('jane.smith@example.com');
    expect(requests[0].cake_description).toEqual('A beautiful three-tier wedding cake with vanilla sponge and buttercream frosting');
    expect(requests[0].status).toEqual('pending');
    expect(requests[0].quoted_price).toBeNull();
    expect(requests[0].created_at).toBeInstanceOf(Date);
    expect(requests[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle null optional fields correctly', async () => {
    const minimalInput: CreateCustomCakeRequestInput = {
      customer_name: 'John Doe',
      customer_email: 'john.doe@example.com',
      customer_phone: '+9876543210',
      cake_description: 'Simple birthday cake with chocolate flavor',
      occasion: null,
      size: null,
      flavor_preferences: null,
      design_preferences: null,
      budget_range: null,
      required_date: null
    };

    const result = await createCustomCakeRequest(minimalInput);

    expect(result.customer_name).toEqual('John Doe');
    expect(result.cake_description).toEqual('Simple birthday cake with chocolate flavor');
    expect(result.occasion).toBeNull();
    expect(result.size).toBeNull();
    expect(result.flavor_preferences).toBeNull();
    expect(result.design_preferences).toBeNull();
    expect(result.budget_range).toBeNull();
    expect(result.required_date).toBeNull();
    expect(result.status).toEqual('pending');
  });

  it('should handle date fields correctly', async () => {
    const futureDate = new Date('2025-12-25');
    const inputWithDate: CreateCustomCakeRequestInput = {
      ...testInput,
      required_date: futureDate
    };

    const result = await createCustomCakeRequest(inputWithDate);

    expect(result.required_date).toEqual(futureDate);
    expect(result.required_date).toBeInstanceOf(Date);

    // Verify in database
    const requests = await db.select()
      .from(customCakeRequestsTable)
      .where(eq(customCakeRequestsTable.id, result.id))
      .execute();

    expect(requests[0].required_date).toEqual(futureDate);
    expect(requests[0].required_date).toBeInstanceOf(Date);
  });
});
