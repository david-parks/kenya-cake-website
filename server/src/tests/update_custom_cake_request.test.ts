
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customCakeRequestsTable } from '../db/schema';
import { type CreateCustomCakeRequestInput, type UpdateCustomCakeRequestInput } from '../schema';
import { updateCustomCakeRequest } from '../handlers/update_custom_cake_request';
import { eq } from 'drizzle-orm';

// Test input for creating a custom cake request
const testCreateInput: CreateCustomCakeRequestInput = {
  customer_name: 'John Doe',
  customer_email: 'john@example.com',
  customer_phone: '123-456-7890',
  cake_description: 'A beautiful 3-tier wedding cake with vanilla flavor',
  occasion: 'Wedding',
  size: 'Large',
  flavor_preferences: 'Vanilla and chocolate',
  design_preferences: 'Elegant white with roses',
  budget_range: '$500-$800',
  required_date: new Date('2024-12-25')
};

describe('updateCustomCakeRequest', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update custom cake request status', async () => {
    // Create a custom cake request first
    const createResult = await db.insert(customCakeRequestsTable)
      .values({
        ...testCreateInput,
        required_date: testCreateInput.required_date
      })
      .returning()
      .execute();

    const requestId = createResult[0].id;

    // Update the status
    const updateInput: UpdateCustomCakeRequestInput = {
      id: requestId,
      status: 'reviewed'
    };

    const result = await updateCustomCakeRequest(updateInput);

    expect(result.id).toEqual(requestId);
    expect(result.status).toEqual('reviewed');
    expect(result.customer_name).toEqual('John Doe');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update custom cake request with admin notes and quoted price', async () => {
    // Create a custom cake request first
    const createResult = await db.insert(customCakeRequestsTable)
      .values({
        ...testCreateInput,
        required_date: testCreateInput.required_date
      })
      .returning()
      .execute();

    const requestId = createResult[0].id;

    // Update with admin notes and quoted price
    const updateInput: UpdateCustomCakeRequestInput = {
      id: requestId,
      status: 'quoted',
      admin_notes: 'Discussed design details with customer',
      quoted_price: 650.00
    };

    const result = await updateCustomCakeRequest(updateInput);

    expect(result.id).toEqual(requestId);
    expect(result.status).toEqual('quoted');
    expect(result.admin_notes).toEqual('Discussed design details with customer');
    expect(result.quoted_price).toEqual(650.00);
    expect(typeof result.quoted_price).toBe('number');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update custom cake request with null quoted price', async () => {
    // Create a custom cake request with a quoted price first
    const createResult = await db.insert(customCakeRequestsTable)
      .values({
        ...testCreateInput,
        required_date: testCreateInput.required_date,
        quoted_price: '500.00'
      })
      .returning()
      .execute();

    const requestId = createResult[0].id;

    // Update with null quoted price
    const updateInput: UpdateCustomCakeRequestInput = {
      id: requestId,
      status: 'pending',
      quoted_price: null
    };

    const result = await updateCustomCakeRequest(updateInput);

    expect(result.id).toEqual(requestId);
    expect(result.status).toEqual('pending');
    expect(result.quoted_price).toBeNull();
  });

  it('should save updated custom cake request to database', async () => {
    // Create a custom cake request first
    const createResult = await db.insert(customCakeRequestsTable)
      .values({
        ...testCreateInput,
        required_date: testCreateInput.required_date
      })
      .returning()
      .execute();

    const requestId = createResult[0].id;

    // Update the request
    const updateInput: UpdateCustomCakeRequestInput = {
      id: requestId,
      status: 'approved',
      admin_notes: 'Ready to proceed with production',
      quoted_price: 725.50
    };

    await updateCustomCakeRequest(updateInput);

    // Verify the update was saved to database
    const savedRequests = await db.select()
      .from(customCakeRequestsTable)
      .where(eq(customCakeRequestsTable.id, requestId))
      .execute();

    expect(savedRequests).toHaveLength(1);
    const savedRequest = savedRequests[0];
    expect(savedRequest.status).toEqual('approved');
    expect(savedRequest.admin_notes).toEqual('Ready to proceed with production');
    expect(parseFloat(savedRequest.quoted_price!)).toEqual(725.50);
    expect(savedRequest.updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when custom cake request not found', async () => {
    const updateInput: UpdateCustomCakeRequestInput = {
      id: 999,
      status: 'reviewed'
    };

    expect(updateCustomCakeRequest(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should update only provided fields', async () => {
    // Create a custom cake request with initial values
    const createResult = await db.insert(customCakeRequestsTable)
      .values({
        ...testCreateInput,
        required_date: testCreateInput.required_date,
        admin_notes: 'Initial notes',
        quoted_price: '400.00'
      })
      .returning()
      .execute();

    const requestId = createResult[0].id;

    // Update only status (not admin_notes or quoted_price)
    const updateInput: UpdateCustomCakeRequestInput = {
      id: requestId,
      status: 'in_progress'
    };

    const result = await updateCustomCakeRequest(updateInput);

    expect(result.id).toEqual(requestId);
    expect(result.status).toEqual('in_progress');
    expect(result.admin_notes).toEqual('Initial notes'); // Should remain unchanged
    expect(result.quoted_price).toEqual(400.00); // Should remain unchanged
  });
});
