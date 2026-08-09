import { MealExceptionType } from '@prisma/client';

export const DEFAULT_DAILY_RATE = 115; // Lunch ₹70 + Dinner ₹45 = ₹115

export const EXCEPTION_PRICES: Record<MealExceptionType, number> = {
  DINNER_ONLY: 50, // Dinner only = ₹50
  LUNCH_ONLY: 70,  // Lunch only = ₹70
  NO_FOOD: 0       // No food = ₹0
};

export const EXCEPTION_DEDUCTIONS: Record<MealExceptionType, number> = {
  DINNER_ONLY: DEFAULT_DAILY_RATE - 50, // ₹115 - ₹50 = ₹65 deduction
  LUNCH_ONLY: DEFAULT_DAILY_RATE - 70,  // ₹115 - ₹70 = ₹45 deduction
  NO_FOOD: DEFAULT_DAILY_RATE - 0       // ₹115 - ₹0 = ₹115 deduction
};

export function getExceptionPrice(type: MealExceptionType): number {
  return EXCEPTION_PRICES[type];
}

export function getExceptionDeduction(type: MealExceptionType): number {
  return EXCEPTION_DEDUCTIONS[type];
}
