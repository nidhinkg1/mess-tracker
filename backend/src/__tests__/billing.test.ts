import request from 'supertest';
import app from '../app';
import prisma from '../prisma/client';

describe('Mess Expense Tracker API Integration & Billing Unit Tests', () => {
  let userToken: string;
  let userId: string;
  let otherUserToken: string;
  let otherUserId: string;

  beforeAll(async () => {
    // Clean up ONLY test specific users if they exist
    const testUsers = await prisma.user.findMany({
      where: { email: { in: ['resident@test.com', 'other@test.com'] } }
    });

    for (const tu of testUsers) {
      await prisma.monthlyShare.deleteMany({ where: { userId: tu.id } });
      await prisma.mealException.deleteMany({ where: { userId: tu.id } });
      await prisma.advancePayment.deleteMany({ where: { userId: tu.id } });
      await prisma.user.delete({ where: { id: tu.id } });
    }

    // Register primary test user
    const regRes = await request(app).post('/api/auth/register').send({
      name: 'Test Resident',
      email: 'resident@test.com',
      password: 'password123'
    });
    userToken = regRes.body.token;
    userId = regRes.body.user.id;

    // Register second test user
    const regRes2 = await request(app).post('/api/auth/register').send({
      name: 'Other Resident',
      email: 'other@test.com',
      password: 'password123'
    });
    otherUserToken = regRes2.body.token;
    otherUserId = regRes2.body.user.id;
  });

  afterAll(async () => {
    // Cleanup ONLY test users, leaving real user data untouched!
    if (userId) {
      await prisma.monthlyShare.deleteMany({ where: { userId } });
      await prisma.mealException.deleteMany({ where: { userId } });
      await prisma.advancePayment.deleteMany({ where: { userId } });
      await prisma.user.deleteMany({ where: { id: userId } });
    }

    if (otherUserId) {
      await prisma.monthlyShare.deleteMany({ where: { userId: otherUserId } });
      await prisma.mealException.deleteMany({ where: { userId: otherUserId } });
      await prisma.advancePayment.deleteMany({ where: { userId: otherUserId } });
      await prisma.user.deleteMany({ where: { id: otherUserId } });
    }

    await prisma.$disconnect();
  });

  describe('1. Pricing & Default Month Billing Logic', () => {
    it('calculates default billing for August', async () => {
      const res = await request(app)
        .get('/api/billing/monthly?year=2026&month=8')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.daysInMonth).toBe(31);
      expect(res.body.defaultMonthlyAmount).toBe(31 * 115);
      expect(res.body.totalDeductions).toBe(0);
      expect(res.body.actualBill).toBe(31 * 115);
      expect(res.body.status).toBe('DUE');
    });

    it('handles February non-leap year (28 days) and leap year (29 days)', async () => {
      const feb2026 = await request(app)
        .get('/api/billing/monthly?year=2026&month=2')
        .set('Authorization', `Bearer ${userToken}`);
      expect(feb2026.body.daysInMonth).toBe(28);

      const feb2028 = await request(app)
        .get('/api/billing/monthly?year=2028&month=2')
        .set('Authorization', `Bearer ${userToken}`);
      expect(feb2028.body.daysInMonth).toBe(29);
    });
  });

  describe('2. Meal Exceptions & Deductions Calculation', () => {
    it('creates DINNER_ONLY exception (actual cost ₹50, deduction ₹65)', async () => {
      const res = await request(app)
        .post('/api/meal-exceptions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ date: '2026-08-10', type: 'DINNER_ONLY' });

      expect(res.status).toBe(201);
      expect(res.body.actualPrice).toBe(50);
      expect(res.body.deduction).toBe(65);
    });

    it('creates NO_FOOD exception (actual cost ₹0, deduction ₹115)', async () => {
      const res = await request(app)
        .post('/api/meal-exceptions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ date: '2026-08-11', type: 'NO_FOOD' });

      expect(res.status).toBe(201);
      expect(res.body.actualPrice).toBe(0);
      expect(res.body.deduction).toBe(115);
    });

    it('creates LUNCH_ONLY exception (actual cost ₹70, deduction ₹45)', async () => {
      const res = await request(app)
        .post('/api/meal-exceptions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ date: '2026-08-12', type: 'LUNCH_ONLY' });

      expect(res.status).toBe(201);
      expect(res.body.actualPrice).toBe(70);
      expect(res.body.deduction).toBe(45);
    });

    it('ignores client-submitted arbitrary amount and computes backend pricing strictly', async () => {
      const res = await request(app)
        .post('/api/meal-exceptions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ date: '2026-08-13', type: 'NO_FOOD', amount: 50 });

      expect(res.status).toBe(201);
      expect(res.body.actualPrice).toBe(0);
      expect(res.body.deduction).toBe(115);
    });

    it('rejects duplicate exception for same user and date (409 Conflict)', async () => {
      const res = await request(app)
        .post('/api/meal-exceptions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ date: '2026-08-10', type: 'LUNCH_ONLY' });

      expect(res.status).toBe(409);
    });

    it('rejects invalid exception type (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/meal-exceptions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ date: '2026-08-14', type: 'BREAKFAST_ONLY' });

      expect(res.status).toBe(400);
    });
  });

  describe('3. Advance Payments & Balance Scenarios', () => {
    it('rejects zero or negative advance payment amounts (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ amount: 0, paymentDate: '2026-08-01' });
      expect(res.status).toBe(400);
    });

    it('creates valid advance payment', async () => {
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ amount: 3000, paymentDate: '2026-08-01', note: 'Initial advance' });

      expect(res.status).toBe(201);
      expect(res.body.amount).toBe(3000);
    });

    it('calculates monthly bill when Advance Paid < Actual Bill', async () => {
      const res = await request(app)
        .get('/api/billing/monthly?year=2026&month=8')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.actualBill).toBe(3225);
      expect(res.body.totalAdvancePaid).toBe(3000);
      expect(res.body.amountDue).toBe(225);
      expect(res.body.status).toBe('DUE');
    });
  });

  describe('4. Monthly Shareable Statement Tests', () => {
    let shareToken: string;

    it('creates a secure random share token for August 2026', async () => {
      const res = await request(app)
        .post('/api/billing/share')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ year: 2026, month: 8 });

      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(typeof res.body.token).toBe('string');
      expect(res.body.token.length).toBe(64);
      shareToken = res.body.token;
    });

    it('fetches public monthly statement via token without authentication', async () => {
      const res = await request(app).get(`/api/share/${shareToken}`);

      expect(res.status).toBe(200);
      expect(res.body.residentName).toBe('Test Resident');
      expect(res.body.year).toBe(2026);
      expect(res.body.month).toBe(8);
      expect(res.body.daysInMonth).toBe(31);

      // Verify Payments
      expect(res.body.payments).toHaveLength(1);
      expect(res.body.payments[0].amount).toBe(3000);
      expect(res.body.totalAdvancePaid).toBe(3000);

      // Verify Logged Exceptions (4 exceptions logged)
      expect(res.body.exceptions).toHaveLength(4);

      // Check Dinner only exception day (Aug 10)
      const day10 = res.body.exceptions.find((d: any) => d.date === '2026-08-10');
      expect(day10.status).toBe('Dinner only');
      expect(day10.normalPrice).toBe(115);
      expect(day10.actualPrice).toBe(50);
      expect(day10.deduction).toBe(65);

      // Check No food exception day (Aug 11)
      const day11 = res.body.exceptions.find((d: any) => d.date === '2026-08-11');
      expect(day11.status).toBe('No food');
      expect(day11.actualPrice).toBe(0);
      expect(day11.deduction).toBe(115);

      // Check Lunch only exception day (Aug 12)
      const day12 = res.body.exceptions.find((d: any) => d.date === '2026-08-12');
      expect(day12.status).toBe('Lunch only');
      expect(day12.actualPrice).toBe(70);
      expect(day12.deduction).toBe(45);

      // Summary math
      expect(res.body.actualBill).toBe(3225);
      expect(res.body.amountDue).toBe(225);
    });

    it('returns 404 for invalid or random token string', async () => {
      const res = await request(app).get('/api/share/invalid_random_token_12345');
      expect(res.status).toBe(404);
      expect(res.body.error).toContain('no longer available');
    });

    it('revokes share link and denies public access afterwards (404)', async () => {
      const revokeRes = await request(app)
        .post('/api/billing/share/revoke')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ year: 2026, month: 8 });

      expect(revokeRes.status).toBe(200);
      expect(revokeRes.body.message).toContain('revoked');

      const publicRes = await request(app).get(`/api/share/${shareToken}`);
      expect(publicRes.status).toBe(404);
      expect(publicRes.body.error).toContain('no longer available');
    });

    it('prevents user from revoking another user share link', async () => {
      const revokeRes = await request(app)
        .post('/api/billing/share/revoke')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({ year: 2026, month: 8 });

      expect(revokeRes.status).toBe(404);
    });
  });

  describe('5. Authorization & Data Isolation', () => {
    it('prevents unauthenticated request (401 Unauthorized)', async () => {
      const res = await request(app).get('/api/payments');
      expect(res.status).toBe(401);
    });

    it('prevents user from accessing another user data', async () => {
      const listRes = await request(app)
        .get('/api/payments')
        .set('Authorization', `Bearer ${userToken}`);
      const paymentId = listRes.body[0].id;

      const unauthorizedRes = await request(app)
        .get(`/api/payments/${paymentId}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(unauthorizedRes.status).toBe(403);
    });
  });
});
