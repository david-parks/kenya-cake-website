
import { db } from '../db';
import { cakesTable, ordersTable, orderItemsTable } from '../db/schema';
import { type CreateOrderInput, type OrderWithItems } from '../schema';
import { eq, inArray } from 'drizzle-orm';

export const createOrder = async (input: CreateOrderInput): Promise<OrderWithItems> => {
  try {
    // Get unique cake IDs from order items
    const cakeIds = [...new Set(input.items.map(item => item.cake_id))];
    
    // Fetch cake information and validate availability
    const cakes = await db.select()
      .from(cakesTable)
      .where(inArray(cakesTable.id, cakeIds))
      .execute();

    // Check if all cakes exist and are available
    for (const item of input.items) {
      const cake = cakes.find(c => c.id === item.cake_id);
      if (!cake) {
        throw new Error(`Cake with ID ${item.cake_id} not found`);
      }
      if (!cake.is_available) {
        throw new Error(`Cake "${cake.name}" is not available`);
      }
    }

    // Calculate total amount
    let totalAmount = 0;
    const orderItemsData = input.items.map(item => {
      const cake = cakes.find(c => c.id === item.cake_id)!;
      const unitPrice = parseFloat(cake.price);
      const totalPrice = unitPrice * item.quantity;
      totalAmount += totalPrice;

      return {
        cake_id: item.cake_id,
        quantity: item.quantity,
        unit_price: unitPrice.toString(),
        total_price: totalPrice.toString()
      };
    });

    // Create the order
    const orderResult = await db.insert(ordersTable)
      .values({
        customer_name: input.customer_name,
        customer_email: input.customer_email,
        customer_phone: input.customer_phone,
        delivery_address: input.delivery_address,
        total_amount: totalAmount.toString(),
        notes: input.notes
      })
      .returning()
      .execute();

    const order = orderResult[0];

    // Create order items
    const orderItemsWithOrderId = orderItemsData.map(item => ({
      ...item,
      order_id: order.id
    }));

    const orderItemsResult = await db.insert(orderItemsTable)
      .values(orderItemsWithOrderId)
      .returning()
      .execute();

    // Build the response with items including cake names
    const itemsWithCakeNames = orderItemsResult.map(orderItem => {
      const cake = cakes.find(c => c.id === orderItem.cake_id)!;
      return {
        id: orderItem.id,
        cake_id: orderItem.cake_id,
        cake_name: cake.name,
        quantity: orderItem.quantity,
        unit_price: parseFloat(orderItem.unit_price),
        total_price: parseFloat(orderItem.total_price)
      };
    });

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
      items: itemsWithCakeNames
    };
  } catch (error) {
    console.error('Order creation failed:', error);
    throw error;
  }
};
