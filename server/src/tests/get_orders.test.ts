
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { cakesTable, ordersTable, orderItemsTable } from '../db/schema';
import { getOrders } from '../handlers/get_orders';

describe('getOrders', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no orders exist', async () => {
    const result = await getOrders();
    expect(result).toEqual([]);
  });

  it('should return orders with items', async () => {
    // Create test cake
    const [cake] = await db.insert(cakesTable)
      .values({
        name: 'Chocolate Cake',
        description: 'Rich chocolate cake',
        price: '25.99',
        category: 'Chocolate',
        is_available: true
      })
      .returning()
      .execute();

    // Create test order
    const [order] = await db.insert(ordersTable)
      .values({
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        customer_phone: '123-456-7890',
        delivery_address: '123 Main St',
        total_amount: '51.98',
        status: 'pending',
        notes: 'Special delivery instructions'
      })
      .returning()
      .execute();

    // Create order items
    await db.insert(orderItemsTable)
      .values([
        {
          order_id: order.id,
          cake_id: cake.id,
          quantity: 2,
          unit_price: '25.99',
          total_price: '51.98'
        }
      ])
      .execute();

    const result = await getOrders();

    expect(result).toHaveLength(1);

    const orderWithItems = result[0];
    expect(orderWithItems.id).toEqual(order.id);
    expect(orderWithItems.customer_name).toEqual('John Doe');
    expect(orderWithItems.customer_email).toEqual('john@example.com');
    expect(orderWithItems.customer_phone).toEqual('123-456-7890');
    expect(orderWithItems.delivery_address).toEqual('123 Main St');
    expect(orderWithItems.total_amount).toEqual(51.98);
    expect(typeof orderWithItems.total_amount).toBe('number');
    expect(orderWithItems.status).toEqual('pending');
    expect(orderWithItems.notes).toEqual('Special delivery instructions');
    expect(orderWithItems.created_at).toBeInstanceOf(Date);
    expect(orderWithItems.updated_at).toBeInstanceOf(Date);

    expect(orderWithItems.items).toHaveLength(1);
    const item = orderWithItems.items[0];
    expect(item.cake_id).toEqual(cake.id);
    expect(item.cake_name).toEqual('Chocolate Cake');
    expect(item.quantity).toEqual(2);
    expect(item.unit_price).toEqual(25.99);
    expect(typeof item.unit_price).toBe('number');
    expect(item.total_price).toEqual(51.98);
    expect(typeof item.total_price).toBe('number');
  });

  it('should return multiple orders with multiple items', async () => {
    // Create test cakes
    const [cake1] = await db.insert(cakesTable)
      .values({
        name: 'Vanilla Cake',
        description: 'Classic vanilla cake',
        price: '20.00',
        category: 'Vanilla',
        is_available: true
      })
      .returning()
      .execute();

    const [cake2] = await db.insert(cakesTable)
      .values({
        name: 'Strawberry Cake',
        description: 'Fresh strawberry cake',
        price: '30.00',
        category: 'Fruit',
        is_available: true
      })
      .returning()
      .execute();

    // Create test orders
    const [order1] = await db.insert(ordersTable)
      .values({
        customer_name: 'Alice Smith',
        customer_email: 'alice@example.com',
        customer_phone: '555-0123',
        delivery_address: '456 Oak Ave',
        total_amount: '50.00',
        status: 'confirmed'
      })
      .returning()
      .execute();

    const [order2] = await db.insert(ordersTable)
      .values({
        customer_name: 'Bob Johnson',
        customer_email: 'bob@example.com',
        customer_phone: '555-0456',
        delivery_address: '789 Pine St',
        total_amount: '60.00',
        status: 'preparing'
      })
      .returning()
      .execute();

    // Create order items
    await db.insert(orderItemsTable)
      .values([
        {
          order_id: order1.id,
          cake_id: cake1.id,
          quantity: 1,
          unit_price: '20.00',
          total_price: '20.00'
        },
        {
          order_id: order1.id,
          cake_id: cake2.id,
          quantity: 1,
          unit_price: '30.00',
          total_price: '30.00'
        },
        {
          order_id: order2.id,
          cake_id: cake2.id,
          quantity: 2,
          unit_price: '30.00',
          total_price: '60.00'
        }
      ])
      .execute();

    const result = await getOrders();

    expect(result).toHaveLength(2);

    // Find orders by customer name
    const aliceOrder = result.find(o => o.customer_name === 'Alice Smith');
    const bobOrder = result.find(o => o.customer_name === 'Bob Johnson');

    expect(aliceOrder).toBeDefined();
    expect(aliceOrder!.items).toHaveLength(2);
    expect(aliceOrder!.total_amount).toEqual(50.00);
    expect(aliceOrder!.status).toEqual('confirmed');

    expect(bobOrder).toBeDefined();
    expect(bobOrder!.items).toHaveLength(1);
    expect(bobOrder!.total_amount).toEqual(60.00);
    expect(bobOrder!.status).toEqual('preparing');
    expect(bobOrder!.items[0].quantity).toEqual(2);
  });

  it('should handle orders without items', async () => {
    // Create order without items
    const [order] = await db.insert(ordersTable)
      .values({
        customer_name: 'Empty Order',
        customer_email: 'empty@example.com',
        customer_phone: '555-0000',
        delivery_address: '000 Empty St',
        total_amount: '0.00',
        status: 'cancelled'
      })
      .returning()
      .execute();

    const result = await getOrders();

    expect(result).toHaveLength(1);
    expect(result[0].customer_name).toEqual('Empty Order');
    expect(result[0].items).toHaveLength(0);
    expect(result[0].total_amount).toEqual(0.00);
    expect(result[0].status).toEqual('cancelled');
  });
});
