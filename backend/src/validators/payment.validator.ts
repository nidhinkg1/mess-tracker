import { z } from 'zod';

export const createPaymentSchema = z.object({
  amount: z.number({ required_error: 'Amount is required', invalid_type_error: 'Amount must be a number' })
    .gt(0, 'Payment amount must be greater than 0'),
  paymentDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid payment date format'
  }),
  note: z.string().optional()
});

export const updatePaymentSchema = createPaymentSchema.partial();
