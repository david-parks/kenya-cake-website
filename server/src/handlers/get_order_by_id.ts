
import { type OrderWithItems } from '../schema';

export declare function getOrderById(id: number): Promise<OrderWithItems | null>;
