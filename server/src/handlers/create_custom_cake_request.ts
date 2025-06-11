
import { db } from '../db';
import { customCakeRequestsTable } from '../db/schema';
import { type CreateCustomCakeRequestInput, type CustomCakeRequest } from '../schema';

export const createCustomCakeRequest = async (input: CreateCustomCakeRequestInput): Promise<CustomCakeRequest> => {
  try {
    // Insert custom cake request record
    const result = await db.insert(customCakeRequestsTable)
      .values({
        customer_name: input.customer_name,
        customer_email: input.customer_email,
        customer_phone: input.customer_phone,
        cake_description: input.cake_description,
        occasion: input.occasion,
        size: input.size,
        flavor_preferences: input.flavor_preferences,
        design_preferences: input.design_preferences,
        budget_range: input.budget_range,
        required_date: input.required_date
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const request = result[0];
    return {
      ...request,
      quoted_price: request.quoted_price ? parseFloat(request.quoted_price) : null
    };
  } catch (error) {
    console.error('Custom cake request creation failed:', error);
    throw error;
  }
};
