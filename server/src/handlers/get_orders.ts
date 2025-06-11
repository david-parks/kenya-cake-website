
import { db } from '../db';
import { ordersTable, orderItemsTable, cakesTable } from '../db/schema';
import { type OrderWithItems } from '../schema';
import { eq } from 'drizzle-orm';

export const getOrders = async (): Promise<OrderWithItems[]> => {
  try {
    // Get all orders with their items and cake details
    const results = await db.select({
      // Order fields
      order_id: ordersTable.id,
      customer_name: ordersTable.customer_name,
      customer_email: ordersTable.customer_email,
      customer_phone: ordersTable.customer_phone,
      delivery_address: ordersTable.delivery_address,
      total_amount: ordersTable.total_amount,
      status: ordersTable.status,
      notes: ordersTable.notes,
      created_at: ordersTable.created_at,
      updated_at: ordersTable.updated_at,
      // Order item fields
      item_id: orderItemsTable.id,
      cake_id: orderItemsTable.cake_id,
      quantity: orderItemsTable.quantity,
      unit_price: orderItemsTable.unit_price,
      item_total_price: orderItemsTable.total_price,
      // Cake fields
      cake_name: cakesTable.name,
    })
    .from(ordersTable)
    .leftJoin(orderItemsTable, eq(ordersTable.id, orderItemsTable.order_id))
    .leftJoin(cakesTable, eq(orderItemsTable.cake_id, cakesTable.id))
    .execute();

    // Group results by order ID and convert numeric fields
    const ordersMap = new Map<number, OrderWithItems>();

    for (const row of results) {
      const orderId = row.order_id;

      if (!ordersMap.has(orderId)) {
        // Create new order entry
        ordersMap.set(orderId, {
          id: orderId,
          customer_name: row.customer_name,
          customer_email: row.customer_email,
          customer_phone: row.customer_phone,
          delivery_address: row.delivery_address,
          total_amount: parseFloat(row.total_amount), // Convert numeric to number
          status: row.status,
          notes: row.notes,
          created_at: row.created_at,
          updated_at: row.updated_at,
          items: []
        });
      }

      // Add order item if it exists (leftJoin might return null for orders without items)
      if (row.item_id && row.cake_name) {
        const order = ordersMap.get(orderId)!;
        order.items.push({
          id: row.item_id,
          cake_id: row.cake_id!,
          cake_name: row.cake_name,
          quantity: row.quantity!,
          unit_price: parseFloat(row.unit_price!), // Convert numeric to number
          total_price: parseFloat(row.item_total_price!) // Convert numeric to number
        });
      }
    }

    return Array.from(ordersMap.values());
  } catch (error) {
    console.error('Failed to get orders:', error);
    throw error;
  }
};
