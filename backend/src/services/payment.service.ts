import prisma from '../prisma/client';
import { AppError } from '../middlewares/error.middleware';

export async function createPayment(userId: string, data: { amount: number; paymentDate: string; note?: string }) {
  if (data.amount <= 0) {
    throw new AppError('Payment amount must be greater than 0', 400);
  }

  const paymentDate = new Date(data.paymentDate);
  if (isNaN(paymentDate.getTime())) {
    throw new AppError('Invalid payment date', 400);
  }

  const payment = await prisma.advancePayment.create({
    data: {
      userId,
      amount: data.amount,
      paymentDate,
      note: data.note?.trim() || null
    }
  });

  return payment;
}

export async function getUserPayments(userId: string) {
  return prisma.advancePayment.findMany({
    where: { userId },
    orderBy: { paymentDate: 'desc' }
  });
}

export async function getPaymentById(userId: string, paymentId: string) {
  const payment = await prisma.advancePayment.findUnique({
    where: { id: paymentId }
  });

  if (!payment) {
    throw new AppError('Payment record not found', 404);
  }

  if (payment.userId !== userId) {
    throw new AppError('Unauthorized access to payment record', 403);
  }

  return payment;
}

export async function updatePayment(
  userId: string,
  paymentId: string,
  data: { amount?: number; paymentDate?: string; note?: string }
) {
  const existing = await getPaymentById(userId, paymentId);

  if (data.amount !== undefined && data.amount <= 0) {
    throw new AppError('Payment amount must be greater than 0', 400);
  }

  const paymentDate = data.paymentDate ? new Date(data.paymentDate) : existing.paymentDate;
  if (isNaN(paymentDate.getTime())) {
    throw new AppError('Invalid payment date', 400);
  }

  return prisma.advancePayment.update({
    where: { id: paymentId },
    data: {
      amount: data.amount !== undefined ? data.amount : existing.amount,
      paymentDate,
      note: data.note !== undefined ? (data.note.trim() || null) : existing.note
    }
  });
}

export async function deletePayment(userId: string, paymentId: string) {
  await getPaymentById(userId, paymentId);

  await prisma.advancePayment.delete({
    where: { id: paymentId }
  });

  return { message: 'Payment deleted successfully' };
}
