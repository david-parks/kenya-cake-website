
import { serial, text, pgTable, timestamp, numeric, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const orderStatusEnum = pgEnum('order_status', [
  'pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'
]);

export const customRequestStatusEnum = pgEnum('custom_request_status', [
  'pending', 'reviewed', 'quoted', 'approved', 'in_progress', 'completed', 'cancelled'
]);

// Tables
export const cakesTable = pgTable('cakes', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  image_url: text('image_url'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  category: text('category').notNull(),
  is_available: boolean('is_available').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const ordersTable = pgTable('orders', {
  id: serial('id').primaryKey(),
  customer_name: text('customer_name').notNull(),
  customer_email: text('customer_email').notNull(),
  customer_phone: text('customer_phone').notNull(),
  delivery_address: text('delivery_address').notNull(),
  total_amount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  status: orderStatusEnum('status').notNull().default('pending'),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const orderItemsTable = pgTable('order_items', {
  id: serial('id').primaryKey(),
  order_id: integer('order_id').notNull().references(() => ordersTable.id, { onDelete: 'cascade' }),
  cake_id: integer('cake_id').notNull().references(() => cakesTable.id),
  quantity: integer('quantity').notNull(),
  unit_price: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  total_price: numeric('total_price', { precision: 10, scale: 2 }).notNull(),
});

export const customCakeRequestsTable = pgTable('custom_cake_requests', {
  id: serial('id').primaryKey(),
  customer_name: text('customer_name').notNull(),
  customer_email: text('customer_email').notNull(),
  customer_phone: text('customer_phone').notNull(),
  cake_description: text('cake_description').notNull(),
  occasion: text('occasion'),
  size: text('size'),
  flavor_preferences: text('flavor_preferences'),
  design_preferences: text('design_preferences'),
  budget_range: text('budget_range'),
  required_date: timestamp('required_date'),
  status: customRequestStatusEnum('status').notNull().default('pending'),
  admin_notes: text('admin_notes'),
  quoted_price: numeric('quoted_price', { precision: 10, scale: 2 }),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const ordersRelations = relations(ordersTable, ({ many }) => ({
  items: many(orderItemsTable),
}));

export const orderItemsRelations = relations(orderItemsTable, ({ one }) => ({
  order: one(ordersTable, {
    fields: [orderItemsTable.order_id],
    references: [ordersTable.id],
  }),
  cake: one(cakesTable, {
    fields: [orderItemsTable.cake_id],
    references: [cakesTable.id],
  }),
}));

export const cakesRelations = relations(cakesTable, ({ many }) => ({
  orderItems: many(orderItemsTable),
}));

// Export all tables for proper query building
export const tables = {
  cakes: cakesTable,
  orders: ordersTable,
  orderItems: orderItemsTable,
  customCakeRequests: customCakeRequestsTable,
};

// TypeScript types for the table schemas
export type Cake = typeof cakesTable.$inferSelect;
export type NewCake = typeof cakesTable.$inferInsert;
export type Order = typeof ordersTable.$inferSelect;
export type NewOrder = typeof ordersTable.$inferInsert;
export type OrderItem = typeof orderItemsTable.$inferSelect;
export type NewOrderItem = typeof orderItemsTable.$inferInsert;
export type CustomCakeRequest = typeof customCakeRequestsTable.$inferSelect;
export type NewCustomCakeRequest = typeof customCakeRequestsTable.$inferInsert;
