
import { type CreateOrderInput, type OrderWithItems } from '../schema';

export declare function createOrder(input: CreateOrderInput): Promise<OrderWithItems>;
