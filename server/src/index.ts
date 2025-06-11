
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createCakeInputSchema,
  updateCakeInputSchema,
  createOrderInputSchema,
  updateOrderStatusInputSchema,
  createCustomCakeRequestInputSchema,
  updateCustomCakeRequestInputSchema
} from './schema';

// Import handlers
import { getCakes } from './handlers/get_cakes';
import { getCakeById } from './handlers/get_cake_by_id';
import { createCake } from './handlers/create_cake';
import { updateCake } from './handlers/update_cake';
import { deleteCake } from './handlers/delete_cake';
import { getCakesByCategory } from './handlers/get_cakes_by_category';
import { getAvailableCakes } from './handlers/get_available_cakes';
import { getCakeCategories } from './handlers/get_cake_categories';
import { createOrder } from './handlers/create_order';
import { getOrders } from './handlers/get_orders';
import { getOrderById } from './handlers/get_order_by_id';
import { updateOrderStatus } from './handlers/update_order_status';
import { createCustomCakeRequest } from './handlers/create_custom_cake_request';
import { getCustomCakeRequests } from './handlers/get_custom_cake_requests';
import { getCustomCakeRequestById } from './handlers/get_custom_cake_request_by_id';
import { updateCustomCakeRequest } from './handlers/update_custom_cake_request';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Cake management routes
  getCakes: publicProcedure
    .query(() => getCakes()),
  
  getCakeById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getCakeById(input.id)),
  
  createCake: publicProcedure
    .input(createCakeInputSchema)
    .mutation(({ input }) => createCake(input)),
  
  updateCake: publicProcedure
    .input(updateCakeInputSchema)
    .mutation(({ input }) => updateCake(input)),
  
  deleteCake: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteCake(input.id)),
  
  getCakesByCategory: publicProcedure
    .input(z.object({ category: z.string() }))
    .query(({ input }) => getCakesByCategory(input.category)),
  
  getAvailableCakes: publicProcedure
    .query(() => getAvailableCakes()),
  
  getCakeCategories: publicProcedure
    .query(() => getCakeCategories()),

  // Order management routes
  createOrder: publicProcedure
    .input(createOrderInputSchema)
    .mutation(({ input }) => createOrder(input)),
  
  getOrders: publicProcedure
    .query(() => getOrders()),
  
  getOrderById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getOrderById(input.id)),
  
  updateOrderStatus: publicProcedure
    .input(updateOrderStatusInputSchema)
    .mutation(({ input }) => updateOrderStatus(input)),

  // Custom cake request routes
  createCustomCakeRequest: publicProcedure
    .input(createCustomCakeRequestInputSchema)
    .mutation(({ input }) => createCustomCakeRequest(input)),
  
  getCustomCakeRequests: publicProcedure
    .query(() => getCustomCakeRequests()),
  
  getCustomCakeRequestById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getCustomCakeRequestById(input.id)),
  
  updateCustomCakeRequest: publicProcedure
    .input(updateCustomCakeRequestInputSchema)
    .mutation(({ input }) => updateCustomCakeRequest(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
