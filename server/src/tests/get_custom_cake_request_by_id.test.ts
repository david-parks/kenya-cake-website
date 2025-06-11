
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customCakeRequestsTable } from '../db/schema';
import { type CreateCustomCakeRequestInput } from '../schema';
import { getCustomCakeRequestById } from '../handlers/get_custom_cake_request_by_id';

const testInput: CreateCustomCakeRequestInput = {
  customer_name: 'Jane Smith',
  customer_email: 'jane.smith@example.com',
  customer_phone: '123-456-7890',
  cake_description: 'A beautiful three-tier wedding cake with roses',
  occasion: 'Wedding',
  size: 'Large',
  flavor_preferences: 'Vanilla and chocolate',
  design_preferences: 'White with pink roses',
  budget_range: '$300-500',
  required_date: new Date('2024-06-15')
};

describe('getCustomCakeRequestById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return custom cake request by id', async () => {
    // Create a custom cake request first
    const insertResult = await db.insert(customCakeRequestsTable)
      .values({
        customer_name: testInput.customer_name,
        customer_email: testInput.customer_email,
        customer_phone: testInput.customer_phone,
        cake_description: testInput.cake_description,
        occasion: testInput.occasion,
        size: testInput.size,
        flavor_preferences: testInput.flavor_preferences,
        design_preferences: testInput.design_preferences,
        budget_range: testInput.budget_range,
        required_date: testInput.required_date,
        quoted_price: '350.00'
      })
      .returning()
      .execute();

    const createdRequest = insertResult[0];
    const result = await getCustomCakeRequestById(createdRequest.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdRequest.id);
    expect(result!.customer_name).toEqual('Jane Smith');
    expect(result!.customer_email).toEqual('jane.smith@example.com');
    expect(result!.customer_phone).toEqual('123-456-7890');
    expect(result!.cake_description).toEqual('A beautiful three-tier wedding cake with roses');
    expect(result!.occasion).toEqual('Wedding');
    expect(result!.size).toEqual('Large');
    expect(result!.flavor_preferences).toEqual('Vanilla and chocolate');
    expect(result!.design_preferences).toEqual('White with pink roses');
    expect(result!.budget_range).toEqual('$300-500');
    expect(result!.required_date).toEqual(new Date('2024-06-15'));
    expect(result!.status).toEqual('pending');
    expect(result!.quoted_price).toEqual(350.00);
    expect(typeof result!.quoted_price).toBe('number');
    expect(result!.admin_notes).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent id', async () => {
    const result = await getCustomCakeRequestById(999);
    expect(result).toBeNull();
  });

  it('should handle null quoted_price correctly', async () => {
    // Create a custom cake request without quoted_price
    const insertResult = await db.insert(customCakeRequestsTable)
      .values({
        customer_name: testInput.customer_name,
        customer_email: testInput.customer_email,
        customer_phone: testInput.customer_phone,
        cake_description: testInput.cake_description,
        occasion: testInput.occasion,
        size: testInput.size,
        flavor_preferences: testInput.flavor_preferences,
        design_preferences: testInput.design_preferences,
        budget_range: testInput.budget_range,
        required_date: testInput.required_date
      })
      .returning()
      .execute();

    const createdRequest = insertResult[0];
    const result = await getCustomCakeRequestById(createdRequest.id);

    expect(result).not.toBeNull();
    expect(result!.quoted_price).toBeNull();
  });
});
