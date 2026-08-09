import { z } from 'zod';

export const MealExceptionTypeEnum = z.enum(['DINNER_ONLY', 'LUNCH_ONLY', 'NO_FOOD'], {
  errorMap: () => ({ message: 'Invalid exception type. Allowed values: DINNER_ONLY, LUNCH_ONLY, NO_FOOD' })
});

export const createExceptionSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format'
  }),
  type: MealExceptionTypeEnum
});

export const updateExceptionSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format'
  }).optional(),
  type: MealExceptionTypeEnum.optional()
});
