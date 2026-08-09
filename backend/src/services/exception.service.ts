import { MealExceptionType } from '@prisma/client';
import prisma from '../prisma/client';
import { AppError } from '../middlewares/error.middleware';
import { getExceptionPrice, getExceptionDeduction, DEFAULT_DAILY_RATE } from '../utils/pricing';
import { parseAsUTCDate, formatToYYYYMMDD } from '../utils/date';

export async function createException(
  userId: string,
  data: { date: string; type: MealExceptionType }
) {
  const normalizedDate = parseAsUTCDate(data.date);

  // Check if an exception already exists for this user and date
  const existing = await prisma.mealException.findUnique({
    where: {
      userId_date: {
        userId,
        date: normalizedDate
      }
    }
  });

  if (existing) {
    throw new AppError(
      `A meal exception already exists for date ${formatToYYYYMMDD(normalizedDate)}`,
      409
    );
  }

  const exception = await prisma.mealException.create({
    data: {
      userId,
      date: normalizedDate,
      type: data.type
    }
  });

  const price = getExceptionPrice(exception.type);
  const deduction = getExceptionDeduction(exception.type);

  return {
    ...exception,
    formattedDate: formatToYYYYMMDD(exception.date),
    normalDailyPrice: DEFAULT_DAILY_RATE,
    actualPrice: price,
    deduction: deduction
  };
}

export async function getUserExceptions(userId: string) {
  const exceptions = await prisma.mealException.findMany({
    where: { userId },
    orderBy: { date: 'asc' }
  });

  return exceptions.map((exc) => {
    const price = getExceptionPrice(exc.type);
    const deduction = getExceptionDeduction(exc.type);
    return {
      ...exc,
      formattedDate: formatToYYYYMMDD(exc.date),
      normalDailyPrice: DEFAULT_DAILY_RATE,
      actualPrice: price,
      deduction: deduction
    };
  });
}

export async function getExceptionById(userId: string, exceptionId: string) {
  const exception = await prisma.mealException.findUnique({
    where: { id: exceptionId }
  });

  if (!exception) {
    throw new AppError('Meal exception record not found', 404);
  }

  if (exception.userId !== userId) {
    throw new AppError('Unauthorized access to meal exception record', 403);
  }

  const price = getExceptionPrice(exception.type);
  const deduction = getExceptionDeduction(exception.type);

  return {
    ...exception,
    formattedDate: formatToYYYYMMDD(exception.date),
    normalDailyPrice: DEFAULT_DAILY_RATE,
    actualPrice: price,
    deduction: deduction
  };
}

export async function updateException(
  userId: string,
  exceptionId: string,
  data: { date?: string; type?: MealExceptionType }
) {
  const existing = await getExceptionById(userId, exceptionId);

  let newDate = existing.date;
  if (data.date) {
    newDate = parseAsUTCDate(data.date);
    // If date changed, verify no conflict with another record
    if (formatToYYYYMMDD(newDate) !== formatToYYYYMMDD(existing.date)) {
      const duplicate = await prisma.mealException.findUnique({
        where: {
          userId_date: {
            userId,
            date: newDate
          }
        }
      });
      if (duplicate) {
        throw new AppError(
          `A meal exception already exists for date ${formatToYYYYMMDD(newDate)}`,
          409
        );
      }
    }
  }

  const updatedType = data.type || existing.type;

  const updated = await prisma.mealException.update({
    where: { id: exceptionId },
    data: {
      date: newDate,
      type: updatedType
    }
  });

  const price = getExceptionPrice(updated.type);
  const deduction = getExceptionDeduction(updated.type);

  return {
    ...updated,
    formattedDate: formatToYYYYMMDD(updated.date),
    normalDailyPrice: DEFAULT_DAILY_RATE,
    actualPrice: price,
    deduction: deduction
  };
}

export async function deleteException(userId: string, exceptionId: string) {
  await getExceptionById(userId, exceptionId);

  await prisma.mealException.delete({
    where: { id: exceptionId }
  });

  return { message: 'Meal exception deleted successfully' };
}
