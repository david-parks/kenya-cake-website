
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { cakesTable, ordersTable, orderItemsTable } from '../db/schema';
import { getOrderById } from '../handlers/get_order_by_id';

describe('getOrderById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null for non-existent order', async () => {
    const result = await getOrderById(999);
    expect(result).toBeNull();
  });

  it('should return order with items', async () => {
    // Create test cake
    const cakeResult = await db.insert(cakesTable)
      .values({
        name: 'Chocolate Cake',
        description: 'Rich chocolate cake',
        price: '25.99',
        category: 'chocolate',
        is_available: true
      })
      .returning()
      .execute();

    const cake = cakeResult[0];

    // Create test order
    const orderResult = await db.insert(ordersTable)
      .values({
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        customer_phone: '555-1234',
        delivery_address: '123 Main St',
        total_amount: '51.98',
        status: 'pending',
        notes: 'Test order'
      })
      .returning()
      .execute();

    const order = orderResult[0];

    // Create order items
    await db.insert(orderItemsTable)
      .values({
        order_id: order.id,
        cake_id: cake.id,
        quantity: 2,
        unit_price: '25.99',
        total_price: '51.98'
      })
      .execute();

    const result = await getOrderById(order.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(order.id);
    expect(result!.customer_name).toEqual('John Doe');
    expect(result!.customer_email).toEqual('john@example.com');
    expect(result!.customer_phone).toEqual('555-1234');
    expect(result!.delivery_address).toEqual('123 Main St');
    expect(result!.total_amount).toEqual(51.98);
    expect(typeof result!.total_amount).toBe('number');
    expect(result!.status).toEqual('pending');
    expect(result!.notes).toEqual('Test order');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);

    expect(result!.items).toHaveLength(1);
    expect(result!.items[0].id).toBeDefined();
    expect(result!.items[0].cake_id).toEqual(cake.id);
    expect(result!.items[0].cake_name).toEqual('Chocolate Cake');
    expect(result!.items[0].quantity).toEqual(2);
    expect(result!.items[0].unit_price).toEqual(25.99);
    expect(typeof result!.items[0].unit_price).toBe('number');
    expect(result!.items[0].total_price).toEqual(51.98);
    expect(typeof result!.items[0].total_price).toBe('number');
  });

  it('should return order with multiple items', async () => {
    // Create test cakes
    const cake1Result = await db.insert(cakesTable)
      .values({
        name: 'Vanilla Cake',
        description: 'Classic vanilla cake',
        price: '20.00',
        category: 'vanilla',
        is_available: true
      })
      .returning()
      .execute();

    const cake2Result = await db.insert(cakesTable)
      .values({
        name: 'Strawberry Cake',
        description: 'Fresh strawberry cake',
        price: '30.00',
        category: 'fruit',
        is_available: true
      })
      .returning()
      .execute();

    const cake1 = cake1Result[0];
    const cake2 = cake2Result[0];

    // Create test order
    const orderResult = await db.insert(ordersTable)
      .values({
        customer_name: 'Jane Smith',
        customer_email: 'jane@example.com',
        customer_phone: '555-5678',
        delivery_address: '456 Oak Ave',
        total_amount: '80.00',
        status: 'confirmed',
        notes: null
      })
      .returning()
      .execute();

    const order = orderResult[0];

    // Create multiple order items
    await db.insert(orderItemsTable)
      .values([
        {
          order_id: order.id,
          cake_id: cake1.id,
          quantity: 1,
          unit_price: '20.00',
          total_price: '20.00'
        },
        {
          order_id: order.id,
          cake_id: cake2.id,
          quantity: 2,
          unit_price: '30.00',
          total_price: '60.00'
        }
      ])
      .execute();

    const result = await getOrderById(order.id);

    expect(result).not.toBeNull();
    expect(result!.items).toHaveLength(2);

    // Check items are properly loaded
    const vanillaItem = result!.items.find(item => item.cake_name === 'Vanilla Cake');
    const strawberryItem = result!.items.find(item => item.cake_name === 'Strawberry Cake');

    expect(vanillaItem).toBeDefined();
    expect(vanillaItem!.quantity).toEqual(1);
    expect(vanillaItem!.unit_price).toEqual(20.00);
    expect(vanillaItem!.total_price).toEqual(20.00);

    expect(strawberryItem).toBeDefined();
    expect(strawberryItem!.quantity).toEqual(2);
    expect(strawberryItem!.unit_price).toEqual(30.00);
    expect(strawberryItem!.total_price).toEqual(60.00);
  });

  it('should return order with empty items array when no items exist', async () => {
    // Create test order without items
    const orderResult = await db.insert(ordersTable)
      .values({
        customer_name: 'Empty Order',
        customer_email: 'empty@example.com',
        customer_phone: '555-0000',
        delivery_address: '789 Pine St',
        total_amount: '0.00',
        status: 'pending',
        notes: null
      })
      .returning()
      .execute();

    const order = orderResult[0];

    const result = await getOrderById(order.id);

    expect(result).not.toBeNull();
    expect(result!.items).toHaveLength(0);
    expect(result!.customer_name).toEqual('Empty Order');
    expect(result!.total_amount).toEqual(0.00);
  });
});
