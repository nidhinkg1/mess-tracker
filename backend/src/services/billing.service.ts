import prisma from '../prisma/client';
import { AppError } from '../middlewares/error.middleware';
import { getDaysInMonth, getStartOfMonth, getEndOfMonth, formatToYYYYMMDD, isDateInMonth } from '../utils/date';
import { DEFAULT_DAILY_RATE, getExceptionPrice, getExceptionDeduction } from '../utils/pricing';

export interface MonthlyBillingSummary {
  year: number;
  month: number;
  daysInMonth: number;
  defaultDailyRate: number;
  defaultMonthlyAmount: number;
  totalDeductions: number;
  actualBill: number;
  totalAdvancePaid: number;
  netResult: number;
  amountDue: number;
  remainingAdvance: number;
  status: 'DUE' | 'SURPLUS' | 'FULLY_PAID';
  exceptionDaysCount: number;
  exceptions: Array<{
    id: string;
    date: string;
    type: string;
    normalPrice: number;
    actualPrice: number;
    deduction: number;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    paymentDate: string;
    note: string | null;
  }>;
}

export async function calculateMonthlyBilling(
  userId: string,
  yearParam: string | number,
  monthParam: string | number
): Promise<MonthlyBillingSummary> {
  const year = parseInt(String(yearParam), 10);
  const month = parseInt(String(monthParam), 10);

  if (isNaN(year) || year < 2000 || year > 2100) {
    throw new AppError('Invalid year parameter', 400);
  }

  if (isNaN(month) || month < 1 || month > 12) {
    throw new AppError('Invalid month parameter (must be 1-12)', 400);
  }

  // Calculate days in the selected month
  const daysInMonth = getDaysInMonth(year, month);
  const defaultMonthlyAmount = daysInMonth * DEFAULT_DAILY_RATE;

  // Month date boundary with timezone buffer
  const startDate = getStartOfMonth(year, month);
  const endDate = getEndOfMonth(year, month);

  // Fetch meal exceptions for this user in the specified month range
  const allExceptions = await prisma.mealException.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: { date: 'asc' }
  });

  // Strictly filter exceptions belonging to year & month
  const mealExceptions = allExceptions.filter((exc) => isDateInMonth(exc.date, year, month));

  let totalDeductions = 0;

  const formattedExceptions = mealExceptions.map((exc) => {
    const actualPrice = getExceptionPrice(exc.type);
    const deduction = getExceptionDeduction(exc.type);
    totalDeductions += deduction;

    return {
      id: exc.id,
      date: formatToYYYYMMDD(exc.date),
      type: exc.type,
      normalPrice: DEFAULT_DAILY_RATE,
      actualPrice,
      deduction
    };
  });

  const actualBill = defaultMonthlyAmount - totalDeductions;

  // Fetch advance payments for this user in the specified month range
  const allPayments = await prisma.advancePayment.findMany({
    where: {
      userId,
      paymentDate: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: { paymentDate: 'asc' }
  });

  // Strictly filter payments belonging to year & month
  const advancePayments = allPayments.filter((p) => isDateInMonth(p.paymentDate, year, month));

  const totalAdvancePaid = advancePayments.reduce((sum, p) => sum + p.amount, 0);

  const formattedPayments = advancePayments.map((p) => ({
    id: p.id,
    amount: p.amount,
    paymentDate: formatToYYYYMMDD(p.paymentDate),
    note: p.note
  }));

  // Net Result = Actual Bill - Total Advance
  const netResult = actualBill - totalAdvancePaid;

  let amountDue = 0;
  let remainingAdvance = 0;
  let status: 'DUE' | 'SURPLUS' | 'FULLY_PAID' = 'FULLY_PAID';

  if (netResult > 0) {
    amountDue = netResult;
    status = 'DUE';
  } else if (netResult < 0) {
    remainingAdvance = Math.abs(netResult);
    status = 'SURPLUS';
  }

  return {
    year,
    month,
    daysInMonth,
    defaultDailyRate: DEFAULT_DAILY_RATE,
    defaultMonthlyAmount,
    totalDeductions,
    actualBill,
    totalAdvancePaid,
    netResult,
    amountDue,
    remainingAdvance,
    status,
    exceptionDaysCount: formattedExceptions.length,
    exceptions: formattedExceptions,
    payments: formattedPayments
  };
}
