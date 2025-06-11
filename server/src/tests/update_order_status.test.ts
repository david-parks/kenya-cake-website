
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ordersTable, cakesTable } from '../db/schema';
import { type UpdateOrderStatusInput, type CreateOrderInput } from '../schema';
import { updateOrderStatus } from '../handlers/update_order_status';
import { eq } from 'drizzle-orm';

describe('updateOrderStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update order status', async () => {
    // Create a test cake first
    const cakeResult = await db.insert(cakesTable)
      .values({
        name: 'Test Cake',
        description: 'A test cake',
        price: '25.99',
        category: 'Birthday',
        is_available: true
      })
      .returning()
      .execute();

    // Create a test order
    const orderResult = await db.insert(ordersTable)
      .values({
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        customer_phone: '123-456-7890',
        delivery_address: '123 Main St',
        total_amount: '25.99',
        status: 'pending',
        notes: 'Test order'
      })
      .returning()
      .execute();

    const testInput: UpdateOrderStatusInput = {
      id: orderResult[0].id,
      status: 'confirmed'
    };

    const result = await updateOrderStatus(testInput);

    // Verify the updated order
    expect(result.id).toEqual(orderResult[0].id);
    expect(result.status).toEqual('confirmed');
    expect(result.customer_name).toEqual('John Doe');
    expect(result.total_amount).toEqual(25.99);
    expect(typeof result.total_amount).toBe('number');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updated status to database', async () => {
    // Create a test cake first
    const cakeResult = await db.insert(cakesTable)
      .values({
        name: 'Test Cake',
        description: 'A test cake',
        price: '25.99',
        category: 'Birthday',
        is_available: true
      })
      .returning()
      .execute();

    // Create a test order
    const orderResult = await db.insert(ordersTable)
      .values({
        customer_name: 'Jane Smith',
        customer_email: 'jane@example.com',
        customer_phone: '987-654-3210',
        delivery_address: '456 Oak Ave',
        total_amount: '35.50',
        status: 'pending',
        notes: null
      })
      .returning()
      .execute();

    const testInput: UpdateOrderStatusInput = {
      id: orderResult[0].id,
      status: 'preparing'
    };

    await updateOrderStatus(testInput);

    // Verify the order was updated in the database
    const orders = await db.select()
      .from(ordersTable)
      .where(eq(ordersTable.id, orderResult[0].id))
      .execute();

    expect(orders).toHaveLength(1);
    expect(orders[0].status).toEqual('preparing');
    expect(orders[0].customer_name).toEqual('Jane Smith');
    expect(orders[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when order not found', async () => {
    const testInput: UpdateOrderStatusInput = {
      id: 999,
      status: 'confirmed'
    };

    await expect(updateOrderStatus(testInput)).rejects.toThrow(/Order with id 999 not found/i);
  });

  it('should update to cancelled status', async () => {
    // Create a test cake first
    const cakeResult = await db.insert(cakesTable)
      .values({
        name: 'Wedding Cake',
        description: 'A beautiful wedding cake',
        price: '150.00',
        category: 'Wedding',
        is_available: true
      })
      .returning()
      .execute();

    // Create a test order
    const orderResult = await db.insert(ordersTable)
      .values({
        customer_name: 'Bob Wilson',
        customer_email: 'bob@example.com',
        customer_phone: '555-123-4567',
        delivery_address: '789 Pine St',
        total_amount: '150.00',
        status: 'confirmed',
        notes: 'Wedding order'
      })
      .returning()
      .execute();

    const testInput: UpdateOrderStatusInput = {
      id: orderResult[0].id,
      status: 'cancelled'
    };

    const result = await updateOrderStatus(testInput);

    expect(result.status).toEqual('cancelled');
    expect(result.customer_name).toEqual('Bob Wilson');
    expect(result.total_amount).toEqual(150.00);
    expect(typeof result.total_amount).toBe('number');
  });
});
