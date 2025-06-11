
import { db } from '../db';
import { ordersTable, orderItemsTable, cakesTable } from '../db/schema';
import { type OrderWithItems } from '../schema';
import { eq } from 'drizzle-orm';

export const getOrderById = async (id: number): Promise<OrderWithItems | null> => {
  try {
    // First get the order
    const orders = await db.select()
      .from(ordersTable)
      .where(eq(ordersTable.id, id))
      .execute();

    if (orders.length === 0) {
      return null;
    }

    const order = orders[0];

    // Get order items with cake details
    const orderItems = await db.select({
      id: orderItemsTable.id,
      cake_id: orderItemsTable.cake_id,
      quantity: orderItemsTable.quantity,
      unit_price: orderItemsTable.unit_price,
      total_price: orderItemsTable.total_price,
      cake_name: cakesTable.name,
    })
      .from(orderItemsTable)
      .innerJoin(cakesTable, eq(orderItemsTable.cake_id, cakesTable.id))
      .where(eq(orderItemsTable.order_id, id))
      .execute();

    // Convert numeric fields and build the response
    return {
      id: order.id,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      customer_phone: order.customer_phone,
      delivery_address: order.delivery_address,
      total_amount: parseFloat(order.total_amount),
      status: order.status,
      notes: order.notes,
      created_at: order.created_at,
      updated_at: order.updated_at,
      items: orderItems.map(item => ({
        id: item.id,
        cake_id: item.cake_id,
        cake_name: item.cake_name,
        quantity: item.quantity,
        unit_price: parseFloat(item.unit_price),
        total_price: parseFloat(item.total_price)
      }))
    };
  } catch (error) {
    console.error('Get order by ID failed:', error);
    throw error;
  }
};
