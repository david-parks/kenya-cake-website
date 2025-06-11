
import { z } from 'zod';

// Cake schema
export const cakeSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  image_url: z.string().nullable(),
  price: z.number(),
  category: z.string(),
  is_available: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Cake = z.infer<typeof cakeSchema>;

// Order schema
export const orderSchema = z.object({
  id: z.number(),
  customer_name: z.string(),
  customer_email: z.string(),
  customer_phone: z.string(),
  delivery_address: z.string(),
  total_amount: z.number(),
  status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']),
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Order = z.infer<typeof orderSchema>;

// Order item schema
export const orderItemSchema = z.object({
  id: z.number(),
  order_id: z.number(),
  cake_id: z.number(),
  quantity: z.number().int(),
  unit_price: z.number(),
  total_price: z.number()
});

export type OrderItem = z.infer<typeof orderItemSchema>;

// Custom cake request schema
export const customCakeRequestSchema = z.object({
  id: z.number(),
  customer_name: z.string(),
  customer_email: z.string(),
  customer_phone: z.string(),
  cake_description: z.string(),
  occasion: z.string().nullable(),
  size: z.string().nullable(),
  flavor_preferences: z.string().nullable(),
  design_preferences: z.string().nullable(),
  budget_range: z.string().nullable(),
  required_date: z.coerce.date().nullable(),
  status: z.enum(['pending', 'reviewed', 'quoted', 'approved', 'in_progress', 'completed', 'cancelled']),
  admin_notes: z.string().nullable(),
  quoted_price: z.number().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type CustomCakeRequest = z.infer<typeof customCakeRequestSchema>;

// Input schemas for creating records
export const createCakeInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  image_url: z.string().url().nullable(),
  price: z.number().positive(),
  category: z.string().min(1),
  is_available: z.boolean().default(true)
});

export type CreateCakeInput = z.infer<typeof createCakeInputSchema>;

export const updateCakeInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  image_url: z.string().url().nullable().optional(),
  price: z.number().positive().optional(),
  category: z.string().min(1).optional(),
  is_available: z.boolean().optional()
});

export type UpdateCakeInput = z.infer<typeof updateCakeInputSchema>;

export const createOrderInputSchema = z.object({
  customer_name: z.string().min(1),
  customer_email: z.string().email(),
  customer_phone: z.string().min(1),
  delivery_address: z.string().min(1),
  notes: z.string().nullable(),
  items: z.array(z.object({
    cake_id: z.number(),
    quantity: z.number().int().positive()
  })).min(1)
});

export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;

export const updateOrderStatusInputSchema = z.object({
  id: z.number(),
  status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'])
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusInputSchema>;

export const createCustomCakeRequestInputSchema = z.object({
  customer_name: z.string().min(1),
  customer_email: z.string().email(),
  customer_phone: z.string().min(1),
  cake_description: z.string().min(10),
  occasion: z.string().nullable(),
  size: z.string().nullable(),
  flavor_preferences: z.string().nullable(),
  design_preferences: z.string().nullable(),
  budget_range: z.string().nullable(),
  required_date: z.coerce.date().nullable()
});

export type CreateCustomCakeRequestInput = z.infer<typeof createCustomCakeRequestInputSchema>;

export const updateCustomCakeRequestInputSchema = z.object({
  id: z.number(),
  status: z.enum(['pending', 'reviewed', 'quoted', 'approved', 'in_progress', 'completed', 'cancelled']),
  admin_notes: z.string().nullable().optional(),
  quoted_price: z.number().positive().nullable().optional()
});

export type UpdateCustomCakeRequestInput = z.infer<typeof updateCustomCakeRequestInputSchema>;

// Order with items schema for detailed order view
export const orderWithItemsSchema = z.object({
  id: z.number(),
  customer_name: z.string(),
  customer_email: z.string(),
  customer_phone: z.string(),
  delivery_address: z.string(),
  total_amount: z.number(),
  status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']),
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  items: z.array(z.object({
    id: z.number(),
    cake_id: z.number(),
    cake_name: z.string(),
    quantity: z.number(),
    unit_price: z.number(),
    total_price: z.number()
  }))
});

export type OrderWithItems = z.infer<typeof orderWithItemsSchema>;
