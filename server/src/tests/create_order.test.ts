
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { cakesTable, ordersTable, orderItemsTable } from '../db/schema';
import { type CreateOrderInput } from '../schema';
import { createOrder } from '../handlers/create_order';
import { eq } from 'drizzle-orm';

const testCakeData = {
  name: 'Chocolate Cake',
  description: 'Rich chocolate cake',
  image_url: 'https://example.com/cake.jpg',
  price: '25.99',
  category: 'chocolate',
  is_available: true
};

const testOrderInput: CreateOrderInput = {
  customer_name: 'John Doe',
  customer_email: 'john@example.com',
  customer_phone: '555-1234',
  delivery_address: '123 Main St, City, State 12345',
  notes: 'Please ring doorbell',
  items: [
    {
      cake_id: 1,
      quantity: 2
    }
  ]
};

describe('createOrder', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an order with items', async () => {
    // Create a test cake first
    const cakeResult = await db.insert(cakesTable)
      .values(testCakeData)
      .returning()
      .execute();

    const cake = cakeResult[0];
    const inputWithValidCakeId = {
      ...testOrderInput,
      items: [{ cake_id: cake.id, quantity: 2 }]
    };

    const result = await createOrder(inputWithValidCakeId);

    // Validate order fields
    expect(result.customer_name).toEqual('John Doe');
    expect(result.customer_email).toEqual('john@example.com');
    expect(result.customer_phone).toEqual('555-1234');
    expect(result.delivery_address).toEqual('123 Main St, City, State 12345');
    expect(result.notes).toEqual('Please ring doorbell');
    expect(result.status).toEqual('pending');
    expect(result.total_amount).toEqual(51.98); // 25.99 * 2
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Validate order items
    expect(result.items).toHaveLength(1);
    expect(result.items[0].cake_id).toEqual(cake.id);
    expect(result.items[0].cake_name).toEqual('Chocolate Cake');
    expect(result.items[0].quantity).toEqual(2);
    expect(result.items[0].unit_price).toEqual(25.99);
    expect(result.items[0].total_price).toEqual(51.98);
    expect(result.items[0].id).toBeDefined();
  });

  it('should save order and items to database', async () => {
    // Create a test cake first
    const cakeResult = await db.insert(cakesTable)
      .values(testCakeData)
      .returning()
      .execute();

    const cake = cakeResult[0];
    const inputWithValidCakeId = {
      ...testOrderInput,
      items: [{ cake_id: cake.id, quantity: 2 }]
    };

    const result = await createOrder(inputWithValidCakeId);

    // Verify order was saved
    const orders = await db.select()
      .from(ordersTable)
      .where(eq(ordersTable.id, result.id))
      .execute();

    expect(orders).toHaveLength(1);
    expect(orders[0].customer_name).toEqual('John Doe');
    expect(parseFloat(orders[0].total_amount)).toEqual(51.98);

    // Verify order items were saved
    const orderItems = await db.select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.order_id, result.id))
      .execute();

    expect(orderItems).toHaveLength(1);
    expect(orderItems[0].cake_id).toEqual(cake.id);
    expect(orderItems[0].quantity).toEqual(2);
    expect(parseFloat(orderItems[0].unit_price)).toEqual(25.99);
    expect(parseFloat(orderItems[0].total_price)).toEqual(51.98);
  });

  it('should handle multiple different cakes in one order', async () => {
    // Create two test cakes
    const cake1Result = await db.insert(cakesTable)
      .values({
        ...testCakeData,
        name: 'Chocolate Cake',
        price: '25.99'
      })
      .returning()
      .execute();

    const cake2Result = await db.insert(cakesTable)
      .values({
        ...testCakeData,
        name: 'Vanilla Cake',
        price: '22.50'
      })
      .returning()
      .execute();

    const cake1 = cake1Result[0];
    const cake2 = cake2Result[0];

    const multiItemInput: CreateOrderInput = {
      ...testOrderInput,
      items: [
        { cake_id: cake1.id, quantity: 1 },
        { cake_id: cake2.id, quantity: 3 }
      ]
    };

    const result = await createOrder(multiItemInput);

    // Total should be: (25.99 * 1) + (22.50 * 3) = 93.49
    expect(result.total_amount).toEqual(93.49);
    expect(result.items).toHaveLength(2);

    // Check first item
    const item1 = result.items.find(item => item.cake_id === cake1.id);
    expect(item1).toBeDefined();
    expect(item1!.cake_name).toEqual('Chocolate Cake');
    expect(item1!.quantity).toEqual(1);
    expect(item1!.unit_price).toEqual(25.99);
    expect(item1!.total_price).toEqual(25.99);

    // Check second item
    const item2 = result.items.find(item => item.cake_id === cake2.id);
    expect(item2).toBeDefined();
    expect(item2!.cake_name).toEqual('Vanilla Cake');
    expect(item2!.quantity).toEqual(3);
    expect(item2!.unit_price).toEqual(22.50);
    expect(item2!.total_price).toEqual(67.50);
  });

  it('should throw error for non-existent cake', async () => {
    const inputWithInvalidCakeId = {
      ...testOrderInput,
      items: [{ cake_id: 999, quantity: 1 }]
    };

    await expect(createOrder(inputWithInvalidCakeId)).rejects.toThrow(/cake with id 999 not found/i);
  });

  it('should throw error for unavailable cake', async () => {
    // Create an unavailable cake
    const cakeResult = await db.insert(cakesTable)
      .values({
        ...testCakeData,
        is_available: false
      })
      .returning()
      .execute();

    const cake = cakeResult[0];
    const inputWithUnavailableCake = {
      ...testOrderInput,
      items: [{ cake_id: cake.id, quantity: 1 }]
    };

    await expect(createOrder(inputWithUnavailableCake)).rejects.toThrow(/is not available/i);
  });
});
