import crypto from 'crypto';
import prisma from '../prisma/client';
import { AppError } from '../middlewares/error.middleware';
import { getDaysInMonth, getStartOfMonth, getEndOfMonth, formatToYYYYMMDD, isDateInMonth } from '../utils/date';
import { DEFAULT_DAILY_RATE, getExceptionPrice, getExceptionDeduction } from '../utils/pricing';

export async function createOrGetShareToken(userId: string, yearParam: number | string, monthParam: number | string) {
  const year = parseInt(String(yearParam), 10);
  const month = parseInt(String(monthParam), 10);

  if (isNaN(year) || year < 2000 || year > 2100) {
    throw new AppError('Invalid year parameter', 400);
  }

  if (isNaN(month) || month < 1 || month > 12) {
    throw new AppError('Invalid month parameter', 400);
  }

  const token = crypto.randomBytes(32).toString('hex');

  const shareRecord = await prisma.monthlyShare.upsert({
    where: {
      userId_year_month: {
        userId,
        year,
        month
      }
    },
    update: {
      token,
      revokedAt: null,
      createdAt: new Date()
    },
    create: {
      userId,
      year,
      month,
      token
    }
  });

  return {
    token: shareRecord.token,
    year: shareRecord.year,
    month: shareRecord.month,
    createdAt: shareRecord.createdAt
  };
}

export async function revokeShareToken(userId: string, yearParam: number | string, monthParam: number | string) {
  const year = parseInt(String(yearParam), 10);
  const month = parseInt(String(monthParam), 10);

  const existing = await prisma.monthlyShare.findUnique({
    where: {
      userId_year_month: {
        userId,
        year,
        month
      }
    }
  });

  if (!existing || existing.revokedAt) {
    throw new AppError('No active share link found to revoke', 404);
  }

  await prisma.monthlyShare.update({
    where: {
      userId_year_month: {
        userId,
        year,
        month
      }
    },
    data: {
      revokedAt: new Date()
    }
  });

  return { message: 'Share link revoked successfully' };
}

export async function getShareStatus(userId: string, yearParam: number | string, monthParam: number | string) {
  const year = parseInt(String(yearParam), 10);
  const month = parseInt(String(monthParam), 10);

  const record = await prisma.monthlyShare.findUnique({
    where: {
      userId_year_month: {
        userId,
        year,
        month
      }
    }
  });

  if (!record || record.revokedAt) {
    return { active: false, token: null };
  }

  return {
    active: true,
    token: record.token,
    createdAt: record.createdAt
  };
}

export async function getPublicMonthlyStatement(token: string) {
  if (!token || typeof token !== 'string') {
    throw new AppError('This share link is no longer available or does not exist', 404);
  }

  const shareRecord = await prisma.monthlyShare.findUnique({
    where: { token },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  if (!shareRecord || shareRecord.revokedAt) {
    throw new AppError('This share link is no longer available or does not exist', 404);
  }

  const { userId, year, month, user } = shareRecord;
  const daysInMonth = getDaysInMonth(year, month);
  const defaultMonthlyAmount = daysInMonth * DEFAULT_DAILY_RATE;

  const startDate = getStartOfMonth(year, month);
  const endDate = getEndOfMonth(year, month);

  // Fetch advance payments
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

  const advancePayments = allPayments.filter((p) => isDateInMonth(p.paymentDate, year, month));
  const totalAdvancePaid = advancePayments.reduce((sum, p) => sum + p.amount, 0);

  const formattedPayments = advancePayments.map((p) => ({
    id: p.id,
    amount: p.amount,
    paymentDate: formatToYYYYMMDD(p.paymentDate),
    note: p.note
  }));

  // Fetch meal exceptions
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

  const mealExceptions = allExceptions.filter((exc) => isDateInMonth(exc.date, year, month));

  let totalDeductions = 0;

  const exceptionsList = mealExceptions.map((exc) => {
    const actualPrice = getExceptionPrice(exc.type);
    const deduction = getExceptionDeduction(exc.type);
    totalDeductions += deduction;

    let statusLabel = 'Exception';
    if (exc.type === 'DINNER_ONLY') statusLabel = 'Dinner only';
    if (exc.type === 'LUNCH_ONLY') statusLabel = 'Lunch only';
    if (exc.type === 'NO_FOOD') statusLabel = 'No food';

    return {
      id: exc.id,
      date: formatToYYYYMMDD(exc.date),
      status: statusLabel,
      type: exc.type,
      normalPrice: DEFAULT_DAILY_RATE,
      actualPrice,
      deduction
    };
  });

  const actualBill = defaultMonthlyAmount - totalDeductions;
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
    residentName: user.name,
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
    payments: formattedPayments,
    exceptions: exceptionsList,
    exceptionDaysCount: exceptionsList.length
  };
}
